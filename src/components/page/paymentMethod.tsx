import { useNavigate } from "react-router";
import { checkoutPath, restaurantPath, tableNumberPath } from "../main";
import { EPaymentMethod } from "../../model/model";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { useRegister } from "../../context/register-context";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { CachedImage } from "../../tabin/components/cachedImage";
import { useRestaurant } from "../../context/restaurant-context";

import "./paymentMethod.scss";
import { Button } from "../../tabin/components/button";
import { Link } from "../../tabin/components/link";
import { FiX } from "react-icons/fi";

export default () => {
    const navigate = useNavigate();
    const { setPaymentMethod } = useCart();
    const { register } = useRegister();
    const { restaurant } = useRestaurant();

    if (!register) throw "Register is not valid";
    if (restaurant == null) throw "Restaurant is invalid!";

    const onClose = () => {
        navigate(`${checkoutPath}`);
    };

    const onSelectPaymentMethod = (paymentMethod: EPaymentMethod) => {
        setPaymentMethod(paymentMethod);

        navigate(`${checkoutPath}/true`);
    };

    return (
        <>
            <PageWrapper>
                <div className="payment-method">
                    <div className="close-button-wrapper">
                        <FiX className="close-button" size={36} onClick={onClose} />
                    </div>
                    <div className="h1 mb-12 select-your-payment-method">Select your payment method</div>
                    <div className="payment-method-payment-button-wrapper">
                        {register.enableCashPayments && (
                            <Button className="large payment-method-cash-button" onClick={() => onSelectPaymentMethod(EPaymentMethod.CASH)}>
                                Cash
                            </Button>
                        )}
                        {register.enableEftposPayments && (
                            <Button className="large payment-method-eftpos-button ml-2" onClick={() => onSelectPaymentMethod(EPaymentMethod.EFTPOS)}>
                                Eftpos
                            </Button>
                        )}
                    </div>
                    {register.enablePayLater && (
                        <Link className="payment-method-pay-later mt-8" onClick={() => onSelectPaymentMethod(EPaymentMethod.LATER)}>
                            I'm not sure, I will pay later at the counter...
                        </Link>
                    )}
                </div>
            </PageWrapper>
        </>
    );
};
