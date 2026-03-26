import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { format } from "date-fns";
import { FiX } from "react-icons/fi";

import { ITableNodesAttributes } from "../../../model/model";
import {
    EReservationStatus,
    GET_RESERVATIONS_BY_RESTAURANT_BY_DATE_FULL,
    IGET_RESERVATION,
} from "../../../graphql/customQueries";
import { CREATE_RESERVATION, UPDATE_RESERVATION } from "../../../graphql/customMutations";
import { Input } from "../../../tabin/components/input";
import { Button } from "../../../tabin/components/button";
import { Select } from "../../../tabin/components/select";
import { ModalV2 } from "../../../tabin/components/modalv2";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { toast } from "../../../tabin/components/toast";

import "./ReservationsPanel.scss";

const STATUS_LABELS: Record<EReservationStatus, string> = {
    [EReservationStatus.PENDING]: "Pending",
    [EReservationStatus.CONFIRMED]: "Confirmed",
    [EReservationStatus.SEATED]: "Seated",
    [EReservationStatus.COMPLETED]: "Completed",
    [EReservationStatus.CANCELLED]: "Cancelled",
    [EReservationStatus.NO_SHOW]: "No Show",
};

type ModalMode = "add" | "edit";

interface IReservationForm {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;
    time: string;
    covers: string;
    status: EReservationStatus;
    notes: string;
    tableNumber: string;
}

const EMPTY_FORM = (date: string): IReservationForm => ({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    date,
    time: "18:00",
    covers: "2",
    status: EReservationStatus.CONFIRMED,
    notes: "",
    tableNumber: "",
});

const formatTime = (awsTime: string): string => {
    try {
        const [h, m] = awsTime.split(":");
        const d = new Date();
        d.setHours(parseInt(h), parseInt(m), 0);
        return format(d, "h:mm a");
    } catch {
        return awsTime;
    }
};

interface Props {
    restaurantId: string;
    tableNodes: ITableNodesAttributes[];
    highlightTableNumber?: string | null;
    onClose: () => void;
}

