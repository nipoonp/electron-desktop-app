import { format } from "date-fns";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRestaurant } from "../../context/restaurant-context";
import { UPDATE_MODIFIER, UPDATE_PRODUCT } from "../../graphql/customMutations";
import { GET_RESTAURANT, IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_MODIFIER, IGET_RESTAURANT_PRODUCT } from "../../graphql/customQueries";
import { useGetRestaurantQuery } from "../../hooks/useGetRestaurantQuery";
import { Button } from "../../tabin/components/button";
import { Checkbox } from "../../tabin/components/checkbox";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { Input } from "../../tabin/components/input";
import { Link } from "../../tabin/components/link";
import { StepperWithQuantityInput } from "../../tabin/components/stepperWithQuantityInput";

import "./stock.scss";

enum TabSelected {
    Products,
    Modifiers,
}

enum ItemAvailability {
    Available,
    SoldOutToday,
    SoldOut,
}

export default () => {
    const { restaurant: savedRestaurantItem } = useRestaurant();
    const [tabSelected, setTabSelected] = useState(TabSelected.Products);

    const [showSpinner, setShowSpinner] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const { data: restaurant, error: getRestaurantError, loading: getRestaurantLoading } = useGetRestaurantQuery(
        savedRestaurantItem ? savedRestaurantItem.id : ""
    );

    const refetchRestaurant = [
        {
            query: GET_RESTAURANT,
            variables: { restaurantId: restaurant ? restaurant.id : "" },
        },
    ];

    const [updateProductMutation, { data, loading, error }] = useMutation(UPDATE_PRODUCT, {
        update: (proxy, mutationResult: any) => {},
        refetchQueries: refetchRestaurant,
    });

    const [updateModifierMutation] = useMutation(UPDATE_MODIFIER, {
        update: (proxy, mutationResult: any) => {},
        refetchQueries: refetchRestaurant,
    });

    if (!savedRestaurantItem) return <div>Please select a restaurant before updating stock.</div>;

    if (getRestaurantLoading) {
        return <FullScreenSpinner show={true} text="Loading restaurant" />;
    }

    if (getRestaurantError) {
        return <h1>Couldn't get restaurant. Try Refreshing</h1>;
    }

    if (!restaurant) {
        return <>Restaurant does not exist</>;
    }

    const onUpdateProduct = async (id: string, soldOut?: boolean | null, soldOutDate?: string | null, totalQuantityAvailable?: number | null) => {
        try {
            setShowSpinner(true);
            await updateProductMutation({
                variables: {
                    id: id,
                    soldOut: soldOut,
                    soldOutDate: soldOutDate,
                    totalQuantityAvailable: totalQuantityAvailable,
                },
            });
        } catch (e) {
            alert(e.message);
            console.log("error: ", e);
        } finally {
            setShowSpinner(false);
        }
    };

    const onUpdateModifier = async (id: string, soldOut?: boolean | null, soldOutDate?: string | null, totalQuantityAvailable?: number | null) => {
        try {
            setShowSpinner(true);
            await updateModifierMutation({
                variables: {
                    id: id,
                    soldOut: soldOut,
                    soldOutDate: soldOutDate,
                    totalQuantityAvailable: totalQuantityAvailable,
                },
            });
        } catch (e) {
            alert(e.message);
            console.log("error: ", e);
        } finally {
            setShowSpinner(false);
        }
    };

    const onClickTab = (tab: TabSelected) => {
        setTabSelected(tab);
    };

    return (
        <>
            <FullScreenSpinner show={showSpinner} />;
            <div className="stock-container">
                <div className="h2 mb-6">Update Stock Levels</div>
                <div className="stock-tabs-wrapper mb-6">
                    <div className={`tab ${tabSelected == TabSelected.Products ? "selected" : ""}`} onClick={() => onClickTab(TabSelected.Products)}>
                        Products
                    </div>
                    <div
                        className={`tab ${tabSelected == TabSelected.Modifiers ? "selected" : ""}`}
                        onClick={() => onClickTab(TabSelected.Modifiers)}
                    >
                        Modifiers
                    </div>
                </div>

                <Input
                    className="mb-4"
                    type="text"
                    label="Search"
                    name="search"
                    value={searchTerm}
                    placeholder="Flat White..."
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                />

                {tabSelected == TabSelected.Products && searchTerm ? (
                    <div>
                        {restaurant &&
                            restaurant.categories.items.map(
                                (category) =>
                                    category.products &&
                                    category.products.items.map((p) => (
                                        <>
                                            {p.product.name.toLowerCase().includes(searchTerm.toLowerCase()) && (
                                                <Item item={p.product} onUpdate={onUpdateProduct} />
                                            )}
                                        </>
                                    ))
                            )}
                    </div>
                ) : tabSelected == TabSelected.Products && !searchTerm ? (
                    <div>
                        {restaurant &&
                            restaurant.categories.items.map((category) => <CategoryItem category={category} onUpdateProduct={onUpdateProduct} />)}
                    </div>
                ) : (
                    <>
                        <div>
                            {restaurant &&
                                restaurant.modifiers.items.map((modifier) => (
                                    <>
                                        {!modifier.productModifier && modifier.name.toLowerCase().includes(searchTerm.toLowerCase()) && (
                                            <Item item={modifier} onUpdate={onUpdateModifier} />
                                        )}
                                    </>
                                ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

const CategoryItem = (props: {
    category: IGET_RESTAURANT_CATEGORY;
    onUpdateProduct: (id: string, soldOut?: boolean | null, soldOutDate?: string | null, totalQuantityAvailable?: number | null) => void;
}) => {
    const { category } = props;
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="item-name" onClick={() => setIsOpen(!isOpen)}>
                <div className="h3">{category.name}</div>
                {isOpen ? <Link>Hide</Link> : <Link>Show</Link>}
            </div>
            {isOpen && <>{category.products && category.products.items.map((p) => <Item item={p.product} onUpdate={props.onUpdateProduct} />)}</>}
        </>
    );
};

const Item = (props: {
    item: IGET_RESTAURANT_PRODUCT | IGET_RESTAURANT_MODIFIER;
    onUpdate: (id: string, soldOut?: boolean | null, soldOutDate?: string | null, totalQuantityAvailable?: number | null) => void;
}) => {
    const { item } = props;
    const [isOpen, setIsOpen] = useState(false);

    const getItemAvailability = () => {
        if (item.soldOut) {
            return ItemAvailability.SoldOut;
        } else if (item.soldOutDate == format(new Date(), "yyyy-MM-dd")) {
            return ItemAvailability.SoldOutToday;
        } else {
            return ItemAvailability.Available;
        }
    };

    const itemAvailability = getItemAvailability();

    const onTrackStock = () => {
        props.onUpdate(item.id, item.soldOut, item.soldOutDate, 1);
    };

    const onUnTrackStock = () => {
        props.onUpdate(item.id, item.soldOut, item.soldOutDate, null);
    };

    const onUpdateStepper = (value: number) => {
        props.onUpdate(item.id, item.soldOut, item.soldOutDate, value);
    };

    const onAvailable = () => {
        props.onUpdate(item.id, false, null, item.totalQuantityAvailable);
    };

    const onSoldOutToday = () => {
        props.onUpdate(item.id, false, format(new Date(), "yyyy-MM-dd"), item.totalQuantityAvailable);
    };

    const onSoldOut = () => {
        props.onUpdate(item.id, true, undefined, item.totalQuantityAvailable);
    };

    return (
        <>
            <div className="item-name" onClick={() => setIsOpen(!isOpen)}>
                <div>
                    <span className="text-bold">{item.name}</span>{" "}
                    <span>
                        {item.totalQuantityAvailable && itemAvailability == ItemAvailability.Available
                            ? `(${item.totalQuantityAvailable} Available)`
                            : itemAvailability == ItemAvailability.SoldOut
                            ? "(SOLD OUT)"
                            : itemAvailability == ItemAvailability.SoldOutToday
                            ? "(SOLD OUT TODAY)"
                            : ""}
                    </span>
                </div>
                {isOpen ? <Link>Close</Link> : <Link>Edit</Link>}
            </div>
            {isOpen && (
                <div className="item-stock-container">
                    <div>
                        <Checkbox
                            className="pt-2"
                            onCheck={onTrackStock}
                            onUnCheck={onUnTrackStock}
                            checked={item.totalQuantityAvailable ? true : false}
                        >
                            Track Stock
                        </Checkbox>
                        {item.totalQuantityAvailable ? (
                            <div className="available-quantity-stepper-container mt-3">
                                <div className="mr-2">Available Quantity</div>
                                <StepperWithQuantityInput count={item.totalQuantityAvailable} min={1} onUpdate={onUpdateStepper} size={32} />
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>
                    <div className="availability-button-container mt-3">
                        <Button className={`${itemAvailability == ItemAvailability.Available ? "" : "unselected"}`} onClick={onAvailable}>
                            Available
                        </Button>
                        <Button className={`${itemAvailability == ItemAvailability.SoldOutToday ? "" : "unselected"}`} onClick={onSoldOutToday}>
                            Sold Out Today
                        </Button>
                        <Button className={`${itemAvailability == ItemAvailability.SoldOut ? "" : "unselected"}`} onClick={onSoldOut}>
                            Sold Out
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};
