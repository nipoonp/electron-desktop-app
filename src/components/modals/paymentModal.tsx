import { useEffect, useRef, useState } from "react";
import { FiArrowDown, FiX } from "react-icons/fi";
import { useCart } from "../../context/cart-context";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";
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
    eftposTransactionDelayed: boolean;
    eftposTransactionOutcome: IEftposTransactionOutcome | null;
    onPrintCustomerReceipt: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
    cashTransactionChangeAmount: number | null;
    createOrderError: string | null;
    onConfirmTotalOrRetryEftposTransaction: (amount: number) => void;
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
        paymentOutcomeApprovedRedirectTimeLeft,
        onContinueToNextOrder,
        onPrintCustomerReceipt,
        eftposTransactionDelayed,
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

    const onClickUberEats = (uberEatsAmount: string) => {
        const uberEatsAmountFloat = parseFloat(uberEatsAmount);
        const uberEatsAmountCents = convertDollarsToCentsReturnInt(uberEatsAmountFloat);

        if (uberEatsAmountCents == 0) {
            setAmountError("Value cannot be 0.00");
            return;
        }

        onConfirmUberEatsTransaction(uberEatsAmountCents);
    };

    const onClickMenulog = (menuLogAmount: string) => {
        const menuLogAmountFloat = parseFloat(menuLogAmount);
        const menuLogAmountCents = convertDollarsToCentsReturnInt(menuLogAmountFloat);

        if (menuLogAmountCents == 0) {
            setAmountError("Value cannot be 0.00");
            return;
        }

        onConfirmMenulogTransaction(menuLogAmountCents);
    };

    const getActivePaymentModalComponent = () => {
        if (createOrderError) {
            return <CreateOrderFailed createOrderError={createOrderError} onCancelOrder={onCancelOrder} />;
        }

        if (eftposTransactionDelayed) {
            return <PaymentDelayed errorMessage={"This transaction is delayed. Please wait..."} />;
        }

        if (paymentModalState == EPaymentModalState.AwaitingCard) {
            return <AwaitingCard />;
        } else if (paymentModalState == EPaymentModalState.EftposResult && eftposTransactionOutcome) {
            if (eftposTransactionOutcome.transactionOutcome == EEftposTransactionOutcome.Success) {
                return (
                    <PaymentAccepted
                        onPrintCustomerReceipt={onPrintCustomerReceipt}
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
            if (isPOS) {
                return (
                    <PaymentCashPaymentPOS
                        onPrintCustomerReceipt={onPrintCustomerReceipt}
                        cashTransactionChangeAmount={cashTransactionChangeAmount}
                        paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                        paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                        onContinueToNextOrder={onContinueToNextOrder}
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
                    />
                );
            }
        } else if (paymentModalState == EPaymentModalState.UberEatsResult) {
            return (
                <PaymentUberEatsPayment
                    onPrintCustomerReceipt={onPrintCustomerReceipt}
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                    onContinueToNextOrder={onContinueToNextOrder}
                />
            );
        } else if (paymentModalState == EPaymentModalState.MenulogResult) {
            return (
                <PaymentMenulogPayment
                    onPrintCustomerReceipt={onPrintCustomerReceipt}
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                    onContinueToNextOrder={onContinueToNextOrder}
                />
            );
        } else if (paymentModalState == EPaymentModalState.PayLater) {
            return (
                <PaymentPayLater
                    onPrintCustomerReceipt={onPrintCustomerReceipt}
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                    onContinueToNextOrder={onContinueToNextOrder}
                />
            );
        } else if (paymentModalState == EPaymentModalState.Park) {
            return (
                <PaymentPark
                    onPrintCustomerReceipt={onPrintCustomerReceipt}
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
                    onClickUberEats={onClickUberEats}
                    onClickMenulog={onClickMenulog}
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
            <div className="awaiting-card-image-override"></div>
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
    const { onPrintCustomerReceipt, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder, onContinueToNextPayment } = props;
    const { paidSoFar, subTotal } = useCart();

    const totalRemaining = subTotal - paidSoFar;
    const paymentComplete = paidSoFar >= subTotal;

    return (
        <>
            {paymentComplete ? (
                <>
                    <div className="h2 mb-6">Transaction Accepted!</div>
                    <div className="mb-1">Your order number is</div>
                    <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
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
    onPrintCustomerReceipt: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
}) => {
    const { onPrintCustomerReceipt, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;

    return (
        <>
            <div className="all-done h1 mb-4">All Done!</div>
            <div className="h2 mb-6">Please pay later at the counter.</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
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
    onPrintCustomerReceipt: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
}) => {
    const { onPrintCustomerReceipt, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;

    return (
        <>
            <div className="h2 mb-6">This order has been parked for now.</div>
            <div className="mb-1">Reference order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            <PaymentModalFooter
                onPrintCustomerReceipt={onPrintCustomerReceipt}
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
}) => {
    const { onPrintCustomerReceipt, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;

    return (
        <>
            <div className="all-done h1 mb-4">All Done!</div>
            <div className="h2 mb-6">Please pay cash at the counter.</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
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
}) => {
    const { onPrintCustomerReceipt, cashTransactionChangeAmount, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } =
        props;

    return (
        <>
            <div className="all-done h1 mb-4">All Done!</div>
            <div className="h2 mb-6">Please give correct change.</div>
            <div className="h1 mb-6">Change: ${convertCentsToDollars(cashTransactionChangeAmount || 0)}</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
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
}) => {
    const { onPrintCustomerReceipt, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;

    return (
        <>
            <div className="all-done h1 mb-4">All Done!</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
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
}) => {
    const { onPrintCustomerReceipt, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;

    return (
        <>
            <div className="all-done h1 mb-4">All Done!</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeOrderNumber}</div>
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
                                    Cash: ${convertCentsToDollars(payment.amount)} <Link onClick={() => onRemoveCashTransaction(index)}>(Remove)</Link>
                                </div>
                            ) : payment.type === "UBEREATS" ? (
                                <div className="mb-2">
                                    Uber Eats: ${convertCentsToDollars(payment.amount)} <Link onClick={() => onRemoveUberEatsTransaction(index)}>(Remove)</Link>
                                </div>
                            ) : payment.type === "MENULOG" ? (
                                <div className="mb-2">
                                    Menulog: ${convertCentsToDollars(payment.amount)} <Link onClick={() => onRemoveMenulogTransaction(index)}>(Remove)</Link>
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
                <Button className="large print-me-a-copy-button" onClick={onPrintCustomerReceipt}>
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
    onPrintCustomerReceipt: () => void;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
}) => {
    const { onPrintCustomerReceipt, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;
    const { isPOS, register } = useRegister();

    const showTakeYourReceiptSign = useRef(false);

    useEffect(() => {
        register &&
            register.printers.items.forEach((printer) => {
                if (printer.customerPrinter) showTakeYourReceiptSign.current = true;
            });
    }, [register]);

    return (
        <>
            {register && register.askToPrintCustomerReceipt && <AskToPrintCustomerReceipt onPrintCustomerReceipt={onPrintCustomerReceipt} />}
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
                {register && !register.askToPrintCustomerReceipt && !isPOS && showTakeYourReceiptSign.current && (
                    <div className="please-take-your-receipt-wrapper mt-4">
                        <div className="h1 mb-4">Please take your receipt</div>
                        <FiArrowDown size="150px" />
                    </div>
                )}
            </div>
        </>
    );
};
