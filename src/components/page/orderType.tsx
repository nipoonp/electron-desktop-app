import { useNavigate } from "react-router";
import { checkoutPath, restaurantPath, tableNumberPath } from "../main";
import { EOrderType } from "../../model/model";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { useRegister } from "../../context/register-context";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { CachedImage } from "../../tabin/components/cachedImage";
import { useRestaurant } from "../../context/restaurant-context";

import "./orderType.scss";

export const OrderType = () => {
    const navigate = useNavigate();
    const { setOrderType } = useCart();
    const { register, isPOS } = useRegister();
    const { restaurant } = useRestaurant();

    if (!register) throw "Register is not valid";
    if (restaurant == null) throw "Restaurant is invalid!";

    const onSelectOrderType = (orderType: EOrderType) => {
        setOrderType(orderType);

        if (register.enableTableFlags && orderType == EOrderType.DINEIN) {
            navigate(tableNumberPath);
        } else {
            if (isPOS) {
                navigate(restaurantPath + "/" + restaurant.id);
            } else {
                navigate(checkoutPath);
            }
        }
    };

    return (
        <>
            <PageWrapper>
                <div className="order-type">
                    <div className="h1 mb-12 are-you-staying-or-going">Are you staying or going?</div>
                    <div className="images-wrapper">
                        <div className="mr-12 dine-in-image-wrapper" onClick={() => onSelectOrderType(EOrderType.DINEIN)}>
                            <CachedImage
                                className="dine-in-image mb-4"
                                url={`${getPublicCloudFrontDomainName()}/images/order-type-dine-in.png`}
                                alt="dine-in-image"
                            />
                            <div className="h2">Dine In</div>
                        </div>
                        <div className="take-away-image-wrapper" onClick={() => onSelectOrderType(EOrderType.TAKEAWAY)}>
                            <CachedImage
                                className="take-away-image mb-4"
                                url={`${getPublicCloudFrontDomainName()}/images/order-type-take-away.png`}
                                alt="take-away-image"
                            />
                            <div className="h2">Takeaway</div>
                        </div>
                    </div>
                </div>
            </PageWrapper>
        </>
    );
};
