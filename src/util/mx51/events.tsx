import { SuccessState, TransactionType } from "@mx51/spi-client-js";
import { spi } from "./index";

// Log SPI events
const log = (message: string, event?: Event) => {
    if (event) {
        spi._log.info(`${message} -> `, event);
    } else {
        spi._log.info(message);
    }
};

/**
 * Event: StatusChanged
 * This method will be called when the terminal connection status changes
 **/
document.addEventListener("StatusChanged", (e: any) => {
    log("Status changed", e);

    if (e?.detail === "PairedConnected") {
        // code actions
    } else {
        // ... other actions
    }
});

/**
 * Event: SecretsChanged
 * For saving secrets after terminal paired (in order to keep current terminal instance activated)
 **/
document.addEventListener("SecretsChanged", (e: any) => {
    log("Secrets changed", e);

    if (e?.detail) {
        window.localStorage.setItem("secrets", JSON.stringify(e.detail));
    }
});

/**
 * Event: PairingFlowStateChanged
 * To get latest updates on the pairing process
 **/
document.addEventListener("PairingFlowStateChanged", (e: any) => {
    log("Pairing flow state changed", e);
    log(
        e?.detail?.AwaitingCheckFromEftpos && e?.detail?.AwaitingCheckFromPos
            ? `${e?.detail?.Message}: ${e?.detail?.ConfirmationCode}`
            : e?.detail?.Message
    );

    // if paring flow state of Successful and Finished turns to true, then we call terminal back to idle status
    if (e?.detail?.Successful && e?.detail?.Finished) {
        spi.AckFlowEndedAndBackToIdle();
    }
});

/**
 * Event: TxFlowStateChanged
 * To get latest updates on the transaction flow
 **/
document.addEventListener("TxFlowStateChanged", (e: any) => {
    log("Transaction flow state changed", e);

    if (e.detail.AwaitingSignatureCheck) {
        // Print the receipt: e.detail.SignatureRequiredMessage._receiptToSign
        // Display the signature confirmation UI
    } else if (e.detail.AwaitingPhoneForAuth) {
        // Display the MOTO phone authentication UI
    } else if (e.detail.Finished) {
        if (e.detail.Response.Data.merchant_receipt && !e.detail.Response.Data.merchant_receipt_printed) {
            // Print and/or store the merchant_receipt
        }

        if (e.detail.Response.Data.customer_receipt && !e.detail.Response.Data.customer_receipt_printed) {
            // Print and/or store the customer_receipt
        }

        switch (e.detail.Success) {
            case SuccessState.Success:
                // Display the successful transaction UI adding detail for user (e.detail.Response.Data.host_response_text)
                // Close the sale on the POS
                switch (e.detail.Type) {
                    case TransactionType.Purchase:
                        // Perform actions after purchases only
                        break;
                    case TransactionType.Refund:
                        // Perform actions after refunds only
                        break;
                    default:
                    // Perform actions after other transaction types
                }
                break;
            case SuccessState.Failed:
                // Display the failed transaction UI adding detail for user:
                // e.detail.Response.Data.error_detail
                // e.detail.Response.Data.error_reason
                // if (e.detail.Response.Data.host_response_text) {
                //     e.detail.Response.Data.host_response_text
                // }
                break;
            case SuccessState.Unknown:
                // Display the manual transaction recovery UI
                break;
            default:
            // Throw error: invalid success state
        }
    }
});

/**
 * Event: DeviceAddressChanged
 * To get latest updates for device address resolution
 * The EFTPOS address should be saved and updated in your store every time it changes to enable reconnection after a disconnection
 **/
document.addEventListener("DeviceAddressChanged", (e: any) => {
    log("Device address changed", e);

    if (e?.detail.ip) {
        window.localStorage.setItem("eftposAddress", JSON.stringify(e.detail.ip));
    } else if (e?.detail.fqdn) {
        window.localStorage.setItem("eftposAddress", JSON.stringify(e.detail.fqdn));
    }
});

/**
 * Event: TerminalConfigurationResponse
 * To get latest terminal confirmation object data
 **/
spi.TerminalConfigurationResponse = (e) => {
    log("Terminal configuration response", e);

    spi.GetTerminalStatus();
};

/**
 * Event: TerminalStatusResponse
 * To get latest terminal status object data
 **/
spi.TerminalStatusResponse = (e) => {
    log("Terminal status response", e);
};

/**
 * Event: Transaction Update Message
 * To get latest transaction updates
 **/
spi.TransactionUpdateMessage = (e) => {
    log("Transaction update", e);
};

/**
 * Event: BatteryLevelChanged
 * To get latest updates for terminal battery level
 **/
spi.BatteryLevelChanged = (e) => {
    log("Battery level changed", e);
};

export { log };
