import { useState } from "react";
import { useNavigate } from "react-router";
import { checkoutPath } from "../main";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { useRestaurant } from "../../context/restaurant-context";
import { useRegister } from "../../context/register-context";

import "./customerInformation.scss";

export default () => {
    const navigate = useNavigate();
    const { register } = useRegister();
    const { restaurant } = useRestaurant();
    const { customerInformation, setCustomerInformation } = useCart();

    const [firstName, setFirstName] = useState(customerInformation ? customerInformation.firstName : "");
    const [email, setEmail] = useState(customerInformation ? customerInformation.email : "");
    const [phoneNumber, setPhoneNumber] = useState(customerInformation ? customerInformation.phoneNumber : "");

    const [firstNameError, setFirstNameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [phoneNumberError, setPhoneNumberError] = useState(false);

    if (!register) throw "Register is not valid";
    if (restaurant == null) throw "Restaurant is invalid!";

    const onNext = () => {
        if (!register.requestCustomerInformation) return;

        let invalid = false;

        if (register.requestCustomerInformation.firstName && !firstName) {
            setFirstNameError(true);
            invalid = true;
        }
        if (register.requestCustomerInformation.email && !email) {
            setEmailError(true);
            invalid = true;
        }
        if (register.requestCustomerInformation.phoneNumber && !phoneNumber) {
            setPhoneNumberError(true);
            invalid = true;
        }

        if (!invalid) {
            setCustomerInformation({ firstName: firstName, email: email, phoneNumber: phoneNumber });
            navigate(`${checkoutPath}/true`);
        }
    };

    const onChangeFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFirstName(e.target.value);
        setFirstNameError(false);
    };

    const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setEmailError(false);
    };

    const onChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(e.target.value);
        setPhoneNumberError(false);
    };

    return (
        <>
            <PageWrapper>
                <div className="customer-information">
                    <div className="h2 mb-6">Enter enter customer details</div>
                    <div className="mb-10" style={{ width: "400px" }}>
                        {register.requestCustomerInformation && register.requestCustomerInformation.firstName && (
                            <>
                                <div className="h2 mt-2 mb-2">Name</div>
                                <Input
                                    type="firstName"
                                    autoFocus={true}
                                    onChange={onChangeFirstName}
                                    value={firstName}
                                    error={firstNameError ? "Required" : ""}
                                />
                            </>
                        )}
                        {register.requestCustomerInformation && register.requestCustomerInformation.email && (
                            <>
                                <div className="h2 mt-2 mb-2">Email</div>
                                <Input type="email" onChange={onChangeEmail} value={email} error={emailError ? "Required" : ""} />
                            </>
                        )}
                        {register.requestCustomerInformation && register.requestCustomerInformation.phoneNumber && (
                            <>
                                <div className="h2 mt-2 mb-2">Phone Number</div>
                                <Input type="number" onChange={onChangePhoneNumber} value={phoneNumber} error={phoneNumberError ? "Required" : ""} />
                            </>
                        )}
                    </div>
                    <Button onClick={onNext}>Next</Button>
                </div>
            </PageWrapper>
        </>
    );
};
