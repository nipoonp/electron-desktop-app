import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { useCart } from "../../context/cart-context";
import { useRegister } from "../../context/register-context";
import { EEftposTransactionOutcome, EPaymentModalState, IEftposTransactionOutcome } from "../../model/model";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { Button } from "../../tabin/components/button";
import { CachedImage } from "../../tabin/components/cachedImage";
import { Input } from "../../tabin/components/input";
import { Link } from "../../tabin/components/link";
import { Modal } from "../../tabin/components/modal";
import { convertCentsToDollars, convertDollarsToCentsReturnInt } from "../../util/util";

import "./paymentModal.scss";

const AMOUNT_5 = "5.00";
const AMOUNT_10 = "10.00";
const AMOUNT_20 = "20.00";
const AMOUNT_50 = "50.00";
const AMOUNT_100 = "100.00";

interface IPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentModalState: EPaymentModalState;
    eftposTransactionOutcome: IEftposTransactionOutcome | null;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
    cashTransactionChangeAmount: number | null;
    createOrderError: string | null;
    onConfirmTotalOrRetryEftposTransaction: (amount: number) => void;
    onConfirmCashTransaction: (amount: number) => void;
    onContinueToNextPayment: () => void;
    onCancelPayment: () => void;
    onCancelOrder: () => void;
}

export const PaymentModal = (props: IPaymentModalProps) => {
    const { subTotal, paymentAmounts } = useCart();
    const {
        isOpen,
        onClose,
        paymentModalState,
        paymentOutcomeOrderNumber,
        paymentOutcomeApprovedRedirectTimeLeft,
        onContinueToNextOrder,
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
        const amountRemaining = subTotal - paymentAmounts.cash - paymentAmounts.eftpos;

        setAmount(convertCentsToDollars(amountRemaining));
    }, [paymentAmounts, subTotal]);

    const onRetry = () => {
        onClickEftpos(amount);
    };

    const onAmountChange = (amount: string) => {
        setAmount(amount);
    };

    const onClickEftpos = (eftposAmount: string) => {
        const eftposAmountFloat = parseFloat(eftposAmount);
        const eftposAmountCents = convertDollarsToCentsReturnInt(eftposAmountFloat);

        const totalPaymentAmounts = paymentAmounts.cash + paymentAmounts.eftpos;
        const totalRemaining = subTotal - totalPaymentAmounts;

        if (eftposAmountCents == 0) {
            setAmountError("Value cannot be 0.00");
            return;
        } else if (eftposAmountCents <= 0) {
            setAmountError("Value must be greater than 0");
            return;
        } else if (eftposAmountCents > totalRemaining) {
            setAmountError("Amount cannot be greater than remaining");
            return;
        }

        onConfirmTotalOrRetryEftposTransaction(eftposAmountCents);
    };

    const onClickCash = (cashAmount: string) => {
        const cashAmountFloat = parseFloat(cashAmount);
        const cashAmountCents = convertDollarsToCentsReturnInt(cashAmountFloat);

        if (cashAmountCents == 0) {
            setAmountError("Value cannot be 0.00");
            return;
        }

        onConfirmCashTransaction(cashAmountCents);
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
                        onContinueToNextOrder={onContinueToNextOrder}
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
                    onContinueToNextOrder={onContinueToNextOrder}
                />
            );
        } else if (paymentModalState == EPaymentModalState.PayLater) {
            return (
                <PaymentPayLater
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                    onContinueToNextOrder={onContinueToNextOrder}
                />
            );
        } else {
            return (
                <POSPaymentScreen
                    amount={amount}
                    onAmountChange={onAmountChange}
                    amountError={amountError}
                    onAmountErrorChange={setAmountError}
                    onClickCash={onClickCash}
                    onClickEftpos={onClickEftpos}
                    onClose={onClose}
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
            <div className="h2 mb-6 awaiting-card-text">Swipe or insert your card on the terminal to complete your payment.</div>
            <CachedImage className="awaiting-card-image" url={`${getPublicCloudFrontDomainName()}/images/awaitingCard.gif`} alt="awaiting-card-gif" />
        </>
    );
};

