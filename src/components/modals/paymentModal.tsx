import { useState } from "react";
import { useCart } from "../../context/cart-context";
import { EEftposTransactionOutcome, IEftposTransactionOutcome } from "../../model/model";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { Button } from "../../tabin/components/button";
import { CachedImage } from "../../tabin/components/cachedImage";
import { Input } from "../../tabin/components/input";
import { Modal } from "../../tabin/components/modal";
import { convertCentsToDollars, convertDollarsToCents } from "../../util/util";

import "./paymentModal.scss";

interface IPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentOutcomeDelayedOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    eftposTransactionInProgress: boolean;
    eftposTransactionOutcome: IEftposTransactionOutcome | null;
    createOrderError: string | null;
    onConfirmTotalOrRetryTransaction: (amount: number) => void;
    onCancelOrder: () => void;
}

export const PaymentModal = (props: IPaymentModalProps) => {
    const { subTotal } = useCart();
    const {
        isOpen,
        onClose,
        paymentOutcomeDelayedOrderNumber,
        paymentOutcomeApprovedRedirectTimeLeft,
        eftposTransactionInProgress,
        eftposTransactionOutcome,
        createOrderError,
        onConfirmTotalOrRetryTransaction,
        onCancelOrder,
    } = props;

    const [amount, setAmount] = useState(convertCentsToDollars(subTotal));

    const onRetry = () => {
        onConfirmTotalOrRetryTransaction(subTotal);
    };

    const retryButtons = () => (
        <>
            <div className="retry-buttons">
                <Button className="button large mr-3" onClick={onRetry}>
                    Retry
                </Button>
                <Button className="button large retry-cancel-button" onClick={onClose}>
                    Cancel
                </Button>
            </div>
        </>
    );

    const awaitingCard = () => (
        <>
            <div className="h4 mb-6 awaiting-card-text">Swipe or insert your card on the terminal to complete your payment.</div>
            <CachedImage className="awaiting-card-image" url={`${getPublicCloudFrontDomainName()}/images/awaitingCard.gif`} alt="awaiting-card-gif" />
        </>
    );

    const paymentPayLater = () => (
        <>
            <div className="h4 mb-4">All Done!</div>
            <div className="h2 mb-6">Please pay later at the counter.</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeDelayedOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            <div className="redirecting-in-text text-grey">
                Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
                {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
                ...
            </div>
        </>
    );

    const paymentAccepted = () => (
        <>
            <div className="h4 mb-4">All Done!</div>
            <div className="h2 mb-6">Transaction Accepted!</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeDelayedOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            <div className="redirecting-in-text text-grey">
                Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
                {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
                ...
            </div>
        </>
    );

    const paymentDelayed = (errorMessage?: string) => (
        <>
            <div className="h4">{errorMessage && <div className="h2 mt-4 mb-6">{errorMessage}</div>}</div>
        </>
    );

    const paymentFailed = (errorMessage?: string) => (
        <>
            <div className="h4">Oops! Something went wrong.</div>
            {errorMessage && <div className="h2 mt-4 mb-6">{errorMessage}</div>}
            {retryButtons()}
        </>
    );

    const onChangeAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(event.target.value);
    };

    const onClickEftpos = () => {
        const amountInt = parseInt(amount);
        const amountCents = convertDollarsToCents(amountInt);
        const amountCentsInt = parseInt(amountCents);

        onConfirmTotalOrRetryTransaction(amountCentsInt);
    };

    const posPaymentScreen = () => (
        <>
            <div className="mb-6" style={{ display: "flex", fontSize: "24px" }}>
                <div>Amount To Pay</div>
                <Input className="ml-4" type="number" name="AmountToPay" value={amount} placeholder="9.99" onChange={onChangeAmount} />
            </div>
            <div className="mb-6" style={{ display: "flex" }}>
                <Button>Cash</Button>
                <Button className="ml-4" onClick={onClickEftpos}>
                    Eftpos
                </Button>
            </div>

            <div className="mb-2">Quick Cash Options</div>
            <div className="mb-4" style={{ display: "flex" }}>
                <Button>$5</Button>
                <Button className="ml-4">$10</Button>
                <Button className="ml-4">$20</Button>
                <Button className="ml-4">$50</Button>
            </div>
        </>
    );

    const createOrderFailed = () => (
        <>
            <div className="h4 mb-4">Oops! Something went wrong.</div>
            <div className="mb-2">Internal Server Error! Please contact a Tabin representative!</div>
            <div className="mb-2">{createOrderError}</div>
            <Button className="issue-fixed-button" onClick={onCancelOrder}>
                Issue Fixed? Restart
            </Button>
        </>
    );

    const getActivePaymentModalComponent = () => {
        if (createOrderError) {
            return createOrderFailed();
        } else if (eftposTransactionInProgress) {
            return awaitingCard();
        } else if (eftposTransactionOutcome) {
            // } else if (eftposTransactionOutcome.transactionOutcome == EEftposTransactionOutcome.PayLater) {
            //     return paymentPayLater();
            if (eftposTransactionOutcome.transactionOutcome == EEftposTransactionOutcome.Success) {
                return paymentAccepted();
            } else if (eftposTransactionOutcome.transactionOutcome == EEftposTransactionOutcome.Fail) {
                return paymentFailed(eftposTransactionOutcome.message);
            } else if (eftposTransactionOutcome.transactionOutcome == EEftposTransactionOutcome.Delay) {
                return paymentDelayed(eftposTransactionOutcome.message);
            } else {
                return paymentFailed();
            }
        } else {
            return posPaymentScreen();
        }
    };

    return (
        <>
            <Modal isOpen={isOpen}>
                <div className="payment-modal">{getActivePaymentModalComponent()}</div>
            </Modal>
        </>
    );
};
