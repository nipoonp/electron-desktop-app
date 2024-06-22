import { v4 as uuid } from "uuid";
import { spi, receiptOptions } from "./index";

// This generates a unique posRefId for each transaction request
const posRefIdGenerator = (type) => `${new Date().toISOString()}-${type}-${uuid()}`;

/**
 * Initiates a purchase transaction
 * Be subscribed to TxFlowStateChanged event to get updates on the process
 * Tip and cashout are not allowed simultaneously
 *
 * @param posRefId - A unique identifier for your Order/Purchase
 * @param purchaseAmount - The Purchase amount in cents
 * @param tipAmount - The Tip amount in cents
 * @param cashoutAmount - The Cashout amount in cents
 * @param promptForCashout - Whether to prompt your customer for cashout on the Eftpos
 * @param options - Set custom Header and Footer text for the Receipt
 * @param surchargeAmount - The Surcharge amount in cents
 **/
const purchase = ({ purchaseAmount, tipAmount, cashoutAmount, promptForCashout, surchargeAmount }) => {
    spi.AckFlowEndedAndBackToIdle();

    spi.InitiatePurchaseTxV2(
        posRefIdGenerator("purchase"), // posRefId
        purchaseAmount,
        tipAmount,
        cashoutAmount,
        promptForCashout,
        receiptOptions, // options
        surchargeAmount
    );
};

/**
 * Initiates a refund transaction
 * Be subscribed to TxFlowStateChanged event to get updates on the process
 *
 * @param posRefId - A unique identifier for your Refund
 * @param amountCents - The amount in cents
 * @param options - Set custom Header and Footer text for the Receipt
 **/
// const refund = ({ refundAmount }) => {
//     spi.AckFlowEndedAndBackToIdle();

//     spi.InitiateRefundTx(
//         posRefIdGenerator("refund"), // posRefId
//         refundAmount, // amountCents
//         receiptOptions // options
//     );
// };

/**
 * Initiates a Mail Order / Telephone Order Purchase transaction
 *
 * @param posRefId - A unique identifier for your MOTO
 * @param amountCents - The amount in cents
 * @param surchargeAmount - The Surcharge amount in cents
 * @param options - Set custom Header and Footer text for the Receipt
 **/
// const moto = ({ purchaseAmount, surchargeAmount }) => {
//     spi.AckFlowEndedAndBackToIdle();

//     spi.InitiateMotoPurchaseTx(
//         posRefIdGenerator("moto"), // posRefId
//         purchaseAmount,
//         surchargeAmount,
//         receiptOptions // options
//     );
// };

/**
 * Initiates a cashout only transaction
 * Be subscribed to TxFlowStateChanged event to get updates on the process
 *
 * @param posRefId - A unique identifier for your Cashout
 * @param amountCents - The amount in cents to cash out
 * @param surchargeAmount - The Surcharge amount in cents
 **/
// const cashout = ({ cashoutAmount, surchargeAmount }) => {
//     spi.AckFlowEndedAndBackToIdle();

//     spi.InitiateCashoutOnlyTx(posRefIdGenerator("cashout"), cashoutAmount, surchargeAmount);
// };

/**
 * Initiates a Get Transaction request
 * Use this when you want to retrieve from one of the last 10 transactions that was processed by the Eftpos
 * Be subscribed to TxFlowStateChanged event to get updates on the process
 *
 * @param posRefId - The unique identifier of the transaction you want to get
 **/
// const getTransaction = (posRefId) => {
//     if (!posRefId) {
//         spi.InitiateGetLastTx(); // Gets the last transaction
//     } else {
//         spi.InitiateGetTx(posRefId);
//     }
// };

/**
 * Attempts to cancel a transaction
 * Be subscribed to TxFlowStateChanged event to see how it goes
 * Wait for the transaction to be finished and then see whether cancellation was successful or not
 *
 **/
const cancelTransaction = () => {
    spi.CancelTransaction();
};

/**
 * Initiates a Settlement transaction
 * Be subscribed to TxFlowStateChanged event to get updates on the process
 *
 * @param posRefId - A unique identifier for your Settlement
 * @param options - Set custom Header and Footer text for the Receipt
 **/
// const settlement = () => {
//     spi.AckFlowEndedAndBackToIdle();

//     spi.InitiateSettleTx(posRefIdGenerator("settlement"), receiptOptions);
// };

/**
 * Initiates a Settlement Enquiry transaction
 *
 * @param posRefId - A unique identifier for your Settlement Enquiry
 * @param options - Set custom Header and Footer text for the Receipt
 **/
// const settlementEnquiry = () => {
//     spi.AckFlowEndedAndBackToIdle();

//     spi.InitiateSettlementEnquiry(posRefIdGenerator("settlementEnquiry"), receiptOptions);
// };

export { purchase, cancelTransaction };