const PaymentAccepted = (props: {
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
    onContinueToNextPayment: () => void;
}) => {
    const { paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder, onContinueToNextPayment } = props;
    const { subTotal, paymentAmounts } = useCart();

    const totalPaymentAmounts = paymentAmounts.cash + paymentAmounts.eftpos;
    const totalRemaining = subTotal - totalPaymentAmounts;
    const paymentComplete = totalPaymentAmounts >= subTotal;

    return (
        <>
            {paymentComplete ? (
                <>
                    <div className="h2 mb-6">Transaction Accepted!</div>
                    <div className="mb-1">Your order number is</div>
                    <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
                    <div className="separator-6 mb-6"></div>
                    <RedirectingIn
                        paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                        onContinueToNextOrder={onContinueToNextOrder}
                    />
                </>
            ) : (
                <>
                    <div className="h2 mb-6">Transaction Accepted!</div>

                    <div className="redirecting-in-text text-grey">
                        <Button className="mb-2" onClick={onContinueToNextPayment}>
                            Continue To Next Payment
                        </Button>
                        <div>Remaining: (${convertCentsToDollars(totalRemaining)})</div>
                    </div>
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

const PaymentPayLater = (props: {
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
}) => {
    const { paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;

    return (
        <>
            <div className="h3 mb-4">All Done!</div>
            <div className="h2 mb-6">Please pay later at the counter.</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            <RedirectingIn
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                onContinueToNextOrder={onContinueToNextOrder}
            />
        </>
    );
};

const PaymentCashPayment = (props: {
    cashTransactionChangeAmount: number | null;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
}) => {
    const { cashTransactionChangeAmount, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;

    return (
        <>
            <div className="h3 mb-4">All Done!</div>
            <div className="h2 mb-6">Please give correct change.</div>
            <div className="h1 mb-6">Change: ${convertCentsToDollars(cashTransactionChangeAmount || 0)}</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            <RedirectingIn
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                onContinueToNextOrder={onContinueToNextOrder}
            />
        </>
    );
};

const POSPaymentScreen = (props: {
    amount: string;
    onAmountChange: (amount: string) => void;
    amountError: string;
    onAmountErrorChange: (error: string) => void;
    onClickCash: (amount: string) => void;
    onClickEftpos: (amount: string) => void;
    onClose: () => void;
}) => {
    const { amount, onAmountChange, amountError, onAmountErrorChange, onClickCash, onClickEftpos, onClose } = props;
    const { subTotal, payments, setPayments, paymentAmounts, setPaymentAmounts } = useCart();

    const totalPaymentAmounts = paymentAmounts.cash + paymentAmounts.eftpos;
    const totalRemaining = subTotal - totalPaymentAmounts;
    const totalRemainingInDollars = convertCentsToDollars(totalRemaining);

    const onRemoveCashTransaction = (index: number) => {
        const payment = payments[index];
        const newPayments = [...payments];
        const newPaymentAmounts = paymentAmounts.cash - payment.amount;

        newPayments.splice(index, 1);

        setPayments(newPayments);
        setPaymentAmounts({ ...paymentAmounts, cash: newPaymentAmounts });
    };

    const onBlurAmount = () => {
        if (amount === "") {
            onAmountChange("0.00");
        } else {
            const amountFloat = parseFloat(amount);
            const rounded = Math.round(amountFloat * 100) / 100; //To 2 dp

            onAmountChange(rounded.toFixed(2));
        }
    };

    const onChangeAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
        onAmountChange(event.target.value);
        onAmountErrorChange("");
    };

    return (
        <>
            <div className="payment-modal-close-button-wrapper">
                <FiX className="payment-modal-close-button" size={36} onClick={onClose} />
            </div>
            <div className="payment-modal-amount-input-wrapper mb-8">
                <div className="h2">Enter Amount To Pay</div>
                <div className="payment-modal-input-wrapper">
                    <Input
                        className="payment-modal-amount-input ml-10 mb-1"
                        type="number"
                        name="amountToPay"
                        value={amount}
                        placeholder="9.99"
                        onChange={onChangeAmount}
                        onBlur={onBlurAmount}
                        error={amountError}
                    />
                    {parseFloat(amount) == parseFloat(totalRemainingInDollars) ? (
                        <div className="payment-modal-partial-payment-label ml-10 text-left">Edit to make a partial payment</div>
                    ) : (
                        <div className="payment-modal-partial-payment-label ml-10 text-left">Remaining: ${totalRemainingInDollars}</div>
                    )}
                </div>
            </div>

            <div className="h3 mb-4">Payment Methods</div>
            <div className="payment-modal-payment-button-wrapper mb-8">
                <Button className="large payment-modal-cash-button" onClick={() => onClickCash(amount)}>
                    Cash
                </Button>
                <Button className="large payment-modal-eftpos-button ml-2" onClick={() => onClickEftpos(amount)}>
                    Eftpos
                </Button>
            </div>

            <div className="h3 mb-4">Quick Cash Options</div>
            <div className="payment-modal-quick-cash-button-wrapper mb-8">
                <div className="payment-modal-quick-cash-button" onClick={() => onClickCash(AMOUNT_5)}>
                    $5
                </div>
                <div className="payment-modal-quick-cash-button ml-4" onClick={() => onClickCash(AMOUNT_10)}>
                    $10
                </div>
                <div className="payment-modal-quick-cash-button ml-4" onClick={() => onClickCash(AMOUNT_20)}>
                    $20
                </div>
                <div className="payment-modal-quick-cash-button ml-4" onClick={() => onClickCash(AMOUNT_50)}>
                    $50
                </div>
                <div className="payment-modal-quick-cash-button ml-4" onClick={() => onClickCash(AMOUNT_100)}>
                    $100
                </div>
            </div>

            {payments && payments.length > 0 && (
                <>
                    <div className="h3 mb-4">Paid So Far</div>
                    {payments.map((payment, index) => (
                        <>
                            {payment.type === "CASH" ? (
                                <div className="mb-2">
                                    Cash: ${convertCentsToDollars(payment.amount)}{" "}
                                    <Link onClick={() => onRemoveCashTransaction(index)}>(Remove)</Link>
                                </div>
                            ) : (
                                //For all Eftpos types Verifone, Smartpay, Windcave
                                <div className="mb-2">Eftpos: ${convertCentsToDollars(payment.amount)}</div>
                            )}
                        </>
                    ))}
                </>
            )}
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

const RedirectingIn = (props: { paymentOutcomeApprovedRedirectTimeLeft: number; onContinueToNextOrder: () => void }) => {
    const { paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;
    const { isPOS } = useRegister();

    return (
        <>
            <div className="redirecting-in-text text-grey">
                {isPOS && (
                    <Button className="mb-2" onClick={onContinueToNextOrder}>
                        Continue To Next Transaction
                    </Button>
                )}
                <div>
                    Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
                    {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
                    ...
                </div>
            </div>
        </>
    );
};
