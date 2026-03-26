import { v4 as uuidv4 } from "uuid";
import { FloorPlanPayload, ISection, ITableNodesAttributes } from "../../../model/model";
import { FLOOR_Z_INDEX } from "./tableNumberUtils";

// Normalizes a section name by trimming extra spaces before showing or saving it.
export const normalizeSectionName = (value: string) => value.replace(/\s+/g, " ").trim();

// Keeps an existing id when valid; otherwise issues a UUID to guarantee uniqueness.
export const buildUniqueId = (baseId: string | undefined, usedIds: Set<string>) => {
    const preferredId = (baseId || "").trim();
    if (preferredId && !usedIds.has(preferredId)) {
        usedIds.add(preferredId);
        return preferredId;
    }
    let candidate = uuidv4();
    while (usedIds.has(candidate)) candidate = uuidv4();
    usedIds.add(candidate);
    return candidate;
};

// Normalizes section names/ids and also returns a mapping from old ids to new ids.
export const normalizeSectionsWithMap = (list: ISection[]) => {
    if (list.length === 0) {
        const fallback: ISection = { id: uuidv4(), name: "Main Room", hidden: false };
        return { normalized: [fallback], mapping: new Map<string, string>() };
    }
    const usedIds = new Set<string>();
    const mapping = new Map<string, string>();
    const normalized = list.map((section, index) => {
        const name = normalizeSectionName(section.name || "");
        const nextId = buildUniqueId(section.id, usedIds);
        mapping.set(section.id, nextId);
        return {
            ...section,
            id: nextId,
            name: name || `Section ${index + 1}`,
            hidden: section.hidden ?? false,
        };
    });
    return { normalized, mapping };
};

// Cleans nodes before persistence so saved payloads always contain valid ids, numbers, and defaults.
const normalizeNodesForPersistence = (nodes: FloorPlanPayload["nodes"], sectionsList: ISection[]): FloorPlanPayload["nodes"] => {
    const validSectionIds = new Set(sectionsList.map((section) => section.id));
    const fallbackSectionId = sectionsList[0]?.id || uuidv4();
    const usedNodeIds = new Set<string>();
    // Fills safe defaults so incomplete or older layouts can still be saved and reloaded.
    return nodes.map((node) => {
        let candidateId = (node.id || "").trim();
        if (!candidateId || usedNodeIds.has(candidateId)) candidateId = uuidv4();
        while (usedNodeIds.has(candidateId)) candidateId = uuidv4();
        usedNodeIds.add(candidateId);

        const sectionId = validSectionIds.has(node.sectionId) ? node.sectionId : fallbackSectionId;
        return {
            ...node,
            id: candidateId,
            number: ["rect", "circle"].includes(node.type) ? (node.number || "").trim() : node.number || "",
            sectionId,
            locked: node.locked ?? false,
            zIndex: node.type === "floor" ? FLOOR_Z_INDEX : (node.zIndex ?? 0),
        };
    });
};

// Validates the layout payload before save to catch duplicate table numbers and invalid ids early.
const validateLayout = (nodes: FloorPlanPayload["nodes"], sectionsList: ISection[]) => {
    if (sectionsList.length === 0) return "At least one section is required.";

    const sectionIds = new Set<string>();
    for (const section of sectionsList) {
        if (!section.id || !section.id.trim()) return "Section ID cannot be empty.";
        if (sectionIds.has(section.id)) return `Section ID '${section.id}' is duplicated.`;
        sectionIds.add(section.id);
    }

    const tableNumbersBySection = new Map<string, Set<string>>();
    for (const node of nodes) {
        if (!node.id || !node.id.trim()) return "Element ID cannot be empty.";
        if (node.type !== "rect" && node.type !== "circle") continue;
        const tableNumber = (node.number || "").trim();
        if (!tableNumber) return "Every table must have a number.";

        const sectionId = node.sectionId;
        const bucket = tableNumbersBySection.get(sectionId) || new Set<string>();
        if (bucket.has(tableNumber)) {
            const sectionName = sectionsList.find((section) => section.id === sectionId)?.name || sectionId;
            return `Duplicate table number '${tableNumber}' in section '${sectionName}'.`;
        }
        bucket.add(tableNumber);
        tableNumbersBySection.set(sectionId, bucket);
    }

    return null;
};

// Returns the next available table number within the current section.
export const nextTableNumberInSection = (sectionId: string, nodes: ITableNodesAttributes[]) => {
    const used = new Set(
        nodes
            .filter((node) => node.sectionId === sectionId && (node.type === "rect" || node.type === "circle"))
            .map((node) => (node.number || "").trim())
            .filter(Boolean),
    );
    let candidate = 1;
    while (used.has(`${candidate}`)) candidate += 1;
    return `${candidate}`;
};

// Normalizes and validates the outgoing payload before it is sent to the backend.
export const prepareLayoutForPersistence = (inputPayload: FloorPlanPayload) => {
    const { normalized: normalizedSections, mapping } = normalizeSectionsWithMap(inputPayload.sections);
    const remappedNodes = inputPayload.nodes.map((node) => ({
        ...node,
        sectionId: mapping.get(node.sectionId) || normalizedSections[0]?.id || node.sectionId,
    }));
    const normalizedNodes = normalizeNodesForPersistence(remappedNodes, normalizedSections);
    const validationError = validateLayout(normalizedNodes, normalizedSections);
    if (validationError) return { payload: null, validationError };
    return {
        payload: {
            ...inputPayload,
            sections: normalizedSections,
            nodes: normalizedNodes,
        },
        validationError: null,
    };
};

// Builds the exact backend payload shape from in-memory nodes/sections while preserving plan id when present.
export const createFloorPlanPayload = ({
    planId,
    restaurantId,
    nodes,
    sectionList,
}: {
    planId: string | null;
    restaurantId: string;
    nodes: ITableNodesAttributes[];
    sectionList: ISection[];
}): FloorPlanPayload => ({
    ...(planId ? { id: planId } : {}),
    restaurantId,
    nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        rotation: node.rotation,
        number: node.number,
        seats: node.seats,
        sectionId: node.sectionId,
        status: node.status,
        locked: node.locked ?? false,
        zIndex: node.type === "floor" ? FLOOR_Z_INDEX : (node.zIndex ?? 0),
        floorStyle: node.floorStyle,
    })),
    sections: sectionList.map((section) => ({
        id: section.id,
        name: section.name,
        hidden: section.hidden,
    })),
});

// Converts the payload into a hash string so the screen can detect unsaved changes.
export const hashPayload = (payload: FloorPlanPayload) => JSON.stringify(payload);
