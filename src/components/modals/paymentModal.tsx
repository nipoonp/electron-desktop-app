import { useEffect, useRef, useState } from "react";
import { FiArrowDown, FiX } from "react-icons/fi";
import { useCart } from "../../context/cart-context";
import { useMutation, useQuery } from "@apollo/client";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";
import { EEftposProvider, EEftposTransactionOutcome, EPaymentModalState, IEftposQuestion, IEftposTransactionOutcome } from "../../model/model";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { Button } from "../../tabin/components/button";
import { CachedImage } from "../../tabin/components/cachedImage";
import { Input } from "../../tabin/components/input";
import { TextArea } from "../../tabin/components/textArea";
import { Link } from "../../tabin/components/link";
import { Modal } from "../../tabin/components/modal";
import { convertCentsToDollars, convertDollarsToCentsReturnInt } from "../../util/util";
import { CREATE_FEEDBACK, UPDATE_FEEDBACK } from "../../graphql/customMutations";
import { useListFeedbackLazyQuery } from "../../hooks/useGetFeeddbackByRestaurant";

import "./paymentModal.scss";
import { IGET_FEEDBACK_BY_RESTAURANT } from "../../graphql/customQueries";

const AMOUNT_5 = "5.00";
const AMOUNT_10 = "10.00";
const AMOUNT_20 = "20.00";
const AMOUNT_50 = "50.00";
const AMOUNT_100 = "100.00";

interface IPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentModalState: EPaymentModalState;
    eftposTransactionProcessMessage: string | null;
    eftposTransactionProcessQuestion: IEftposQuestion | null;
    eftposTransactionOutcome: IEftposTransactionOutcome | null;
    onPrintCustomerReceipt: () => void;
    onPrintParkedOrderReceipts: () => void;
    paymentOutcomeOrderNumber: string | null;
    incrementRedirectTimer: (time: number) => void;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
    cashTransactionChangeAmount: number | null;
    createOrderError: string | null;
    onConfirmTotalOrRetryEftposTransaction: (amount: number) => void;
    onCancelEftposTransaction: () => void;
    onConfirmCashTransaction: (amount: number) => void;
    onConfirmUberEatsTransaction: (amount: number) => void;
    onConfirmMenulogTransaction: (amount: number) => void;
    onContinueToNextPayment: () => void;
    onCancelPayment: () => void;
    onCancelOrder: () => void;
}

