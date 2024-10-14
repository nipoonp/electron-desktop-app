import axios from "axios";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { ModalV2 } from "../../tabin/components/modalv2";
import { toast } from "../../tabin/components/toast";
import { useState } from "react";
import { TextArea } from "../../tabin/components/textArea";
import { useRestaurant } from "../../context/restaurant-context";

interface IRequestItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestItemName: string;
}

export const RequestItemModal = (props: IRequestItemModalProps) => {
    const { restaurant } = useRestaurant();
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [notes, setNotes] = useState("");

    const [firstNameError, setFirstNameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [phoneNumberError, setPhoneNumberError] = useState(false);

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

    const onChangeNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    const onRequestItem = async () => {
        try {
            const result = await axios({
                method: "post",
                url: `https://y0gnh04vva.execute-api.ap-southeast-2.amazonaws.com/prod/`,
                headers: {
                    Accept: "application/json",
                },
                data: {
                    to: "nipoon@tabin.co.nz",
                    from: {
                        name: "Tabin",
                        email: "info@tabin.co.nz",
                    },
                    subject: `Tabin - New Item Request`,
                    text: `<div style="font-family: Arial, sans-serif; color: #333;"><h2>Item Request Form</h2><p><strong>Requested Item:</strong> ${props.requestItemName}</p><p><strong>Site:</strong> ${restaurant?.name}</p><p><strong>Name:</strong> ${firstName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone Number:</strong> ${phoneNumber}</p><p><strong>Notes:</strong> ${notes}</p></div>`,
                    html: `<div style="font-family: Arial, sans-serif; color: #333;"><h2>Item Request Form</h2><p><strong>Requested Item:</strong> ${props.requestItemName}</p><p><strong>Site:</strong> ${restaurant?.name}</p><p><strong>Name:</strong> ${firstName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone Number:</strong> ${phoneNumber}</p><p><strong>Notes:</strong> ${notes}</p></div>`,
                },
            });

            console.log("result.data", JSON.stringify(result.data));

            toast.success("New request has been sent!");

            props.onClose();
        } catch (error) {
            console.error("Error sending request item", error);
        }
    };

    return (
        <>
            <ModalV2 padding="16px" isOpen={props.isOpen} disableClose={false} onRequestClose={props.onClose}>
                <div className="promo-code-modal">
                    <div>Requested Item: {props.requestItemName}</div>
                    <div className="mt-2">Site: {restaurant?.name}</div>
                    <div className="mt-4 mb-2">Customer Name</div>
                    <Input
                        type="firstName"
                        autoFocus={true}
                        onChange={onChangeFirstName}
                        value={firstName}
                        error={firstNameError ? "Required" : ""}
                    />
                    <div className="mt-2 mb-2">Customer Email</div>
                    <Input type="email" onChange={onChangeEmail} value={email} error={emailError ? "Required" : ""} />
                    <div className="mt-2 mb-2">Customer Number</div>
                    <Input type="number" onChange={onChangePhoneNumber} value={phoneNumber} error={phoneNumberError ? "Required" : ""} />
                    <div className="mt-2 mb-2">Customer Notes</div>
                    <TextArea rows={2} onChange={onChangeNotes} value={notes} />
                    <Button className="mt-4" onClick={onRequestItem}>
                        Request Item
                    </Button>
                </div>
            </ModalV2>
        </>
    );
};
