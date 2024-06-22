import { Spi as SpiClient, TransactionOptions } from "@mx51/spi-client-js";
import config from "./../../../package.json";

// SPI's settings
const spiSettings = {
    posVendorId: "Tabin", // your POS company name/id
    posVersion: config.version, // your POS version
    deviceApiKey: process.env.REACT_APP_MX51_API_KEY || "", // ask the integration support team for your API key
    countryCode: "AU", // if unsure check with integration support team
    secureWebSockets: window.location.protocol === "https:" ? true : false, // checks for HTTPs
    printMerchantCopyOnEftpos: false, // prints merchant receipt from terminal instead of POS
    promptForCustomerCopyOnEftpos: false, // prints customer receipt from terminal instead of POS
    signatureFlowOnEftpos: false, // signature flow and receipts on terminal instead of POS
    merchantReceiptHeader: "", // custom text to be added to merchant receipt header
    merchantReceiptFooter: "", // custom text to be added to merchant receipt footer
    customerReceiptHeader: "", // custom text to be added to customer receipt header
    customerReceiptFooter: "", // custom text to be added to customer receipt footer
};

export const getAvailableTenants = async () => {
    const { Data: tenants } = await SpiClient.GetAvailableTenants(spiSettings.countryCode, spiSettings.posVendorId, spiSettings.deviceApiKey);
    // store the list of tenants
    localStorage.setItem("tenants", JSON.stringify(tenants));
    // store the desired tenant code
    localStorage.setItem("tenantCode", tenants[0].code);
};

// Pairing input
const pairingInput = {
    posId: "T1", // individual POS identifier
    tenantCode: JSON.parse(window.localStorage.getItem("tenantCode") || "") || "gko", // this would be a dynamic value the user can select based on the GetAvailableTenants list
    serialNumber: "000-000-000", // the terminal serial number
    eftposAddress: JSON.parse(window.localStorage.getItem("eftposAddress") || "") || "192.168.0.1", // the terminal eftpos address
    autoAddressResolution: true, // this should always be set to true in order to handle IP address changes
    testMode: true, // this will be false when using Gecko Bank and true when using physical test terminals provided by payment providers
};

// Retrieve the pairing secrets from local storage if they are there
const spiSecrets = JSON.parse(window.localStorage.getItem("secrets") || "");

/**
 * Instantiate the SPI library as an instance object
 *
 * @param posId - required
 * @param serialNumber - required
 * @param eftposAddress - required
 * @param secrets - can be null if not previously paired (used to reconnect to the terminal without having to "pair" again)
 **/
const spi = new SpiClient(pairingInput.posId, pairingInput.serialNumber, pairingInput.eftposAddress, spiSecrets);

/**
 * Sets values used to identify the POS software to the EFTPOS terminal
 * Must be set before starting
 *
 * @param posVendorId - Vendor identifier of the POS itself
 * @param posVersion - Version string of the POS itself
 **/
spi.SetPosInfo(spiSettings.posVendorId, spiSettings.posVersion); // If not set, will get this error: Uncaught Error: Missing POS vendor ID and version. posVendorId and posVersion are required before starting

/**
 * Set the tenant code of your provider, please use the GetAvailableTenants method for a list of available tenants.
 * More information can be found here - https://developer.mx51.io/docs/setup#tenants
 *
 * @param tenantCode
 **/
spi.SetTenantCode(localStorage.getItem(pairingInput.tenantCode) || "");

/**
 * Set the api key used for auto address discovery feature
 * Integration Support will provide you with a Unique API key
 *
 * @param deviceApiKey
 **/
spi.SetDeviceApiKey(spiSettings.deviceApiKey);

/**
 * Allows you to set the auto address discovery feature
 *
 * @param autoAddressResolutionEnable
 **/
spi.SetAutoAddressResolution(pairingInput.autoAddressResolution);

/**
 * Set the client library to use secure web sockets TLS (wss protocol)
 *
 * @param useSecureWebSockets
 **/
spi.SetSecureWebSockets(spiSettings.secureWebSockets);

/**
 * Call this method to set the client library test mode
 * Set it to true only while you are developing the integration with a physical test terminal
 * If you are using Gecko Bank then it should be set to false
 * It defaults to false. For a real merchant, always leave it set to false
 *
 * @param testMode
 **/
spi.SetTestMode(pairingInput.testMode);

// Set the client library to print merchant receipts on the terminal
spi.Config.PrintMerchantCopy = spiSettings.printMerchantCopyOnEftpos;

// Set the client library to prompt for customer receipts on the terminal
spi.Config.PromptForCustomerCopyOnEftpos = spiSettings.promptForCustomerCopyOnEftpos;

// Set the client library to handle the signature flow on the terminal (prompt for signature approval and print receipts)
spi.Config.SignatureFlowOnEftpos = spiSettings.signatureFlowOnEftpos;

/**
 * Set the client library to print custom receipt headers and footers
 *
 * @param customerReceiptHeader - the text you want to display on the customer receipt header
 * @param customerReceiptFooter - the text you want to display on the customer receipt footer
 * @param merchantReceiptHeader - the text you want to display on the merchant receipt header
 * @param merchantReceiptFooter - the text you want to display on the merchant receipt footer
 **/
const receiptOptions = new TransactionOptions();
receiptOptions.SetMerchantReceiptHeader(spiSettings.merchantReceiptHeader);
receiptOptions.SetMerchantReceiptFooter(spiSettings.merchantReceiptFooter);
receiptOptions.SetCustomerReceiptHeader(spiSettings.customerReceiptHeader);
receiptOptions.SetCustomerReceiptFooter(spiSettings.customerReceiptFooter);

/**
 * Start the terminal instance, including:
 * Connect terminal
 * Reconnect terminal
 * Validate posId and eftpos address
 *
 **/
spi.Start();

// Use these throughout your code
export { spiSettings, pairingInput, spi, receiptOptions };
