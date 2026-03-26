import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { format } from "date-fns";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router";

import { useRestaurant } from "../../context/restaurant-context";
import { useGetRestaurantFloorPlanLazyQuery } from "../../hooks/useGetRestaurantFloorPlanLazyQuery";
import { CREATE_RESERVATION, UPDATE_RESERVATION } from "../../graphql/customMutations";
import {
    EReservationStatus,
    GET_RESERVATIONS_BY_RESTAURANT_BY_DATE_FULL,
    IGET_RESERVATION,
} from "../../graphql/customQueries";
import { ITableNodesAttributes } from "../../model/model";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { Input } from "../../tabin/components/input";
import { Button } from "../../tabin/components/button";
import { Select } from "../../tabin/components/select";
import { ModalV2 } from "../../tabin/components/modalv2";
import { toast } from "../../tabin/components/toast";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { tableNumberPath } from "../main";

import "./reservations.scss";

const STATUS_LABELS: Record<EReservationStatus, string> = {
    [EReservationStatus.PENDING]: "Pending",
    [EReservationStatus.CONFIRMED]: "Confirmed",
    [EReservationStatus.SEATED]: "Seated",
    [EReservationStatus.COMPLETED]: "Completed",
    [EReservationStatus.CANCELLED]: "Cancelled",
    [EReservationStatus.NO_SHOW]: "No Show",
};

const STATUS_FILTER_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: EReservationStatus.CONFIRMED, label: "Confirmed" },
    { value: EReservationStatus.PENDING, label: "Pending" },
    { value: EReservationStatus.SEATED, label: "Seated" },
    { value: EReservationStatus.COMPLETED, label: "Completed" },
    { value: EReservationStatus.CANCELLED, label: "Cancelled" },
    { value: EReservationStatus.NO_SHOW, label: "No Show" },
];

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

const EMPTY_FORM: IReservationForm = {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "18:00",
    covers: "2",
    status: EReservationStatus.CONFIRMED,
    notes: "",
    tableNumber: "",
};

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

