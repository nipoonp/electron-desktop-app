import React from "react";
import { useHistory } from "react-router";
import { checkoutPath, tableNumberPath } from "../main";
import { EOrderType } from "../../model/model";
import { useCart } from "../../context/cart-context";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import { useRegister } from "../../context/register-context";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";

import "./orderType.scss";

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
            <KioskPageWrapper>
                <div className="order-type">
                    <div className="h1 mb-12">Are you staying or going?</div>
                    <div className="imagesWrapper">
                        <div className="mr-12" onClick={() => onSelectOrderType(EOrderType.DINEIN)}>
                            <img className="dineinImage mb-4" src={`${getPublicCloudFrontDomainName()}/images/order-type-dine-in.png`} />
                            <div className="h2">Dine In</div>
                        </div>
                        <div onClick={() => onSelectOrderType(EOrderType.TAKEAWAY)}>
                            <img className="takeawayImage mb-4" src={`${getPublicCloudFrontDomainName()}/images/order-type-take-away.png`} />
                            <div className="h2">Takeaway</div>
                        </div>
                    </div>
                </div>
            </KioskPageWrapper>
        </>
    );
};
