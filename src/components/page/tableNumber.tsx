import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@apollo/client";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { checkoutPath, restaurantPath } from "../main";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { useRestaurant } from "../../context/restaurant-context";
import { useUser } from "../../context/user-context";
import {
    FiX,
    FiEdit2,
    FiTrash2,
    FiSquare,
    FiCircle,
    FiLayout,
    FiMap,
    FiBox,
    FiSave,
    FiLogOut,
    FiMousePointer,
    FiZoomIn,
    FiZoomOut,
    FiMaximize2,
} from "react-icons/fi";
import { useRegister } from "../../context/register-context";
import { Stepper } from "../../tabin/components/stepper";
import { Stage, Layer } from "react-konva";

import { BackgroundGrid, TableNode } from "./tableNumber/tableNumberComponent";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../graphql/customFragments";
import { EOrderStatus, EOrderType } from "../../graphql/customQueries";
import {
    CategoryType,
    FloorPlanPayload,
    FloorPlanSaveState,
    ICartProduct,
    ISection,
    ITableNodesAttributes,
    LayoutSnapshot,
    FloorStyle,
    ShapeType,
    TableStatus,
    TableLiveState,
} from "../../model/model";
import {
    isNonInteractive,
    normalizeSections,
    normalizeTables,
    snapToGrid,
    HISTORY_LIMIT,
    ZOOM_MIN,
    ZOOM_MAX,
    ZOOM_STEP,
    FLOOR_Z_INDEX,
    VIEW_MODE_MANUAL_STATUSES,
    getTodayOrderDateKey,
    getLayerPriority,
    compareNodesForRender,
    nextZIndexForType,
    DEFAULT_SEATS,
    FLOOR_STYLE_META,
    STATUS_META,
    STATUS_ORDER,
    compareTablesByStatusOrder,
} from "./tableNumber/tableNumberUtils";
import {
    calculateCartProductsTotal,
    cloneAndSanitizeCartProducts,
    mapOrderProductsToCartProducts,
    toOrderPaymentAmountsInput,
} from "./tableNumber/orderCartMappers";
import {
    formatOrderTotal,
    getParkedOrderPrintedProductStorageKey,
    getElapsedMinutes,
    getServerLabelForOrder,
    initializeRunningOrderPrintedProductTracking,
    isOpenDineInRunningOrder,
} from "./tableNumber/runningOrderUtils";
import {
    buildUniqueId,
    createFloorPlanPayload,
    hashPayload,
    nextTableNumberInSection,
    normalizeSectionName,
    normalizeSectionsWithMap,
    prepareLayoutForPersistence,
} from "./tableNumber/floorPlanPersistence";
import { useGetRestaurantFloorPlanLazyQuery } from "../../hooks/useGetRestaurantFloorPlanLazyQuery";
import { useGetRestaurantOrdersByBeginWithPlacedAt } from "../../hooks/useGetRestaurantOrdersByBeginWithPlacedAt";
import { useUpdateRestaurantFloorPlanMutation } from "../../hooks/useUpdateRestaurantFloorPlanMutation";
import { TableAddSectionModal, TableLayoutEditModal, TableSectionSettingsModal } from "../modals/tableNumberModals";
import { UPDATE_ORDER } from "../../graphql/customMutations";

import "./tableNumber.scss";
import { Input } from "../../tabin/components/input";
import { toast } from "../../tabin/components/toast";
import { toLocalISOString } from "../../util/util";
import { getCreateMergedOrderEndpoint } from "../../private/aws-custom";
import { MdSettings } from "react-icons/md";
import { FaRectangleList } from "react-icons/fa6";

// Feature flag toggle for table-number experience.
const TABLE_FEATURE_STATIC_FALLBACK = true;

// Uses restaurant-level feature config when available; falls back to static value for now.
const getIsTableFeatureEnabled = (restaurant: { checkTableFeature?: boolean | null } | null | undefined) => {
    if (typeof restaurant?.checkTableFeature === "boolean") return restaurant.checkTableFeature;
    return TABLE_FEATURE_STATIC_FALLBACK;
};

// Feature disabled flow: simple table + covers entry screen. (Existimg flow)
const TableNumberFeatureDisabledPage = () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { register, isPOS } = useRegister();
    const { tableNumber, setTableNumber, covers, setCovers } = useCart();
    const [table, setTable] = useState(tableNumber || "");
    const [coversNumber, setCoversNumber] = useState(covers || 1);
    const [tableError, setTableError] = useState(false);

    if (restaurant == null) throw "Restaurant is invalid!";

    // Closes the basic table-number screen and routes to POS home or checkout depending on register mode.
    const onClose = () => {
        const restaurantId = restaurant?.id;
        if (isPOS) {
            if (!restaurantId) return;
            navigate(`${restaurantPath}/${restaurantId}`);
            return;
        }
        navigate(`${checkoutPath}`);
    };

    // Validates table input, stores table/covers into cart state, and exits this screen.
    const onNext = () => {
        const normalizedTable = `${table || ""}`.trim();
        if (!normalizedTable) {
            setTableError(true);
            return;
        }
        setTableNumber(normalizedTable);
        setCovers(coversNumber);
        onClose();
    };

    return (
        <PageWrapper>
            <div className="table-number">
                <div className="close-button-wrapper">
                    <FiX className="close-button" size={36} onClick={onClose} />
                </div>

                <div className="mb-4 text-center" style={{ width: "300px" }}>
                    <div className="h3 mb-2">Table Number</div>
                    <Input
                        autoFocus
                        onChange={(event) => {
                            setTable(event.target.value);
                            setTableError(false);
                        }}
                        value={table || ""}
                        error={tableError ? "Required" : ""}
                    />
                    {tableError && <div className="text-error mt-2">{tableError ? "Required" : ""}</div>}
                </div>

                {register?.enableCovers && (
                    <div className="mb-12 text-center" style={{ width: "300px" }}>
                        <div className="h3 mb-2">Number Of Diners</div>
                        <div className="covers-wrapper">
                            <Stepper count={coversNumber} min={1} max={20} onUpdate={setCoversNumber} size={48} />
                        </div>
                    </div>
                )}
                <Button onClick={onNext}>Next</Button>
            </div>
        </PageWrapper>
    );
};

