import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowDown, FiX } from "react-icons/fi";
import { useCart } from "../../context/cart-context";
import { useMutation, useQuery } from "@apollo/client";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";
import {
    EEftposProvider,
    EEftposTransactionOutcome,
    EPaymentModalState,
    ITyroEftposQuestion,
    IEftposTransactionOutcome,
    IMX51EftposQuestion,
    ICartProduct,
    ICartPaymentAmounts,
} from "../../model/model";
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
import { EPromotionType, IGET_FEEDBACK_BY_RESTAURANT } from "../../graphql/customQueries";
import Restaurant from "../page/restaurant";
import { format } from "date-fns";
import { Stepper } from "../../tabin/components/stepper";

const AMOUNT_5 = "5.00";
const AMOUNT_10 = "10.00";
const AMOUNT_20 = "20.00";
const AMOUNT_50 = "50.00";
const AMOUNT_100 = "100.00";
const SPLIT_BY_PEOPLE_MIN_COUNT = 2;
const QUICK_CASH_AMOUNTS = [AMOUNT_5, AMOUNT_10, AMOUNT_20, AMOUNT_50, AMOUNT_100];
const REMOVABLE_PAYMENT_CONFIG: Record<
    string,
    {
        label: string;
        amountKey: keyof ICartPaymentAmounts;
    }
> = {
    CASH: { label: "Cash", amountKey: "cash" },
    UBEREATS: { label: "Uber Eats", amountKey: "uberEats" },
    MENULOG: { label: "Menulog", amountKey: "menulog" },
    DOORDASH: { label: "Doordash", amountKey: "doordash" },
    DELIVEREASY: { label: "Delivereasy", amountKey: "delivereasy" },
    ONACCOUNT: { label: "On Account", amountKey: "onAccount" },
};

const computeNextSplitByPeopleShare = (count: number, paidCount: number, remainingAmount: number) => {
    if (count <= 0 || remainingAmount <= 0) return Math.max(remainingAmount, 0);

    const peopleLeft = Math.max(count - paidCount, 1);
    const baseShare = Math.floor(remainingAmount / peopleLeft);
    const remainder = remainingAmount - baseShare * peopleLeft;
    const currentIndex = Math.min(paidCount, peopleLeft - 1);

    return baseShare + (currentIndex < remainder ? 1 : 0);
};

const areCountMapsEqual = (first: Record<string, number>, second: Record<string, number>) => {
    if (first === second) return true;
    const firstKeys = Object.keys(first);
    const secondKeys = Object.keys(second);
    if (firstKeys.length !== secondKeys.length) return false;

    for (const key of firstKeys) {
        if (first[key] !== second[key]) return false;
    }

    return true;
};

type SplitItemsCommand =
    | {
          id: number;
          type: "reset";
          resetAmount: boolean;
      }
    | {
          id: number;
          type: "finalise";
      };