export const PaymentModal = (props: IPaymentModalProps) => {
    const { isPOS } = useRegister();
    const { paidSoFar, subTotal, paymentAmounts } = useCart();
    const {
        isOpen,
        onClose,
        paymentModalState,
        paymentOutcomeOrderNumber,
        incrementRedirectTimer,
        paymentOutcomeApprovedRedirectTimeLeft,
        onContinueToNextOrder,
        onPrintCustomerReceipt,
        onPrintParkedOrderReceipts,
        eftposTransactionProcessMessage,
        eftposTransactionProcessQuestion,
        eftposTransactionOutcome,
        cashTransactionChangeAmount,
        createOrderError,
        onConfirmTotalOrRetryEftposTransaction,
        onConfirmCashTransaction,
        onConfirmUberEatsTransaction,
        onConfirmMenulogTransaction,
        onContinueToNextPayment,
        onCancelPayment,
        onCancelOrder,
    } = props;

    const [amount, setAmount] = useState(convertCentsToDollars(subTotal));
    const [amountError, setAmountError] = useState("");

    useEffect(() => {
        const amountRemaining = subTotal - paidSoFar;

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
        const totalRemaining = subTotal - paidSoFar;
        if (subTotal !== 0 && eftposAmountCents == 0) {
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
        if (subTotal !== 0 && cashAmountCents == 0) {
            setAmountError("Value cannot be 0.00");
            return;
        }

        onConfirmCashTransaction(cashAmountCents);
    };

    const onClickUberEats = (uberEatsAmount: string) => {
        const uberEatsAmountFloat = parseFloat(uberEatsAmount);
        const uberEatsAmountCents = convertDollarsToCentsReturnInt(uberEatsAmountFloat);

        if (subTotal !== 0 && uberEatsAmountCents == 0) {
            setAmountError("Value cannot be 0.00");
            return;
        }

        onConfirmUberEatsTransaction(uberEatsAmountCents);
    };

    const onClickMenulog = (menuLogAmount: string) => {
        const menuLogAmountFloat = parseFloat(menuLogAmount);
        const menuLogAmountCents = convertDollarsToCentsReturnInt(menuLogAmountFloat);

        if (subTotal !== 0 && menuLogAmountCents == 0) {
            setAmountError("Value cannot be 0.00");
            return;
        }

        onConfirmMenulogTransaction(menuLogAmountCents);
    };

    const getActivePaymentModalComponent = () => {
        if (createOrderError) {
            return <CreateOrderFailed createOrderError={createOrderError} onCancelOrder={onCancelOrder} />;
        }

        if (paymentModalState == EPaymentModalState.POSScreen) {
            return (
                <POSPaymentScreen
                    amount={amount}
                    onAmountChange={onAmountChange}
                    amountError={amountError}
                    onAmountErrorChange={setAmountError}
                    onClickCash={onClickCash}
                    onClickEftpos={onClickEftpos}
                    onClickUberEats={onClickUberEats}
                    onClickMenulog={onClickMenulog}
                    onClose={onClose}
                />
            );
        } else if (paymentModalState == EPaymentModalState.AwaitingCard) {
            return (
                <AwaitingCard
                    message={eftposTransactionProcessMessage}
                    question={eftposTransactionProcessQuestion}
                    onCancelEftposTransaction={props.onCancelEftposTransaction}
                />
            );
        } else if (paymentModalState == EPaymentModalState.EftposResult && eftposTransactionOutcome) {
            if (eftposTransactionOutcome.transactionOutcome === EEftposTransactionOutcome.Success) {
                return (
                    <PaymentAccepted
                        onPrintCustomerReceipt={onPrintCustomerReceipt}
                        paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                        paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                        onContinueToNextOrder={onContinueToNextOrder}
                        onContinueToNextPayment={onContinueToNextPayment}
                    />
                );
            } else if (eftposTransactionOutcome.transactionOutcome === EEftposTransactionOutcome.Fail) {
                return <PaymentFailed errorMessage={eftposTransactionOutcome.message} onRetry={onRetry} onCancelPayment={onCancelPayment} />;
            }
            // else if (eftposTransactionOutcome.transactionOutcome === EEftposTransactionOutcome.ProcessMessage) {
            //     return <PaymentProgressMessage message={eftposTransactionOutcome.message} />;
            // }
        } else if (paymentModalState === EPaymentModalState.CashResult) {
            if (isPOS) {
                return (
                    <PaymentCashPaymentPOS
                        onPrintCustomerReceipt={onPrintCustomerReceipt}
                        cashTransactionChangeAmount={cashTransactionChangeAmount}
                        paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                        paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                        onContinueToNextOrder={onContinueToNextOrder}
                        incrementRedirectTimer={incrementRedirectTimer}
                    />
                );
            } else {
                return (
                    <PaymentCashPayment
                        onPrintCustomerReceipt={onPrintCustomerReceipt}
                        cashTransactionChangeAmount={cashTransactionChangeAmount}
                        paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                        paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                        onContinueToNextOrder={onContinueToNextOrder}
                        incrementRedirectTimer={incrementRedirectTimer}
                    />
                );
            }
        } else if (paymentModalState === EPaymentModalState.UberEatsResult) {
            return (
                <PaymentUberEatsPayment
                    onPrintCustomerReceipt={onPrintCustomerReceipt}
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                    onContinueToNextOrder={onContinueToNextOrder}
                    incrementRedirectTimer={incrementRedirectTimer}
                />
            );
        } else if (paymentModalState === EPaymentModalState.MenulogResult) {
            return (
                <PaymentMenulogPayment
                    onPrintCustomerReceipt={onPrintCustomerReceipt}
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                    onContinueToNextOrder={onContinueToNextOrder}
                    incrementRedirectTimer={incrementRedirectTimer}
                />
            );
        } else if (paymentModalState === EPaymentModalState.PayLater) {
            return (
                <PaymentPayLater
                    onPrintCustomerReceipt={onPrintCustomerReceipt}
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                    onContinueToNextOrder={onContinueToNextOrder}
                    incrementRedirectTimer={incrementRedirectTimer}
                />
            );
        } else if (paymentModalState === EPaymentModalState.Park) {
            return (
                <PaymentPark
                    onPrintParkedOrderReceipts={onPrintParkedOrderReceipts}
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                    onContinueToNextOrder={onContinueToNextOrder}
                />
            );
        } else if (paymentModalState === EPaymentModalState.ThirdPartyIntegrationAwaitingResponse) {
            return <div className="h1">Processing your order. Please wait...</div>;
        } else {
            return <div className="h1">Creating your order. Please wait...</div>;
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

const AwaitingCard = (props: { message: string | null; question: IEftposQuestion | null; onCancelEftposTransaction: () => void }) => {
    const { message, question } = props;
    const { register } = useRegister();
    const [cancelState, setCancelState] = useState(false);

    console.log("xxx...props", props);

    const onCancelTransaction = () => {
        props.onCancelEftposTransaction();
        setCancelState(false);
    };

    return (
        <>
            {question ? (
                <>
                    <div className="h2 mb-6 awaiting-card-text">{question.text}</div>
                    <div className="awaiting-card-cancel-button-wrapper">
                        {question.options.map((option) => (
                            <Button className="button large awaiting-card-cancel-yes-button" onClick={() => question.answerCallback(option)}>
                                {option}
                            </Button>
                        ))}
                    </div>
                </>
            ) : cancelState ? (
                <>
                    <div className="h2 mb-6 awaiting-card-text">Are are you sure want to cancel this transaction?</div>
                    <div className="awaiting-card-cancel-button-wrapper">
                        <Button className="button large awaiting-card-cancel-yes-button" onClick={onCancelTransaction}>
                            Yes
                        </Button>
                        <Button className="button large awaiting-card-cancel-no-button" onClick={() => setCancelState(false)}>
                            No
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <div className="h2 mb-6 awaiting-card-text">Swipe or insert your card on the terminal to complete your payment.</div>
                    <CachedImage
                        className="awaiting-card-image"
                        url={`${getPublicCloudFrontDomainName()}/images/awaitingCard.gif`}
                        alt="awaiting-card-gif"
                    />
                    <div className="awaiting-card-image-override"></div>
                    {message && <div className="h2 mt-4 mb-6">{message}</div>}
                    {register?.eftposProvider === EEftposProvider.TYRO && (
                        <Button className="mt-4" onClick={() => setCancelState(true)}>
                            Cancel Transaction
                        </Button>
                    )}
                </>
            )}
        </>
    );
};

const PaymentAccepted = (props: {
    onPrintCustomerReceipt: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
    onContinueToNextPayment: () => void;
}) => {
    const {
        onPrintCustomerReceipt,
        paymentOutcomeOrderNumber,
        paymentOutcomeApprovedRedirectTimeLeft,
        onContinueToNextOrder,
        onContinueToNextPayment,
    } = props;
    const { paidSoFar, subTotal, buzzerNumber } = useCart();

    const totalRemaining = subTotal - paidSoFar;
    const paymentComplete = paidSoFar >= subTotal;

    return (
        <>
            {paymentComplete ? (
                <>
                    <div className="h2 mb-6">Transaction Accepted!</div>
                    {buzzerNumber !== null ? (
                        <>
                            <div className="mb-1">Your buzzer number is</div>
                            <div className="order-number h1">{buzzerNumber}</div>
                        </>
                    ) : (
                        <>
                            <div className="mb-1">Your order number is</div>
                            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
                        </>
                    )}
                    <PreparationTime />
                    <div className="separator-6 mb-6"></div>
                    <PaymentModalFooter
                        onPrintCustomerReceipt={onPrintCustomerReceipt}
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
    onPrintCustomerReceipt: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
    incrementRedirectTimer: (time: number) => void;
}) => {
    const {
        onPrintCustomerReceipt,
        paymentOutcomeOrderNumber,
        paymentOutcomeApprovedRedirectTimeLeft,
        onContinueToNextOrder,
        incrementRedirectTimer,
    } = props;
    const { buzzerNumber } = useCart();

    return (
        <>
            <div className="all-done h1 mb-4">All Done!</div>
            <div className="h2 mb-6">Please pay later at the counter.</div>
            {buzzerNumber !== null ? (
                <>
                    <div className="mb-1">Your buzzer number is</div>
                    <div className="order-number h1">{buzzerNumber}</div>
                </>
            ) : (
                <>
                    <div className="mb-1">Your order number is</div>
                    <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
                </>
            )}
            <FeedbackSection
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                incrementRedirectTimer={incrementRedirectTimer}
            />
            <PreparationTime />
            <div className="separator-6 mb-6"></div>
            <PaymentModalFooter
                onPrintCustomerReceipt={onPrintCustomerReceipt}
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                onContinueToNextOrder={onContinueToNextOrder}
            />
        </>
    );
};

const PaymentPark = (props: {
    onPrintParkedOrderReceipts: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
}) => {
    const { onPrintParkedOrderReceipts, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;

    return (
        <>
            <div className="h2 mb-6">This order has been parked for now.</div>
            <div className="mb-1">Reference order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
            <div className="separator-2 mb-2"></div>
            <AskToPrintParkedOrderReceipts onPrinterParkedOrderReceipts={onPrintParkedOrderReceipts} />
            <div className="separator-2 mb-2"></div>
            <PaymentModalFooter
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                onContinueToNextOrder={onContinueToNextOrder}
            />
        </>
    );
};

const PaymentCashPayment = (props: {
    cashTransactionChangeAmount: number | null;
    onPrintCustomerReceipt: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
    incrementRedirectTimer: (time: number) => void;
}) => {
    const {
        onPrintCustomerReceipt,
        paymentOutcomeOrderNumber,
        paymentOutcomeApprovedRedirectTimeLeft,
        onContinueToNextOrder,
        incrementRedirectTimer,
    } = props;
    const { buzzerNumber } = useCart();

    return (
        <>
            <div className="all-done h1 mb-4">All Done!</div>
            <div className="h2 mb-6">Please pay cash at the counter.</div>
            {buzzerNumber !== null ? (
                <>
                    <div className="mb-1">Your buzzer number is</div>
                    <div className="order-number h1">{buzzerNumber}</div>
                </>
            ) : (
                <>
                    <div className="mb-1">Your order number is</div>
                    <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
                </>
            )}
            <FeedbackSection
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                incrementRedirectTimer={incrementRedirectTimer}
            />
            <PreparationTime />
            <div className="separator-6 mb-6"></div>
            <PaymentModalFooter
                onPrintCustomerReceipt={onPrintCustomerReceipt}
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                onContinueToNextOrder={onContinueToNextOrder}
            />
        </>
    );
};

const PaymentCashPaymentPOS = (props: {
    cashTransactionChangeAmount: number | null;
    onPrintCustomerReceipt: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
    incrementRedirectTimer: (time: number) => void;
}) => {
    const {
        onPrintCustomerReceipt,
        cashTransactionChangeAmount,
        paymentOutcomeOrderNumber,
        paymentOutcomeApprovedRedirectTimeLeft,
        onContinueToNextOrder,
        incrementRedirectTimer,
    } = props;
    const { buzzerNumber } = useCart();

    return (
        <>
            <div className="all-done h1 mb-4">All Done!</div>
            <div className="h2 mb-6">Please give correct change.</div>
            <div className="h1 mb-6">Change: ${convertCentsToDollars(cashTransactionChangeAmount || 0)}</div>
            {buzzerNumber !== null ? (
                <>
                    <div className="mb-1">Your buzzer number is</div>
                    <div className="order-number h1">{buzzerNumber}</div>
                </>
            ) : (
                <>
                    <div className="mb-1">Your order number is</div>
                    <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
                </>
            )}
            <FeedbackSection
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                incrementRedirectTimer={incrementRedirectTimer}
            />
            <PreparationTime />
            <div className="separator-6 mb-6"></div>
            <PaymentModalFooter
                onPrintCustomerReceipt={onPrintCustomerReceipt}
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                onContinueToNextOrder={onContinueToNextOrder}
            />
        </>
    );
};

const PaymentUberEatsPayment = (props: {
    onPrintCustomerReceipt: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
    incrementRedirectTimer: (time: number) => void;
}) => {
    const {
        onPrintCustomerReceipt,
        paymentOutcomeOrderNumber,
        paymentOutcomeApprovedRedirectTimeLeft,
        onContinueToNextOrder,
        incrementRedirectTimer,
    } = props;
    const { buzzerNumber } = useCart();

    return (
        <>
            <div className="all-done h1 mb-4">All Done!</div>
            {buzzerNumber !== null ? (
                <>
                    <div className="mb-1">Your buzzer number is</div>
                    <div className="order-number h1">{buzzerNumber}</div>
                </>
            ) : (
                <>
                    <div className="mb-1">Your order number is</div>
                    <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
                </>
            )}
            <FeedbackSection
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                incrementRedirectTimer={incrementRedirectTimer}
            />
            <PreparationTime />
            <div className="separator-6 mb-6"></div>
            <PaymentModalFooter
                onPrintCustomerReceipt={onPrintCustomerReceipt}
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                onContinueToNextOrder={onContinueToNextOrder}
            />
        </>
    );
};

const PaymentMenulogPayment = (props: {
    onPrintCustomerReceipt: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
    incrementRedirectTimer: (time: number) => void;
}) => {
    const {
        onPrintCustomerReceipt,
        paymentOutcomeOrderNumber,
        paymentOutcomeApprovedRedirectTimeLeft,
        onContinueToNextOrder,
        incrementRedirectTimer,
    } = props;
    const { buzzerNumber } = useCart();

    return (
        <>
            <div className="all-done h1 mb-4">All Done!</div>
            {buzzerNumber !== null ? (
                <>
                    <div className="mb-1">Your buzzer number is</div>
                    <div className="order-number h1">{buzzerNumber}</div>
                </>
            ) : (
                <>
                    <div className="mb-1">Your order number is</div>
                    <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
                </>
            )}
            <FeedbackSection
                paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                incrementRedirectTimer={incrementRedirectTimer}
            />
            <PreparationTime />
            <div className="separator-6 mb-6"></div>
            <PaymentModalFooter
                onPrintCustomerReceipt={onPrintCustomerReceipt}
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
    onClickUberEats: (amount: string) => void;
    onClickMenulog: (amount: string) => void;
    onClose: () => void;
}) => {
    const { amount, onAmountChange, amountError, onAmountErrorChange, onClickCash, onClickEftpos, onClickUberEats, onClickMenulog, onClose } = props;
    const { subTotal, payments, setPayments, paymentAmounts, setPaymentAmounts, paidSoFar } = useCart();
    const { register } = useRegister();

    const totalRemaining = subTotal - paidSoFar;
    const totalRemainingInDollars = convertCentsToDollars(totalRemaining);

    const onRemoveCashTransaction = (index: number) => {
        const payment = payments[index];
        const newPayments = [...payments];
        const newPaymentAmounts = paymentAmounts.cash - payment.amount;

        newPayments.splice(index, 1);

        setPayments(newPayments);
        setPaymentAmounts({ ...paymentAmounts, cash: newPaymentAmounts });
    };

    const onRemoveUberEatsTransaction = (index: number) => {
        const payment = payments[index];
        const newPayments = [...payments];
        const newPaymentAmounts = paymentAmounts.uberEats - payment.amount;

        newPayments.splice(index, 1);

        setPayments(newPayments);
        setPaymentAmounts({ ...paymentAmounts, uberEats: newPaymentAmounts });
    };

    const onRemoveMenulogTransaction = (index: number) => {
        const payment = payments[index];
        const newPayments = [...payments];
        const newPaymentAmounts = paymentAmounts.menulog - payment.amount;

        newPayments.splice(index, 1);

        setPayments(newPayments);
        setPaymentAmounts({ ...paymentAmounts, menulog: newPaymentAmounts });
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
            <div className="payment-modal-payment-buttons-wrapper mb-8">
                <div className="payment-modal-payment-button-wrapper">
                    <Button className="large payment-modal-cash-button" onClick={() => onClickCash(amount)}>
                        Cash
                    </Button>
                    <Button className="large payment-modal-eftpos-button ml-2" onClick={() => onClickEftpos(amount)}>
                        Eftpos
                    </Button>
                </div>
                {register && register.enableUberEatsPayments && (
                    <div className="payment-modal-payment-button-wrapper">
                        {register && register.enableUberEatsPayments && (
                            <Button className="large payment-modal-uber-eats-button" onClick={() => onClickUberEats(amount)}>
                                Uber Eats
                            </Button>
                        )}
                        {register && register.enableMenulogPayments && (
                            <Button className="large payment-modal-menulog-button ml-2" onClick={() => onClickMenulog(amount)}>
                                Menulog
                            </Button>
                        )}
                    </div>
                )}
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
                            ) : payment.type === "UBEREATS" ? (
                                <div className="mb-2">
                                    Uber Eats: ${convertCentsToDollars(payment.amount)}{" "}
                                    <Link onClick={() => onRemoveUberEatsTransaction(index)}>(Remove)</Link>
                                </div>
                            ) : payment.type === "MENULOG" ? (
                                <div className="mb-2">
                                    Menulog: ${convertCentsToDollars(payment.amount)}{" "}
                                    <Link onClick={() => onRemoveMenulogTransaction(index)}>(Remove)</Link>
                                </div>
                            ) : (
                                //For all Eftpos types Verifone, Smartpay, Windcave and Tyro
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
            <div className="mb-4">Internal Server Error! Please contact a Tabin representative!</div>
            <div className="mb-4 h2 text-bold">{createOrderError}</div>
            <Button className="issue-fixed-button" onClick={onCancelOrder}>
                Issue Fixed? Restart
            </Button>
        </>
    );
};

const FeedbackSection = (props: { paymentOutcomeApprovedRedirectTimeLeft: number; incrementRedirectTimer: (time: number) => void }) => {
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { orderDetail } = useCart();
    const { data: getFeedbackData, error: errorFeedback, loading: loadingFeedback } = useListFeedbackLazyQuery(restaurant ? restaurant?.id : "");

    const { incrementRedirectTimer } = props;
    const [newRating, setNewRating] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const [feedbackAdded, setFeedbackAdded] = useState<boolean>(false);
    const [showComment, setShowComment] = useState<boolean>(false);

    const feedbackSubmit = (rating) => {
        setNewRating(rating);
        setShowComment(true);
    };

    const [createFeedback] = useMutation(CREATE_FEEDBACK, {
        update: (proxy, mutationResult) => {},
    });
    const [updateFeedback] = useMutation(UPDATE_FEEDBACK);

    if (errorFeedback) return <div>Unable to lead feedback</div>;
    if (loadingFeedback) return <p>Loading feedback</p>;

    const onSubmitFeedback = async () => {
        try {
            if (getFeedbackData && getFeedbackData.length > 0) {
                // Update
                let oldFeedback: IGET_FEEDBACK_BY_RESTAURANT = getFeedbackData[0];
                let totalRating = getFeedbackData[0].totalNumberOfRatings * getFeedbackData[0].averageRating;
                let totalNumberOfRatings = getFeedbackData[0].totalNumberOfRatings;

                const newFeedbackComment = {
                    comment: comment,
                    rating: newRating,
                    orderId: orderDetail?.id,
                };

                totalRating = totalRating + newRating;
                totalNumberOfRatings = totalNumberOfRatings + 1;
                const modifiedResponse = JSON.parse(JSON.stringify(getFeedbackData[0], (key, value) => (key === "__typename" ? undefined : value)));
                await updateFeedback({
                    variables: {
                        id: oldFeedback.id,
                        averageRating: totalRating / totalNumberOfRatings,
                        totalNumberOfRatings: totalNumberOfRatings,
                        feedbackRestaurantId: restaurant?.id,
                        comments: [...modifiedResponse.comments, newFeedbackComment],
                    },
                });
            } else {
                const newFeedbackComment = {
                    comment: comment,
                    rating: newRating,
                    orderId: orderDetail?.id,
                };

                const createFeedbackInput = {
                    averageRating: newRating,
                    totalNumberOfRatings: 1,
                    feedbackRestaurantId: restaurant?.id,
                    comments: [newFeedbackComment],
                };

                await createFeedback({
                    variables: {
                        createFeedbackInput,
                    },
                });
            }

            setFeedbackAdded(true);
            incrementRedirectTimer(3);
        } catch (error) {
            // Handle errors
            console.error(error);
        }
    };

    const commentChangeEvent = (e) => {
        setComment(e.target.value);
    };

    const onFocusFeedbackComment = () => {
        incrementRedirectTimer(30);
    };

    return (
        <>
            {register?.enableFeedback ? (
                <>
                    {feedbackAdded ? (
                        <div className="h2 mb-6">Thank you for Feedback</div>
                    ) : (
                        <div className="feedback--body">
                            <p>Your Feedback</p>
                            <div className="feedback-content">
                                <div className="feedback">
                                    <div onClick={() => feedbackSubmit(1)} className={newRating === 1 ? "active" : ""}>
                                        <CachedImage
                                            className="feedback-card-image"
                                            url={`https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/rating-emoji-5.png`}
                                            alt="awaiting-card-gif"
                                        />
                                        <p>Horrible</p>
                                    </div>
                                    <div onClick={() => feedbackSubmit(2)} className={newRating === 2 ? "active" : ""}>
                                        <CachedImage
                                            className="feedback-card-image"
                                            url={`https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/rating-emoji-4.png`}
                                            alt="awaiting-card-gif"
                                        />
                                        <p>Bad</p>
                                    </div>
                                    <div onClick={() => feedbackSubmit(3)} className={newRating === 3 ? "active" : ""}>
                                        <CachedImage
                                            className="feedback-card-image"
                                            url={`https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/rating-emoji-3.png`}
                                            alt="awaiting-card-gif"
                                        />
                                        <p>Okay</p>
                                    </div>
                                    <div onClick={() => feedbackSubmit(4)} className={newRating === 4 ? "active" : ""}>
                                        <CachedImage
                                            className="feedback-card-image"
                                            url={`https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/rating-emoji-2.png`}
                                            alt="awaiting-card-gif"
                                        />
                                        <p>Good</p>
                                    </div>
                                    <div onClick={() => feedbackSubmit(5)} className={newRating === 5 ? "active" : ""}>
                                        <CachedImage
                                            className={"feedback-card-image"}
                                            url={`https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/rating-emoji-1.png`}
                                            alt="awaiting-card-gif"
                                        />
                                        <p>Excellent</p>
                                    </div>
                                </div>
                                {showComment ? (
                                    <TextArea
                                        className="payment-modal-amount-input mb-1"
                                        rows={5}
                                        name="amountToPay"
                                        value={comment}
                                        placeholder="Enter feedback comment"
                                        onChange={(e) => commentChangeEvent(e)}
                                        onFocus={(e) => onFocusFeedbackComment()}
                                    />
                                ) : null}
                                <Button onClick={() => onSubmitFeedback()}>Submit Feedback</Button>
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </>
    );
};

const PreparationTime = () => {
    const { restaurant } = useRestaurant();
    const { isPOS } = useRegister();

    return (
        <>
            {!isPOS && restaurant && restaurant.preparationTimeInMinutes && (
                <div className="preparation-time h2 mt-3 mb-6">
                    Your order will be ready in approximately {restaurant.preparationTimeInMinutes}{" "}
                    {restaurant.preparationTimeInMinutes > 1 ? "minutes" : "minute"}
                </div>
            )}
        </>
    );
};

const AskToPrintParkedOrderReceipts = (props: { onPrinterParkedOrderReceipts: () => void }) => {
    const { onPrinterParkedOrderReceipts } = props;

    const [hide, setHide] = useState(false);

    if (hide) return <></>;

    return (
        <>
            <div className="ask-to-print-parked-order-receipts">
                <div className="h1 mb-6 text-center would-you-like-parked-order-receipts">Would you like to print order receipts?</div>
                <Button
                    className="print-parked-receipts-button"
                    onClick={() => {
                        onPrinterParkedOrderReceipts();
                        setHide(true);
                    }}
                >
                    Yes, print!
                </Button>
                <Button className="print-parked-receipts-button-no mt-2" onClick={() => setHide(true)}>
                    No
                </Button>
            </div>
        </>
    );
};

const AskToPrintCustomerReceipt = (props: { onPrintCustomerReceipt: () => void }) => {
    const { onPrintCustomerReceipt } = props;

    const [hide, setHide] = useState(false);

    if (hide) return <></>;

    return (
        <>
            <div className="ask-to-print-customer-receipt">
                <div className="h1 mb-6 text-center would-you-like-a-customer-receipt">Would you like a customer receipt?</div>
                <div className="mb-6 receipt-image-container">
                    <img
                        alt="Receipt Image"
                        className="receipt-image"
                        src="https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/downlow_receipt_icon.png"
                    />
                    <div className="receipt-image-override"></div>
                </div>
                <Button
                    className="large print-me-a-copy-button"
                    onClick={() => {
                        onPrintCustomerReceipt();
                        setHide(true);
                    }}
                >
                    Yes, print me a copy!
                </Button>
                <Button className="large print-me-a-copy-button-no mt-2" onClick={() => setHide(true)}>
                    No
                </Button>
            </div>
        </>
    );
};

const PaymentModalFooter = (props: {
    onPrintCustomerReceipt?: () => void;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
}) => {
    const { onPrintCustomerReceipt, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;
    const { isPOS, register } = useRegister();

    const showTakeYourReceiptSign = useRef(false);

    const printCustomerReceipt = () => {
        onPrintCustomerReceipt && onPrintCustomerReceipt();
        showTakeYourReceiptSign.current = true;
    };

    return (
        <>
            {onPrintCustomerReceipt && register && register.askToPrintCustomerReceipt && (
                <AskToPrintCustomerReceipt onPrintCustomerReceipt={printCustomerReceipt} />
            )}
            <div className="redirecting-in-text">
                {isPOS && (
                    <Button className="mb-2" onClick={onContinueToNextOrder}>
                        Continue To Next Transaction
                    </Button>
                )}
                <div className="text-grey">
                    Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
                    {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
                    ...
                </div>
                {((register && !isPOS && !register.askToPrintCustomerReceipt) || showTakeYourReceiptSign.current) && (
                    <div className="please-take-your-receipt-wrapper mt-4">
                        <div className="h1 mb-10">Please take your receipt</div>
                        <FiArrowDown className="please-take-your-receipt-arrow" size="150px" />
                    </div>
                )}
            </div>
        </>
    );
};