// Feature enabled flow: full floor-plan designer + running-order aware table selection.
const TableNumberFeatureEnabledPage = () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { register, isPOS } = useRegister();
    const { user } = useUser();
    const {
        clearCart,
        parkedOrderId,
        setOrderType,
        setParkedOrderId,
        setParkedOrderNumber,
        setParkedOrderStatus,
        setTableNumber,
        setBuzzerNumber,
        setCustomerInformation,
        products,
        setProducts,
        setNotes,
        covers,
        setCovers,
        total,
        tableNumber,
    } = useCart();
    // Load floor plan only after restaurant data is ready.
    const { getRestaurantFloorPlan, data: floorPlanData, loading: floorPlanLoading } = useGetRestaurantFloorPlanLazyQuery();
    const todayOrderDateKey = getTodayOrderDateKey();
    // This page shows the newest orders when it opens.
    // After checkout saves an order, it refetches so this page gets updated data.
    const { data: activeOrders, refetch: refetchActiveOrders } = useGetRestaurantOrdersByBeginWithPlacedAt(restaurant?.id || "", todayOrderDateKey);
    // Unified save mutation decides between create/update based on payload id.
    const { updateRestaurantFloorPlan } = useUpdateRestaurantFloorPlanMutation();
    const [updateOrderMutation] = useMutation(UPDATE_ORDER);

    // State
    const [tables, setTables] = useState<ITableNodesAttributes[]>([]);
    const [sections, setSections] = useState<ISection[]>([]);
    const [floorPlanId, setFloorPlanId] = useState<string | null>(null);
    const [activeSectionId, setActiveSectionId] = useState<string>("");
    const [viewMode, setViewMode] = useState<"map" | "list">("map");

    // UI State
    const [selectedId, selectShape] = useState<string | null>(null);
    const [isDesignMode, setIsDesignMode] = useState(false);
    const [showEditConfirm, setShowEditConfirm] = useState(false);
    const [showSectionSettings, setShowSectionSettings] = useState(false);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [sectionDrafts, setSectionDrafts] = useState<ISection[]>(sections);
    const [sectionError, setSectionError] = useState<string | null>(null);
    const [newSectionName, setNewSectionName] = useState("");
    const [addSectionError, setAddSectionError] = useState<string | null>(null);

    // Sidebar State
    const [activeCategory, setActiveCategory] = useState<CategoryType | null>("tables");

    // Input Form State
    const [table, setTable] = useState(tableNumber || "");
    const [coversNumber, setCoversNumber] = useState(covers || 1);
    const [tableError, setTableError] = useState(false);
    const [transferTargetTable, setTransferTargetTable] = useState("");
    const [transferError, setTransferError] = useState<string | null>(null);
    const [transferBusy, setTransferBusy] = useState(false);
    const [mergeSourceTable, setMergeSourceTable] = useState("");
    const [mergeError, setMergeError] = useState<string | null>(null);
    const [mergeBusy, setMergeBusy] = useState(false);
    // Progressive action mode: keep transfer/merge UI hidden until user chooses an action.
    const [orderActionMode, setOrderActionMode] = useState<"none" | "transfer" | "merge">("none");

    const containerRef = useRef<HTMLDivElement>(null);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const savedStateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasLoadedFloorPlanRef = useRef(false);
    const hasHydratedFromServerRef = useRef(false);
    const lastSavedPayloadHashRef = useRef<string | null>(null);
    const [saveState, setSaveState] = useState<FloorPlanSaveState>("idle");
    const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
    const [retryPayload, setRetryPayload] = useState<FloorPlanPayload | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [undoStack, setUndoStack] = useState<LayoutSnapshot[]>([]);
    const [redoStack, setRedoStack] = useState<LayoutSnapshot[]>([]);
    const [stageScale, setStageScale] = useState(1);
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
    const [tableLiveClockMs, setTableLiveClockMs] = useState(() => Date.now());

    // Creates a shallow copy of the table nodes so undo/redo snapshots are isolated from live state.
    const cloneTables = (nodes: ITableNodesAttributes[]) => nodes.map((node) => ({ ...node }));
    // Creates a shallow copy of the section list for the same snapshot/history workflow.
    const cloneSections = (list: ISection[]) => list.map((section) => ({ ...section }));

    // Captures the current editable layout state so it can be restored by undo/redo.
    const createSnapshot = (): LayoutSnapshot => ({
        tables: cloneTables(tables),
        sections: cloneSections(sections),
        selectedId,
        activeSectionId,
    });

    // Pushes the current layout into the undo stack and clears redo history after a new change.
    const pushUndoSnapshot = () => {
        setUndoStack((prev) => {
            const trimmedStack = prev.slice(-(HISTORY_LIMIT - 1));
            return [...trimmedStack, createSnapshot()];
        });
        setRedoStack([]);
    };

    // Restores a previously captured layout snapshot back into local state.
    const restoreSnapshot = (snapshot: LayoutSnapshot) => {
        setTables(cloneTables(snapshot.tables));
        setSections(cloneSections(snapshot.sections));
        selectShape(snapshot.selectedId);
        setActiveSectionId(snapshot.activeSectionId);
    };

    // Applies one table-list update and records an undo snapshot while in design mode.
    const updateTables = (updater: (prev: ITableNodesAttributes[]) => ITableNodesAttributes[]) => {
        if (isDesignMode) pushUndoSnapshot();
        setTables(updater);
    };

    // Updates tables and sections together when a change needs to affect the whole layout.
    const updateLayout = (
        updater: (state: { tables: ITableNodesAttributes[]; sections: ISection[] }) => {
            tables: ITableNodesAttributes[];
            sections: ISection[];
        },
    ) => {
        if (isDesignMode) pushUndoSnapshot();
        const next = updater({
            tables: cloneTables(tables),
            sections: cloneSections(sections),
        });
        setTables(next.tables);
        setSections(next.sections);
    };

    // Clears the temporary "Saved" state after a short delay so the status banner can return to idle.
    const scheduleSavedStateReset = () => {
        if (savedStateTimeoutRef.current) clearTimeout(savedStateTimeoutRef.current);
        savedStateTimeoutRef.current = setTimeout(() => {
            setSaveState((prev) => (prev === "saved" ? "idle" : prev));
        }, 1500);
    };

    // Fetches saved floor plan once restaurant data is available.
    useEffect(() => {
        const restaurantId = restaurant?.id;
        if (!restaurantId) return;
        hasLoadedFloorPlanRef.current = false;
        getRestaurantFloorPlan({
            variables: {
                restaurantId,
            },
        });
    }, [restaurant?.id, getRestaurantFloorPlan]);

    // Loads the floor-plan data from server response into local editor state.
    useEffect(() => {
        const restaurantId = restaurant?.id;
        if (!restaurantId) return;
        if (floorPlanLoading) return;

        const plan = floorPlanData;
        if (!plan) {
            const { normalized: nextSections } = normalizeSectionsWithMap([]);
            const nextTables: ITableNodesAttributes[] = [];
            const payload = createFloorPlanPayload({
                planId: null,
                restaurantId,
                nodes: nextTables,
                sectionList: nextSections,
            });
            hasHydratedFromServerRef.current = true;
            setFloorPlanId(null);
            // Default layout creation intentionally disabled.
            setTables(nextTables);
            setSections(nextSections);
            lastSavedPayloadHashRef.current = hashPayload(payload);
            setHasUnsavedChanges(false);
            setRetryPayload(null);
            setSaveErrorMessage(null);
            setSaveState("idle");
            setUndoStack([]);
            setRedoStack([]);
            hasLoadedFloorPlanRef.current = true;
            return;
        }

        // Default layout fallback intentionally disabled.
        const rawSections = normalizeSections(plan.sections?.length ? plan.sections : []);
        const { normalized: nextSections, mapping } = normalizeSectionsWithMap(rawSections);
        const remappedTables = (plan.nodes?.length ? plan.nodes : []).map((node) => ({
            ...node,
            sectionId: mapping.get(node.sectionId) || nextSections[0]?.id || node.sectionId,
        }));
        const nextTables = normalizeTables(remappedTables);
        const payload = createFloorPlanPayload({
            planId: plan.id,
            restaurantId,
            nodes: nextTables,
            sectionList: nextSections,
        });

        hasHydratedFromServerRef.current = true;
        setFloorPlanId(plan.id);
        setTables(nextTables);
        setSections(nextSections);
        lastSavedPayloadHashRef.current = hashPayload(payload);
        setHasUnsavedChanges(false);
        setRetryPayload(null);
        setSaveErrorMessage(null);
        setSaveState("idle");
        setUndoStack([]);
        setRedoStack([]);
        hasLoadedFloorPlanRef.current = true;
    }, [floorPlanData, floorPlanLoading, restaurant?.id]);

    // Creates save payload only when required data is ready.
    const buildFloorPlanPayload = () => {
        const restaurantId = restaurant?.id;
        if (!restaurantId) return null;
        if (!hasLoadedFloorPlanRef.current) return null;

        return createFloorPlanPayload({
            planId: floorPlanId,
            restaurantId,
            nodes: tables,
            sectionList: sections,
        });
    };

    // Saves floor plan and updates local state with the saved data.
    const persistFloorPlan = async (payload: FloorPlanPayload) => {
        if (!payload) return;
        const prepared = prepareLayoutForPersistence(payload);
        if (!prepared.payload) {
            setRetryPayload(payload);
            setHasUnsavedChanges(true);
            setSaveState("error");
            setSaveErrorMessage(prepared.validationError || "Layout validation failed.");
            throw new Error(prepared.validationError || "Layout validation failed.");
        }

        const sanitizedPayload = prepared.payload;
        setSaveState("saving");
        setSaveErrorMessage(null);

        try {
            const result: any = await updateRestaurantFloorPlan({
                variables: {
                    input: sanitizedPayload,
                },
            });

            const savedId = result?.data?.updateTablePlan?.id || result?.data?.createTablePlan?.id;
            const persistedPayload: FloorPlanPayload = {
                ...sanitizedPayload,
                ...(savedId ? { id: savedId } : sanitizedPayload.id ? { id: sanitizedPayload.id } : {}),
            };

            // Keep local state aligned with normalized payload stored in backend.
            setTables(normalizeTables(persistedPayload.nodes as ITableNodesAttributes[]));
            setSections(normalizeSections(persistedPayload.sections));
            lastSavedPayloadHashRef.current = hashPayload(persistedPayload);
            setHasUnsavedChanges(false);
            setRetryPayload(null);
            setSaveState("saved");
            scheduleSavedStateReset();

            if (savedId) setFloorPlanId(savedId);
        } catch (error: any) {
            setRetryPayload(sanitizedPayload);
            setHasUnsavedChanges(true);
            setSaveState("error");
            setSaveErrorMessage(error?.message || "Unable to save floor plan.");
            throw error;
        }
    };

    // Saves only when the current payload differs from the last successfully saved payload.
    const flushPendingSave = async () => {
        const payload = buildFloorPlanPayload();
        if (!payload) return true;
        const isDirty = hashPayload(payload) !== lastSavedPayloadHashRef.current;
        if (!isDirty) return true;

        try {
            await persistFloorPlan(payload);
            return true;
        } catch (error) {
            console.error("Failed to save table plan", error);
            return false;
        }
    };

    // Recomputes whether there are unsaved changes whenever layout state changes.
    useEffect(() => {
        const payload = buildFloorPlanPayload();
        if (!payload) return;
        const payloadHash = hashPayload(payload);

        if (hasHydratedFromServerRef.current) {
            hasHydratedFromServerRef.current = false;
            return;
        }

        const isDirty = payloadHash !== lastSavedPayloadHashRef.current;
        setHasUnsavedChanges(isDirty);
        if (!isDirty) {
            setRetryPayload(null);
            setSaveErrorMessage(null);
            setSaveState((prev) => (prev === "saving" || prev === "saved" ? prev : "idle"));
            return;
        }
        setSaveState((prev) => (prev === "saving" ? prev : "dirty"));
    }, [tables, sections, floorPlanId, restaurant?.id, updateRestaurantFloorPlan]);

    // Clears the delayed saved-state timer when the component unmounts.
    useEffect(() => {
        return () => {
            if (savedStateTimeoutRef.current) clearTimeout(savedStateTimeoutRef.current);
        };
    }, []);

    // Refreshes the section modal draft values whenever the modal is opened or sections change.
    useEffect(() => {
        if (showSectionSettings) setSectionDrafts(sections);
    }, [showSectionSettings, sections]);

    //refreshes table metadata timers so "time open" stays live in view mode.
    useEffect(() => {
        if (isDesignMode) return;
        const intervalId = window.setInterval(() => setTableLiveClockMs(Date.now()), 60 * 1000);
        return () => window.clearInterval(intervalId);
    }, [isDesignMode]);

    // Keeps the active section valid in view mode if a section is hidden or removed.
    useEffect(() => {
        if (isDesignMode) return;
        const visible = sections.filter((s) => !s.hidden);
        if (visible.length === 0) return;
        if (!visible.find((s) => s.id === activeSectionId)) {
            setActiveSectionId(visible[0].id);
        }
    }, [sections, isDesignMode, activeSectionId]);

    // Tracks the canvas container size so the Konva stage matches the available space.
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) setStageSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
        };
        handleResize();
        setTimeout(handleResize, 100);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if (restaurant == null) throw "Restaurant is invalid!";

    // --- Actions ---

    // Leaves the table screen and routes back to the correct page for POS or kiosk flow.
    const onClose = () => {
        const restaurantId = restaurant?.id;
        if (isPOS) {
            if (!restaurantId) return;
            navigate(`${restaurantPath}/${restaurantId}`);
            return;
        }
        navigate(`${checkoutPath}`);
    };

    // Finalizes the selected single table number and stores it in cart state.
    const onNext = () => {
        if (isDesignMode) {
            setIsDesignMode(false);
            return;
        }

        const normalizedTable = `${table || ""}`.trim();
        if (!normalizedTable) {
            setTableError(true);
            return;
        }
        const runningOrder = activeRunningOrdersByTable.get(normalizedTable);

        // If resuming an existing running order (or replacing an old parked binding), reset cart state first.
        if (runningOrder || parkedOrderId) clearCart();

        // Point 1: start a dine-in session for the selected table.
        // Keep current cart items when user selected items first and table later.
        setOrderType(EOrderType.DINEIN);
        setTable(normalizedTable);
        setTableNumber(normalizedTable);
        setCovers(coversNumber);

        if (runningOrder) {
            // Point 2: resume the already-open running order for this table instead of creating a new one.
            setParkedOrderId(runningOrder.id);
            setParkedOrderNumber(runningOrder.number);
            setParkedOrderStatus(runningOrder.status);
            setBuzzerNumber(runningOrder.buzzer || null);
            setNotes(runningOrder.notes || "");
            setCustomerInformation(
                runningOrder.customerInformation
                    ? {
                          firstName: runningOrder.customerInformation.firstName || "",
                          email: runningOrder.customerInformation.email || "",
                          phoneNumber: runningOrder.customerInformation.phoneNumber || "",
                          signatureBase64: "",
                          customFields: [],
                      }
                    : null,
            );
            setProducts(mapOrderProductsToCartProducts(runningOrder.products));
            if (typeof runningOrder.covers === "number" && runningOrder.covers > 0) setCovers(runningOrder.covers);

            // Point 3: enable continuous add-item flow by marking currently loaded items as the printed baseline.
            initializeRunningOrderPrintedProductTracking(runningOrder);
            // Point 4: preserve round-based send tracking so each fire cycle prints only still-unsent items.
        } else {
            // Ensure this stays a fresh non-parked session when no running order exists on the selected table.
            setParkedOrderId(null);
            setParkedOrderNumber(null);
            setParkedOrderStatus(null);
        }

        onClose();
    };

    // Applies a partial update to a single layout node by id.
    const updateTable = (id: string, patch: Partial<ITableNodesAttributes>) => {
        updateTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    };

    // Brings a node to the front inside its own layer group without breaking global layer ordering.
    const bringNodeToFront = (id: string) => {
        updateTables((prev) => {
            const target = prev.find((t) => t.id === id);
            if (!target) return prev;
            if (target.type === "floor") return prev;

            const targetPriority = getLayerPriority(target.type);
            const maxZ = prev.reduce((max, node) => {
                if (getLayerPriority(node.type) !== targetPriority) return max;
                return Math.max(max, node.zIndex ?? 0);
            }, target.zIndex ?? 0);
            const nextZ = maxZ + 1;
            if ((target.zIndex ?? 0) >= nextZ) return prev;

            return prev.map((node) => (node.id === id ? { ...node, zIndex: nextZ } : node));
        });
    };

    // Updates the selected table status.
    const updateSelectedStatus = (status: TableStatus) => {
        if (!selectedId) return;
        // Live occupancy is derived from orders, so view mode only allows manual fallback states.
        if (!isDesignMode && !VIEW_MODE_MANUAL_STATUSES.includes(status)) return;
        updateTable(selectedId, { status });
    };

    // Switches the selected table between rectangular and circular shapes.
    const updateSelectedShape = (shape: "rect" | "circle") => {
        if (!selectedId) return;
        updateTables((prev) =>
            prev.map((t) => {
                if (t.id !== selectedId) return t;
                if (t.type !== "rect" && t.type !== "circle") return t;
                if (shape === "circle") {
                    const size = Math.min(t.width, t.height);
                    return { ...t, type: "circle", width: size, height: size };
                }
                return { ...t, type: "rect" };
            }),
        );
    };

    // Enters edit mode or exits it if the editor is already open.
    const handleEditClick = () => {
        if (isDesignMode) {
            setIsDesignMode(false);
        } else {
            setShowEditConfirm(true); // Confirm entry
        }
    };

    // Applies the state changes needed after the user confirms entering layout edit mode.
    const confirmEditMode = () => {
        setShowEditConfirm(false);
        setIsDesignMode(true);
        setActiveCategory("tables");
        setViewMode("map");
        if (!sections.find((section) => section.id === activeSectionId) && sections[0]) {
            setActiveSectionId(sections[0].id);
        }
    };

    // Forces edit mode to stay in map view because list view is read-only.
    useEffect(() => {
        if (isDesignMode && viewMode !== "map") setViewMode("map");
    }, [isDesignMode, viewMode]);

    // Unlocks existing floor nodes in edit mode so they can be resized or moved.
    useEffect(() => {
        if (!isDesignMode) return;
        updateTables((prev) => prev.map((node) => (node.type === "floor" && node.locked ? { ...node, locked: false } : node)));
    }, [isDesignMode]);

    // Opens the add-section modal from section settings.
    const addSection = () => {
        setAddSectionError(null);
        setNewSectionName("");
        setShowAddSectionModal(true);
    };

    // Adds a new section draft from the modal input.
    const saveNewSection = () => {
        const name = normalizeSectionName(newSectionName || "");
        if (!name) {
            setAddSectionError("Section name cannot be empty.");
            return;
        }

        const used = new Set(sectionDrafts.map((section) => section.id));
        const newId = buildUniqueId(undefined, used);
        setSectionError(null);
        setSectionDrafts((prev) => [...prev, { id: newId, name, hidden: false }]);
        setAddSectionError(null);
        setNewSectionName("");
        setShowAddSectionModal(false);
    };

    // Removes a section from the modal draft list while keeping at least one section available.
    const deleteSectionDraft = (sectionId: string) => {
        if (sectionDrafts.length <= 1) {
            setSectionError("At least one section is required.");
            return;
        }

        setSectionError(null);
        setSectionDrafts((prev) => prev.filter((section) => section.id !== sectionId));
    };

    // Opens the section settings modal with the current section values loaded into drafts.
    const openSectionSettings = () => {
        setSectionDrafts(sections);
        setSectionError(null);
        setAddSectionError(null);
        setNewSectionName("");
        setShowSectionSettings(true);
    };

    // Closes section-management UI and clears any pending add-section draft state.
    const closeSectionSettings = () => {
        setShowSectionSettings(false);
        setShowAddSectionModal(false);
        setAddSectionError(null);
        setNewSectionName("");
    };

    // Validates and saves the section settings modal back into layout state.
    const saveSectionSettings = async () => {
        const cleanedDrafts = sectionDrafts.map((section) => ({
            ...section,
            name: normalizeSectionName(section.name || ""),
        }));
        if (cleanedDrafts.length === 0) {
            setSectionError("At least one section is required.");
            return;
        }
        if (cleanedDrafts.some((section) => !section.name)) {
            setSectionError("Section name cannot be empty.");
            return;
        }

        const { normalized, mapping } = normalizeSectionsWithMap(cleanedDrafts);
        const nextTables = tables.map((tableNode) => ({
            ...tableNode,
            sectionId: mapping.get(tableNode.sectionId) || normalized[0]?.id || tableNode.sectionId,
        }));
        updateLayout(() => ({
            tables: nextTables,
            sections: normalized,
        }));
        closeSectionSettings();
        setSectionError(null);

        const visible = normalized.filter((s) => !s.hidden);
        if (visible.length > 0 && !visible.find((s) => s.id === activeSectionId)) {
            setActiveSectionId(visible[0].id);
        }

        const restaurantId = restaurant?.id;
        if (!restaurantId || !hasLoadedFloorPlanRef.current) return;

        try {
            await persistFloorPlan(
                createFloorPlanPayload({
                    planId: floorPlanId,
                    restaurantId,
                    nodes: nextTables,
                    sectionList: normalized,
                }),
            );
        } catch (error) {
            console.error("Failed to save section settings", error);
        }
    };

    // New Drag and Drop Handlers
    // Starts dragging a palette item by storing its type and options in the drag payload.
    const handleDragStart = (e: React.DragEvent, type: ShapeType, floorStyle?: FloorStyle, rotation?: number) => {
        e.dataTransfer.setData("shapeType", type);
        if (floorStyle) e.dataTransfer.setData("floorStyle", floorStyle);
        if (rotation !== undefined) e.dataTransfer.setData("rotation", rotation.toString());
        e.dataTransfer.effectAllowed = "copy";
    };

    // Allows the canvas to accept dragged palette items.
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    // Converts the browser drop position into stage coordinates and creates the new node there.
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("shapeType") as ShapeType;
        const floorStyle = e.dataTransfer.getData("floorStyle") as FloorStyle;
        const rotation = Number(e.dataTransfer.getData("rotation"));
        if (!type || !containerRef.current) return;

        // Calculate position relative to the stage container
        const rect = containerRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const dropX = (screenX - stagePosition.x) / stageScale;
        const dropY = (screenY - stagePosition.y) / stageScale;

        // Add the shape at the dropped position
        addShapeAt(type, dropX, dropY, floorStyle, Number.isFinite(rotation) ? rotation : undefined);
    };

    // Creates a new shape with the right defaults for its type and inserts it into the layout.
    const addShapeAt = (type: ShapeType, x: number, y: number, floorStyle?: FloorStyle, rotation?: number) => {
        const newId = uuidv4();

        let width = 80,
            height = 80;
        if (type === "wall") {
            width = 10;
            height = 100;
        }
        if (type === "pillar") {
            width = 40;
            height = 40;
        }
        // Chair dimensions
        if (type === "chair") {
            width = 40;
            height = 40;
        }
        if (type === "stool") {
            width = 30;
            height = 30;
        }
        if (type === "armchair") {
            width = 50;
            height = 50;
        }
        if (type === "floor") {
            width = 420;
            height = 300;
        }

        const isTable = ["rect", "circle"].includes(type);
        const isFloor = type === "floor";
        const nextNum = isTable ? nextTableNumberInSection(activeSectionId, tables) : "";
        const nextZIndex = isFloor ? FLOOR_Z_INDEX : nextZIndexForType(type, tables);

        const newTable: ITableNodesAttributes = {
            id: newId,
            type,
            x: snapToGrid(x), // Snap the drop position
            y: snapToGrid(y),
            width,
            height,
            rotation: rotation ?? 0,
            number: nextNum,
            seats: isTable ? DEFAULT_SEATS : undefined,
            sectionId: activeSectionId,
            status: isTable ? "available" : undefined,
            floorStyle: isFloor ? floorStyle || "wood" : undefined,
            zIndex: nextZIndex,
            locked: false,
        };
        const updatedList = [...tables, newTable];
        updateTables(() => updatedList);
        selectShape(newId);
        if (nextNum) setTable(nextNum);
    };

    // Removes the currently selected node from the layout.
    const deleteSelected = () => {
        if (selectedId) {
            updateTables((prev) => prev.filter((t) => t.id !== selectedId));
            selectShape(null);
            setTable("");
        }
    };

    // Restores the previous snapshot from the undo stack.
    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const previous = undoStack[undoStack.length - 1];
        setUndoStack((prev) => prev.slice(0, -1));
        setRedoStack((prev) => {
            const trimmedStack = prev.slice(-(HISTORY_LIMIT - 1));
            return [...trimmedStack, createSnapshot()];
        });
        restoreSnapshot(previous);
    };

    // Restores the next snapshot from the redo stack.
    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        setRedoStack((prev) => prev.slice(0, -1));
        setUndoStack((prev) => {
            const trimmedStack = prev.slice(-(HISTORY_LIMIT - 1));
            return [...trimmedStack, createSnapshot()];
        });
        restoreSnapshot(next);
    };

    // Resets the canvas zoom and pan back to the default viewport.
    const resetViewport = () => {
        setStageScale(1);
        setStagePosition({ x: 0, y: 0 });
    };

    // Triggers a manual save and updates the save banner when it succeeds.
    const handleManualSave = async () => {
        const didSave = await flushPendingSave();
        if (didSave) {
            setSaveErrorMessage(null);
            setSaveState("saved");
            scheduleSavedStateReset();
        }
    };

    // Enables Ctrl/Cmd+Z and Ctrl/Cmd+Y shortcuts while editing the layout.
    useEffect(() => {
        if (!isDesignMode) return;
        const onKeyDown = (event: KeyboardEvent) => {
            const isCtrlOrCmd = event.ctrlKey || event.metaKey;
            if (!isCtrlOrCmd) return;
            if (event.key.toLowerCase() === "z" && !event.shiftKey) {
                event.preventDefault();
                handleUndo();
                return;
            }
            if (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey)) {
                event.preventDefault();
                handleRedo();
                return;
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isDesignMode, undoStack.length, redoStack.length]);

    // Retries the most recent failed save using the cached retry payload.
    const retrySave = async () => {
        const payload = retryPayload || buildFloorPlanPayload();
        if (!payload) return;

        try {
            await persistFloorPlan(payload);
        } catch (error) {
            console.error("Retry save failed", error);
        }
    };

    const saveStateLabel =
        saveState === "saving"
            ? "Saving..."
            : saveState === "saved"
              ? "Saved"
              : saveState === "error"
                ? "Save failed"
                : hasUnsavedChanges
                  ? "Unsaved changes"
                  : "All changes synced";

    const safeStageWidth = Math.max(stageSize.width, 1);
    const safeStageHeight = Math.max(stageSize.height, 1);
    const minimapScale = 0.2;
    const minimapSize = {
        width: Math.max(120, safeStageWidth * minimapScale),
        height: Math.max(90, safeStageHeight * minimapScale),
    };
    const minimapViewport = useMemo(() => {
        const worldX = -stagePosition.x / stageScale;
        const worldY = -stagePosition.y / stageScale;
        const worldWidth = safeStageWidth / stageScale;
        const worldHeight = safeStageHeight / stageScale;
        return {
            left: Math.max(0, (worldX / safeStageWidth) * minimapSize.width),
            top: Math.max(0, (worldY / safeStageHeight) * minimapSize.height),
            width: Math.min(minimapSize.width, (worldWidth / safeStageWidth) * minimapSize.width),
            height: Math.min(minimapSize.height, (worldHeight / safeStageHeight) * minimapSize.height),
        };
    }, [stagePosition, stageScale, safeStageWidth, safeStageHeight, minimapSize.width, minimapSize.height]);

    // Only parked dine-in orders should mark a table as occupied in floor layout.
    const visibleActiveOrders = useMemo(
        () =>
            (activeOrders || []).filter((order) => isOpenDineInRunningOrder(order) && `${order.status || ""}`.toUpperCase() === EOrderStatus.PARKED),
        [activeOrders],
    );

    // Keeps only one open running order per table for resume flow, preferring the newest by placedAt.
    const activeRunningOrdersByTable = useMemo<Map<string, IGET_RESTAURANT_ORDER_FRAGMENT>>(() => {
        const byTable = new Map<string, IGET_RESTAURANT_ORDER_FRAGMENT>();
        visibleActiveOrders.forEach((order) => {
            // Extra guard: NEW orders must never drive table occupancy in this layout.
            if (`${order.status || ""}`.toUpperCase() !== EOrderStatus.PARKED) return;
            const tableNumberValue = `${order.table || ""}`.trim();
            if (!tableNumberValue) return;

            const existing = byTable.get(tableNumberValue);
            if (!existing) {
                byTable.set(tableNumberValue, order);
                return;
            }

            const existingPlacedAt = new Date(existing.placedAt).getTime();
            const nextPlacedAt = new Date(order.placedAt).getTime();
            if (!Number.isFinite(existingPlacedAt) || nextPlacedAt >= existingPlacedAt) byTable.set(tableNumberValue, order);
        });
        return byTable;
    }, [visibleActiveOrders]);

    // Point 5: drive runtime table state from currently open orders and expose live table metadata.
    const liveTableStateByTable = useMemo<Map<string, TableLiveState>>(() => {
        const summaries = new Map<string, TableLiveState>();

        activeRunningOrdersByTable.forEach((order, tableNumberValue) => {
            const covers = typeof order.covers === "number" && order.covers > 0 ? order.covers : null;
            const currentRegisterName = register && order.registerId === register.id ? register.name || null : null;
            summaries.set(tableNumberValue, {
                status: "occupied",
                covers,
                totalCents: typeof order.total === "number" ? order.total : null,
                elapsedMinutes: getElapsedMinutes(order.placedAt, tableLiveClockMs),
                serverLabel: getServerLabelForOrder(order, currentRegisterName),
            });
        });
        return summaries;
    }, [activeRunningOrdersByTable, register, tableLiveClockMs]);

    // Point 5: open-order status is overlaid onto the layout so table cards and map stay in sync.
    const runtimeTables: ITableNodesAttributes[] = useMemo(
        () =>
            tables.map((node) => {
                if (node.type !== "rect" && node.type !== "circle") return node;

                const tableNumberValue = `${node.number || ""}`.trim();
                const liveState = liveTableStateByTable.get(tableNumberValue);
                if (!liveState) {
                    return {
                        ...node,
                        status: node.status === "reserved" ? "reserved" : "available",
                    };
                }

                return {
                    ...node,
                    status: liveState.status,
                };
            }),
        [tables, liveTableStateByTable],
    );

    // Builds the section-specific canvas list using the visual render ordering rules.
    // View mode reads the runtime overlay; edit mode must keep using the raw persisted nodes.
    const displayTables = isDesignMode ? tables : runtimeTables;
    const visibleTables = displayTables.filter((t) => t.sectionId === activeSectionId).sort(compareNodesForRender);

    const visibleSections = isDesignMode ? sections : sections.filter((s) => !s.hidden);
    const selectedNode = selectedId ? displayTables.find((t) => t.id === selectedId) : null;
    const selectedTable = selectedNode && !isNonInteractive(selectedNode.type) ? selectedNode : null;
    const selectedTableLiveState = selectedTable ? liveTableStateByTable.get(`${selectedTable.number || ""}`.trim()) : null;
    const selectedTableCartTotalCents = useMemo(() => {
        if (!selectedTable) return null;
        const selectedTableNumber = `${selectedTable.number || ""}`.trim();
        const draftTableNumber = `${table || tableNumber || ""}`.trim();
        if (!selectedTableNumber || selectedTableNumber !== draftTableNumber) return null;
        if (!products || products.length === 0) return null;
        return total;
    }, [selectedTable, table, tableNumber, products, total]);
    const selectedTableHasLiveOrder = !!selectedTableLiveState;
    const selectedRunningOrder = selectedTable ? activeRunningOrdersByTable.get(`${selectedTable.number || ""}`.trim()) || null : null;
    const transferSourceTable = `${selectedRunningOrder?.table || selectedTable?.number || ""}`.trim();
    const allTableNumbers = useMemo(() => {
        const tableNumbers = new Set<string>();
        tables.forEach((node) => {
            if (node.type !== "rect" && node.type !== "circle") return;
            const tableNumberValue = `${node.number || ""}`.trim();
            if (tableNumberValue) tableNumbers.add(tableNumberValue);
        });
        return Array.from(tableNumbers).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    }, [tables]);

    // Transfer targets must be empty tables (no running order) to avoid accidental implicit merges.
    const transferTargetOptions = useMemo(
        () =>
            allTableNumbers.filter(
                (tableNumberValue) => tableNumberValue !== transferSourceTable && !activeRunningOrdersByTable.has(tableNumberValue),
            ),
        [allTableNumbers, transferSourceTable, activeRunningOrdersByTable],
    );

    // Merge sources only include tables that currently have an open running dine-in order.
    const mergeSourceOptions = useMemo(
        () =>
            Array.from(activeRunningOrdersByTable.keys())
                .filter((tableNumberValue) => tableNumberValue !== transferSourceTable)
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })),
        [activeRunningOrdersByTable, transferSourceTable],
    );
    const hasTransferTargets = transferTargetOptions.length > 0;
    const hasMergeSources = mergeSourceOptions.length > 0;

    useEffect(() => {
        // Reset action flow whenever table/order context changes.
        setOrderActionMode("none");
        setTransferError(null);
        setMergeError(null);
    }, [selectedId, selectedRunningOrder?.id]);

    useEffect(() => {
        if (!selectedRunningOrder) {
            if (transferTargetTable) setTransferTargetTable("");
            return;
        }
        if (transferTargetOptions.length === 0) {
            if (transferTargetTable) setTransferTargetTable("");
            return;
        }
        if (!transferTargetTable || !transferTargetOptions.includes(transferTargetTable)) {
            setTransferTargetTable(transferTargetOptions[0]);
        }
    }, [transferTargetOptions, transferTargetTable, selectedRunningOrder]);
    useEffect(() => {
        if (!selectedRunningOrder) {
            if (mergeSourceTable) setMergeSourceTable("");
            return;
        }
        if (mergeSourceOptions.length === 0) {
            if (mergeSourceTable) setMergeSourceTable("");
            return;
        }
        if (!mergeSourceTable || !mergeSourceOptions.includes(mergeSourceTable)) {
            setMergeSourceTable(mergeSourceOptions[0]);
        }
    }, [mergeSourceOptions, mergeSourceTable, selectedRunningOrder]);
    useEffect(() => {
        // Auto-close mode if no valid action targets remain after data refresh.
        if (orderActionMode === "transfer" && !hasTransferTargets) {
            setOrderActionMode("none");
        }
        if (orderActionMode === "merge" && !hasMergeSources) {
            setOrderActionMode("none");
        }
    }, [orderActionMode, hasTransferTargets, hasMergeSources]);

    // Builds sanitized UPDATE_ORDER mutation variables while preserving key order metadata.
    const buildOrderUpdateMutationVariables = (
        order: IGET_RESTAURANT_ORDER_FRAGMENT,
        nextProducts: ICartProduct[],
        options?: { tableOverride?: string; preserveFinancials?: boolean },
    ) => {
        if (!user?.id) throw new Error("Cannot perform this action because user context is missing.");
        if (!restaurant?.id) throw new Error("Cannot perform this action because restaurant context is missing.");
        if (!restaurant.country) throw new Error("Cannot perform this action because restaurant country is missing.");

        const status = order.status;
        const now = new Date();
        const total = options?.preserveFinancials ? order.total : calculateCartProductsTotal(nextProducts);
        const subTotal = options?.preserveFinancials ? order.subTotal : total;
        const tableValue = options?.tableOverride !== undefined ? `${options.tableOverride || ""}`.trim() : `${order.table || ""}`.trim();
        const sanitizedProducts = cloneAndSanitizeCartProducts(nextProducts);

        const variables: Record<string, any> = {
            orderId: order.id,
            status,
            paid: order.paid,
            type: order.type,
            number: order.number,
            table: tableValue || undefined,
            buzzer: order.buzzer || undefined,
            notes: order.notes || undefined,
            eftposReceipt: order.eftposReceipt || undefined,
            paymentAmounts: toOrderPaymentAmountsInput(order.paymentAmounts),
            total,
            discount: undefined,
            promotionId: undefined,
            subTotal,
            preparationTimeInMinutes: restaurant.preparationTimeInMinutes || undefined,
            registerId: order.registerId || register?.id,
            products: sanitizedProducts,
            placedAt: order.placedAt,
            parkedAt: status === EOrderStatus.PARKED ? order.parkedAt || order.placedAt : undefined,
            parkedAtUtc: status === EOrderStatus.PARKED ? now.toISOString() : undefined,
            completedAt: status === EOrderStatus.COMPLETED ? order.completedAt || toLocalISOString(now) : undefined,
            completedAtUtc: status === EOrderStatus.COMPLETED ? now.toISOString() : undefined,
            orderUserId: user.id,
            orderRestaurantId: restaurant.id,
        };

        if (!variables.registerId) throw new Error("Cannot perform this action because register context is missing.");
        if (!variables.buzzer) delete variables.buzzer;
        if (!variables.notes) delete variables.notes;
        if (!variables.eftposReceipt) delete variables.eftposReceipt;
        if (!variables.paymentAmounts) delete variables.paymentAmounts;
        if (!variables.table) delete variables.table;

        return variables;
    };

    // Reads the saved per-product print counters for a parked/running order from local storage.
    const getPrintedProductQuantities = (orderId: string) => {
        try {
            const parsedProductQuantities = JSON.parse(localStorage.getItem(getParkedOrderPrintedProductStorageKey(orderId)) || "{}");
            if (!parsedProductQuantities) return {} as Record<string, number>;

            return Object.entries(parsedProductQuantities).reduce(
                (printedProductQuantities, [productId, quantity]) => {
                    if (typeof quantity === "number" && quantity > 0) printedProductQuantities[productId] = quantity;
                    return printedProductQuantities;
                },
                {} as Record<string, number>,
            );
        } catch {
            return {} as Record<string, number>;
        }
    };

    // Combines source-order print counters into destination-order counters so kitchen delta printing stays accurate after merge.
    const mergePrintedProductTracking = (destinationOrderId: string, sourceOrderId: string) => {
        const destinationPrintedProductQuantities = getPrintedProductQuantities(destinationOrderId);
        const sourcePrintedProductQuantities = getPrintedProductQuantities(sourceOrderId);

        const hasSourcePrintedProducts = Object.keys(sourcePrintedProductQuantities).length > 0;
        if (!hasSourcePrintedProducts) return;

        Object.entries(sourcePrintedProductQuantities).forEach(([productId, quantity]) => {
            destinationPrintedProductQuantities[productId] = (destinationPrintedProductQuantities[productId] || 0) + quantity;
        });

        localStorage.setItem(getParkedOrderPrintedProductStorageKey(destinationOrderId), JSON.stringify(destinationPrintedProductQuantities));
        localStorage.removeItem(getParkedOrderPrintedProductStorageKey(sourceOrderId));
    };

    // Merges one running dine-in order into the selected table order (destination).
    const runMergeOrder = async (destinationOrder: IGET_RESTAURANT_ORDER_FRAGMENT, sourceTable: string) => {
        if (!destinationOrder) throw new Error("Select a destination table with a running order.");

        const normalizedSourceTable = `${sourceTable || ""}`.trim();
        const normalizedDestinationTable = `${destinationOrder.table || transferSourceTable || ""}`.trim();
        if (!normalizedSourceTable) throw new Error("Select a source table to merge.");
        if (!normalizedDestinationTable) throw new Error("Destination table is invalid.");
        if (normalizedSourceTable === normalizedDestinationTable) throw new Error("Source and destination tables cannot be the same.");

        const sourceOrder = activeRunningOrdersByTable.get(normalizedSourceTable);
        if (!sourceOrder) throw new Error("Source table does not have an active running order.");
        if (sourceOrder.id === destinationOrder.id) throw new Error("Source and destination orders are the same.");

        const endpoint = getCreateMergedOrderEndpoint();
        await axios({
            method: "post",
            url: endpoint,
            data: {
                // Keep destination as order1 so the merged bill stays on the selected table.
                order1Id: destinationOrder.id,
                order2Id: sourceOrder.id,
            },
        });

        mergePrintedProductTracking(destinationOrder.id, sourceOrder.id);

        const refreshedOrdersResponse: any = await refetchActiveOrders();
        const refreshedOrders = (refreshedOrdersResponse?.data?.getOrdersByRestaurantByPlacedAt?.items || []).filter(Boolean);
        const refreshedDestinationOrder =
            refreshedOrders.find((order: IGET_RESTAURANT_ORDER_FRAGMENT) => order.id === destinationOrder.id) || destinationOrder;

        // If the current cart session was bound to the source order, re-bind it to the merged destination order.
        if (parkedOrderId === sourceOrder.id) {
            const destinationTableValue = `${refreshedDestinationOrder.table || normalizedDestinationTable}`.trim();
            setParkedOrderId(refreshedDestinationOrder.id);
            setParkedOrderNumber(refreshedDestinationOrder.number);
            setParkedOrderStatus(refreshedDestinationOrder.status);
            setTableNumber(destinationTableValue);
            setTable(destinationTableValue);
            setBuzzerNumber(refreshedDestinationOrder.buzzer || null);
            setNotes(refreshedDestinationOrder.notes || "");
            setCustomerInformation(
                refreshedDestinationOrder.customerInformation
                    ? {
                          firstName: refreshedDestinationOrder.customerInformation.firstName || "",
                          email: refreshedDestinationOrder.customerInformation.email || "",
                          phoneNumber: refreshedDestinationOrder.customerInformation.phoneNumber || "",
                          signatureBase64: "",
                          customFields: [],
                      }
                    : null,
            );
            setProducts(mapOrderProductsToCartProducts(refreshedDestinationOrder.products));
            if (typeof refreshedDestinationOrder.covers === "number" && refreshedDestinationOrder.covers > 0) {
                setCovers(refreshedDestinationOrder.covers);
            }
            initializeRunningOrderPrintedProductTracking(refreshedDestinationOrder);
        }

        toast.success(`Running order merged into Table ${normalizedDestinationTable}.`);
    };

    // Transfers one running order to another table when the target has no active running order.
    const runTransferOrder = async (sourceOrder: IGET_RESTAURANT_ORDER_FRAGMENT, targetTable: string) => {
        if (!sourceOrder) throw new Error("Please select a running order first.");
        const normalizedTargetTable = `${targetTable || ""}`.trim();
        const normalizedSourceTable = `${sourceOrder.table || ""}`.trim();
        if (!normalizedTargetTable) throw new Error("Please select a target table.");
        if (normalizedTargetTable === normalizedSourceTable) throw new Error("Source and target tables cannot be the same.");

        const targetOrder = activeRunningOrdersByTable.get(normalizedTargetTable);
        if (targetOrder && targetOrder.id !== sourceOrder.id) {
            throw new Error("Target table already has a running order.");
        }

        const sourceProducts = mapOrderProductsToCartProducts(sourceOrder.products);
        await updateOrderMutation({
            variables: buildOrderUpdateMutationVariables(sourceOrder, sourceProducts, {
                tableOverride: normalizedTargetTable,
                preserveFinancials: true,
            }),
        });

        if (parkedOrderId === sourceOrder.id) {
            setTableNumber(normalizedTargetTable);
            setTable(normalizedTargetTable);
        }

        await refetchActiveOrders();
        toast.success("Running order transferred.");
    };

    // Opens transfer mode and keeps merge controls collapsed.
    const startTransferMode = () => {
        if (orderActionMode === "merge") return;
        if (!selectedRunningOrder || !hasTransferTargets || transferBusy || mergeBusy) return;
        setOrderActionMode("transfer");
        setTransferError(null);
        setMergeError(null);
    };

    // Opens merge mode and keeps transfer controls collapsed.
    const startMergeMode = () => {
        if (orderActionMode === "transfer") return;
        if (!selectedRunningOrder || mergeBusy || transferBusy) return;
        if (!hasMergeSources) {
            const message = "No other running table is available to merge.";
            setMergeError(message);
            toast.error(message);
            return;
        }
        setOrderActionMode("merge");
        setMergeError(null);
        setTransferError(null);
    };

    // Returns to compact action chooser and clears inline action errors.
    const clearOrderActionMode = () => {
        if (transferBusy || mergeBusy) return;
        setOrderActionMode("none");
        setTransferError(null);
        setMergeError(null);
    };

    // Validates transfer UI state and executes the transfer action with user feedback.
    const onRunTransferOperation = async () => {
        if (transferBusy || mergeBusy || orderActionMode !== "transfer") return;

        const sourceOrder = selectedRunningOrder;
        const normalizedTargetTable = `${transferTargetTable || ""}`.trim();
        if (!sourceOrder) {
            setTransferError("Select a table with a running order.");
            return;
        }
        if (!normalizedTargetTable) {
            setTransferError("Select a target table.");
            return;
        }

        setTransferBusy(true);
        setTransferError(null);

        try {
            await runTransferOrder(sourceOrder, normalizedTargetTable);
            setOrderActionMode("none");
        } catch (error: any) {
            const message = error?.message || "Unable to complete this action.";
            setTransferError(message);
            toast.error(message);
        } finally {
            setTransferBusy(false);
        }
    };

    // Validates merge UI state and executes source->destination table merge with user feedback.
    const onRunMergeOperation = async () => {
        if (mergeBusy || transferBusy || orderActionMode !== "merge") return;

        const destinationOrder = selectedRunningOrder;
        const normalizedSourceTable = `${mergeSourceTable || ""}`.trim();
        if (!destinationOrder) {
            setMergeError("Select a destination table with a running order.");
            return;
        }
        if (!normalizedSourceTable) {
            setMergeError("Select a source table.");
            return;
        }

        setMergeBusy(true);
        setMergeError(null);

        try {
            await runMergeOrder(destinationOrder, normalizedSourceTable);
            setOrderActionMode("none");
        } catch (error: any) {
            const message = error?.message || "Unable to merge running orders.";
            setMergeError(message);
            toast.error(message);
        } finally {
            setMergeBusy(false);
        }
    };

    //List view of tables sorted by status.
    const listViewTables = useMemo(
        () =>
            visibleTables
                .filter((t) => !isNonInteractive(t.type))
                .slice()
                .sort(compareTablesByStatusOrder),
        [visibleTables],
    );

    // Render path starts here after the runtime order overlay has been applied for view mode.
    return (
        <PageWrapper>
            <div className="table-number-layout full-height">
                {/* --- HEADER (Only in View Mode) --- */}
                {!isDesignMode && (
                    <div className="layout-top-bar">
                        <div className="section-tabs">
                            {visibleSections.map((s) => (
                                <button
                                    key={s.id}
                                    className={`tab-btn ${activeSectionId === s.id ? "active" : ""} ${s.hidden ? "hidden" : ""}`}
                                    onClick={() => setActiveSectionId(s.id)}
                                >
                                    {s.name}
                                </button>
                            ))}
                            <button className="tab-btn" onClick={openSectionSettings} title="Section Settings">
                                <MdSettings size="22px" />
                            </button>
                        </div>
                        <div className="action-buttons">
                            <div className="view-toggle">
                                <button
                                    className={`toggle-btn ${viewMode === "map" ? "active" : ""}`}
                                    onClick={() => setViewMode("map")}
                                    title="Map View"
                                >
                                    <FiMap size="20px" />
                                </button>
                                <button
                                    className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
                                    onClick={() => setViewMode("list")}
                                    title="List View"
                                >
                                    <FaRectangleList size="20px" />
                                </button>
                            </div>
                            <Button className={`action-btn`} onClick={handleEditClick} title="Edit Layout">
                                <FiEdit2 /> Edit
                            </Button>
                        </div>
                    </div>
                )}

                <div className="layout-content">
                    {/* --- LEFT SIDEBAR (Edit Mode) --- */}
                    {isDesignMode && (
                        <div className="editor-sidebar">
                            <div className="sidebar-group">
                                <div
                                    className={`sidebar-item ${activeCategory === "tables" ? "active" : ""}`}
                                    onClick={() => setActiveCategory("tables")}
                                >
                                    <div className="icon">
                                        <FiSquare style={{ border: "1px solid currentColor", borderRadius: "4px" }} />
                                    </div>
                                    <div className="label">Tables</div>
                                </div>
                                <div
                                    className={`sidebar-item ${activeCategory === "chairs" ? "active" : ""}`}
                                    onClick={() => setActiveCategory("chairs")}
                                >
                                    <div className="icon">
                                        <FiLayout />
                                    </div>
                                    <div className="label">Chairs</div>
                                </div>
                                <div
                                    className={`sidebar-item ${activeCategory === "structure" ? "active" : ""}`}
                                    onClick={() => setActiveCategory("structure")}
                                >
                                    <div className="icon">
                                        <FiLayout style={{ transform: "rotate(90deg)" }} />
                                    </div>
                                    <div className="label">Structures</div>
                                </div>
                                <div
                                    className={`sidebar-item ${activeCategory === "decor" ? "active" : ""}`}
                                    onClick={() => setActiveCategory("decor")}
                                >
                                    <div className="icon">
                                        <FiBox />
                                    </div>
                                    <div className="label">Decor</div>
                                </div>
                                <div
                                    className={`sidebar-item ${activeCategory === "select" ? "active" : ""}`}
                                    onClick={() => {
                                        setActiveCategory("select");
                                        selectShape(null);
                                    }}
                                >
                                    <div className="icon">
                                        <FiMousePointer />
                                    </div>
                                    <div className="label">Select</div>
                                </div>
                            </div>

                            <div className="sidebar-group bottom">
                                <div className="sidebar-item" onClick={deleteSelected}>
                                    <div className="icon">
                                        <FiTrash2 />
                                    </div>
                                    <div className="label">Delete</div>
                                </div>
                                <div className="sidebar-item" onClick={() => void handleManualSave()} title="Save layout changes to backend">
                                    <div className="icon">
                                        <FiSave />
                                    </div>
                                    <div className="label">Save Layout</div>
                                </div>
                                <div className="sidebar-item" onClick={onClose}>
                                    <div className="icon">
                                        <FiLogOut />
                                    </div>
                                    <div className="label">Exit</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PALETTE PANEL (Only in Edit Mode when category active) --- */}
                    {isDesignMode && activeCategory && ["tables", "structure", "decor", "chairs"].includes(activeCategory) && (
                        <div className="palette-panel">
                            <div className="palette-header">Drag {activeCategory} onto the canvas</div>
                            <div className="palette-grid">
                                {activeCategory === "tables" && (
                                    <>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "rect")}>
                                            <div className="preview rect"></div>
                                            <span>Square</span>
                                        </div>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "circle")}>
                                            <div className="preview circle"></div>
                                            <span>Round</span>
                                        </div>
                                    </>
                                )}
                                {activeCategory === "chairs" && (
                                    <>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "chair", undefined, 0)}>
                                            <div className="preview chair rotate-0"></div>
                                        </div>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "chair", undefined, 90)}>
                                            <div className="preview chair rotate-90"></div>
                                        </div>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "chair", undefined, 180)}>
                                            <div className="preview chair rotate-180"></div>
                                        </div>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "chair", undefined, 270)}>
                                            <div className="preview chair rotate-270"></div>
                                        </div>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "stool")}>
                                            <div className="preview stool"></div>
                                            <span>Stool</span>
                                        </div>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "armchair")}>
                                            <div className="preview armchair"></div>
                                            <span>Armchair</span>
                                        </div>
                                    </>
                                )}
                                {activeCategory === "structure" && (
                                    <>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "wall")}>
                                            <div className="preview wall"></div>
                                            <span>Wall</span>
                                        </div>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "pillar")}>
                                            <div className="preview pillar"></div>
                                            <span>Pillar</span>
                                        </div>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "floor", "wood")}>
                                            <div className="preview floor-wood"></div>
                                            <span>Floor: Wood</span>
                                        </div>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "floor", "tile")}>
                                            <div className="preview floor-tile"></div>
                                            <span>Floor: Tile</span>
                                        </div>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "floor", "concrete")}>
                                            <div className="preview floor-concrete"></div>
                                            <span>Floor: Concrete</span>
                                        </div>
                                    </>
                                )}
                                {activeCategory === "decor" && (
                                    <>
                                        <div className="draggable-item" draggable onDragStart={(e) => handleDragStart(e, "plant")}>
                                            <div className="preview plant"></div>
                                            <span>Plant</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- MAIN STAGE --- */}
                    <div
                        className={`floor-plan-container ${isDesignMode ? "edit-mode" : "view-mode"}`}
                        ref={containerRef}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {viewMode === "map" ? (
                            <>
                                {isDesignMode && (
                                    <div className="viewport-tools">
                                        <button onClick={() => setStageScale((prev) => Math.max(ZOOM_MIN, Number((prev / ZOOM_STEP).toFixed(2))))}>
                                            <FiZoomOut />
                                        </button>
                                        <button onClick={() => setStageScale((prev) => Math.min(ZOOM_MAX, Number((prev * ZOOM_STEP).toFixed(2))))}>
                                            <FiZoomIn />
                                        </button>
                                        <button onClick={resetViewport}>
                                            <FiMaximize2 />
                                        </button>
                                    </div>
                                )}
                                <Stage
                                    width={stageSize.width}
                                    height={stageSize.height}
                                    pixelRatio={window.devicePixelRatio}
                                    x={stagePosition.x}
                                    y={stagePosition.y}
                                    scaleX={stageScale}
                                    scaleY={stageScale}
                                    draggable={false}
                                    onDragEnd={(e) => {
                                        if (!isDesignMode) return;
                                        // Child node drags bubble here; only move canvas when the stage itself is dragged.
                                        if (e.target !== e.target.getStage()) return;
                                        setStagePosition({ x: e.target.x(), y: e.target.y() });
                                    }}
                                    onWheel={(e) => {
                                        if (!isDesignMode) return;
                                        e.evt.preventDefault();
                                        const pointer = e.target.getStage()?.getPointerPosition();
                                        if (!pointer) return;
                                        const oldScale = stageScale;
                                        const direction = e.evt.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
                                        const nextScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Number((oldScale * direction).toFixed(2))));
                                        if (nextScale === oldScale) return;

                                        const mousePointTo = {
                                            x: (pointer.x - stagePosition.x) / oldScale,
                                            y: (pointer.y - stagePosition.y) / oldScale,
                                        };
                                        const nextPosition = {
                                            x: pointer.x - mousePointTo.x * nextScale,
                                            y: pointer.y - mousePointTo.y * nextScale,
                                        };
                                        setStageScale(nextScale);
                                        setStagePosition(nextPosition);
                                    }}
                                    onMouseDown={(e) => {
                                        if (e.target === e.target.getStage()) selectShape(null);
                                    }}
                                    onTouchStart={(e) => {
                                        if (e.target === e.target.getStage()) selectShape(null);
                                    }}
                                    style={{ backgroundColor: isDesignMode ? "#f8f9fa" : "#fff" }}
                                >
                                    {isDesignMode && <BackgroundGrid width={stageSize.width} height={stageSize.height} />}
                                    <Layer>
                                        {visibleTables.map((tableAttr) => (
                                            <TableNode
                                                key={tableAttr.id}
                                                shapeProps={tableAttr}
                                                isSelected={tableAttr.id === selectedId}
                                                isDesignMode={isDesignMode}
                                                onSelect={() => {
                                                    if (!isDesignMode && isNonInteractive(tableAttr.type)) return;
                                                    if (isDesignMode) bringNodeToFront(tableAttr.id);
                                                    selectShape(tableAttr.id);
                                                    if (!isNonInteractive(tableAttr.type)) {
                                                        setTable(tableAttr.number);
                                                        setTableError(false);
                                                        const nextCovers = tableAttr.seats;
                                                        if (nextCovers) setCoversNumber(nextCovers);
                                                    }
                                                }}
                                                onChange={(newAttrs) => {
                                                    const idx = tables.findIndex((t) => t.id === newAttrs.id);
                                                    if (idx < 0) return;
                                                    if (tables[idx]?.locked) return;
                                                    const newT = [...tables];
                                                    newT[idx] = newAttrs;
                                                    updateTables(() => newT);
                                                }}
                                            />
                                        ))}
                                    </Layer>
                                </Stage>
                                {isDesignMode && (
                                    <div className="minimap">
                                        <div className="minimap-canvas" style={{ width: minimapSize.width, height: minimapSize.height }}>
                                            {visibleTables.map((node) => (
                                                <span
                                                    key={`mini-${node.id}`}
                                                    className={`minimap-node ${node.type === "floor" ? "floor" : "shape"}`}
                                                    style={{
                                                        left: `${(node.x / safeStageWidth) * minimapSize.width}px`,
                                                        top: `${(node.y / safeStageHeight) * minimapSize.height}px`,
                                                        width: `${Math.max(2, (node.width / safeStageWidth) * minimapSize.width)}px`,
                                                        height: `${Math.max(2, (node.height / safeStageHeight) * minimapSize.height)}px`,
                                                    }}
                                                />
                                            ))}
                                            <span
                                                className="minimap-viewport"
                                                style={{
                                                    left: `${minimapViewport.left}px`,
                                                    top: `${minimapViewport.top}px`,
                                                    width: `${Math.max(8, minimapViewport.width)}px`,
                                                    height: `${Math.max(8, minimapViewport.height)}px`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="list-view-container">
                                {listViewTables.length === 0 ? (
                                    <div className="empty-state">No tables in this section.</div>
                                ) : (
                                    <div className="table-grid">
                                        {listViewTables.map((t) => {
                                            const liveState = liveTableStateByTable.get(`${t.number || ""}`.trim());
                                            return (
                                                <div
                                                    key={t.id}
                                                    className={`table-card ${selectedId === t.id ? "selected" : ""}`}
                                                    onClick={() => {
                                                        if (isDesignMode) bringNodeToFront(t.id);
                                                        selectShape(t.id);
                                                        setTable(t.number);
                                                        setTableError(false);
                                                        const nextCovers = liveState?.covers || t.seats;
                                                        if (nextCovers) setCoversNumber(nextCovers);
                                                    }}
                                                >
                                                    <div className="card-icon">{t.type === "circle" ? <FiCircle /> : <FiSquare />}</div>
                                                    <div className="card-info">
                                                        <div className="number">Table {t.number}</div>
                                                        <div className="meta">
                                                            <span className={`status-pill status-${t.status || "available"}`}>
                                                                {STATUS_META[t.status || "available"].label}
                                                            </span>
                                                        </div>
                                                        {/* Point 5: table cards surface live open-order metadata for fast floor visibility. */}
                                                        <div className="meta-line">
                                                            <span className="meta-label">Open</span>
                                                            <span className="meta-value">
                                                                {liveState?.elapsedMinutes !== null && liveState?.elapsedMinutes !== undefined
                                                                    ? `${liveState.elapsedMinutes}m`
                                                                    : "-"}
                                                            </span>
                                                        </div>
                                                        <div className="meta-line">
                                                            <span className="meta-label">Covers</span>
                                                            <span className="meta-value">{liveState?.covers || t.seats || 0}</span>
                                                        </div>
                                                        <div className="meta-line">
                                                            <span className="meta-label">Total</span>
                                                            <span className="meta-value">{formatOrderTotal(liveState?.totalCents)}</span>
                                                        </div>
                                                        <div className="meta-line">
                                                            <span className="meta-label">Server</span>
                                                            <span className="meta-value">{liveState?.serverLabel || "-"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                        {!isDesignMode && (
                            <div className="status-legend">
                                {STATUS_ORDER.map((status) => (
                                    <div key={status} className="legend-item">
                                        <span className="legend-dot" style={{ backgroundColor: STATUS_META[status].dot }} />
                                        <span className="legend-label">{STATUS_META[status].label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Side: Input Form */}
                    <div className="input-form-container">
                        <div className="close-button-wrapper-right">
                            <FiX className="close-button" size={32} onClick={onClose} />
                        </div>
                        <div className={`save-status-banner state-${saveState}`}>
                            <span className="save-status-label">{saveStateLabel}</span>
                            {saveState === "error" && (
                                <button className="save-retry-btn" onClick={() => void retrySave()}>
                                    Retry
                                </button>
                            )}
                        </div>
                        {saveState === "error" && saveErrorMessage && <div className="save-status-error">{saveErrorMessage}</div>}

                        <div className="form-section top-spacing">
                            <div className="h3 section-title">
                                {isDesignMode ? "Properties" : selectedTable ? `Table ${selectedTable.number}` : "Select Table"}
                            </div>

                            {/* In Design Mode, show properties based on selection */}
                            {isDesignMode ? (
                                selectedId ? (
                                    <div className="edit-panel">
                                        {selectedNode && ["rect", "circle"].includes(selectedNode.type) ? (
                                            <>
                                                <div className="control-group">
                                                    <label>Table Shape</label>
                                                    <div className="status-actions">
                                                        <button
                                                            className={`status-action ${selectedNode.type === "rect" ? "active" : ""}`}
                                                            onClick={() => updateSelectedShape("rect")}
                                                        >
                                                            Square / Rectangle
                                                        </button>
                                                        <button
                                                            className={`status-action ${selectedNode.type === "circle" ? "active" : ""}`}
                                                            onClick={() => updateSelectedShape("circle")}
                                                        >
                                                            Round
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="control-group">
                                                    <label>Table Number</label>
                                                    <Input
                                                        value={selectedNode?.number || ""}
                                                        onChange={(e: any) => {
                                                            const newVal = `${e.target.value || ""}`.trim();
                                                            const currentNode = tables.find((t) => t.id === selectedId);
                                                            if (!currentNode) return;
                                                            const isDuplicate = tables.some(
                                                                (t) =>
                                                                    t.id !== selectedId &&
                                                                    (t.type === "rect" || t.type === "circle") &&
                                                                    t.sectionId === currentNode.sectionId &&
                                                                    (t.number || "").trim() === newVal,
                                                            );
                                                            if (newVal && isDuplicate) {
                                                                setSaveState("error");
                                                                setSaveErrorMessage(`Table number '${newVal}' already exists in this section.`);
                                                                return;
                                                            }
                                                            updateTables((prev) =>
                                                                prev.map((t) => (t.id === selectedId ? { ...t, number: newVal } : t)),
                                                            );
                                                            setSaveErrorMessage(null);
                                                            setSaveState((prev) => (prev === "error" ? "dirty" : prev));
                                                            setTable(newVal);
                                                        }}
                                                    />
                                                </div>
                                                <div className="control-group">
                                                    <label>Default Covers</label>
                                                    <Stepper
                                                        count={selectedNode?.seats || DEFAULT_SEATS}
                                                        min={1}
                                                        max={12}
                                                        onUpdate={(val) =>
                                                            updateTables((prev) => prev.map((t) => (t.id === selectedId ? { ...t, seats: val } : t)))
                                                        }
                                                        size={32}
                                                    />
                                                </div>
                                                <div className="control-group">
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedNode?.locked || false}
                                                            onChange={(e) =>
                                                                updateTables((prev) =>
                                                                    prev.map((t) => (t.id === selectedId ? { ...t, locked: e.target.checked } : t)),
                                                                )
                                                            }
                                                        />
                                                        Lock Position
                                                    </label>
                                                </div>
                                                <div className="control-group">
                                                    <label>Table Status</label>
                                                    <div className="status-actions">
                                                        {STATUS_ORDER.map((status) => (
                                                            <button
                                                                key={status}
                                                                className={`status-action status-${status} ${selectedNode?.status === status ? "active" : ""}`}
                                                                onClick={() => updateSelectedStatus(status)}
                                                            >
                                                                {STATUS_META[status].label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : selectedNode?.type === "floor" ? (
                                            <>
                                                <div className="control-group">
                                                    <label>Floor Style</label>
                                                    <div className="status-actions">
                                                        {(Object.keys(FLOOR_STYLE_META) as FloorStyle[]).map((style) => (
                                                            <button
                                                                key={style}
                                                                className={`status-action ${selectedNode.floorStyle === style ? "active" : ""}`}
                                                                onClick={() =>
                                                                    updateTable(selectedNode.id, {
                                                                        floorStyle: style,
                                                                    })
                                                                }
                                                            >
                                                                {FLOOR_STYLE_META[style].label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="control-group">
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedNode?.locked || false}
                                                            onChange={(e) =>
                                                                updateTables((prev) =>
                                                                    prev.map((t) => (t.id === selectedId ? { ...t, locked: e.target.checked } : t)),
                                                                )
                                                            }
                                                        />
                                                        Lock Position
                                                    </label>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="control-group">
                                                    <label>Element</label>
                                                    <p className="hint">Drag edges to resize or rotate. Click a chair to rotate counterclockwise.</p>
                                                </div>
                                                <div className="control-group">
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedNode?.locked || false}
                                                            onChange={(e) =>
                                                                updateTables((prev) =>
                                                                    prev.map((t) => (t.id === selectedId ? { ...t, locked: e.target.checked } : t)),
                                                                )
                                                            }
                                                        />
                                                        Lock Position
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-muted small">Select an item to edit its properties.</div>
                                )
                            ) : selectedTable ? (
                                <div className="table-details">
                                    <div className={`status-pill status-${selectedTable.status || "available"}`}>
                                        {STATUS_META[selectedTable.status || "available"].label}
                                    </div>
                                    <div className="detail-grid">
                                        <div>
                                            <div className="detail-label">Guests</div>
                                            <div className="detail-value">
                                                {selectedTableLiveState?.covers || coversNumber || selectedTable.seats || 0}
                                            </div>
                                        </div>
                                        {/* Point 5: selected table details use the same live metadata model as table cards. */}
                                        <div>
                                            <div className="detail-label">Time Open</div>
                                            <div className="detail-value">
                                                {selectedTableLiveState?.elapsedMinutes !== null &&
                                                selectedTableLiveState?.elapsedMinutes !== undefined
                                                    ? `${selectedTableLiveState.elapsedMinutes}m`
                                                    : "-"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="detail-label">Total</div>
                                            <div className="detail-value">
                                                {formatOrderTotal(selectedTableLiveState?.totalCents ?? selectedTableCartTotalCents)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="detail-label">Server</div>
                                            <div className="detail-value">{selectedTableLiveState?.serverLabel || "-"}</div>
                                        </div>
                                    </div>
                                    {!selectedTableHasLiveOrder && (
                                        <div className="status-actions">
                                            {VIEW_MODE_MANUAL_STATUSES.map((status) => (
                                                <button
                                                    key={status}
                                                    className={`status-action status-${status} ${selectedTable.status === status ? "active" : ""}`}
                                                    onClick={() => updateSelectedStatus(status)}
                                                >
                                                    {STATUS_META[status].label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedRunningOrder && (
                                        <div className="transfer-panel">
                                            <div className="detail-label">Order Actions</div>
                                            <div className="status-actions">
                                                <button
                                                    className={`status-action ${orderActionMode === "transfer" ? "active" : ""}`}
                                                    onClick={startTransferMode}
                                                    disabled={transferBusy || mergeBusy || !hasTransferTargets || orderActionMode === "merge"}
                                                >
                                                    Transfer Order
                                                </button>
                                                <button
                                                    className={`status-action ${orderActionMode === "merge" ? "active" : ""}`}
                                                    onClick={startMergeMode}
                                                    disabled={mergeBusy || transferBusy || orderActionMode === "transfer"}
                                                >
                                                    Merge Orders
                                                </button>
                                                {orderActionMode !== "none" && (
                                                    <button
                                                        className="status-action"
                                                        onClick={clearOrderActionMode}
                                                        disabled={transferBusy || mergeBusy}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>

                                            {orderActionMode === "none" && (
                                                <div className="helper-text">
                                                    {hasTransferTargets || hasMergeSources || !!selectedRunningOrder
                                                        ? "Choose an action for this running order."
                                                        : "No transfer or merge action is currently available."}
                                                </div>
                                            )}
                                            {orderActionMode === "none" && mergeError && <div className="transfer-error">{mergeError}</div>}

                                            {orderActionMode === "transfer" && (
                                                <>
                                                    <label className="detail-label">Target Table</label>
                                                    <select
                                                        className="transfer-target-select"
                                                        value={transferTargetTable}
                                                        onChange={(event) => {
                                                            setTransferTargetTable(event.target.value);
                                                            if (transferError) setTransferError(null);
                                                        }}
                                                        disabled={transferBusy || mergeBusy || !hasTransferTargets}
                                                    >
                                                        {!hasTransferTargets && <option value="">No empty target table available</option>}
                                                        {transferTargetOptions.map((tableNumberOption) => (
                                                            <option key={tableNumberOption} value={tableNumberOption}>
                                                                Table {tableNumberOption}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {transferError && <div className="transfer-error">{transferError}</div>}
                                                    {!hasTransferTargets && (
                                                        <div className="helper-text">No empty table is available for transfer.</div>
                                                    )}
                                                    <Button
                                                        className="transfer-action-btn"
                                                        disabled={transferBusy || mergeBusy || !hasTransferTargets}
                                                        onClick={() => void onRunTransferOperation()}
                                                    >
                                                        {transferBusy ? "Processing..." : "Transfer Running Order"}
                                                    </Button>
                                                </>
                                            )}

                                            {orderActionMode === "merge" && (
                                                <>
                                                    <label className="detail-label">Source Table</label>
                                                    <select
                                                        className="transfer-target-select"
                                                        value={mergeSourceTable}
                                                        onChange={(event) => {
                                                            setMergeSourceTable(event.target.value);
                                                            if (mergeError) setMergeError(null);
                                                        }}
                                                        disabled={mergeBusy || transferBusy || !hasMergeSources}
                                                    >
                                                        {!hasMergeSources && <option value="">No source table available</option>}
                                                        {mergeSourceOptions.map((tableNumberOption) => (
                                                            <option key={tableNumberOption} value={tableNumberOption}>
                                                                Table {tableNumberOption}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {mergeSourceTable && (
                                                        <div className="helper-text">
                                                            Merge Table {mergeSourceTable} into Table {transferSourceTable}.
                                                        </div>
                                                    )}
                                                    {mergeError && <div className="transfer-error">{mergeError}</div>}
                                                    {!hasMergeSources && (
                                                        <div className="helper-text">No source table with a running order is available.</div>
                                                    )}
                                                    <Button
                                                        className="transfer-action-btn"
                                                        disabled={mergeBusy || transferBusy || !hasMergeSources}
                                                        onClick={() => void onRunMergeOperation()}
                                                    >
                                                        {mergeBusy ? "Processing..." : "Merge Into Selected Table"}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <div className="helper-text">
                                        {selectedTableHasLiveOrder
                                            ? "Status is driven by the active dine-in order."
                                            : "Tap to mark the table as available or reserved."}
                                    </div>
                                </div>
                            ) : (
                                /* Normal Mode: Inputs */
                                <>
                                    <Input
                                        autoFocus
                                        onChange={(e) => {
                                            setTable(e.target.value);
                                            setTableError(false);
                                        }}
                                        value={table || ""}
                                        error={tableError ? "Required" : ""}
                                        placeholder="Enter or select table..."
                                    />
                                    {tableError && <div className="text-error mt-2">{tableError ? "Required" : ""}</div>}
                                </>
                            )}
                        </div>

                        {register?.enableCovers && !isDesignMode && (
                            <div className="form-section">
                                <div className="h3 section-title">Covers</div>
                                <div className="covers-wrapper">
                                    <Stepper count={coversNumber} min={1} max={20} onUpdate={setCoversNumber} size={48} />
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: "auto", width: "100%", paddingTop: "20px" }}>
                            <Button onClick={onNext} style={{ width: "100%", height: "50px", fontSize: "1.2rem" }}>
                                {isDesignMode ? "Done" : "Next"}
                            </Button>
                        </div>
                    </div>
                </div>

                <TableLayoutEditModal
                    isOpen={showEditConfirm}
                    sectionName={sections.find((s) => s.id === activeSectionId)?.name}
                    onClose={() => setShowEditConfirm(false)}
                    onConfirm={confirmEditMode}
                />

                <TableSectionSettingsModal
                    isOpen={showSectionSettings}
                    sectionDrafts={sectionDrafts}
                    sectionError={sectionError}
                    onClose={closeSectionSettings}
                    onAddSection={addSection}
                    onSave={() => void saveSectionSettings()}
                    onDeleteSection={deleteSectionDraft}
                    onSectionNameChange={(sectionId, value) =>
                        setSectionDrafts((prev) => prev.map((s) => (s.id === sectionId ? { ...s, name: value } : s)))
                    }
                    onSectionVisibilityChange={(sectionId, isVisible) =>
                        setSectionDrafts((prev) => prev.map((s) => (s.id === sectionId ? { ...s, hidden: !isVisible } : s)))
                    }
                />

                <TableAddSectionModal
                    isOpen={showAddSectionModal}
                    value={newSectionName}
                    error={addSectionError}
                    onClose={() => {
                        setShowAddSectionModal(false);
                        setAddSectionError(null);
                        setNewSectionName("");
                    }}
                    onChange={(value) => {
                        setNewSectionName(value);
                        if (addSectionError) setAddSectionError(null);
                    }}
                    onSave={saveNewSection}
                />
            </div>
        </PageWrapper>
    );
};

// Feature switch: keep disabled flow first in this file, enabled flow after it.
const TableNumberPage = () => {
    const { restaurant } = useRestaurant();
    const isTableFeatureEnabled = getIsTableFeatureEnabled(restaurant);
    return isTableFeatureEnabled ? <TableNumberFeatureEnabledPage /> : <TableNumberFeatureDisabledPage />;
};

export default TableNumberPage;