interface IPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentModalState: EPaymentModalState;
    eftposTransactionProcessMessage: string | null;
    eftposTransactionProcessQuestion: ITyroEftposQuestion | null;
    eftposSignatureRequiredQuestion: IMX51EftposQuestion | null;
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
    onConfirmOnAccountTransaction: (acount: number) => void;
    onConfirmUberEatsTransaction: (amount: number) => void;
    onConfirmMenulogTransaction: (amount: number) => void;
    onConfirmDoordashTransaction: (amount: number) => void;
    onConfirmDelivereasyTransaction: (amount: number) => void;
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
        eftposSignatureRequiredQuestion,
        eftposTransactionOutcome,
        cashTransactionChangeAmount,
        createOrderError,
        onConfirmTotalOrRetryEftposTransaction,
        onConfirmCashTransaction,
        onConfirmOnAccountTransaction,
        onConfirmUberEatsTransaction,
        onConfirmMenulogTransaction,
        onConfirmDoordashTransaction,
        onConfirmDelivereasyTransaction,
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

    const onClickOnAccount = (onAccountAmount: string) => {
        const onAccountAmountFloat = parseFloat(onAccountAmount);
        const onAccountAmountCents = convertDollarsToCentsReturnInt(onAccountAmountFloat);

        if (subTotal !== 0 && onAccountAmountCents == 0) {
            setAmountError("Value cannot be 0.00");
            return;
        }

        onConfirmOnAccountTransaction(onAccountAmountCents);
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

    const onClickDoordash = (doordashAmount: string) => {
        const doordashAmountFloat = parseFloat(doordashAmount);
        const doordashAmountCents = convertDollarsToCentsReturnInt(doordashAmountFloat);

        if (subTotal !== 0 && doordashAmountCents == 0) {
            setAmountError("Value cannot be 0.00");
            return;
        }

        onConfirmDoordashTransaction(doordashAmountCents);
    };

    const onClickDelivereasy = (delivereasyAmount: string) => {
        const delivereasyAmountFloat = parseFloat(delivereasyAmount);
        const delivereasyAmountCents = convertDollarsToCentsReturnInt(delivereasyAmountFloat);

        if (subTotal !== 0 && delivereasyAmountCents == 0) {
            setAmountError("Value cannot be 0.00");
            return;
        }

        onConfirmDelivereasyTransaction(delivereasyAmountCents);
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
                    onClickOnAccount={onClickOnAccount}
                    onClickUberEats={onClickUberEats}
                    onClickMenulog={onClickMenulog}
                    onClickDoordash={onClickDoordash}
                    onClickDelivereasy={onClickDelivereasy}
                    onClose={onClose}
                />
            );
        } else if (paymentModalState == EPaymentModalState.AwaitingCard) {
            return (
                <AwaitingCard
                    message={eftposTransactionProcessMessage}
                    question={eftposTransactionProcessQuestion}
                    signatureRequiredQuestion={eftposSignatureRequiredQuestion}
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
        } else if (paymentModalState === EPaymentModalState.OnAccountResult) {
            return (
                <PaymentOnAccountPayment
                    onPrintParkedOrderReceipts={onPrintParkedOrderReceipts}
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                    onContinueToNextOrder={onContinueToNextOrder}
                />
            );
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
        } else if (paymentModalState === EPaymentModalState.DoordashResult) {
            return (
                <PaymentDoordashPayment
                    onPrintCustomerReceipt={onPrintCustomerReceipt}
                    paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                    paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                    onContinueToNextOrder={onContinueToNextOrder}
                    incrementRedirectTimer={incrementRedirectTimer}
                />
            );
        } else if (paymentModalState === EPaymentModalState.DelivereasyResult) {
            return (
                <PaymentDelivereasyPayment
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

type SplitPaymentByItemsProps = {
    isSplitByItems: boolean;
    onToggleSplitByItems: () => void;
    onAmountChange: (amount: string) => void;
    onAmountErrorChange: (error: string) => void;
    products: ICartProduct[] | null;
    paidItemCounts: Record<string, number>;
    setPaidItemCounts: (counts: Record<string, number>) => void;
    command: SplitItemsCommand | null;
    onCommandHandled: (id: number) => void;
};

const SplitPaymentByItems = (props: SplitPaymentByItemsProps) => {
    const {
        isSplitByItems,
        onToggleSplitByItems,
        onAmountChange,
        onAmountErrorChange,
        products,
        paidItemCounts,
        setPaidItemCounts,
        command,
        onCommandHandled,
    } = props;
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

    const hasSplitSelection = Object.values(selectedQuantities).some((qty) => qty > 0);
    const getProductKey = (index: number) => `product-${index}`;

    const getProductUnitPrices = (product: ICartProduct) => {
        if (product.quantity <= 0) return [];

        const lineTotal = product.totalPrice * product.quantity - product.discount;
        if (lineTotal <= 0) {
            return new Array(product.quantity).fill(0);
        }

        const baseUnitPrice = Math.floor(lineTotal / product.quantity);
        const remainder = lineTotal - baseUnitPrice * product.quantity;

        return Array.from({ length: product.quantity }, (_, unitIndex) => baseUnitPrice + (unitIndex < remainder ? 1 : 0));
    };

    const getRemainingQuantity = useCallback(
        (index: number) => {
            if (!products) return 0;

            const product = products[index];
            if (!product) return 0;

            const key = getProductKey(index);
            const paidCount = paidItemCounts[key] ?? 0;
            return Math.max(product.quantity - paidCount, 0);
        },
        [paidItemCounts, products]
    );

    const calculateSelectionTotal = useCallback(
        (selection: Record<string, number>) => {
            if (!products) return 0;

            return Object.entries(selection).reduce((total, [key, qty]) => {
                if (qty <= 0) return total;

                const index = Number(key.replace("product-", ""));
                if (Number.isNaN(index)) return total;

                const product = products[index];
                if (!product) return total;

                const paidCount = paidItemCounts[key] ?? 0;
                const unitPrices = getProductUnitPrices(product);
                const startIndex = Math.min(paidCount, unitPrices.length);
                const endIndex = Math.min(startIndex + qty, unitPrices.length);
                if (endIndex <= startIndex) return total;

                const itemTotal = unitPrices.slice(startIndex, endIndex).reduce((sum, value) => sum + value, 0);
                return total + itemTotal;
            }, 0);
        },
        [paidItemCounts, products]
    );

    const updateSelection = (index: number, nextCount: number) => {
        const key = getProductKey(index);
        setSelectedQuantities((prev) => {
            const remaining = getRemainingQuantity(index);
            const safeCount = Math.min(Math.max(nextCount, 0), remaining);
            const current = prev[key] ?? 0;

            if (current === safeCount) return prev;

            const next = { ...prev };
            if (safeCount > 0) {
                next[key] = safeCount;
            } else {
                delete next[key];
            }

            return next;
        });
    };

    const clearSelection = useCallback(
        (resetAmount: boolean) => {
            setSelectedQuantities({});
            if (resetAmount) {
                onAmountChange(convertCentsToDollars(0));
                onAmountErrorChange("");
            }
        },
        [onAmountChange, onAmountErrorChange]
    );

    useEffect(() => {
        if (!products) {
            setSelectedQuantities({});
            return;
        }

        setSelectedQuantities((prev) => {
            const next: Record<string, number> = {};
            let changed = false;

            products.forEach((product, index) => {
                const key = getProductKey(index);
                const previousSelected = prev[key] ?? 0;
                const remaining = getRemainingQuantity(index);
                const bounded = Math.min(previousSelected, remaining);

                if (bounded > 0) {
                    next[key] = bounded;
                }

                if (bounded !== previousSelected) {
                    changed = true;
                }
            });

            if (Object.keys(prev).length !== Object.keys(next).length) {
                changed = true;
            }

            return changed ? next : prev;
        });
    }, [getRemainingQuantity, products]);

    useEffect(() => {
        if (!isSplitByItems) return;

        const totalCents = calculateSelectionTotal(selectedQuantities);
        onAmountChange(convertCentsToDollars(totalCents));
        onAmountErrorChange("");
    }, [calculateSelectionTotal, isSplitByItems, onAmountChange, onAmountErrorChange, selectedQuantities]);

    useEffect(() => {
        if (isSplitByItems) return;
        if (Object.keys(selectedQuantities).length === 0) return;
        clearSelection(false);
    }, [clearSelection, isSplitByItems, selectedQuantities]);

    useEffect(() => {
        if (!command) return;

        if (command.type === "reset") {
            clearSelection(command.resetAmount);
            onCommandHandled(command.id);
            return;
        }

        if (command.type === "finalise") {
            if (!isSplitByItems || !products || Object.keys(selectedQuantities).length === 0) {
                onCommandHandled(command.id);
                return;
            }

            const nextCounts = { ...paidItemCounts };
            let changed = false;

            Object.entries(selectedQuantities).forEach(([key, qty]) => {
                if (qty <= 0) return;

                const index = Number(key.replace("product-", ""));
                if (Number.isNaN(index)) return;

                const product = products[index];
                if (!product) return;

                const currentPaid = paidItemCounts[key] ?? 0;
                const remaining = Math.max(product.quantity - currentPaid, 0);
                const quantityToCommit = Math.min(qty, remaining);
                const updatedPaid = Math.min(product.quantity, currentPaid + quantityToCommit);

                if (nextCounts[key] !== updatedPaid) {
                    nextCounts[key] = updatedPaid;
                    changed = true;
                }
            });

            if (changed && !areCountMapsEqual(paidItemCounts, nextCounts)) {
                setPaidItemCounts(nextCounts);
            }

            clearSelection(true);
            onCommandHandled(command.id);
        }
    }, [clearSelection, command, isSplitByItems, onCommandHandled, paidItemCounts, products, selectedQuantities, setPaidItemCounts]);

    return (
        <>
            <div className="payment-modal-split-header">
                <div className="h3 cursor-pointer" onClick={onToggleSplitByItems}>
                    Split payment by items
                </div>
                {isSplitByItems && hasSplitSelection && <Link onClick={() => clearSelection(true)}>Clear selection</Link>}
            </div>
            {isSplitByItems && (
                <div className="payment-modal-split-items mb-2">
                    {products && products.length > 0 ? (
                        products.map((product, index) => {
                            const key = getProductKey(index);
                            const remaining = getRemainingQuantity(index);
                            const isFullyPaid = remaining === 0;
                            const selectedQty = isFullyPaid ? 0 : selectedQuantities[key] ?? 0;
                            const unitPrices = getProductUnitPrices(product);
                            const paidCount = paidItemCounts[key] ?? 0;
                            const nextUnitPrice = isFullyPaid ? 0 : unitPrices[paidCount] ?? 0;
                            const selectionAmount = isFullyPaid
                                ? 0
                                : (() => {
                                      const startIndex = Math.min(paidCount, unitPrices.length);
                                      const endIndex = Math.min(startIndex + selectedQty, unitPrices.length);
                                      if (endIndex <= startIndex) return 0;
                                      return unitPrices.slice(startIndex, endIndex).reduce((sum, value) => sum + value, 0);
                                  })();

                            return (
                                <div key={key} className={`payment-modal-split-item${isFullyPaid ? " payment-modal-split-item-paid" : ""}`}>
                                    <div className="payment-modal-split-item-info">
                                        <div className="text-bold text-left mb-1">{product.name}</div>
                                        {isFullyPaid ? (
                                            <div className="text-grey">Paid</div>
                                        ) : (
                                            <div className="text-grey">
                                                Remaining {remaining} × ${convertCentsToDollars(nextUnitPrice)}
                                            </div>
                                        )}
                                    </div>
                                    {isFullyPaid ? (
                                        <div className="payment-modal-split-item-controls paid">Paid</div>
                                    ) : (
                                        <Stepper
                                            count={selectedQty}
                                            min={0}
                                            max={remaining}
                                            size={32}
                                            onUpdate={(count: number) => updateSelection(index, count)}
                                        />
                                    )}
                                    <div className={`payment-modal-split-item-amount${isFullyPaid ? " paid" : ""}`}>
                                        {isFullyPaid ? "Paid" : `$${convertCentsToDollars(selectionAmount)}`}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-left text-grey">No items available to split.</div>
                    )}
                </div>
            )}
        </>
    );
};

type SplitPaymentByPeopleProps = {
    isSplitByPeople: boolean;
    onToggleSplitByPeople: () => void;
    onResetSplitByPeople: () => void;
    splitPaymentByPeople: { count: number; paid: number };
    onUpdateSplitPeopleCount: (count: number) => void;
    totalRemainingCents: number;
    totalRemainingDollars: string;
    onAmountChange: (amount: string) => void;
    onAmountErrorChange: (error: string) => void;
    setSplitPaymentByPeople: (next: { count: number; paid: number }) => void;
};

const SplitPaymentByPeople = (props: SplitPaymentByPeopleProps) => {
    const {
        isSplitByPeople,
        onToggleSplitByPeople,
        onResetSplitByPeople,
        splitPaymentByPeople,
        onUpdateSplitPeopleCount,
        totalRemainingCents,
        totalRemainingDollars,
        onAmountChange,
        onAmountErrorChange,
        setSplitPaymentByPeople,
    } = props;

    const { count, paid } = splitPaymentByPeople;
    const peopleRemaining = Math.max(count - paid, 0);

    useEffect(() => {
        if (!isSplitByPeople) return;

        if (peopleRemaining <= 0 || totalRemainingCents <= 0) {
            setSplitPaymentByPeople({ count: 0, paid: 0 });
            onAmountChange(totalRemainingDollars);
            onAmountErrorChange("");
            return;
        }

        const shareCents = computeNextSplitByPeopleShare(count, paid, totalRemainingCents);
        onAmountChange(convertCentsToDollars(shareCents));
        onAmountErrorChange("");
    }, [
        count,
        paid,
        isSplitByPeople,
        peopleRemaining,
        totalRemainingCents,
        totalRemainingDollars,
        onAmountChange,
        onAmountErrorChange,
        setSplitPaymentByPeople,
    ]);

    const nextSplitByPeopleAmountCents = isSplitByPeople ? computeNextSplitByPeopleShare(count, paid, totalRemainingCents) : 0;

    return (
        <div className="mb-4">
            <div className="d-flex d-flex-align-center">
                <div className="h3 cursor-pointer text-left mb-3" onClick={onToggleSplitByPeople}>
                    Split payment equally by people
                </div>
                {isSplitByPeople && (
                    <Link className="mb-3 ml-2" onClick={onResetSplitByPeople}>
                        Reset split
                    </Link>
                )}
            </div>
            {isSplitByPeople && (
                <div className="mb-4">
                    <Stepper count={count} min={SPLIT_BY_PEOPLE_MIN_COUNT} max={99} size={28} onUpdate={onUpdateSplitPeopleCount}>
                        <div>
                            People remaining: {peopleRemaining}
                            <span className="ml-2">Next share: ${convertCentsToDollars(nextSplitByPeopleAmountCents)}</span>
                        </div>
                    </Stepper>
                </div>
            )}
        </div>
    );
};

const AwaitingCard = (props: {
    message: string | null;
    question: ITyroEftposQuestion | null;
    signatureRequiredQuestion: IMX51EftposQuestion | null;
    onCancelEftposTransaction: () => void;
}) => {
    const { message, question, signatureRequiredQuestion } = props;
    const { register } = useRegister();
    const [cancelState, setCancelState] = useState(false);

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
            ) : signatureRequiredQuestion ? (
                <>
                    <div className="h2 mb-6 awaiting-card-text">Confirm the customer's signature</div>
                    <div className="awaiting-card-cancel-button-wrapper">
                        <Button
                            className="button large awaiting-card-cancel-yes-button"
                            onClick={() => signatureRequiredQuestion.answerCallback(true)}
                        >
                            Yes
                        </Button>
                        <Button
                            className="button large awaiting-card-cancel-no-button"
                            onClick={() => signatureRequiredQuestion.answerCallback(false)}
                        >
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
                    {(register?.eftposProvider === EEftposProvider.TYRO || register?.eftposProvider === EEftposProvider.MX51) && (
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

const PaymentOnAccountPayment = (props: {
    onPrintParkedOrderReceipts: () => void;
    paymentOutcomeOrderNumber: string | null;
    paymentOutcomeApprovedRedirectTimeLeft: number;
    onContinueToNextOrder: () => void;
}) => {
    const { onPrintParkedOrderReceipts, paymentOutcomeOrderNumber, paymentOutcomeApprovedRedirectTimeLeft, onContinueToNextOrder } = props;

    return (
        <>
            <div className="h2 mb-6">This order has been added to customer account.</div>
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

const PaymentDoordashPayment = (props: {
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

const PaymentDelivereasyPayment = (props: {
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
    onClickOnAccount: (amount: string) => void;
    onClickUberEats: (amount: string) => void;
    onClickMenulog: (amount: string) => void;
    onClickDoordash: (amount: string) => void;
    onClickDelivereasy: (amount: string) => void;
    onClose: () => void;
}) => {
    const {
        amount,
        onAmountChange,
        amountError,
        onAmountErrorChange,
        onClickCash,
        onClickEftpos,
        onClickOnAccount,
        onClickUberEats,
        onClickMenulog,
        onClickDoordash,
        onClickDelivereasy,
        onClose,
    } = props;
    const {
        subTotal,
        payments,
        setPayments,
        paymentAmounts,
        setPaymentAmounts,
        paidItemCounts,
        setPaidItemCounts,
        splitPaymentByPeople,
        setSplitPaymentByPeople,
        paidSoFar,
        products,
        setUserAppliedPromotion,
        promotion,
        userAppliedPromotionCode,
        removeUserAppliedPromotion,
        customerInformation,
        onAccountOrders,
    } = useCart();
    const { register } = useRegister();
    const { restaurant } = useRestaurant();

    const [isSplitByItems, setIsSplitByItems] = useState(false);
    const [splitItemsCommand, setSplitItemsCommand] = useState<SplitItemsCommand | null>(null);
    const splitItemsCommandId = useRef(0);

    const sendSplitItemsCommand = useCallback(
        (command: { type: "reset"; resetAmount: boolean } | { type: "finalise" }) => {
            splitItemsCommandId.current += 1;
            setSplitItemsCommand({ id: splitItemsCommandId.current, ...command });
        },
        [setSplitItemsCommand]
    );

    const handleSplitItemsCommandHandled = useCallback(
        (commandId: number) => {
            setSplitItemsCommand((current) => (current && current.id === commandId ? null : current));
        },
        [setSplitItemsCommand]
    );

    const totalRemaining = Math.max(subTotal - paidSoFar, 0);
    const totalRemainingInDollars = convertCentsToDollars(totalRemaining);
    const isSplitByPeople = splitPaymentByPeople.count > 0;
    const unpaidOnAccountOrders = onAccountOrders.filter((order) => !order.paid);
    const unpaidOnAccountTotal = unpaidOnAccountOrders.reduce((sum, order) => sum + order.subTotal, 0);

    useEffect(() => {
        if (!products) {
            if (Object.keys(paidItemCounts).length > 0) {
                setPaidItemCounts({});
            }
            sendSplitItemsCommand({ type: "reset", resetAmount: true });
            setSplitPaymentByPeople({ count: 0, paid: 0 });
            return;
        }

        const next: Record<string, number> = {};

        products.forEach((product, index) => {
            const key = `product-${index}`;
            const previousPaid = paidItemCounts[key] ?? 0;
            const bounded = Math.min(previousPaid, product.quantity);
            next[key] = bounded;
        });

        if (!areCountMapsEqual(paidItemCounts, next)) {
            setPaidItemCounts(next);
        }
    }, [paidItemCounts, products, sendSplitItemsCommand, setPaidItemCounts, setSplitPaymentByPeople]);

    const disableItemSplit = (options?: { resetAmount?: boolean }) => {
        if (!isSplitByItems) return;

        setIsSplitByItems(false);
        sendSplitItemsCommand({ type: "reset", resetAmount: options?.resetAmount ?? false });
    };

    const clearSplitByPeople = (resetAmount: boolean = true) => {
        setSplitPaymentByPeople({ count: 0, paid: 0 });
        if (resetAmount) onAmountChange(totalRemainingInDollars);
        onAmountErrorChange("");
    };

    const enableSplitByPeople = () => {
        disableItemSplit();
        const nextCount = splitPaymentByPeople.count >= SPLIT_BY_PEOPLE_MIN_COUNT ? splitPaymentByPeople.count : SPLIT_BY_PEOPLE_MIN_COUNT;
        if (splitPaymentByPeople.count !== nextCount || splitPaymentByPeople.paid !== 0) {
            setSplitPaymentByPeople({ count: nextCount, paid: 0 });
        }
        onAmountErrorChange("");
    };

    const updateSplitPeopleCount = (nextCount: number) => {
        if (!isSplitByPeople) return;

        const safeCount = Math.max(nextCount, SPLIT_BY_PEOPLE_MIN_COUNT);
        const safePaid = Math.min(splitPaymentByPeople.paid, safeCount);
        if (safeCount !== splitPaymentByPeople.count || safePaid !== splitPaymentByPeople.paid) {
            setSplitPaymentByPeople({ count: safeCount, paid: safePaid });
        }
    };

    const revertSplitPeopleShare = () => {
        if (splitPaymentByPeople.count <= 0 || splitPaymentByPeople.paid <= 0) return;

        setSplitPaymentByPeople({ count: splitPaymentByPeople.count, paid: splitPaymentByPeople.paid - 1 });
    };

    const onToggleSplitPeople = () => {
        if (isSplitByPeople) {
            clearSplitByPeople();
        } else {
            enableSplitByPeople();
        }
    };

    const onToggleSplit = () => {
        const nextSplitState = !isSplitByItems;
        setIsSplitByItems(nextSplitState);
        sendSplitItemsCommand({ type: "reset", resetAmount: nextSplitState });

        if (nextSplitState) {
            clearSplitByPeople(false);
            onAmountChange(convertCentsToDollars(0));
        } else {
            onAmountChange(totalRemainingInDollars);
            onAmountErrorChange("");
        }
    };

    const processPayment = (handler: (amount: string) => void, amountValue?: string) => {
        const paymentAmount = amountValue ?? amount;
        handler(paymentAmount);
        if (isSplitByPeople) {
            const { count, paid } = splitPaymentByPeople;
            if (count > 0) {
                const peopleLeft = Math.max(count - paid, 0);
                if (peopleLeft > 0) {
                    const nextPaid = Math.min(count, paid + 1);
                    if (nextPaid !== paid) {
                        setSplitPaymentByPeople({ count, paid: nextPaid });
                    }
                }
            }
        }
        sendSplitItemsCommand({ type: "finalise" });
    };

    const handleCashPayment = () => processPayment(onClickCash);
    const handleEftposPayment = () => processPayment(onClickEftpos);
    const handleOnAccountPayment = () => processPayment(onClickOnAccount);
    const handleUberEatsPayment = () => processPayment(onClickUberEats);
    const handleMenulogPayment = () => processPayment(onClickMenulog);
    const handleDoordashPayment = () => processPayment(onClickDoordash);
    const handleDelivereasyPayment = () => processPayment(onClickDelivereasy);

    const handleQuickCashPayment = (quickAmount: string) => {
        if (isSplitByItems) disableItemSplit();
        if (isSplitByPeople) clearSplitByPeople(false);

        onAmountErrorChange("");
        onClickCash(quickAmount);
    };

    const removePayment = (index: number, amountKey: keyof ICartPaymentAmounts) => {
        const payment = payments[index];
        if (!payment) return;

        const updatedPayments = payments.filter((_, paymentIndex) => paymentIndex !== index);
        const updatedAmountValue = Math.max(paymentAmounts[amountKey] - payment.amount, 0);

        setPayments(updatedPayments);
        setPaymentAmounts({ ...paymentAmounts, [amountKey]: updatedAmountValue });
        setPaidItemCounts({});
        sendSplitItemsCommand({ type: "reset", resetAmount: true });
        revertSplitPeopleShare();
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
        if (isSplitByItems) disableItemSplit();
        if (isSplitByPeople) clearSplitByPeople(false);

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

            <div className="payment-modal-split-section">
                <SplitPaymentByItems
                    isSplitByItems={isSplitByItems}
                    onToggleSplitByItems={onToggleSplit}
                    onAmountChange={onAmountChange}
                    onAmountErrorChange={onAmountErrorChange}
                    products={products}
                    paidItemCounts={paidItemCounts}
                    setPaidItemCounts={setPaidItemCounts}
                    command={splitItemsCommand}
                    onCommandHandled={handleSplitItemsCommandHandled}
                />

                <SplitPaymentByPeople
                    isSplitByPeople={isSplitByPeople}
                    onToggleSplitByPeople={onToggleSplitPeople}
                    onResetSplitByPeople={() => clearSplitByPeople()}
                    splitPaymentByPeople={splitPaymentByPeople}
                    onUpdateSplitPeopleCount={updateSplitPeopleCount}
                    totalRemainingCents={totalRemaining}
                    totalRemainingDollars={totalRemainingInDollars}
                    onAmountChange={onAmountChange}
                    onAmountErrorChange={onAmountErrorChange}
                    setSplitPaymentByPeople={setSplitPaymentByPeople}
                />
            </div>

            {unpaidOnAccountOrders.length > 0 && (
                <div className="payment-modal-on-account-payments-wrapper mb-8">
                    <div className="text-bold mb-2">This customer has unpaid Account Balance</div>
                    {unpaidOnAccountOrders.map((order) => (
                        <div key={order.id} className="mt-1">
                            Order: {order.number} - {format(new Date(order.placedAt), "dd MMM h:mm:ss aa")} - {order.products.length}
                            {order.products.length === 1 ? " item" : " items"} - ${convertCentsToDollars(order.subTotal)}
                        </div>
                    ))}
                    <div className="mt-2 text-bold">Total: -${convertCentsToDollars(unpaidOnAccountTotal)}</div>
                </div>
            )}

            <div className="h3 mb-4">Payment Methods</div>
            <div className="payment-modal-payment-buttons-wrapper mb-8">
                <div className="payment-modal-payment-button-wrapper">
                    <Button className="large payment-modal-cash-button" onClick={handleCashPayment}>
                        Cash
                    </Button>
                    <Button className="large payment-modal-eftpos-button" onClick={handleEftposPayment}>
                        Eftpos
                    </Button>
                    {register &&
                        register.enableOnAccountPayments &&
                        customerInformation &&
                        customerInformation.firstName &&
                        customerInformation.email &&
                        customerInformation.phoneNumber && (
                            <Button className="large payment-modal-on-account-button" onClick={handleOnAccountPayment}>
                                On Account
                            </Button>
                        )}
                    {register && register.enableUberEatsPayments && (
                        <Button className="large payment-modal-uber-eats-button" onClick={handleUberEatsPayment}>
                            Uber Eats
                        </Button>
                    )}
                    {register && register.enableMenulogPayments && (
                        <Button className="large payment-modal-menulog-button" onClick={handleMenulogPayment}>
                            Menulog
                        </Button>
                    )}
                    {register && register.enableDoordashPayments && (
                        <Button className="large payment-modal-doordash-button" onClick={handleDoordashPayment}>
                            Doordash
                        </Button>
                    )}
                    {register && register.enableDelivereasyPayments && (
                        <Button className="large payment-modal-delivereasy-button" onClick={handleDelivereasyPayment}>
                            Delivereasy
                        </Button>
                    )}
                </div>
            </div>
            <div className="h3 mb-4">Quick Cash Options</div>
            <div className="payment-modal-quick-cash-button-wrapper mb-8">
                {QUICK_CASH_AMOUNTS.map((quickAmount, index) => {
                    const displayAmount = parseFloat(quickAmount).toString();

                    return (
                        <div
                            key={quickAmount}
                            className={`payment-modal-quick-cash-button${index > 0 ? " ml-4" : ""}${isSplitByItems ? " disabled" : ""}`}
                            onClick={() => !isSplitByItems && handleQuickCashPayment(quickAmount)}
                        >
                            ${displayAmount}
                        </div>
                    );
                })}
            </div>
            {payments && payments.length > 0 && (
                <>
                    <div className="h3 mb-4">Paid So Far</div>
                    {payments.map((payment, index) => {
                        const removalConfig = REMOVABLE_PAYMENT_CONFIG[payment.type];
                        const key = `payment-${index}-${payment.type}`;

                        if (removalConfig) {
                            return (
                                <div key={key} className="mb-2">
                                    {removalConfig.label}: ${convertCentsToDollars(payment.amount)}{" "}
                                    <Link onClick={() => removePayment(index, removalConfig.amountKey)}>(Remove)</Link>
                                </div>
                            );
                        }

                        return (
                            <div key={key} className="mb-2">
                                Eftpos: ${convertCentsToDollars(payment.amount)}
                            </div>
                        );
                    })}
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
                <div className="h3 mb-6 text-center would-you-like-a-customer-receipt">Would you like a customer receipt?</div>
                {/* <div className="mb-6 receipt-image-container">
                    <img
                        alt="Receipt Image"
                        className="receipt-image"
                        src="https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/downlow_receipt_icon.png"
                    />
                    <div className="receipt-image-override"></div>
                </div> */}
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
