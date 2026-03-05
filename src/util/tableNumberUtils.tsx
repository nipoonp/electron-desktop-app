import { ISection, ShapeType, ITableNodesAttributes, TableStatus, FloorStyle } from "../model/model";

export const SNAP_SIZE = 10;
export const GRID_SIZE = 20;
export const DEFAULT_SEATS = 4;
export const HISTORY_LIMIT = 100;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2.5;
export const ZOOM_STEP = 1.08;
export const FLOOR_Z_INDEX = -1000;
export const VIEW_MODE_MANUAL_STATUSES: TableStatus[] = ["available", "reserved"];

// Converts the current local date into the yyyy-MM-dd key expected by the orders query.
export const getTodayOrderDateKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// Assigns each shape type to a fixed visual layer so floors stay behind and tables stay on top.
export const getLayerPriority = (type: ShapeType) => {
    if (type === "floor") return 0;
    if (["chair", "stool", "armchair"].includes(type)) return 1;
    if (["wall", "plant", "pillar"].includes(type)) return 2;
    return 3;
};

// Compares two nodes to decide which one should render first on the canvas.
export const compareNodesForRender = (a: ITableNodesAttributes, b: ITableNodesAttributes) => {
    const priorityDelta = getLayerPriority(a.type) - getLayerPriority(b.type);
    if (priorityDelta !== 0) return priorityDelta;

    const zDelta = (a.zIndex ?? 0) - (b.zIndex ?? 0);
    if (zDelta !== 0) return zDelta;

    return a.id.localeCompare(b.id);
};

// Finds the next z-index inside the same layer group without breaking the global layer rules.
export const nextZIndexForType = (type: ShapeType, nodes: ITableNodesAttributes[]) => {
    const targetPriority = getLayerPriority(type);
    const max = nodes.reduce((maxZ, node) => {
        if (getLayerPriority(node.type) !== targetPriority) return maxZ;
        return Math.max(maxZ, node.zIndex ?? 0);
    }, Number.NEGATIVE_INFINITY);
    return Number.isFinite(max) ? max + 1 : 0;
};

// Shared snap helper used by drag/drop and resize so all nodes align to the same grid.
export const snapToGrid = (val: number) => Math.round(val / SNAP_SIZE) * SNAP_SIZE;

export const isNonInteractive = (type: ShapeType) => ["wall", "plant", "pillar", "chair", "stool", "armchair", "floor"].includes(type);

export const recalculateSeats = (nodes: ITableNodesAttributes[]) => {
    const DISTANCE_THRESHOLD = 120;

    const distance = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    // Legacy helper that infers seats from nearby chairs; callers opt in explicitly.
    return nodes.map((node) => {
        if (!["rect", "circle"].includes(node.type)) return node;

        const centerX = node.x + node.width / 2;
        const centerY = node.y + node.height / 2;

        const chairCount = nodes.filter((n) => {
            if (!["chair", "stool", "armchair"].includes(n.type)) return false;
            if (n.sectionId !== node.sectionId) return false;

            const cx = n.x + n.width / 2;
            const cy = n.y + n.height / 2;

            return distance(centerX, centerY, cx, cy) < DISTANCE_THRESHOLD;
        }).length;

        return {
            ...node,
            seats: chairCount > 0 ? chairCount : node.seats,
        };
    });
};

// Collapses older saved table states into the current four-state model so existing layouts still load safely.
const normalizeTableStatus = (status?: string): TableStatus => {
    switch (`${status || ""}`.trim()) {
        case "opened":
        case "available":
        case "waiting":
            return "available";
        case "occupied":
        case "serving":
            return "occupied";
        case "idle":
        case "served":
        case "dirty":
            return "idle";
        case "reserved":
            return "reserved";
        default:
            return "available";
    }
};

export const normalizeTables = (nodes: ITableNodesAttributes[]) =>
    nodes.map((node) => {
        const isTable = ["rect", "circle"].includes(node.type);
        const isFloor = node.type === "floor";
        // Hydrates server data with safe defaults so older saved layouts still render correctly.
        return {
            ...node,
            rotation: node.rotation ?? 0,
            status: isTable ? normalizeTableStatus(node.status) : node.status,
            floorStyle: isFloor ? node.floorStyle || "wood" : node.floorStyle,
            zIndex: isFloor ? FLOOR_Z_INDEX : (node.zIndex ?? 0),
            locked: node.locked ?? false,
        };
    });

export const normalizeSections = (list: ISection[]) => list.map((section) => ({ ...section, hidden: section.hidden ?? false }));

export const formatMoney = (value?: number) => {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
};

export const formatElapsed = (mins?: number) => {
    if (mins === undefined || mins === null) return "-";
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return hours > 0 ? `${hours}h ${remaining}m` : `${remaining}m`;
};

export const STATUS_META: Record<TableStatus, { label: string; fill: string; stroke: string; text: string; dot: string }> = {
    available: { label: "Available", fill: "#f8f9fa", stroke: "#ced4da", text: "#495057", dot: "#adb5bd" },
    occupied: { label: "Occupied", fill: "#ffd8a8", stroke: "#e8590c", text: "#d9480f", dot: "#f76707" },
    idle: { label: "Idle 15m+", fill: "#e9ecef", stroke: "#868e96", text: "#495057", dot: "#868e96" },
    reserved: { label: "Reserved", fill: "#d0ebff", stroke: "#228be6", text: "#1c7ed6", dot: "#228be6" },
};

export const STATUS_ORDER: TableStatus[] = ["available", "occupied", "idle", "reserved"];
// Precomputed status rank used by list view sorting and any other status-priority workflows.
const STATUS_ORDER_INDEX: Record<TableStatus, number> = STATUS_ORDER.reduce(
    (acc, status, index) => ({
        ...acc,
        [status]: index,
    }),
    {
        available: 0,
        occupied: 0,
        idle: 0,
        reserved: 0,
    } as Record<TableStatus, number>,
);

const parseTableNumber = (value?: string) => {
    const trimmed = `${value || ""}`.trim();
    if (!trimmed) return Number.POSITIVE_INFINITY;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
};

export const compareTablesByStatusOrder = (a: ITableNodesAttributes, b: ITableNodesAttributes) => {
    const aStatus = normalizeTableStatus(a.status);
    const bStatus = normalizeTableStatus(b.status);
    const statusDelta = STATUS_ORDER_INDEX[aStatus] - STATUS_ORDER_INDEX[bStatus];
    if (statusDelta !== 0) return statusDelta;

    const numberDelta = parseTableNumber(a.number) - parseTableNumber(b.number);
    if (numberDelta !== 0) return numberDelta;

    return `${a.number || ""}`.localeCompare(`${b.number || ""}`);
};

export const FLOOR_STYLE_META: Record<FloorStyle, { label: string; fill: string; stroke: string }> = {
    tile: { label: "Tile", fill: "#f1f3f5", stroke: "#dee2e6" },
    wood: { label: "Wood", fill: "#eadfce", stroke: "#d6c5ae" },
    concrete: { label: "Concrete", fill: "#e9ecef", stroke: "#ced4da" },
};
