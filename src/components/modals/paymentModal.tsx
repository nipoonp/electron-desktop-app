import { useEffect, useState } from "react";
import { useCart } from "../../context/cart-context";
import { EEftposTransactionOutcome, EPaymentModalState, ICartAmountPaid, IEftposTransactionOutcome } from "../../model/model";
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
    paymentModalState: EPaymentModalState;
    eftposTransactionOutcome: IEftposTransactionOutcome | null;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    cashTransactionChangeAmount: number | null;
    createOrderError: string | null;
    onConfirmTotalOrRetryEftposTransaction: (amount: number) => void;
    onConfirmCashTransaction: (amount: number) => void;
    onContinueToNextPayment: () => void;
    onCancelPayment: () => void;
    onCancelOrder: () => void;
}

export const PaymentModal = (props: IPaymentModalProps) => {
    const { subTotal, amountPaid } = useCart();
    const {
        isOpen,
        // onClose,
        paymentModalState,
        paymentOutcomeOrderNumber,
        paymentOutcomeApprovedRedirectTimeLeft,
        eftposTransactionOutcome,
        cashTransactionChangeAmount,
        createOrderError,
        onConfirmTotalOrRetryEftposTransaction,
        onConfirmCashTransaction,
        onContinueToNextPayment,
        onCancelPayment,
        onCancelOrder,
    } = props;

    const [amount, setAmount] = useState(convertCentsToDollars(subTotal));
    const [amountError, setAmountError] = useState("");

    useEffect(() => {
        const amountRemaining = subTotal - amountPaid.cash - amountPaid.eftpos;

        setAmount(convertCentsToDollars(amountRemaining));
    }, [amountPaid, subTotal]);

    const onRetry = () => {
        onClickEftpos(amount);
    };

    const onChangeAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(event.target.value);
        setAmountError("");
    };

    const onClickEftpos = (eftposAmount: string) => {
        const eftposAmountFloat = parseFloat(eftposAmount);
        const eftposAmountCents = convertDollarsToCents(eftposAmountFloat);
        const eftposAmountCentsInt = parseInt(eftposAmountCents);

        const totalAmountPaid = amountPaid.cash + amountPaid.eftpos;
        const totalRemaining = subTotal - totalAmountPaid;

        if (eftposAmountCentsInt < 0) {
            setAmountError("Amount cannot be less than 0");
            return;
        } else if (eftposAmountCentsInt > totalRemaining) {
            setAmountError("Amount cannot be greater than amount due");
            return;
        }

        onConfirmTotalOrRetryEftposTransaction(eftposAmountCentsInt);
    };

    const onClickCash = (cashAmount: string) => {
        const cashAmountFloat = parseFloat(cashAmount);
        const cashAmountCents = convertDollarsToCents(cashAmountFloat);
        const cashAmountCentsInt = parseInt(cashAmountCents);

        onConfirmCashTransaction(cashAmountCentsInt);
    };

    const getActivePaymentModalComponent = () => {
        if (createOrderError) {
            return <CreateOrderFailed createOrderError={createOrderError} onCancelOrder={onCancelOrder} />;
        }

        if (paymentModalState == EPaymentModalState.AwaitingCard) {
            return <AwaitingCard />;
        } else if (paymentModalState == EPaymentModalState.EftposResult && eftposTransactionOutcome) {
            if (eftposTransactionOutcome.transactionOutcome == EEftposTransactionOutcome.Success) {
                return (
                    <PaymentAccepted
                        paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                        paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                        onContinueToNextPayment={onContinueToNextPayment}
                    />
                );
            } else if (eftposTransactionOutcome.transactionOutcome == EEftposTransactionOutcome.Fail) {
                return <PaymentFailed errorMessage={eftposTransactionOutcome.message} onRetry={onRetry} onCancelPayment={onCancelPayment} />;
            } else if (eftposTransactionOutcome.transactionOutcome == EEftposTransactionOutcome.Delay) {
                return <PaymentDelayed errorMessage={eftposTransactionOutcome.message} />;
            }
        } else if (paymentModalState == EPaymentModalState.CashResult) {
            return (
                <PaymentCashPayment
                    cashTransactionChangeAmount={cashTransactionChangeAmount}
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                />
            );
        } else {
            return (
                <POSPaymentScreen
                    amount={amount}
                    amountError={amountError}
                    onChangeAmount={onChangeAmount}
                    amountPaid={amountPaid}
                    onClickCash={onClickCash}
                    onClickEftpos={onClickEftpos}
                />
            );
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

const AwaitingCard = () => {
    return (
        <>
            <div className="h4 mb-6 awaiting-card-text">Swipe or insert your card on the terminal to complete your payment.</div>
            <CachedImage className="awaiting-card-image" url={`${getPublicCloudFrontDomainName()}/images/awaitingCard.gif`} alt="awaiting-card-gif" />
        </>
    );
};

const PaymentAccepted = (props: {
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextPayment: () => void;
}) => {
    const { paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextPayment } = props;
    const { subTotal, amountPaid } = useCart();

    const totalAmountPaid = amountPaid.cash + amountPaid.eftpos;
    const totalRemaining = subTotal - totalAmountPaid;
    const paymentComplete = totalAmountPaid >= subTotal;

    return (
        <>
            {paymentComplete ? (
                <>
                    <div className="h2 mb-6">Transaction Accepted!</div>
                    <div className="mb-1">Your order number is</div>
                    <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
                    <div className="separator-6 mb-6"></div>
                    <div className="redirecting-in-text text-grey">
                        Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
                        {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
                        ...
                    </div>
                </>
            ) : (
                <>
                    <div className="h2 mb-6">Transaction Accepted!</div>
                    <Button className="large redirecting-in-text" onClick={onContinueToNextPayment}>
                        Continue to next payment... (${convertCentsToDollars(totalRemaining)})
                    </Button>
                </>
            )}
        </>
    );
};

const PaymentDelayed = (props: { errorMessage: string }) => {
    const { errorMessage } = props;

    return <div className="h4">{errorMessage && <div className="h2 mt-4 mb-6">{errorMessage}</div>}</div>;
};

const PaymentFailed = (props: { errorMessage: string; onRetry: () => void; onCancelPayment: () => void }) => {
    const { errorMessage, onRetry, onCancelPayment } = props;

    return (
        <>
            <div className="h4">Oops! Something went wrong.</div>
            <div className="h2 mt-4 mb-6">{errorMessage || ""}</div>
            <div className="retry-buttons">
                <Button className="large mr-3" onClick={onRetry}>
                    Retry
                </Button>
                <Button className="large retry-cancel-button" onClick={onCancelPayment}>
                    Cancel
                </Button>
            </div>
        </>
    );
};

const PaymentPayLater = (props: { paymentOutcomeOrderNumber: string | null; paymentOutcomeApprovedRedirectTimeLeft: number }) => {
    const { paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft } = props;

    return (
        <>
            <div className="h4 mb-4">All Done!</div>
            <div className="h2 mb-6">Please pay later at the counter.</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            <div className="redirecting-in-text text-grey">
                Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
                {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
                ...
            </div>
        </>
    );
};

const PaymentCashPayment = (props: {
    cashTransactionChangeAmount: number | null;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
}) => {
    const { cashTransactionChangeAmount, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft } = props;

    return (
        <>
            <div className="h4 mb-4">All Done!</div>
            <div className="h2 mb-6">Please give correct change.</div>
            <div className="h1 mb-6">Change: ${convertCentsToDollars(cashTransactionChangeAmount || 0)}</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            <div className="redirecting-in-text text-grey">
                Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
                {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
                ...
            </div>
        </>
    );
};

const POSPaymentScreen = (props: {
    amount: string;
    amountError: string;
    onChangeAmount: (event: React.ChangeEvent<HTMLInputElement>) => void;
    amountPaid: ICartAmountPaid;
    onClickCash: (amount: string) => void;
    onClickEftpos: (amount: string) => void;
}) => {
    const { amount, amountError, amountPaid, onChangeAmount, onClickCash, onClickEftpos } = props;

    return (
        <>
            <div className="mb-6" style={{ display: "flex", fontSize: "24px" }}>
                <div>Amount To Pay</div>
                <div>
                    <Input
                        className="ml-4"
                        type="number"
                        name="AmountToPay"
                        value={amount}
                        placeholder="9.99"
                        onChange={onChangeAmount}
                        error={amountError}
                    />
                </div>
            </div>

            <div className="h4 mb-2">Paid So Far</div>
            <div className="mb-2">Cash: ${convertCentsToDollars(amountPaid.cash)}</div>
            <div className="mb-2">Eftpos: ${convertCentsToDollars(amountPaid.eftpos)}</div>

            <div className="mb-6" style={{ display: "flex" }}>
                <Button className="large" onClick={() => onClickCash(amount)}>
                    Cash
                </Button>
                <Button className="large ml-4" onClick={() => onClickEftpos(amount)}>
                    Eftpos
                </Button>
            </div>

            <div className="mb-2">Quick Cash Options</div>
            <div className="mb-4" style={{ display: "flex" }}>
                <Button onClick={() => onClickCash("5.00")}>$5</Button>
                <Button className="ml-4" onClick={() => onClickCash("10.00")}>
                    $10
                </Button>
                <Button className="ml-4" onClick={() => onClickCash("20.00")}>
                    $20
                </Button>
                <Button className="ml-4" onClick={() => onClickCash("50.00")}>
                    $50
                </Button>
            </div>
        </>
    );
};

const CreateOrderFailed = (props: { createOrderError: string; onCancelOrder: () => void }) => {
    const { createOrderError, onCancelOrder } = props;

    return (
        <>
            <div className="h4 mb-4">Oops! Something went wrong.</div>
            <div className="mb-2">Internal Server Error! Please contact a Tabin representative!</div>
            <div className="mb-2">{createOrderError}</div>
            <Button className="issue-fixed-button" onClick={onCancelOrder}>
                Issue Fixed? Restart
            </Button>
        </>
    );
};
