import { useHistory } from "react-router";
import { checkoutPath, tableNumberPath } from "../main";
import { EOrderType } from "../../model/model";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { useRegister } from "../../context/register-context";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";

import "./orderType.scss";
import { CachedImage } from "../../tabin/components/cachedImage";

export const OrderType = (props: {}) => {
    const history = useHistory();
    const { setOrderType } = useCart();
    const { register } = useRegister();

    if (!register) {
        throw "Register is not valid";
    }

    const onSelectOrderType = (orderType: EOrderType) => {
        setOrderType(orderType);

        if (register.enableTableFlags && orderType == EOrderType.DINEIN) {
            history.push(tableNumberPath);
        } else {
            history.push(checkoutPath);
        }
    };

    return (
        <>
            <PageWrapper>
                <div className="order-type">
                    <div className="h1 mb-12">Are you staying or going?</div>
                    <div className="imagesWrapper">
                        <div className="mr-12" onClick={() => onSelectOrderType(EOrderType.DINEIN)}>
                            <CachedImage
                                className="dineinImage mb-4"
                                url={`${getPublicCloudFrontDomainName()}/images/order-type-dine-in.png`}
                                alt="dine-in-image"
                            />
                            <div className="h2">Dine In</div>
                        </div>
                        <div onClick={() => onSelectOrderType(EOrderType.TAKEAWAY)}>
                            <CachedImage
                                className="takeawayImage mb-4"
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
