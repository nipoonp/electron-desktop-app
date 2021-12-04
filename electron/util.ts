import usbPrinter from "@thiagoelg/node-printer";
import { format } from "date-fns";
import { printer as ThermalPrinter, types as PrinterTypes } from "node-thermal-printer";
import {
    EReceiptPrinterType, ICartModifier, ICartModifierGroup, ICartProduct, IOrderReceipt, IPrintReceiptOutput,
    IPrintSalesByDayDataInput
} from "./model";

export const calculateLRC = (str: string): string => {
    var bytes: number[] = [];
    var lrc = 0;
    for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i));
    }

    for (let i = 0; i < str.length; i++) {
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
    let price = product.price;

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

export const printReceipt = async (order: IOrderReceipt, printCustomerReceipt: boolean): Promise<IPrintReceiptOutput> => {
    let printer;

    if (order.printerType === EReceiptPrinterType.WIFI) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
            interface: `tcp://${order.printerAddress}`,
        });
    } else if (order.printerType === EReceiptPrinterType.USB) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
        });
    } else {
        //Bluetooth
    }

    // let isConnected = await printer.isPrinterConnected();
    // console.log("Printer connected:", isConnected);

    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(order.restaurant.name);

    printer.newLine();

    if (printCustomerReceipt) {
        printer.bold(false);
        printer.setTextNormal();
        printer.println(order.restaurant.address);
    }

    if (printCustomerReceipt) {
        printer.newLine();

        if (order.restaurant.gstNumber) {
            printer.bold(false);
            printer.setTextNormal();
            printer.println(`GST: ${order.restaurant.gstNumber}`);

            printer.newLine();
        }
    }

    printer.setTextNormal();
    printer.println(`Order Placed ${format(new Date(order.placedAt), "dd MMM HH:mm aa")} for ${order.type}`);

    if (order.orderScheduledAt) {
        printer.newLine();
        printer.bold(true);
        printer.underlineThick(true);
        printer.println(`Order Scheduled ${format(new Date(order.orderScheduledAt), "dd MMM HH:mm aa")}`);
        printer.underlineThick(false);
        printer.bold(false);
    }

    if (order.customerInformation) {
        printer.newLine();
        printer.println(`Customer: ${order.customerInformation.firstName} (${order.customerInformation.phoneNumber})`);
    }

    if (order.table) {
        printer.println("Your table number is");
        printer.newLine();
        printer.setTextSize(1, 1);
        printer.println(order.table);
        printer.newLine();
    }

    printer.newLine();

    printer.setTextNormal();
    printer.println("Your order number is");
    printer.newLine();

    //If table number is present display table number in big, order number in small
    if (!order.table) {
        printer.setTextSize(1, 1);
    }

    printer.println(order.number);
    printer.newLine();
    printer.setTextNormal();

    if (order.paid === false) {
        printer.underlineThick(true);
        printer.println("Payment Required");
        printer.underlineThick(false);
        printer.newLine();
    }

    printer.alignLeft();

    order.products.forEach((product: ICartProduct) => {
        printer.drawLine();
        printer.bold(true);

        printer.tableCustom([
            {
                text: `${product.quantity > 1 ? product.quantity + " x " : ""}${product.name}`,
                align: "LEFT",
                width: 0.75,
                bold: true,
            },
            {
                text: `\$${convertCentsToDollars(getProductTotal(product))}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);

        product.modifierGroups.forEach((modifierGroup: ICartModifierGroup) => {
            if (order.hideModifierGroupsForCustomer === true && modifierGroup.hideForCustomer === true) {
                return;
            }

            printer.newLine();
            printer.bold(false);
            printer.underline(true);
            printer.println(`${modifierGroup.name}`);
            printer.underline(false);

            modifierGroup.modifiers.forEach((modifier: ICartModifier) => {
                const changedQuantity = modifier.quantity - modifier.preSelectedQuantity;
                let mStr = "";

                if (changedQuantity < 0 && Math.abs(changedQuantity) === modifier.preSelectedQuantity) {
                    mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)} x ` : ""}${modifier.name}`;
                } else {
                    mStr = `${modifier.quantity > 1 ? `${Math.abs(modifier.quantity)} x ` : ""}${modifier.name}`;
                }

                if (modifier.price > 0 && changedQuantity > 0) {
                    mStr += ` ($${convertCentsToDollars(modifier.price)})`;
                }

                printer.println(mStr);

                modifier.productModifiers &&
                    modifier.productModifiers.forEach((productModifier_product: ICartProduct, index) => {
                        if (modifier.productModifiers && modifier.productModifiers.length > 1) {
                            if (index !== 0) {
                                printer.newLine();
                            }

                            printer.print(`     `);
                            printer.underlineThick(true);
                            printer.print(`Selection ${index + 1}`);
                            printer.println(``);
                            printer.underlineThick(false);
                        }

                        if (productModifier_product.modifierGroups.length > 0) {
                            productModifier_product.modifierGroups.forEach((productModifier_modifierGroup, index2) => {
                                if (order.hideModifierGroupsForCustomer === true && productModifier_modifierGroup.hideForCustomer === true) {
                                    return;
                                }

                                if (index2 !== 0) {
                                    printer.newLine();
                                }

                                printer.bold(false);
                                printer.println(`     ${productModifier_modifierGroup.name}`);

                                productModifier_modifierGroup.modifiers.forEach((productModifier_modifier: ICartModifier) => {
                                    const changedQuantity = productModifier_modifier.quantity - productModifier_modifier.preSelectedQuantity;
                                    let mStr = "";

                                    if (changedQuantity < 0 && Math.abs(changedQuantity) === productModifier_modifier.preSelectedQuantity) {
                                        mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)} x ` : ""}${
                                            productModifier_modifier.name
                                        }`;
                                    } else {
                                        mStr = `${productModifier_modifier.quantity > 1 ? `${Math.abs(productModifier_modifier.quantity)} x ` : ""}${
                                            productModifier_modifier.name
                                        }`;
                                    }

                                    if (productModifier_modifier.price > 0 && changedQuantity > 0) {
                                        mStr += ` ($${convertCentsToDollars(productModifier_modifier.price)})`;
                                    }

                                    printer.println(`     ${mStr}`);
                                });
                            });
                        } else {
                            printer.println(`     No extra selections made`);
                        }
                    });
            });
        });

        if (product.notes) {
            printer.bold(false);
            printer.newLine();
            printer.println(`Notes: ${product.notes}`);
        }
    });

    printer.drawLine();

    if (order.notes) {
        printer.bold(false);
        printer.println(`Notes: ${order.notes}`);
        printer.newLine();
    }

    const GST = order.total * 0.15;

    printer.tableCustom([
        { text: "GST (15.00%)", align: "LEFT", width: 0.75 },
        { text: `\$${convertCentsToDollars(GST)}`, align: "RIGHT", width: 0.25 },
    ]);
    order.discount &&
        printer.tableCustom([
            { text: "Discount", align: "LEFT", width: 0.75, bold: true },
            {
                text: `-\$${convertCentsToDollars(order.discount)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.paymentAmounts &&
        order.paymentAmounts.cash &&
        printer.tableCustom([
            { text: "Cash", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.paymentAmounts.cash)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.paymentAmounts &&
        order.paymentAmounts.eftpos &&
        printer.tableCustom([
            { text: "Eftpos", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.paymentAmounts.eftpos)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.paymentAmounts &&
        order.paymentAmounts.online &&
        printer.tableCustom([
            { text: "Online", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.paymentAmounts.online)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    printer.tableCustom([
        { text: "Total", align: "LEFT", width: 0.75, bold: true },
        {
            text: `\$${convertCentsToDollars(order.subTotal)}`,
            align: "RIGHT",
            width: 0.25,
            bold: true,
        },
    ]);

    printer.newLine();
    printer.alignCenter();

    if (order.eftposReceipt && printCustomerReceipt) {
        printer.println(order.eftposReceipt);
    }

    printer.newLine();
    printer.alignCenter();
    printer.setTypeFontB();
    printer.println("Order Placed on Tabin Kiosk");

    printer.partialCut();

    if (order.paymentAmounts && order.paymentAmounts.cash > 0 && !printCustomerReceipt) {
        printer.openCashDrawer();
    }

    try {
        if (order.printerType === EReceiptPrinterType.WIFI) {
            await printer.execute();
        } else if (order.printerType === EReceiptPrinterType.USB) {
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

export const printSalesByDayReceipt = async (printSalesByDayDataInput: IPrintSalesByDayDataInput): Promise<IPrintReceiptOutput> => {
    let printer;

    if (printSalesByDayDataInput.printerType === EReceiptPrinterType.WIFI) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
            interface: `tcp://${printSalesByDayDataInput.printerAddress}`,
        });
    } else if (printSalesByDayDataInput.printerType === EReceiptPrinterType.USB) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
        });
    } else {
        //Bluetooth
    }

    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println("Sales Report");
    printer.setTextNormal();
    printer.bold(false);

    printer.alignLeft();

    printer.newLine();
    printer.println(`Printed On: ${format(new Date(), "dd MMM yyyy HH:mm aa")}`);
    printer.newLine();

    Object.entries(printSalesByDayDataInput.saleData).forEach(([date, data], index) => {
        printer.bold(true);
        printer.underline(true);
        printer.println(date);
        printer.underline(false);
        printer.bold(false);

        printer.println(`Cash: $${convertCentsToDollars(data.totalPaymentAmounts.cash)}`);
        printer.println(`Eftpos: $${convertCentsToDollars(data.totalPaymentAmounts.eftpos)}`);
        printer.println(`Online: $${convertCentsToDollars(data.totalPaymentAmounts.online)}`);

        printer.bold(true);
        printer.println(`Total: $${convertCentsToDollars(data.totalAmount)}`);
        printer.println(`Number of Orders: ${data.totalQuantity}`);

        printer.bold(false);
        printer.newLine();
    });

    printer.partialCut();

    try {
        if (printSalesByDayDataInput.printerType === EReceiptPrinterType.WIFI) {
            await printer.execute();
        } else if (printSalesByDayDataInput.printerType === EReceiptPrinterType.USB) {
            await usbPrinterExecute(printSalesByDayDataInput.printerAddress, printer.getBuffer());
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
