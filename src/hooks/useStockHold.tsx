import { useEffect, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { UPDATE_MODIFIER, UPDATE_PRODUCT } from "../graphql/customMutations";
import { IGET_RESTAURANT_PRODUCT, IGET_RESTAURANT_MODIFIER } from "../graphql/customQueries";
import { toast } from "../tabin/components/toast";
import { isItemSoldOut } from "../util/util";

export type StockTarget = {
    item: IGET_RESTAURANT_PRODUCT | IGET_RESTAURANT_MODIFIER;
    type: "product" | "modifier";
};

export const useStockHold = (resetKey?: string) => {
    const client = useApolloClient();
    const [stockTarget, setStockTarget] = useState<StockTarget | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startedAt = useRef<number | null>(null);
    const triggered = useRef(false);

    const cancel = () => {
        if (timer.current !== null) clearTimeout(timer.current);
        timer.current = null;
        startedAt.current = null;
    };

    useEffect(() => cancel, [resetKey]);

    const getHoldHandlers = (target: StockTarget): React.HTMLAttributes<HTMLDivElement> => {
        const { item, type } = target;
        return {
            onPointerDown: (event) => {
                if (!event.isPrimary || event.button !== 0) return;
                cancel();
                triggered.current = false;
                startedAt.current = Date.now();
                timer.current = setTimeout(() => {
                    timer.current = null;
                    triggered.current = true;
                    setStockTarget(target);
                }, 2000);
            },
            onPointerUp: async (event) => {
                if (!event.isPrimary || event.button !== 0) return;
                const start = startedAt.current;
                cancel();
                if (start === null || triggered.current) return;
                const duration = Date.now() - start;
                if (duration < 1100) return;
                triggered.current = true;
                if (duration >= 2000) {
                    setStockTarget(target);
                    return;
                }
                const soldOut = !isItemSoldOut(item.soldOut, item.soldOutDate);
                try {
                    await client.mutate({
                        mutation: type === "modifier" ? UPDATE_MODIFIER : UPDATE_PRODUCT,
                        variables: { id: item.id, soldOut, soldOutDate: null },
                    });
                    toast.success(`${item.name} marked as ${soldOut ? "sold out" : "available"}`);
                } catch {
                    toast.error(`Could not update availability for ${item.name}`);
                }
            },
            onPointerLeave: cancel,
            onPointerCancel: cancel,
            onDragStart: (event) => event.preventDefault(),
            onContextMenu: (event) => event.preventDefault(),
            onClickCapture: (event) => {
                if (triggered.current) event.stopPropagation();
            },
        };
    };

    return { stockTarget, closeStockModal: () => setStockTarget(null), getHoldHandlers };
};
