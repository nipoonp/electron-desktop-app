import { format, subDays } from "date-fns";
import { useEffect, useState } from "react";
import { useRestaurant } from "../../../context/restaurant-context";
import { GET_ORDERS_BY_RESTAURANT_BY_BETWEEN_PLACEDAT } from "../../../graphql/customQueries";
import { useGetRestaurantOrdersByBetweenPlacedAt } from "../../../hooks/useGetRestaurantOrdersByBetweenPlacedAt";
import { DateRangePicker } from "../../../tabin/components/dateRangePicker";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";

export const SalesReport = () => {
    const { restaurant } = useRestaurant();
    const [focusedInput, setFocusedInput] = useState<"startDate" | "endDate" | null>(null);

    const [startDate, setStartDate] = useState<string | null>(format(subDays(new Date(), 7), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState<string | null>(format(new Date(), "yyyy-MM-dd"));

    const { data: orders, error, loading, refetch } = useGetRestaurantOrdersByBetweenPlacedAt(
        restaurant ? restaurant.id : "",
        startDate || "",
        endDate || ""
    );

    const onDatesChange = async (startD: string | null, endD: string | null) => {
        setStartDate(startD);
        setEndDate(endD);

        if (!startDate || !endDate) return;

        const res = await refetch({
            orderRestaurantId: restaurant ? restaurant.id : "",
            placedAtStartDate: startDate,
            placedAtEndDate: endDate,
        });
    };

    const onFocusChange = (focusedInput: "startDate" | "endDate" | null) => {
        setFocusedInput(focusedInput);
    };

    return (
        <>
            <FullScreenSpinner show={loading} text={"Loading orders..."} />

            <div className="m-4">
                <div className="h1 text-center mb-4">Reports</div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onDatesChange={onDatesChange}
                        focusedInput={focusedInput}
                        onFocusChange={onFocusChange}
                    />
                </div>
            </div>
        </>
    );
};
