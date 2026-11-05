import { useState } from "react";
import { useMutation } from "@apollo/client";
import { format } from "date-fns";
import { UPDATE_MODIFIER, UPDATE_PRODUCT } from "../../graphql/customMutations";
import { StockTarget } from "../../hooks/useStockHold";
import { Button } from "../../tabin/components/button";
import { Checkbox } from "../../tabin/components/checkbox";
import { Input } from "../../tabin/components/input";
import { ModalV2 } from "../../tabin/components/modalv2";
import { Radio } from "../../tabin/components/radio";
import { toast } from "../../tabin/components/toast";

const statuses = ["Available", "Sold Out Today", "Sold Out"] as const;
type StockStatus = (typeof statuses)[number];

export const ItemStockModal = ({ target, onClose }: { target: StockTarget; onClose: () => void }) => {
    const { item, type } = target;
    const [updateStock, { loading }] = useMutation(type === "modifier" ? UPDATE_MODIFIER : UPDATE_PRODUCT);
    const [status, setStatus] = useState<StockStatus>(
        item.soldOut ? "Sold Out" : item.soldOutDate === format(new Date(), "yyyy-MM-dd") ? "Sold Out Today" : "Available",
    );
    const [trackStock, setTrackStock] = useState(!!item.totalQuantityAvailable);
    const [quantity, setQuantity] = useState(String(item.totalQuantityAvailable || ""));
    const quantityAvailable = Number(quantity);
    const validQuantity = Number.isInteger(quantityAvailable) && quantityAvailable > 0 && quantityAvailable <= 2147483647;
    const disabled = loading || (trackStock && !validQuantity);

    const save = async () => {
        if (disabled) return;
        try {
            await updateStock({
                variables: {
                    id: item.id,
                    soldOut: status === "Sold Out",
                    soldOutDate: status === "Sold Out Today" ? format(new Date(), "yyyy-MM-dd") : null,
                    totalQuantityAvailable: trackStock ? quantityAvailable : null,
                },
            });
            toast.success(`${item.name} stock updated`);
            onClose();
        } catch {
            toast.error(`Could not update stock for ${item.name}`);
        }
    };

    return (
        <ModalV2 padding="24px" isOpen onRequestClose={() => !loading && onClose()} disableClose={loading} contentLabel={`Stock for ${item.name}`}>
            <div className="item-stock-modal">
                <div className="h3 mb-3">{item.name}</div>
                <div className="mb-3">
                    <Checkbox checked={trackStock} onCheck={() => setTrackStock(true)} onUnCheck={() => setTrackStock(false)} disabled={loading}>
                        Track Stock
                    </Checkbox>
                    {trackStock && (
                        <div className="mt-3">
                            <Input
                                label="Quantity available"
                                type="number"
                                min="1"
                                max="2147483647"
                                value={quantity}
                                onChange={(event) => setQuantity(event.target.value)}
                                error={!validQuantity ? "Enter a positive whole number" : null}
                                disabled={loading}
                            />
                        </div>
                    )}
                </div>
                <div className="text-bold mb-2">Availability</div>
                <div className="mb-3" role="group" aria-label="Availability">
                    {statuses.map((option) => (
                        <Radio key={option} className="pt-1 pb-1" selected={status === option} onSelect={() => setStatus(option)} disabled={loading}>
                            {option}
                        </Radio>
                    ))}
                </div>
                <div className="d-flex">
                    <Button onClick={save} loading={loading} disabled={disabled} style={{ minWidth: 100 }}>
                        Save
                    </Button>
                </div>
            </div>
        </ModalV2>
    );
};
