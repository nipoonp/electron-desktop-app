import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { checkoutPath, restaurantPath } from "../main";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { useRestaurant } from "../../context/restaurant-context";
import { useRegister } from "../../context/register-context";
import SignatureCanvas from "react-signature-canvas";

import "./customerInformation.scss";
import { FiX } from "react-icons/fi";
import { resizeBase64ImageToWidth } from "../../util/util";

export default () => {
    const navigate = useNavigate();
    const { register } = useRegister();
    const { restaurant } = useRestaurant();
    const { isPOS } = useRegister();

    const { customerInformation, setCustomerInformation } = useCart();

    const [firstName, setFirstName] = useState(customerInformation ? customerInformation.firstName : "");
    const [email, setEmail] = useState(customerInformation ? customerInformation.email : "");
    const [phoneNumber, setPhoneNumber] = useState(customerInformation ? customerInformation.phoneNumber : "");

    const [firstNameError, setFirstNameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [phoneNumberError, setPhoneNumberError] = useState(false);
    const [signatureError, setSignatureError] = useState(false);

    const signatureCanvasRef = useRef();
    const signatureMimeType = "image/png";

    useEffect(() => {
        if (!customerInformation || !customerInformation.signatureBase64) return;
        //@ts-ignore
        signatureCanvasRef.current.fromDataURL(customerInformation.signatureBase64, signatureMimeType);
    }, []);

    if (!register) throw "Register is not valid";
    if (restaurant == null) throw "Restaurant is invalid!";

    const onClose = () => {
        if (isPOS) {
            navigate(`${restaurantPath}/${restaurant.id}`);
        } else {
            navigate(`${checkoutPath}`);
        }
    };

    const onNext = async () => {
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
        //@ts-ignore
        if (register.requestCustomerInformation.signature && signatureCanvasRef.current.isEmpty()) {
            setSignatureError(true);
            invalid = true;
        }

        if (!invalid) {
            let resizedSignatureBase64: string = "";

            if (signatureCanvasRef.current) {
                //@ts-ignore
                const signatureBase64 = signatureCanvasRef.current.getTrimmedCanvas().toDataURL(signatureMimeType);
                resizedSignatureBase64 = await resizeBase64ImageToWidth(signatureBase64, 200, signatureMimeType);
            }

            setCustomerInformation({ firstName: firstName, email: email, phoneNumber: phoneNumber, signatureBase64: resizedSignatureBase64 });

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

    const onClearSignature = () => {
        //@ts-ignore
        signatureCanvasRef.current.clear();
    };

    return (
        <>
            <PageWrapper>
                <div className="customer-information">
                    <div className="close-button-wrapper">
                        <FiX className="close-button" size={36} onClick={onClose} />
                    </div>
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
                        {register.requestCustomerInformation && register.requestCustomerInformation.signature && (
                            <>
                                <div className="h2 mt-2 mb-2">Signature</div>
                                <SignatureCanvas
                                    ref={signatureCanvasRef}
                                    canvasProps={{ className: `customer-signature-canvas ${signatureError ? "error" : ""}` }}
                                />
                                {signatureError && <div className="text-error mt-2 mb-2">{signatureError ? "Required" : ""}</div>}
                                <Button className="customer-signature-clear-button" onClick={onClearSignature}>
                                    Clear
                                </Button>
                            </>
                        )}
                    </div>
                    <Button onClick={onNext}>Next</Button>
                </div>
            </PageWrapper>
        </>
    );
};
