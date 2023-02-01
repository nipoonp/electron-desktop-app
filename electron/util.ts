import { printer as ThermalPrinter, types as PrinterTypes } from "node-thermal-printer";
import {
    IOrderReceipt,
    ICartProduct,
    ICartModifierGroup,
    ICartModifier,
    ERegisterPrinterType,
    IPrintReceiptOutput,
    IPrintSalesDataInput,
    EOrderStatus,
} from "./model";
import usbPrinter from "@thiagoelg/node-printer";
import { format } from "date-fns";
import { execute } from "html2thermal";
var inlineCss = require("inline-css");

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const calculateLRC = (str: string): string => {
    var bytes: number[] = [];
    var lrc = 0;
    for (var i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i));
    }

    for (var i = 0; i < str.length; i++) {
        lrc ^= bytes[i];
    }

    return String.fromCharCode(lrc);
};

export const encodeCommandBuffer = (command: string): Buffer => {
    const messageIdentifier = Buffer.from("V2");
    const payloadLength = Buffer.from([0, command.length]);
    const payload = Buffer.from(command);
    const lrc = Buffer.from(calculateLRC(command));

    var arr = [messageIdentifier, payloadLength, payload, lrc];

    return Buffer.concat(arr);
};

export const decodeCommandBuffer = (data: Buffer): string => {
    // Remove V2
    let dataBuffer = data.slice(2);

    // Remove payload length
    dataBuffer = dataBuffer.slice(2);

    // Remove LRC
    dataBuffer = dataBuffer.slice(0, -1);

    return dataBuffer.toString();
};

export const convertDollarsToCents = (price: number) => (price * 100).toFixed(0);

export const convertCentsToDollars = (price: number) => (price / 100).toFixed(2);

const getProductTotal = (product: ICartProduct) => {
    let price = product.price - product.discount;

    product.modifierGroups.forEach((mg) => {
        mg.modifiers.forEach((m) => {
            const changedQuantity = m.quantity - m.preSelectedQuantity;

            if (changedQuantity > 0) {
                price += m.price * changedQuantity;
            }

            if (m.productModifiers) {
                m.productModifiers.forEach((productModifier) => {
                    productModifier.modifierGroups.forEach((orderedProductModifierModifierGroup) => {
                        orderedProductModifierModifierGroup.modifiers.forEach((orderedProductModifierModifier) => {
                            const changedQuantity = orderedProductModifierModifier.quantity - orderedProductModifierModifier.preSelectedQuantity;

                            if (changedQuantity > 0) {
                                price += orderedProductModifierModifier.price * changedQuantity;
                            }
                        });
                    });
                });
            }
        });
    });

    price = price * product.quantity;

    return price;
};

export const printCustomerReceipt = async (order: IOrderReceipt): Promise<IPrintReceiptOutput> => {
    let printer;

    if (order.printerType == ERegisterPrinterType.WIFI) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
            interface: `tcp://${order.printerAddress}`,
        });
    } else if (order.printerType == ERegisterPrinterType.USB) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
        });
    } else {
        //Bluetooth
    }

    // let isConnected = await printer.isPrinterConnected();
    // console.log("Printer connected:", isConnected);
    // if (order.paymentAmounts && order.paymentAmounts.cash > 0) printer.openCashDrawer();

    // printer.alignCenter();

    const html = `
    <style>div{font-size:30px;}</style>
<div>hello world</div>
<p>it is</p>
<fonta>Nipoon</fonta>
<fontb>Nipoon</fontb>
`;

    const template = await inlineCss(html, { url: "" });
    console.log(template);

    // printer.partialCut();

    try {
        if (order.printerType == ERegisterPrinterType.WIFI) {
            await execute(printer, template);
        } else if (order.printerType == ERegisterPrinterType.USB) {
            await usbPrinterExecute(order.printerAddress, printer.getBuffer());
            printer.clear();
        } else {
            //Bluetooth
        }

        return { error: null };
    } catch (e) {
        return { error: e };
    }
};

const usbPrinterExecute = (address: string, dataBuffer: any) => {
    return new Promise(async (resolve, reject) => {
        usbPrinter.printDirect({
            data: dataBuffer,
            printer: address,
            type: "RAW",
            success: (jobId) => {
                resolve(jobId);
            },
            error: (err) => {
                reject(err);
            },
        });
    });
};
