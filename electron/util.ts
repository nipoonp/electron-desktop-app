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
    IEftposReceiptOutput,
    IPrintReceiptDataInput,
    IEftposReceipt,
    IPrintNoSaleOutput,
    IPrintNoSaleReceiptDataInput,
    ECountry,
} from "./model";
import usbPrinter from "@thiagoelg/node-printer";
import { format, isToday } from "date-fns";

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

export const printCustomerReceipt = async (
    order: IOrderReceipt,
    receiptIndex?: number,
    receiptTotalNumber?: number
): Promise<IPrintReceiptOutput> => {
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

    if (order.futureOrder) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Future Order");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    if (order.orderReminder) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Upcoming Order Reminder");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    if (order.displayPaymentRequiredMessage) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Payment Required");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }
    printer.alignCenter();

    if (order.restaurantLogoBase64) {
        if (order.restaurantLogoBase64) {
            const logoImageRemoveTag = order.restaurantLogoBase64.split(",")[1];
            const logoImage = Buffer.from(logoImageRemoveTag, "base64");

            printer.newLine();
            await printer.printImageBuffer(logoImage);
            printer.newLine();
        }
    } else {
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.underlineThick(true);
        printer.println(order.restaurant.name);
        printer.underlineThick(false);
        printer.setTextNormal();
        printer.bold(false);
    }

    printer.newLine();

    if (order.restaurant.gstNumber) {
        if (order.country === ECountry.au) {
            printer.println(`ABN: ${order.restaurant.gstNumber}`);
        } else {
            printer.println(`GST: ${order.restaurant.gstNumber}`);
        }
    }

    printer.println(order.restaurant.address);
    printer.newLine();
    printer.println(`Placed: ${format(new Date(order.placedAt), "dd MMM HH:mm aa")}`);

    if (order.orderScheduledAt) {
        printer.bold(true);
        printer.println(`Pickup: ${format(new Date(order.orderScheduledAt), "dd MMM HH:mm aa")}`);
        printer.bold(false);
    }

    if (order.customerInformation) {
        printer.println(
            `Customer: ${order.customerInformation.firstName} ${order.customerInformation.email} ${order.customerInformation.phoneNumber}`
        );

        if (order.customerInformation.signatureBase64) {
            const signatureImageRemoveTag = order.customerInformation.signatureBase64.split(",")[1];
            const signatureImage = Buffer.from(signatureImageRemoveTag, "base64");

            printer.newLine();
            await printer.printImageBuffer(signatureImage);
            printer.newLine();
        }
    }

    if (!order.hideOrderType) {
        printer.newLine();
        printer.println(`${order.type}${order.table ? ` (Table: ${order.table})` : ""}`);
    }

    if (order.buzzer !== null) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Buzzer: ${order.buzzer}`);
        printer.setTextNormal();
        printer.bold(false);

        printer.newLine();
        printer.println(`Order: ${order.number}`);
    } else {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Order: ${order.number}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (receiptTotalNumber && receiptTotalNumber > 1) {
        printer.newLine();
        printer.alignCenter();
        printer.println(`Receipt ${receiptIndex} of ${receiptTotalNumber}`);
    }

    if (!order.hidePreparationTime && !order.orderScheduledAt && order.preparationTimeInMinutes) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Ready in ${order.preparationTimeInMinutes} ${order.preparationTimeInMinutes > 1 ? "mins" : "min"}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    printer.newLine();
    printer.alignLeft();

    order.products.forEach((product: ICartProduct) => {
        printer.drawLine();
        printer.bold(true);

        printer.tableCustom([
            {
                text: `${product.quantity > 1 ? product.quantity + "x " : ""}${product.name}`,
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
            if (order.hideModifierGroupsForCustomer == true && modifierGroup.hideForCustomer == true) return;

            if (!order.hideModifierGroupName) {
                printer.newLine();
                printer.bold(true);
                printer.underlineThick(true);
                printer.println(`${modifierGroup.name}`);
                printer.underlineThick(false);
                printer.bold(false);
            }

            modifierGroup.modifiers.forEach((modifier: ICartModifier) => {
                const changedQuantity = modifier.quantity - modifier.preSelectedQuantity;
                let mStr = "";

                if (changedQuantity < 0 && Math.abs(changedQuantity) == modifier.preSelectedQuantity) {
                    mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)}x ` : ""}${modifier.name}`;
                } else {
                    mStr = `${modifier.quantity > 1 ? `${Math.abs(modifier.quantity)}x ` : ""}${modifier.name}`;
                }

                if (modifier.price > 0 && changedQuantity > 0) {
                    mStr += ` (+$${convertCentsToDollars(modifier.price)})`;
                }

                printer.println(mStr);

                modifier.productModifiers &&
                    modifier.productModifiers.forEach((productModifier_product: ICartProduct, index) => {
                        printer.newLine();

                        if (modifier.productModifiers && modifier.productModifiers.length > 1) {
                            printer.print(`      `);
                            printer.underlineThick(true);
                            printer.setTypeFontB();
                            printer.print(`Selection ${index + 1}`);
                            printer.setTypeFontA();
                            printer.println(``);
                            printer.underlineThick(false);
                        }

                        if (productModifier_product.modifierGroups.length > 0) {
                            productModifier_product.modifierGroups.forEach((productModifier_modifierGroup, index2) => {
                                if (order.hideModifierGroupsForCustomer == true && productModifier_modifierGroup.hideForCustomer == true) return;

                                if (!order.hideModifierGroupName) {
                                    if (index2 !== 0) printer.newLine();

                                    printer.print(`      `);
                                    printer.bold(true);
                                    printer.underlineThick(true);
                                    printer.println(`${productModifier_modifierGroup.name}`);
                                    printer.underlineThick(false);
                                    printer.bold(false);
                                }

                                productModifier_modifierGroup.modifiers.forEach((productModifier_modifier: ICartModifier) => {
                                    const changedQuantity = productModifier_modifier.quantity - productModifier_modifier.preSelectedQuantity;
                                    let mStr = "";

                                    if (changedQuantity < 0 && Math.abs(changedQuantity) == productModifier_modifier.preSelectedQuantity) {
                                        mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)}x ` : ""}${
                                            productModifier_modifier.name
                                        }`;
                                    } else {
                                        mStr = `${productModifier_modifier.quantity > 1 ? `${Math.abs(productModifier_modifier.quantity)}x ` : ""}${
                                            productModifier_modifier.name
                                        }`;
                                    }

                                    if (productModifier_modifier.price > 0 && changedQuantity > 0) {
                                        mStr += ` (+$${convertCentsToDollars(productModifier_modifier.price)})`;
                                    }

                                    printer.println(`     ${mStr}`);
                                });
                            });
                        } else {
                            printer.println(`      No extra selections made`);
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

    printer.tableCustom([
        { text: "GST", align: "LEFT", width: 0.75 },
        { text: `\$${convertCentsToDollars(order.tax)}`, align: "RIGHT", width: 0.25 },
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
    order.surcharge &&
        printer.tableCustom([
            { text: "Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.surcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.orderTypeSurcharge &&
        printer.tableCustom([
            { text: "Order Type Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.orderTypeSurcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.eftposSurcharge &&
        printer.tableCustom([
            { text: "Card Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.eftposSurcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.eftposTip &&
        printer.tableCustom([
            { text: "Eftpos Tip", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.eftposTip)}`,
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
    order.paymentAmounts &&
        order.paymentAmounts.uberEats &&
        printer.tableCustom([
            { text: "Uber Eats", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.paymentAmounts.uberEats)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.paymentAmounts &&
        order.paymentAmounts.menulog &&
        printer.tableCustom([
            { text: "Menulog", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.paymentAmounts.menulog)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.paymentAmounts &&
        order.paymentAmounts.doordash &&
        printer.tableCustom([
            { text: "Doordash", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.paymentAmounts.doordash)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.paymentAmounts &&
        order.paymentAmounts.delivereasy &&
        printer.tableCustom([
            { text: "Delivereasy", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.paymentAmounts.delivereasy)}`,
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

    // printer.newLine();
    // printer.alignCenter();

    // if (order.eftposReceipt) {
    //     const eftposReceiptArray = order.eftposReceipt.split("\n");

    //     eftposReceiptArray.forEach((line) => {
    //         printer.println(line);
    //     });
    // }

    if (order.enableLoyalty) {
        printer.newLine();
        printer.alignCenter();

        printer.println("Don't miss out on your reward points!");
        printer.printQR(`http://rewards.tabin.co.nz/${order.orderId}`);
    }

    if (order.receiptFooterText) {
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(order.receiptFooterText);
        printer.setTextNormal();
        printer.bold(false);
    } else {
        printer.setTypeFontB();
        printer.println("Order Placed on Tabin Kiosk (tabin.co.nz)");
    }

    if (order.skipReceiptCutCommand) {
    } else {
        printer.partialCut();
    }

    try {
        if (order.printerType == ERegisterPrinterType.WIFI) {
            await printer.execute();
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

export const printKitchenReceipt = async (order: IOrderReceipt, receiptIndex?: number, receiptTotalNumber?: number): Promise<IPrintReceiptOutput> => {
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

    if (order.futureOrder) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Future Order");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    if (order.orderReminder) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Upcoming Order Reminder");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    if (order.displayPaymentRequiredMessage) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Payment Required");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    printer.alignCenter();
    printer.bold(true);
    printer.underlineThick(true);
    printer.println(order.restaurant.name);
    printer.underlineThick(false);
    printer.bold(false);
    printer.newLine();

    printer.println(`Placed: ${format(new Date(order.placedAt), "dd MMM HH:mm aa")}`);

    if (order.orderScheduledAt) {
        printer.setTextSize(1, 1);
        printer.bold(true);

        if (isToday(order.orderScheduledAt)) {
            printer.println(`Pickup: Today ${format(new Date(order.orderScheduledAt), "HH:mm aa")}`);
        } else {
            printer.println(`Pickup: ${format(new Date(order.orderScheduledAt), "dd MMM HH:mm aa")}`);
        }

        printer.bold(false);
        printer.setTextNormal();
    }

    if (order.status === EOrderStatus.PARKED && order.notes) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Notes: ${order.notes}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (!order.hideOrderType) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`${order.type}${order.table ? ` (Table: ${order.table})` : ""}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (order.buzzer !== null) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Buzzer: ${order.buzzer}`);
        printer.setTextNormal();
        printer.bold(false);

        printer.newLine();
        printer.println(`Order: ${order.number}`);
    } else {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Order: ${order.number}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (receiptTotalNumber && receiptTotalNumber > 1) {
        printer.newLine();
        printer.alignCenter();
        printer.println(`Receipt ${receiptIndex} of ${receiptTotalNumber}`);
    }

    if (!order.hidePreparationTime && !order.orderScheduledAt && order.preparationTimeInMinutes) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Ready in ${order.preparationTimeInMinutes} ${order.preparationTimeInMinutes > 1 ? "mins" : "min"}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (order.customerInformation) {
        printer.newLine();
        printer.drawLine();
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        if (order.customerInformation.firstName) printer.println(order.customerInformation.firstName);
        if (order.customerInformation.email) printer.println(order.customerInformation.email);
        if (order.customerInformation.phoneNumber) printer.println(order.customerInformation.phoneNumber);
        printer.setTextNormal();
        printer.bold(false);

        if (order.customerInformation.signatureBase64) {
            const signatureImageRemoveTag = order.customerInformation.signatureBase64.split(",")[1];
            const signatureImage = Buffer.from(signatureImageRemoveTag, "base64");

            await printer.printImageBuffer(signatureImage);
            printer.newLine();
        }
    }

    printer.newLine();
    printer.alignLeft();

    order.products.forEach((product: ICartProduct) => {
        printer.drawLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`${product.quantity > 1 ? product.quantity + "x " : ""}${product.kitchenName || product.name}`);
        printer.setTextNormal();
        printer.bold(false);

        product.modifierGroups.forEach((modifierGroup: ICartModifierGroup) => {
            if (order.hideModifierGroupsForCustomer == true && modifierGroup.hideForCustomer == true) return;

            if (!order.hideModifierGroupName) {
                printer.newLine();
                printer.bold(true);
                printer.underlineThick(true);
                printer.println(`${modifierGroup.kitchenName || modifierGroup.name}`);
                printer.underlineThick(false);
                printer.bold(false);
            }

            modifierGroup.modifiers.forEach((modifier: ICartModifier, modifier_index: number) => {
                const changedQuantity = modifier.quantity - modifier.preSelectedQuantity;
                let mStr = "";

                if (changedQuantity < 0 && Math.abs(changedQuantity) == modifier.preSelectedQuantity) {
                    mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)}x ` : ""}${modifier.kitchenName || modifier.name}`;
                } else {
                    mStr = `${modifier.quantity > 1 ? `${Math.abs(modifier.quantity)}x ` : ""}${modifier.kitchenName || modifier.name}`;
                }

                printer.print(mStr);
                if (modifier_index === modifierGroup.modifiers.length - 1) {
                    printer.println("");
                } else {
                    printer.print(", ");
                }

                modifier.productModifiers &&
                    modifier.productModifiers.forEach((productModifier_product: ICartProduct, index) => {
                        printer.newLine();

                        if (modifier.productModifiers && modifier.productModifiers.length > 1) {
                            printer.print(`      `);
                            printer.underlineThick(true);
                            printer.setTypeFontB();
                            printer.print(`Selection ${index + 1}`);
                            printer.setTypeFontA();
                            printer.println(``);
                            printer.underlineThick(false);
                        }

                        if (productModifier_product.modifierGroups.length > 0) {
                            productModifier_product.modifierGroups.forEach((productModifier_modifierGroup, index2) => {
                                if (order.hideModifierGroupsForCustomer == true && productModifier_modifierGroup.hideForCustomer == true) return;

                                if (!order.hideModifierGroupName) {
                                    if (index2 !== 0) printer.newLine();

                                    printer.print(`      `);
                                    printer.bold(true);
                                    printer.underlineThick(true);
                                    printer.println(`${productModifier_modifierGroup.kitchenName || productModifier_modifierGroup.name}`);
                                    printer.underlineThick(false);
                                    printer.bold(false);
                                }

                                productModifier_modifierGroup.modifiers.forEach(
                                    (productModifier_modifier: ICartModifier, productModifier_modifier_index: number) => {
                                        const changedQuantity = productModifier_modifier.quantity - productModifier_modifier.preSelectedQuantity;
                                        let mStr = "";

                                        if (changedQuantity < 0 && Math.abs(changedQuantity) == productModifier_modifier.preSelectedQuantity) {
                                            mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)}x ` : ""}${
                                                productModifier_modifier.kitchenName || productModifier_modifier.name
                                            }`;
                                        } else {
                                            mStr = `${
                                                productModifier_modifier.quantity > 1 ? `${Math.abs(productModifier_modifier.quantity)}x ` : ""
                                            }${productModifier_modifier.kitchenName || productModifier_modifier.name}`;
                                        }

                                        if (productModifier_modifier_index === 0) {
                                            printer.print(`      `);
                                        }
                                        printer.print(`${mStr}`);
                                        if (productModifier_modifier_index === productModifier_modifierGroup.modifiers.length - 1) {
                                            printer.println("");
                                        } else {
                                            printer.print(", ");
                                        }
                                    }
                                );
                            });
                        } else {
                            printer.println(`      No extra selections made`);
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
        printer.println(`Notes: ${order.notes}`);
        printer.newLine();
    }

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
    order.surcharge &&
        printer.tableCustom([
            { text: "Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.surcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.orderTypeSurcharge &&
        printer.tableCustom([
            { text: "Order Type Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.orderTypeSurcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.eftposSurcharge &&
        printer.tableCustom([
            { text: "Card Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.eftposSurcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.eftposTip &&
        printer.tableCustom([
            { text: "Eftpos Tip", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.eftposTip)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);

    if (order.displayPaymentRequiredMessage) {
        printer.newLine();
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.bold(true);
        printer.println(`Total: $${convertCentsToDollars(order.subTotal)}`);
        printer.bold(false);
        printer.setTextNormal();
        printer.alignLeft();
    }

    printer.newLine();
    printer.alignCenter();
    printer.setTypeFontB();
    printer.println("Order Placed on Tabin Kiosk (tabin.co.nz)");

    if (order.skipReceiptCutCommand) {
    } else {
        printer.partialCut();
    }

    try {
        if (order.printerType == ERegisterPrinterType.WIFI) {
            await printer.execute();
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

export const printKitchenReceiptSmall = async (
    order: IOrderReceipt,
    receiptIndex?: number,
    receiptTotalNumber?: number
): Promise<IPrintReceiptOutput> => {
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

    if (order.futureOrder) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Future Order");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    if (order.orderReminder) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Upcoming Order Reminder");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    if (order.displayPaymentRequiredMessage) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Payment Required");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    printer.alignCenter();
    printer.bold(true);
    printer.underlineThick(true);
    printer.println(order.restaurant.name);
    printer.underlineThick(false);
    printer.bold(false);
    printer.newLine();

    printer.println(`Placed: ${format(new Date(order.placedAt), "dd MMM HH:mm aa")}`);

    if (order.orderScheduledAt) {
        printer.setTextSize(1, 1);
        printer.bold(true);

        if (isToday(order.orderScheduledAt)) {
            printer.println(`Pickup: Today ${format(new Date(order.orderScheduledAt), "HH:mm aa")}`);
        } else {
            printer.println(`Pickup: ${format(new Date(order.orderScheduledAt), "dd MMM HH:mm aa")}`);
        }

        printer.bold(false);
        printer.setTextNormal();
    }

    if (order.customerInformation) {
        printer.println(
            `Customer: ${order.customerInformation.firstName} ${order.customerInformation.email} ${order.customerInformation.phoneNumber}`
        );

        if (order.customerInformation.signatureBase64) {
            const signatureImageRemoveTag = order.customerInformation.signatureBase64.split(",")[1];
            const signatureImage = Buffer.from(signatureImageRemoveTag, "base64");

            printer.newLine();
            await printer.printImageBuffer(signatureImage);
            printer.newLine();
        }
    }

    if (order.status === EOrderStatus.PARKED && order.notes) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Notes: ${order.notes}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (!order.hideOrderType) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`${order.type}${order.table ? ` (Table: ${order.table})` : ""}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (order.buzzer !== null) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Buzzer: ${order.buzzer}`);
        printer.setTextNormal();
        printer.bold(false);

        printer.newLine();
        printer.println(`Order: ${order.number}`);
    } else {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Order: ${order.number}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (receiptTotalNumber && receiptTotalNumber > 1) {
        printer.newLine();
        printer.alignCenter();
        printer.println(`Receipt ${receiptIndex} of ${receiptTotalNumber}`);
    }

    if (!order.hidePreparationTime && !order.orderScheduledAt && order.preparationTimeInMinutes) {
        printer.newLine();
        printer.bold(true);
        printer.println(`Ready in ${order.preparationTimeInMinutes} ${order.preparationTimeInMinutes > 1 ? "mins" : "min"}`);
        printer.bold(false);
    }

    if (order.customerInformation) {
        printer.newLine();
        printer.drawLine();
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        if (order.customerInformation.firstName) printer.println(order.customerInformation.firstName);
        if (order.customerInformation.email) printer.println(order.customerInformation.email);
        if (order.customerInformation.phoneNumber) printer.println(order.customerInformation.phoneNumber);
        printer.setTextNormal();
        printer.bold(false);

        if (order.customerInformation.signatureBase64) {
            const signatureImageRemoveTag = order.customerInformation.signatureBase64.split(",")[1];
            const signatureImage = Buffer.from(signatureImageRemoveTag, "base64");

            await printer.printImageBuffer(signatureImage);
            printer.newLine();
        }
    }

    printer.newLine();
    printer.alignLeft();

    order.products.forEach((product: ICartProduct) => {
        printer.drawLine();
        printer.bold(true);
        printer.println(`${product.quantity > 1 ? product.quantity + "x " : ""}${product.kitchenName || product.name}`);
        printer.bold(false);

        product.modifierGroups.forEach((modifierGroup: ICartModifierGroup) => {
            if (order.hideModifierGroupsForCustomer == true && modifierGroup.hideForCustomer == true) return;

            if (!order.hideModifierGroupName) {
                printer.newLine();
                printer.bold(true);
                printer.underlineThick(true);
                printer.println(`${modifierGroup.kitchenName || modifierGroup.name}`);
                printer.underlineThick(false);
                printer.bold(false);
            }

            modifierGroup.modifiers.forEach((modifier: ICartModifier, modifier_index: number) => {
                const changedQuantity = modifier.quantity - modifier.preSelectedQuantity;
                let mStr = "";

                if (changedQuantity < 0 && Math.abs(changedQuantity) == modifier.preSelectedQuantity) {
                    mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)}x ` : ""}${modifier.kitchenName || modifier.name}`;
                } else {
                    mStr = `${modifier.quantity > 1 ? `${Math.abs(modifier.quantity)}x ` : ""}${modifier.kitchenName || modifier.name}`;
                }

                printer.print(mStr);
                if (modifier_index === modifierGroup.modifiers.length - 1) {
                    printer.println("");
                } else {
                    printer.print(", ");
                }

                modifier.productModifiers &&
                    modifier.productModifiers.forEach((productModifier_product: ICartProduct, index) => {
                        printer.newLine();

                        if (modifier.productModifiers && modifier.productModifiers.length > 1) {
                            printer.print(`      `);
                            printer.underlineThick(true);
                            printer.setTypeFontB();
                            printer.print(`Selection ${index + 1}`);
                            printer.setTypeFontA();
                            printer.println(``);
                            printer.underlineThick(false);
                        }

                        if (productModifier_product.modifierGroups.length > 0) {
                            productModifier_product.modifierGroups.forEach((productModifier_modifierGroup, index2) => {
                                if (order.hideModifierGroupsForCustomer == true && productModifier_modifierGroup.hideForCustomer == true) return;

                                if (!order.hideModifierGroupName) {
                                    if (index2 !== 0) printer.newLine();

                                    printer.print(`      `);
                                    printer.bold(true);
                                    printer.underlineThick(true);
                                    printer.println(`${productModifier_modifierGroup.kitchenName || productModifier_modifierGroup.name}`);
                                    printer.underlineThick(false);
                                    printer.bold(false);
                                }

                                productModifier_modifierGroup.modifiers.forEach(
                                    (productModifier_modifier: ICartModifier, productModifier_modifier_index: number) => {
                                        const changedQuantity = productModifier_modifier.quantity - productModifier_modifier.preSelectedQuantity;
                                        let mStr = "";

                                        if (changedQuantity < 0 && Math.abs(changedQuantity) == productModifier_modifier.preSelectedQuantity) {
                                            mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)}x ` : ""}${
                                                productModifier_modifier.kitchenName || productModifier_modifier.name
                                            }`;
                                        } else {
                                            mStr = `${
                                                productModifier_modifier.quantity > 1 ? `${Math.abs(productModifier_modifier.quantity)}x ` : ""
                                            }${productModifier_modifier.kitchenName || productModifier_modifier.name}`;
                                        }

                                        if (productModifier_modifier_index === 0) {
                                            printer.print(`      `);
                                        }
                                        printer.print(`${mStr}`);
                                        if (productModifier_modifier_index === productModifier_modifierGroup.modifiers.length - 1) {
                                            printer.println("");
                                        } else {
                                            printer.print(", ");
                                        }
                                    }
                                );
                            });
                        } else {
                            printer.println(`      No extra selections made`);
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
        printer.println(`Notes: ${order.notes}`);
        printer.newLine();
    }

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
    order.surcharge &&
        printer.tableCustom([
            { text: "Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.surcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.orderTypeSurcharge &&
        printer.tableCustom([
            { text: "Order Type Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.orderTypeSurcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.eftposSurcharge &&
        printer.tableCustom([
            { text: "Card Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.eftposSurcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.eftposTip &&
        printer.tableCustom([
            { text: "Eftpos Tip", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.eftposTip)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);

    if (order.displayPaymentRequiredMessage) {
        printer.newLine();
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.bold(true);
        printer.println(`Total: $${convertCentsToDollars(order.subTotal)}`);
        printer.bold(false);
        printer.setTextNormal();
        printer.alignLeft();
    }

    if (order.displayPaymentRequiredMessage) {
        printer.newLine();
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.bold(true);
        printer.println(`Total: $${convertCentsToDollars(order.subTotal)}`);
        printer.bold(false);
        printer.setTextNormal();
        printer.alignLeft();
    }

    printer.newLine();
    printer.alignCenter();
    printer.setTypeFontB();
    printer.println("Order Placed on Tabin Kiosk (tabin.co.nz)");

    if (order.skipReceiptCutCommand) {
    } else {
        printer.partialCut();
    }

    try {
        if (order.printerType == ERegisterPrinterType.WIFI) {
            await printer.execute();
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

export const printKitchenReceiptLarge = async (
    order: IOrderReceipt,
    receiptIndex?: number,
    receiptTotalNumber?: number
): Promise<IPrintReceiptOutput> => {
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

    if (order.futureOrder) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Future Order");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    if (order.orderReminder) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Upcoming Order Reminder");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    if (order.displayPaymentRequiredMessage) {
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.invert(true);
        printer.bold(true);
        printer.println("Payment Required");
        printer.bold(false);
        printer.invert(false);
        printer.setTextNormal();
        printer.alignLeft();
        printer.newLine();
    }

    printer.alignCenter();
    printer.bold(true);
    printer.underlineThick(true);
    printer.println(order.restaurant.name);
    printer.underlineThick(false);
    printer.bold(false);
    printer.newLine();

    printer.println(`Placed: ${format(new Date(order.placedAt), "dd MMM HH:mm aa")}`);

    if (order.orderScheduledAt) {
        printer.setTextSize(1, 1);
        printer.bold(true);

        if (isToday(order.orderScheduledAt)) {
            printer.println(`Pickup: Today ${format(new Date(order.orderScheduledAt), "HH:mm aa")}`);
        } else {
            printer.println(`Pickup: ${format(new Date(order.orderScheduledAt), "dd MMM HH:mm aa")}`);
        }

        printer.bold(false);
        printer.setTextNormal();
    }

    if (order.customerInformation) {
        printer.println(
            `Customer: ${order.customerInformation.firstName} ${order.customerInformation.email} ${order.customerInformation.phoneNumber}`
        );

        if (order.customerInformation.signatureBase64) {
            const signatureImageRemoveTag = order.customerInformation.signatureBase64.split(",")[1];
            const signatureImage = Buffer.from(signatureImageRemoveTag, "base64");

            printer.newLine();
            await printer.printImageBuffer(signatureImage);
            printer.newLine();
        }
    }

    if (order.status === EOrderStatus.PARKED && order.notes) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Notes: ${order.notes}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (!order.hideOrderType) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`${order.type}${order.table ? ` (Table: ${order.table})` : ""}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (order.buzzer !== null) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Buzzer: ${order.buzzer}`);
        printer.setTextNormal();
        printer.bold(false);

        printer.newLine();
        printer.println(`Order: ${order.number}`);
    } else {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Order: ${order.number}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (receiptTotalNumber && receiptTotalNumber > 1) {
        printer.newLine();
        printer.alignCenter();
        printer.println(`Receipt ${receiptIndex} of ${receiptTotalNumber}`);
    }

    if (!order.hidePreparationTime && !order.orderScheduledAt && order.preparationTimeInMinutes) {
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`Ready in ${order.preparationTimeInMinutes} ${order.preparationTimeInMinutes > 1 ? "mins" : "min"}`);
        printer.setTextNormal();
        printer.bold(false);
    }

    if (order.customerInformation) {
        printer.newLine();
        printer.drawLine();
        printer.newLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        if (order.customerInformation.firstName) printer.println(order.customerInformation.firstName);
        if (order.customerInformation.email) printer.println(order.customerInformation.email);
        if (order.customerInformation.phoneNumber) printer.println(order.customerInformation.phoneNumber);
        printer.setTextNormal();
        printer.bold(false);

        if (order.customerInformation.signatureBase64) {
            const signatureImageRemoveTag = order.customerInformation.signatureBase64.split(",")[1];
            const signatureImage = Buffer.from(signatureImageRemoveTag, "base64");

            await printer.printImageBuffer(signatureImage);
            printer.newLine();
        }
    }

    printer.newLine();
    printer.alignLeft();

    order.products.forEach((product: ICartProduct) => {
        printer.drawLine();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`${product.quantity > 1 ? product.quantity + "x " : ""}${product.kitchenName || product.name}`);
        printer.setTextNormal();
        printer.bold(false);

        product.modifierGroups.forEach((modifierGroup: ICartModifierGroup) => {
            if (order.hideModifierGroupsForCustomer == true && modifierGroup.hideForCustomer == true) return;

            if (!order.hideModifierGroupName) {
                printer.newLine();
                printer.bold(true);
                printer.underlineThick(true);
                printer.println(`${modifierGroup.kitchenName || modifierGroup.name}`);
                printer.underlineThick(false);
                printer.bold(false);
            }

            modifierGroup.modifiers.forEach((modifier: ICartModifier, modifier_index: number) => {
                const changedQuantity = modifier.quantity - modifier.preSelectedQuantity;
                let mStr = "";

                if (changedQuantity < 0 && Math.abs(changedQuantity) == modifier.preSelectedQuantity) {
                    mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)}x ` : ""}${modifier.kitchenName || modifier.name}`;
                } else {
                    mStr = `${modifier.quantity > 1 ? `${Math.abs(modifier.quantity)}x ` : ""}${modifier.kitchenName || modifier.name}`;
                }

                printer.bold(true);
                printer.setTextSize(1, 1);
                printer.print(mStr);
                if (modifier_index === modifierGroup.modifiers.length - 1) {
                    printer.println("");
                } else {
                    printer.print(", ");
                }
                printer.setTextNormal();
                printer.bold(false);

                modifier.productModifiers &&
                    modifier.productModifiers.forEach((productModifier_product: ICartProduct, index) => {
                        printer.newLine();

                        if (modifier.productModifiers && modifier.productModifiers.length > 1) {
                            printer.print(`      `);
                            printer.underlineThick(true);
                            printer.setTypeFontB();
                            printer.print(`Selection ${index + 1}`);
                            printer.setTypeFontA();
                            printer.println(``);
                            printer.underlineThick(false);
                        }

                        if (productModifier_product.modifierGroups.length > 0) {
                            productModifier_product.modifierGroups.forEach((productModifier_modifierGroup, index2) => {
                                if (order.hideModifierGroupsForCustomer == true && productModifier_modifierGroup.hideForCustomer == true) return;

                                if (!order.hideModifierGroupName) {
                                    if (index2 !== 0) printer.newLine();

                                    printer.print(`      `);
                                    printer.bold(true);
                                    printer.underlineThick(true);
                                    printer.println(`${productModifier_modifierGroup.kitchenName || productModifier_modifierGroup.name}`);
                                    printer.underlineThick(false);
                                    printer.bold(false);
                                }

                                productModifier_modifierGroup.modifiers.forEach(
                                    (productModifier_modifier: ICartModifier, productModifier_modifier_index: number) => {
                                        const changedQuantity = productModifier_modifier.quantity - productModifier_modifier.preSelectedQuantity;
                                        let mStr = "";

                                        if (changedQuantity < 0 && Math.abs(changedQuantity) == productModifier_modifier.preSelectedQuantity) {
                                            mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)}x ` : ""}${
                                                productModifier_modifier.kitchenName || productModifier_modifier.name
                                            }`;
                                        } else {
                                            mStr = `${
                                                productModifier_modifier.quantity > 1 ? `${Math.abs(productModifier_modifier.quantity)}x ` : ""
                                            }${productModifier_modifier.kitchenName || productModifier_modifier.name}`;
                                        }

                                        printer.bold(true);
                                        printer.setTextSize(1, 1);
                                        if (productModifier_modifier_index === 0) {
                                            printer.print(`   `);
                                        }
                                        printer.print(`${mStr}`);
                                        if (productModifier_modifier_index === productModifier_modifierGroup.modifiers.length - 1) {
                                            printer.println("");
                                        } else {
                                            printer.print(", ");
                                        }
                                        printer.setTextNormal();
                                        printer.bold(false);
                                    }
                                );
                            });
                        } else {
                            printer.bold(true);
                            printer.setTextSize(1, 1);
                            printer.println(`   No extra selections made`);
                            printer.setTextNormal();
                            printer.bold(false);
                        }
                    });
            });
        });

        if (product.notes) {
            printer.bold(false);
            printer.newLine();
            printer.setTextSize(1, 1);
            printer.println(`Notes: ${product.notes}`);
            printer.setTextNormal();
        }
    });

    printer.drawLine();

    if (order.notes) {
        printer.setTextSize(1, 1);
        printer.println(`Notes: ${order.notes}`);
        printer.setTextNormal();
        printer.newLine();
    }

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
    order.surcharge &&
        printer.tableCustom([
            { text: "Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.surcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.orderTypeSurcharge &&
        printer.tableCustom([
            { text: "Order Type Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.orderTypeSurcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.eftposSurcharge &&
        printer.tableCustom([
            { text: "Card Surcharge", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.eftposSurcharge)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);
    order.eftposTip &&
        printer.tableCustom([
            { text: "Eftpos Tip", align: "LEFT", width: 0.75, bold: true },
            {
                text: `\$${convertCentsToDollars(order.eftposTip)}`,
                align: "RIGHT",
                width: 0.25,
                bold: true,
            },
        ]);

    if (order.displayPaymentRequiredMessage) {
        printer.newLine();
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.bold(true);
        printer.println(`Total: $${convertCentsToDollars(order.subTotal)}`);
        printer.bold(false);
        printer.setTextNormal();
        printer.alignLeft();
    }

    printer.newLine();
    printer.alignCenter();
    printer.setTypeFontB();
    printer.println("Order Placed on Tabin Kiosk (tabin.co.nz)");

    if (order.skipReceiptCutCommand) {
    } else {
        printer.partialCut();
    }

    try {
        if (order.printerType == ERegisterPrinterType.WIFI) {
            await printer.execute();
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

export const printEftposReceipt = async (receiptDataInput: IEftposReceipt) => {
    let printer;

    if (receiptDataInput.printer.printerType == ERegisterPrinterType.WIFI) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
            interface: `tcp://${receiptDataInput.printer.printerAddress}`,
        });
    } else if (receiptDataInput.printer.printerType == ERegisterPrinterType.USB) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
        });
    } else {
        //Bluetooth
    }

    printer.newLine();
    printer.alignCenter();

    if (receiptDataInput.eftposReceipt) {
        const eftposReceiptArray = receiptDataInput.eftposReceipt.split("\n");

        eftposReceiptArray.forEach((line) => {
            printer.println(line);
        });
    }

    printer.partialCut();

    try {
        if (receiptDataInput.printer.printerType == ERegisterPrinterType.WIFI) {
            await printer.execute();
        } else if (receiptDataInput.printer.printerType == ERegisterPrinterType.USB) {
            await usbPrinterExecute(receiptDataInput.printer.printerAddress, printer.getBuffer());
            printer.clear();
        } else {
            //Bluetooth
        }

        return { error: null };
    } catch (e) {
        return { error: e };
    }
};

const printSalesByDayReceipt = (printer: any, data: IPrintSalesDataInput) => {
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println("Sales Report");
    printer.setTextNormal();
    printer.bold(false);

    printer.alignLeft();

    printer.newLine();
    printer.println(`Date Range: ${format(new Date(data.startDate), "dd MMM yyyy")} - ${format(new Date(data.endDate), "dd MMM yyyy")}`);
    printer.newLine();
    printer.println(`Printed On: ${format(new Date(), "dd MMM yyyy HH:mm aa")}`);
    printer.newLine();

    Object.entries(data.dailySales).forEach(([date, data]) => {
        printer.bold(true);
        printer.underline(true);
        printer.println(date);
        printer.underline(false);
        printer.bold(false);

        printer.println(`Cash: $${convertCentsToDollars(data.totalPaymentAmounts.cash)}`);
        printer.println(`Eftpos: $${convertCentsToDollars(data.totalPaymentAmounts.eftpos)}`);
        printer.println(`Online: $${convertCentsToDollars(data.totalPaymentAmounts.online)}`);
        printer.println(`Uber Eats: $${convertCentsToDollars(data.totalPaymentAmounts.uberEats)}`);
        printer.println(`Menu Log: $${convertCentsToDollars(data.totalPaymentAmounts.menulog)}`);
        printer.println(`Doordash: $${convertCentsToDollars(data.totalPaymentAmounts.doordash)}`);
        printer.println(`Delivereasy: $${convertCentsToDollars(data.totalPaymentAmounts.delivereasy)}`);

        printer.bold(true);
        printer.println(`Total: $${convertCentsToDollars(data.totalAmount)}`);
        printer.println(`Number of Orders: ${data.totalQuantity}`);

        printer.bold(false);
        printer.newLine();
    });

    return printer;
};

const printSalesByCategoryReceipt = (printer: any, data: IPrintSalesDataInput) => {
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println("Category Report");
    printer.setTextNormal();
    printer.bold(false);

    printer.alignLeft();

    printer.newLine();
    printer.println(`Date Range: ${format(new Date(data.startDate), "dd MMM yyyy")} - ${format(new Date(data.endDate), "dd MMM yyyy")}`);
    printer.newLine();
    printer.println(`Printed On: ${format(new Date(), "dd MMM yyyy HH:mm aa")}`);
    printer.newLine();

    Object.values(data.mostSoldCategories)
        .sort((a, b) => a.item.name.localeCompare(b.item.name))
        .forEach((record) => {
            printer.tableCustom([
                {
                    text: record.item.name,
                    width: 0.5,
                },
                {
                    text: record.totalQuantity,
                    align: "RIGHT",
                    width: 0.25,
                },
                {
                    text: `\$${convertCentsToDollars(record.totalAmount)}`,
                    align: "RIGHT",
                    width: 0.25,
                },
            ]);
        });

    return printer;
};

const printSalesByProductReceipt = (printer: any, data: IPrintSalesDataInput) => {
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println("Product Report");
    printer.setTextNormal();
    printer.bold(false);

    printer.alignLeft();

    printer.newLine();
    printer.println(`Date Range: ${format(new Date(data.startDate), "dd MMM yyyy")} - ${format(new Date(data.endDate), "dd MMM yyyy")}`);
    printer.newLine();
    printer.println(`Printed On: ${format(new Date(), "dd MMM yyyy HH:mm aa")}`);
    printer.newLine();

    Object.values(data.mostSoldProducts)
        .sort((a, b) => a.item.name.localeCompare(b.item.name))
        .forEach((record) => {
            printer.tableCustom([
                {
                    text: record.item.name,
                    width: 0.5,
                },
                {
                    text: record.totalQuantity,
                    align: "RIGHT",
                    width: 0.25,
                },
                {
                    text: `\$${convertCentsToDollars(record.totalAmount)}`,
                    align: "RIGHT",
                    width: 0.25,
                },
            ]);
        });

    return printer;
};

export const printSalesDataReceipt = async (printSalesDataInput: IPrintSalesDataInput): Promise<IPrintReceiptOutput> => {
    let printer;

    if (printSalesDataInput.printer.printerType == ERegisterPrinterType.WIFI) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
            interface: `tcp://${printSalesDataInput.printer.printerAddress}`,
        });
    } else if (printSalesDataInput.printer.printerType == ERegisterPrinterType.USB) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
        });
    } else {
        //Bluetooth
    }

    switch (printSalesDataInput.type) {
        case "DAY":
            printer = printSalesByDayReceipt(printer, printSalesDataInput);
            break;
        case "CATEGORY":
            printer = printSalesByCategoryReceipt(printer, printSalesDataInput);
            break;
        case "PRODUCT":
            printer = printSalesByProductReceipt(printer, printSalesDataInput);
            break;
        default:
            break;
    }

    printer.partialCut();

    try {
        if (printSalesDataInput.printer.printerType == ERegisterPrinterType.WIFI) {
            await printer.execute();
        } else if (printSalesDataInput.printer.printerType == ERegisterPrinterType.USB) {
            await usbPrinterExecute(printSalesDataInput.printer.printerAddress, printer.getBuffer());
            printer.clear();
        } else {
            //Bluetooth
        }

        return { error: null };
    } catch (e) {
        return { error: e };
    }
};

export const printNoSaleDataReceipt = async (printSalesDataInput: IPrintNoSaleReceiptDataInput): Promise<IPrintNoSaleOutput> => {
    let printer;

    if (printSalesDataInput.printer.printerType == ERegisterPrinterType.WIFI) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
            interface: `tcp://${printSalesDataInput.printer.printerAddress}`,
        });
    } else if (printSalesDataInput.printer.printerType == ERegisterPrinterType.USB) {
        //@ts-ignore
        printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // 'star' or 'epson'
        });
    } else {
        //Bluetooth
    }

    printer.openCashDrawer();

    try {
        if (printSalesDataInput.printer.printerType == ERegisterPrinterType.WIFI) {
            await printer.execute();
        } else if (printSalesDataInput.printer.printerType == ERegisterPrinterType.USB) {
            await usbPrinterExecute(printSalesDataInput.printer.printerAddress, printer.getBuffer());
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
