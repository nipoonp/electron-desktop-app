import { spi } from "./index";
import { log } from "./events";

/**
 * This will connect to the Eftpos and start the pairing process
 * Only call this if you are in the Unpaired state
 * Subscribe to the PairingFlowStateChanged event to get updates on the pairing process
 *
 **/
const pair = (pairingInput) => {
    log("Pairing...");
    spi.Pair();
};

/**
 * Call this when your user clicks yes to confirm the pairing code on your
 * screen matches the one on the Eftpos
 *
 **/
const pairConfirm = () => {
    console.log("Pairing code confirmed");
    spi.PairingConfirmCode();
};

/**
 * Call this when your user clicks the Unpair button
 * This will disconnect from the Eftpos and forget the secrets
 * The CurrentState is then changed to Unpaired
 * Call this only if you are not yet in the Unpaired state
 *
 **/
const unpair = () => {
    if (!spi) return;

    spi.AckFlowEndedAndBackToIdle(); // Ensure terminal is always on Idle status before unpair a terminal

    log("Unpairing...");
    spi.Unpair();

    if (spi._currentStatus === "Unpaired") {
        localStorage.removeItem("secrets");
    }
};

/**
 * Call this if your user clicks CANCEL or NO during the pairing process
 *
 **/
const cancelPairing = () => {
    log("Pairing cancelled");
    spi.PairingCancel();
};

export { pair, pairConfirm, unpair, cancelPairing };
