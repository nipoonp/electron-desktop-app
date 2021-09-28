import { useCart } from "../../context/cart-context";
import { ECheckoutTransactionOutcome } from "../../model/model";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { Button } from "../../tabin/components/button";
import { CachedImage } from "../../tabin/components/cachedImage";
import { Modal } from "../../tabin/components/modal";
import { convertCentsToDollars } from "../../util/util";

import "./paymentModal.scss";

interface IPaymentModalProps {
    isOpen: boolean;
    // onClose: () => void;
    paymentOutcomeDelayedOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    paymentOutcomeErrorMessage: string | null;
    createOrderError: string | null;
    paymentOutcome: ECheckoutTransactionOutcome | null;
    onConfirmTotalOrRetryTransaction: () => void;
    onClosePaymentModal: () => void;
    onCancelOrder: () => void;
}

export const PaymentModal = (props: IPaymentModalProps) => {
    const {
        isOpen,
        // onClose,
        paymentOutcomeDelayedOrderNumber,
        paymentOutcomeApprovedRedirectTimeLeft,
        paymentOutcomeErrorMessage,
        createOrderError,
        paymentOutcome,
        onConfirmTotalOrRetryTransaction,
        onClosePaymentModal,
        onCancelOrder,
    } = props;
    const { subTotal } = useCart();

    const retryButtons = () => (
        <>
            <div className="retry-buttons">
                <Button className="button large mr-3" onClick={onConfirmTotalOrRetryTransaction}>
                    Retry
                </Button>
                <Button className="button large retry-cancel-button" onClick={onClosePaymentModal}>
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

    const paymentCashPayment = () => (
        <>
            <div className="h4 mb-4">All Done!</div>
            <div className="h2 mb-6">Please give correct change.</div>
            <div className="h1 mb-6">Total: ${convertCentsToDollars(subTotal)}</div>
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

    const paymentDelayed = () => <div className="h4">Transaction delayed! Check if the device is powered on and online.</div>;

    const paymentFailed = (errorMessage?: string) => (
        <>
            <div className="h4">Oops! Something went wrong.</div>
            {errorMessage && <div className="h2 mt-4 mb-6">{errorMessage}</div>}
            {retryButtons()}
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
        if (paymentOutcomeErrorMessage) {
            return paymentFailed(paymentOutcomeErrorMessage);
        }

        if (createOrderError) {
            return createOrderFailed();
        }

        if (paymentOutcome == null) {
            return awaitingCard();
        }

        if (paymentOutcome == ECheckoutTransactionOutcome.PayLater) {
            return paymentPayLater();
        } else if (paymentOutcome == ECheckoutTransactionOutcome.CashPayment) {
            return paymentCashPayment();
        } else if (paymentOutcome == ECheckoutTransactionOutcome.Success) {
            return paymentAccepted();
        } else if (paymentOutcome == ECheckoutTransactionOutcome.Fail) {
            return paymentFailed();
        } else if (paymentOutcome == ECheckoutTransactionOutcome.Delay) {
            return paymentDelayed();
        } else {
            return paymentFailed();
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