const ReservationsPanel = ({ restaurantId, tableNodes, highlightTableNumber, onClose }: Props) => {
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>("add");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<IReservationForm>(EMPTY_FORM(date));
    const [formErrors, setFormErrors] = useState<Partial<IReservationForm>>({});
    const [spinner, setSpinner] = useState(false);

    const refetchOptions = {
        query: GET_RESERVATIONS_BY_RESTAURANT_BY_DATE_FULL,
        variables: { restaurantId, date: { eq: date }, limit: 500 },
    };

    const { data, loading } = useQuery(GET_RESERVATIONS_BY_RESTAURANT_BY_DATE_FULL, {
        variables: { restaurantId, date: { eq: date }, limit: 500 },
        skip: !restaurantId,
        fetchPolicy: "network-only",
    });

    const reservations: IGET_RESERVATION[] = data?.getReservationsByRestaurantByDate?.items ?? [];

    const [createReservation] = useMutation(CREATE_RESERVATION, { refetchQueries: [refetchOptions] });
    const [updateReservation] = useMutation(UPDATE_RESERVATION, { refetchQueries: [refetchOptions] });

    // Filter to actual table nodes only (rect/circle with a number)
    const selectableTableNodes = useMemo(
        () =>
            tableNodes
                .filter((n) => (n.type === "rect" || n.type === "circle") && n.number)
                .sort((a, b) =>
                    (a.number ?? "").localeCompare(b.number ?? "", undefined, {
                        numeric: true,
                        sensitivity: "base",
                    })
                ),
        [tableNodes]
    );

    // Sort reservations: time ascending, then highlight table's reservations float to top
    const sorted = useMemo(() => {
        const items = [...reservations].sort((a, b) => a.time.localeCompare(b.time));
        if (!highlightTableNumber) return items;
        return [
            ...items.filter((r) => r.tableNumber?.trim() === highlightTableNumber.trim()),
            ...items.filter((r) => r.tableNumber?.trim() !== highlightTableNumber.trim()),
        ];
    }, [reservations, highlightTableNumber]);

    const totalCovers = reservations
        .filter((r) => r.status !== EReservationStatus.CANCELLED && r.status !== EReservationStatus.NO_SHOW)
        .reduce((sum, r) => sum + r.covers, 0);

    // ─── Helpers ────────────────────────────────────────────────────────────

    const openAddModal = () => {
        setForm({ ...EMPTY_FORM(date), tableNumber: highlightTableNumber ?? "" });
        setFormErrors({});
        setModalMode("add");
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (r: IGET_RESERVATION) => {
        setForm({
            customerName: r.customerName,
            customerEmail: r.customerEmail ?? "",
            customerPhone: r.customerPhone ?? "",
            date: r.date,
            time: r.time.slice(0, 5),
            covers: String(r.covers),
            status: r.status,
            notes: r.notes ?? "",
            tableNumber: r.tableNumber ?? "",
        });
        setFormErrors({});
        setModalMode("edit");
        setEditingId(r.id);
        setShowModal(true);
    };

    const setField = (field: keyof IReservationForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validate = (): boolean => {
        const errors: Partial<IReservationForm> = {};
        if (!form.customerName.trim()) errors.customerName = "Name is required";
        if (!form.date) errors.date = "Date is required";
        if (!form.time) errors.time = "Time is required";
        const coversNum = parseInt(form.covers);
        if (!form.covers || isNaN(coversNum) || coversNum < 1) errors.covers = "Min 1 guest";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const onUpdateStatus = async (r: IGET_RESERVATION, newStatus: EReservationStatus) => {
        setSpinner(true);
        try {
            await updateReservation({ variables: { id: r.id, status: newStatus } });
            toast.success(`Marked as ${STATUS_LABELS[newStatus]}`);
        } catch {
            toast.error("Could not update reservation.");
        } finally {
            setSpinner(false);
        }
    };

    const onSave = async () => {
        if (!validate()) return;
        setSpinner(true);
        try {
            const variables = {
                restaurantId,
                date: form.date,
                time: form.time.length === 5 ? `${form.time}:00` : form.time,
                covers: parseInt(form.covers),
                status: form.status,
                customerName: form.customerName.trim(),
                customerEmail: form.customerEmail.trim() || null,
                customerPhone: form.customerPhone.trim() || null,
                notes: form.notes.trim() || null,
                tableNumber: form.tableNumber.trim() || null,
            };
            if (modalMode === "add") {
                await createReservation({ variables });
                toast.success("Reservation added");
            } else {
                await updateReservation({ variables: { id: editingId, ...variables } });
                toast.success("Reservation updated");
            }
            setShowModal(false);
        } catch {
            toast.error("Could not save reservation.");
        } finally {
            setSpinner(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <FullScreenSpinner show={spinner} />

            <div className="res-panel">
                {/* Panel header */}
                <div className="res-panel-header">
                    <div className="res-panel-title">Reservations</div>
                    <FiX className="res-panel-close" size={20} onClick={onClose} />
                </div>

                {/* Date picker */}
                <div className="res-panel-date-row">
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                {/* Stats */}
                {reservations.length > 0 && (
                    <div className="res-panel-stats">
                        {reservations.length} {reservations.length === 1 ? "booking" : "bookings"} · {totalCovers} covers
                    </div>
                )}

                {/* Highlighted table callout */}
                {highlightTableNumber && (
                    <div className="res-panel-highlight-bar">
                        Table {highlightTableNumber} — showing reservations first
                    </div>
                )}

                {/* List */}
                <div className="res-panel-list">
                    {loading && reservations.length === 0 ? (
                        <div className="res-panel-empty">Loading...</div>
                    ) : sorted.length === 0 ? (
                        <div className="res-panel-empty">No reservations for this date.</div>
                    ) : (
                        sorted.map((r) => (
                            <PanelCard
                                key={r.id}
                                reservation={r}
                                highlighted={!!highlightTableNumber && r.tableNumber?.trim() === highlightTableNumber.trim()}
                                onEdit={() => openEditModal(r)}
                                onUpdateStatus={onUpdateStatus}
                            />
                        ))
                    )}
                </div>

                {/* Add button pinned to bottom */}
                <div className="res-panel-footer">
                    <Button onClick={openAddModal} style={{ width: "100%" }}>
                        + Add Reservation
                    </Button>
                </div>
            </div>

            {/* Add / Edit modal */}
            <ModalV2
                isOpen={showModal}
                onRequestClose={() => setShowModal(false)}
                width="520px"
                padding="28px"
                overlayClassName="res-panel-modal-overlay"
            >
                <div className="res-reservation-modal">
                    <div className="h3 mb-3">
                        {modalMode === "add" ? "Add Reservation" : "Edit Reservation"}
                    </div>

                    <Input
                        label="Guest Name"
                        value={form.customerName}
                        onChange={(e) => setField("customerName", e.target.value)}
                        placeholder="Jane Smith"
                        error={formErrors.customerName}
                    />
                    <div className="mb-3"></div>
                    <Input
                        label="Email"
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => setField("customerEmail", e.target.value)}
                        placeholder="jane@example.com"
                    />
                    <div className="mb-3"></div>
                    <Input
                        label="Phone"
                        type="tel"
                        value={form.customerPhone}
                        onChange={(e) => setField("customerPhone", e.target.value)}
                        placeholder="+64 21 000 0000"
                    />
                    <div className="mb-3"></div>
                    <Input
                        label="Date"
                        type="date"
                        value={form.date}
                        onChange={(e) => setField("date", e.target.value)}
                        error={formErrors.date}
                    />
                    <div className="mb-3"></div>
                    <Input
                        label="Time"
                        type="time"
                        value={form.time}
                        onChange={(e) => setField("time", e.target.value)}
                        error={formErrors.time}
                    />
                    <div className="mb-3"></div>
                    <Input
                        label="Guests"
                        type="number"
                        value={form.covers}
                        onChange={(e) => setField("covers", e.target.value)}
                        placeholder="2"
                        min="1"
                        max="100"
                        error={formErrors.covers}
                    />
                    <div className="mb-3"></div>
                    <Select
                        label="Status"
                        value={form.status}
                        onChange={(e) => setField("status", e.target.value as EReservationStatus)}
                    >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </Select>
                    {selectableTableNodes.length > 0 && (
                        <>
                            <div className="mb-3"></div>
                            <Select
                                label="Table (optional)"
                                value={form.tableNumber}
                                onChange={(e) => setField("tableNumber", e.target.value)}
                            >
                                <option value="">No table assigned</option>
                                {selectableTableNodes.map((t) => (
                                    <option key={t.id} value={t.number!}>
                                        Table {t.number}{t.seats ? ` (${t.seats} seats)` : ""}
                                    </option>
                                ))}
                            </Select>
                        </>
                    )}
                    <div className="mb-3"></div>
                    <Input
                        label="Notes (optional)"
                        value={form.notes}
                        onChange={(e) => setField("notes", e.target.value)}
                        placeholder="Dietary requirements, occasion, seating preference..."
                    />
                    <div className="mb-4"></div>

                    <div className="modal-actions">
                        <Button className="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={onSave}>
                            {modalMode === "add" ? "Add Reservation" : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </ModalV2>
        </>
    );
};

// ─── Panel card ───────────────────────────────────────────────────────────────

const PanelCard = (props: {
    reservation: IGET_RESERVATION;
    highlighted: boolean;
    onEdit: () => void;
    onUpdateStatus: (r: IGET_RESERVATION, status: EReservationStatus) => void;
}) => {
    const { reservation: r, highlighted, onEdit, onUpdateStatus } = props;

    const actions: { label: string; status: EReservationStatus }[] = [];
    if (r.status === EReservationStatus.PENDING) {
        actions.push({ label: "Confirm", status: EReservationStatus.CONFIRMED });
        actions.push({ label: "Cancel", status: EReservationStatus.CANCELLED });
    } else if (r.status === EReservationStatus.CONFIRMED) {
        actions.push({ label: "Seat", status: EReservationStatus.SEATED });
        actions.push({ label: "No Show", status: EReservationStatus.NO_SHOW });
        actions.push({ label: "Cancel", status: EReservationStatus.CANCELLED });
    } else if (r.status === EReservationStatus.SEATED) {
        actions.push({ label: "Complete", status: EReservationStatus.COMPLETED });
        actions.push({ label: "No Show", status: EReservationStatus.NO_SHOW });
    }

    return (
        <div className={`res-panel-card res-panel-card--${r.status.toLowerCase()} ${highlighted ? "res-panel-card--highlighted" : ""}`}>
            <div className="res-panel-card-top">
                <div className="res-panel-card-time">{formatTime(r.time)}</div>
                <span className={`res-panel-badge res-panel-badge--${r.status.toLowerCase()}`}>
                    {STATUS_LABELS[r.status]}
                </span>
            </div>
            <div className="res-panel-card-name">{r.customerName}</div>
            <div className="res-panel-card-meta">
                <span>{r.covers === 1 ? "1 guest" : `${r.covers} guests`}</span>
                {r.tableNumber && <span> · Table {r.tableNumber}</span>}
                {r.customerPhone && <span> · {r.customerPhone}</span>}
            </div>
            {r.notes && <div className="res-panel-card-notes">{r.notes}</div>}
            <div className="res-panel-card-actions">
                {actions.map((a) => (
                    <button
                        key={a.status}
                        className="res-panel-action-btn"
                        onClick={() => onUpdateStatus(r, a.status)}
                    >
                        {a.label}
                    </button>
                ))}
                <button className="res-panel-action-btn res-panel-action-btn--neutral" onClick={onEdit}>
                    Edit
                </button>
            </div>
        </div>
    );
};

export default ReservationsPanel;