const Reservations = () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const restaurantId = restaurant?.id ?? "";

    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>("add");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<IReservationForm>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<Partial<IReservationForm>>({});
    const [spinner, setSpinner] = useState(false);

    // Floor plan for table assignment dropdown
    const { getRestaurantFloorPlan, data: floorPlanData } = useGetRestaurantFloorPlanLazyQuery();
    useEffect(() => {
        if (restaurantId) getRestaurantFloorPlan({ variables: { restaurantId } });
    }, [restaurantId]);

    const tableNodes: ITableNodesAttributes[] = useMemo(
        () =>
            (floorPlanData?.nodes ?? [])
                .filter((n) => (n.type === "rect" || n.type === "circle") && n.number)
                .sort((a, b) =>
                    (a.number ?? "").localeCompare(b.number ?? "", undefined, { numeric: true, sensitivity: "base" })
                ),
        [floorPlanData]
    );

    const refetchOptions = {
        query: GET_RESERVATIONS_BY_RESTAURANT_BY_DATE_FULL,
        variables: { restaurantId, date: { eq: date }, limit: 500 },
    };

    const { data: reservationsData, loading } = useQuery(GET_RESERVATIONS_BY_RESTAURANT_BY_DATE_FULL, {
        variables: { restaurantId, date: { eq: date }, limit: 500 },
        skip: !restaurantId,
        fetchPolicy: "network-only",
    });

    const reservations: IGET_RESERVATION[] = reservationsData?.getReservationsByRestaurantByDate?.items ?? [];

    const [createReservation] = useMutation(CREATE_RESERVATION, { refetchQueries: [refetchOptions] });
    const [updateReservation] = useMutation(UPDATE_RESERVATION, { refetchQueries: [refetchOptions] });

    // ─── Helpers ────────────────────────────────────────────────────────────

    const openAddModal = () => {
        setForm({ ...EMPTY_FORM, date });
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
        if (!form.covers || isNaN(coversNum) || coversNum < 1) errors.covers = "Enter a number of guests (min 1)";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ─── Status actions ─────────────────────────────────────────────────────

    const onUpdateStatus = async (r: IGET_RESERVATION, newStatus: EReservationStatus) => {
        setSpinner(true);
        try {
            await updateReservation({ variables: { id: r.id, status: newStatus } });
            toast.success(`Reservation marked as ${STATUS_LABELS[newStatus]}`);
        } catch {
            toast.error("Could not update reservation. Please try again.");
        } finally {
            setSpinner(false);
        }
    };

    // ─── Form submit ─────────────────────────────────────────────────────────

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
            toast.error("Could not save reservation. Please try again.");
        } finally {
            setSpinner(false);
        }
    };

    // ─── Derived data ────────────────────────────────────────────────────────

    const filtered = reservations.filter((r) => statusFilter === "ALL" || r.status === statusFilter);
    const sorted = [...filtered].sort((a, b) => a.time.localeCompare(b.time));

    const grouped: { slotTime: string; items: IGET_RESERVATION[] }[] = [];
    sorted.forEach((r) => {
        const slot = r.time.slice(0, 5);
        const last = grouped[grouped.length - 1];
        if (last && last.slotTime === slot) {
            last.items.push(r);
        } else {
            grouped.push({ slotTime: slot, items: [r] });
        }
    });

    const totalCovers = reservations
        .filter((r) => r.status !== EReservationStatus.CANCELLED && r.status !== EReservationStatus.NO_SHOW)
        .reduce((sum, r) => sum + r.covers, 0);

    const confirmedCount = reservations.filter((r) => r.status === EReservationStatus.CONFIRMED).length;
    const seatedCount = reservations.filter((r) => r.status === EReservationStatus.SEATED).length;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <PageWrapper>
            <FullScreenSpinner show={spinner} />

            <div className="res-container">
                {/* Header */}
                <div className="res-header mb-3">
                    <button className="res-back-btn" onClick={() => navigate(tableNumberPath)}>
                        <FiArrowLeft size={18} />
                        <span>Floor Plan</span>
                    </button>
                    <div className="h2 res-header-title">Reservations</div>
                    <Button onClick={openAddModal}>+ Add Reservation</Button>
                </div>

                {/* Date picker */}
                <Input
                    className="mb-3"
                    label="Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />

                {/* Stats bar */}
                {reservations.length > 0 && (
                    <div className="res-stats mb-3">
                        <div className="res-stat">
                            <span className="res-stat-value">{reservations.length}</span>
                            <span className="res-stat-label">Bookings</span>
                        </div>
                        <div className="res-stat">
                            <span className="res-stat-value">{totalCovers}</span>
                            <span className="res-stat-label">Covers</span>
                        </div>
                        <div className="res-stat">
                            <span className="res-stat-value">{confirmedCount}</span>
                            <span className="res-stat-label">Confirmed</span>
                        </div>
                        <div className="res-stat">
                            <span className="res-stat-value">{seatedCount}</span>
                            <span className="res-stat-label">Seated</span>
                        </div>
                    </div>
                )}

                {/* Status filter tabs */}
                <div className="res-tabs mb-4">
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                        <div
                            key={opt.value}
                            className={`tab ${statusFilter === opt.value ? "selected" : ""}`}
                            onClick={() => setStatusFilter(opt.value)}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>

                {/* Loading / empty / list */}
                {loading && reservations.length === 0 ? (
                    <div className="res-empty">Loading reservations...</div>
                ) : grouped.length === 0 ? (
                    <div className="res-empty">
                        {statusFilter === "ALL"
                            ? "No reservations for this date."
                            : `No ${STATUS_LABELS[statusFilter as EReservationStatus]?.toLowerCase()} reservations for this date.`}
                    </div>
                ) : (
                    <div className="res-timeline">
                        {grouped.map(({ slotTime, items }) => (
                            <div key={slotTime} className="res-slot">
                                <div className="res-slot-time">{formatTime(`${slotTime}:00`)}</div>
                                <div className="res-slot-cards">
                                    {items.map((r) => (
                                        <ReservationCard
                                            key={r.id}
                                            reservation={r}
                                            onEdit={() => openEditModal(r)}
                                            onUpdateStatus={onUpdateStatus}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add / Edit modal */}
            <ModalV2
                isOpen={showModal}
                onRequestClose={() => setShowModal(false)}
                width="520px"
                padding="28px"
            >
                <h2 className="h3 mb-4">{modalMode === "add" ? "Add Reservation" : "Edit Reservation"}</h2>

                <Input
                    className="mb-3"
                    label="Guest Name"
                    value={form.customerName}
                    onChange={(e) => setField("customerName", e.target.value)}
                    placeholder="Jane Smith"
                    error={formErrors.customerName}
                />
                <div className="res-form-row mb-3">
                    <Input
                        label="Email"
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => setField("customerEmail", e.target.value)}
                        placeholder="jane@example.com"
                    />
                    <Input
                        label="Phone"
                        type="tel"
                        value={form.customerPhone}
                        onChange={(e) => setField("customerPhone", e.target.value)}
                        placeholder="+64 21 000 0000"
                    />
                </div>
                <div className="res-form-row mb-3">
                    <Input
                        label="Date"
                        type="date"
                        value={form.date}
                        onChange={(e) => setField("date", e.target.value)}
                        error={formErrors.date}
                    />
                    <Input
                        label="Time"
                        type="time"
                        value={form.time}
                        onChange={(e) => setField("time", e.target.value)}
                        error={formErrors.time}
                    />
                </div>
                <div className="res-form-row mb-3">
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
                    <Select
                        label="Status"
                        value={form.status}
                        onChange={(e) => setField("status", e.target.value as EReservationStatus)}
                    >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </Select>
                </div>
                {tableNodes.length > 0 && (
                    <Select
                        className="mb-3"
                        label="Table (optional)"
                        value={form.tableNumber}
                        onChange={(e) => setField("tableNumber", e.target.value)}
                    >
                        <option value="">No table assigned</option>
                        {tableNodes.map((t) => (
                            <option key={t.id} value={t.number!}>
                                Table {t.number}{t.seats ? ` (${t.seats} seats)` : ""}
                            </option>
                        ))}
                    </Select>
                )}
                <Input
                    className="mb-4"
                    label="Notes (optional)"
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Dietary requirements, occasion, seating preference..."
                />

                <div className="res-modal-actions">
                    <button className="res-cancel-btn" onClick={() => setShowModal(false)}>
                        Cancel
                    </button>
                    <Button onClick={onSave}>
                        {modalMode === "add" ? "Add Reservation" : "Save Changes"}
                    </Button>
                </div>
            </ModalV2>
        </PageWrapper>
    );
};

// ─── Reservation card ─────────────────────────────────────────────────────────

const ReservationCard = (props: {
    reservation: IGET_RESERVATION;
    onEdit: () => void;
    onUpdateStatus: (r: IGET_RESERVATION, status: EReservationStatus) => void;
}) => {
    const { reservation: r, onEdit, onUpdateStatus } = props;

    const actions: { label: string; status: EReservationStatus; variant?: "primary" | "danger" | "neutral" }[] = [];

    if (r.status === EReservationStatus.PENDING) {
        actions.push({ label: "Confirm", status: EReservationStatus.CONFIRMED, variant: "primary" });
        actions.push({ label: "Cancel", status: EReservationStatus.CANCELLED, variant: "danger" });
    } else if (r.status === EReservationStatus.CONFIRMED) {
        actions.push({ label: "Seat", status: EReservationStatus.SEATED, variant: "primary" });
        actions.push({ label: "No Show", status: EReservationStatus.NO_SHOW, variant: "danger" });
        actions.push({ label: "Cancel", status: EReservationStatus.CANCELLED, variant: "neutral" });
    } else if (r.status === EReservationStatus.SEATED) {
        actions.push({ label: "Complete", status: EReservationStatus.COMPLETED, variant: "primary" });
        actions.push({ label: "No Show", status: EReservationStatus.NO_SHOW, variant: "danger" });
    }

    return (
        <div className={`res-card res-card--${r.status.toLowerCase()}`}>
            <div className="res-card-main">
                <div className="res-card-name text-bold">{r.customerName}</div>
                <div className="res-card-meta">
                    <span>{r.covers === 1 ? "1 guest" : `${r.covers} guests`}</span>
                    {r.tableNumber && <span className="res-card-dot">·</span>}
                    {r.tableNumber && <span>Table {r.tableNumber}</span>}
                    {r.customerPhone && <span className="res-card-dot">·</span>}
                    {r.customerPhone && <span>{r.customerPhone}</span>}
                    {r.customerEmail && <span className="res-card-dot">·</span>}
                    {r.customerEmail && <span>{r.customerEmail}</span>}
                </div>
                {r.notes && <div className="res-card-notes">{r.notes}</div>}
            </div>
            <div className="res-card-right">
                <span className={`res-badge res-badge--${r.status.toLowerCase()}`}>
                    {STATUS_LABELS[r.status]}
                </span>
                <div className="res-card-actions">
                    {actions.map((a) => (
                        <button
                            key={a.status}
                            className={`res-action-btn res-action-btn--${a.variant ?? "neutral"}`}
                            onClick={() => onUpdateStatus(r, a.status)}
                        >
                            {a.label}
                        </button>
                    ))}
                    <button className="res-action-btn res-action-btn--neutral" onClick={onEdit}>
                        Edit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Reservations;
