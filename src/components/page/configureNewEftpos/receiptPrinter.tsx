import { useState } from "react";

import { Input } from "../../../tabin/components/input";
import { useReceiptPrinter } from "../../../context/receiptPrinter-context";
import { EOrderType, ERegisterPrinterType, ICartProduct } from "../../../model/model";
import { useRegister } from "../../../context/register-context";
import { Button } from "../../../tabin/components/button";
import { Select } from "../../../tabin/components/select";
import { EOrderStatus } from "../../../graphql/customQueries";

const TEST_PRODUCT: ICartProduct[] = [
  {
    id: "",
    name: "Samosa",
    kitchenName: "Samosa",
    price: 1,
    totalPrice: 0,
    discount: 0,
    image: null,
    quantity: 2,
    availablePlatforms: [],
    isAgeRescricted: false,
    category: {
      id: "",
      name: "Test Category",
      kitchenName: "aaa",
      image: null,
    },
    modifierGroups: [
      // {
      //     id: "",
      //     name: "Choice of Sauce 1",
      //     choiceDuplicate: 1,
      //     choiceMin: 0,
      //     choiceMax: 1,
      //     hideForCustomer: true,
      //     modifiers: [
      //         {
      //             id: "",
      //             name: "Sauce",
      //             price: 50,
      //             preSelectedQuantity: 0,
      //             quantity: 1,
      //             image: null,
      //             productModifiers: [
      //                 {
      //                     id: "",
      //                     name: "Samosa",
      //                     price: 1,
      //                     totalPrice: 0,
      //                     discount: 0,
      //                     image: null,
      //                     quantity: 2,
      //                     category: {
      //                         id: "",
      //                         name: "Test Category",
      //                         image: null,
      //                     },
      //                     modifierGroups: [
      //                         {
      //                             id: "",
      //                             name: "Choice of Sauce 1",
      //                             choiceDuplicate: 1,
      //                             choiceMin: 0,
      //                             choiceMax: 1,
      //                             hideForCustomer: true,
      //                             modifiers: [
      //                                 {
      //                                     id: "",
      //                                     name: "Sauce",
      //                                     price: 50,
      //                                     preSelectedQuantity: 0,
      //                                     quantity: 1,
      //                                     image: null,
      //                                     productModifiers: null,
      //                                 },
      //                             ],
      //                         },
      //                         {
      //                             id: "",
      //                             name: "Choice of Sauce 1",
      //                             choiceDuplicate: 1,
      //                             choiceMin: 0,
      //                             choiceMax: 1,
      //                             hideForCustomer: true,
      //                             modifiers: [
      //                                 {
      //                                     id: "",
      //                                     name: "Sauce",
      //                                     price: 50,
      //                                     preSelectedQuantity: 0,
      //                                     quantity: 1,
      //                                     image: null,
      //                                     productModifiers: null,
      //                                 },
      //                             ],
      //                         },
      //                     ],
      //                     notes: "Product notes",
      //                 },
      //             ],
      //         },
      //     ],
      // },
      {
        id: "",
        name: "Choice of Sauce 2",
        kitchenName: "Choice of Sauce 2",
        choiceDuplicate: 1,
        choiceMin: 0,
        choiceMax: 1,
        hideForCustomer: false,
        modifiers: [
          {
            id: "",
            name: "Sauce",
            kitchenName: "bbb",
            price: 50,
            preSelectedQuantity: 0,
            quantity: 2,
            image: null,
            productModifiers: null,
          },
        ],
      },
      // {
      //     id: "",
      //     name: "Choice of Sauce 3",
      //     choiceDuplicate: 1,
      //     choiceMin: 0,
      //     choiceMax: 1,
      //     hideForCustomer: false,
      //     modifiers: [
      //         {
      //             id: "",
      //             name: "Sauce",
      //             price: 50,
      //             preSelectedQuantity: 1,
      //             quantity: 1,
      //             image: null,
      //             productModifiers: null,
      //         },
      //     ],
      // },
      // {
      //     id: "",
      //     name: "Choice of Sauce 4",
      //     choiceDuplicate: 1,
      //     choiceMin: 0,
      //     choiceMax: 1,
      //     hideForCustomer: false,
      //     modifiers: [
      //         {
      //             id: "",
      //             name: "Sauce",
      //             price: 50,
      //             preSelectedQuantity: 1,
      //             quantity: 0,
      //             image: null,
      //             productModifiers: null,
      //         },
      //     ],
      // },
      // {
      //     id: "",
      //     name: "Choice of Sauce 5",
      //     choiceDuplicate: 1,
      //     choiceMin: 0,
      //     choiceMax: 1,
      //     hideForCustomer: false,
      //     modifiers: [
      //         {
      //             id: "",
      //             name: "Sauce",
      //             price: 50,
      //             preSelectedQuantity: 2,
      //             quantity: 1,
      //             image: null,
      //             productModifiers: null,
      //         },
      //     ],
      // },
    ],
    notes: "Product notes",
  },
];

export const ReceiptPrinter = () => {
    const { register } = useRegister();
    const [printerType, setPrinterType] = useState(ERegisterPrinterType.WIFI);
    const [printerAddress1, setPrinterAddress1] = useState(register?.printers?.items[0]?.address || "192.168.1.211");
    const [printerAddress2, setPrinterAddress2] = useState(register?.printers?.items[1]?.address || "192.168.1.212");
    const [printerAddress3, setPrinterAddress3] = useState(register?.printers?.items[2]?.address || "192.168.1.213");

    const { printReceipt, printLabel } = useReceiptPrinter();

    const onPrintTestReceipt = async () => {
        if (printerAddress1) {
            await printReceipt({
                orderId: "123",
                status: EOrderStatus.NEW,
                printerType: printerType,
                printerAddress: printerAddress1,
                receiptFooterText: "",
                customerPrinter: false,
                kitchenPrinter: true,
                kitchenPrinterSmall: false,
                kitchenPrinterLarge: false,
                hidePreparationTime: false,
                hideModifierGroupName: false,
                printReceiptForEachProduct: false,
                hideOrderType: false,
                hideModifierGroupsForCustomer: false,
                eftposReceipt: "",
                restaurant: {
                    name: "Test Tabin Restaurant",
                    address: "Receipt Printer 1 Restaurant Address",
                    gstNumber: "123-456-789",
                },
                restaurantLogoBase64: "",
                customerInformation: {
                    firstName: "Test Tabin",
                    phoneNumber: "123-456-789",
                    email: "test@test.com",
                    signatureBase64: "",
                },
                notes: "Order notes",
                products: TEST_PRODUCT,
                paymentAmounts: null,
                total: 100,
                discount: 10,
                subTotal: 90,
                paid: false,
                displayPaymentRequiredMessage: true,
                type: EOrderType.TAKEAWAY,
                number: "Web",
                table: "8",
                buzzer: "10",
                placedAt: new Date().toISOString(),
                orderScheduledAt: new Date().toISOString(),
                preparationTimeInMinutes: 20,
            });
        }

        if (printerAddress2) {
            await printReceipt({
                orderId: "456",
                status: EOrderStatus.NEW,
                printerType: printerType,
                printerAddress: printerAddress2,
                receiptFooterText: "receiptFooterText",
                customerPrinter: true,
                kitchenPrinter: false,
                kitchenPrinterSmall: false,
                kitchenPrinterLarge: false,
                hidePreparationTime: false,
                hideModifierGroupName: false,
                printReceiptForEachProduct: false,
                hideOrderType: false,
                hideModifierGroupsForCustomer: false,
                eftposReceipt: "",
                restaurantLogoBase64: "",
                restaurant: {
                    name: "Test Tabin Restaurant",
                    address: "Receipt Printer 2",
                    gstNumber: "123-456-789",
                },
                customerInformation: null,
                notes: "Order notes",
                products: TEST_PRODUCT,
                paymentAmounts: null,
                total: 100,
                discount: 10,
                subTotal: 90,
                paid: false,
                displayPaymentRequiredMessage: true,
                type: EOrderType.TAKEAWAY,
                number: "18",
                table: "8",
                buzzer: "10",
                placedAt: new Date().toISOString(),
                orderScheduledAt: new Date().toISOString(),
                preparationTimeInMinutes: null,
            });
        }

        if (printerAddress3) {
            await printReceipt({
                orderId: "789",
                status: EOrderStatus.NEW,
                printerType: printerType,
                printerAddress: printerAddress3,
                customerPrinter: false,
                receiptFooterText: "",
                kitchenPrinter: true,
                kitchenPrinterSmall: false,
                kitchenPrinterLarge: false,
                hidePreparationTime: false,
                hideModifierGroupName: false,
                printReceiptForEachProduct: false,
                hideOrderType: false,
                hideModifierGroupsForCustomer: false,
                eftposReceipt: "",
                restaurantLogoBase64: "",
                restaurant: {
                    name: "Test Tabin Restaurant",
                    address: "Receipt Printer 3",
                    gstNumber: "123-456-789",
                },
                customerInformation: null,
                notes: "Order notes",
                products: TEST_PRODUCT,
                paymentAmounts: null,
                total: 100,
                discount: 10,
                subTotal: 90,
                paid: true,
                displayPaymentRequiredMessage: false,
                type: EOrderType.TAKEAWAY,
                number: "18",
                table: "8",
                buzzer: "10",
                placedAt: new Date().toISOString(),
                orderScheduledAt: null,
                preparationTimeInMinutes: null,
            });
        }
    };

    const handleSelectType = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPrinterType(ERegisterPrinterType[event.target.value]);
    };

    return (
        <>
            <div>
                <div className="h2 mb-4">Configure your Receipt Printer(s)</div>
                <Select
                    className="mb-4"
                    label="Printer Type"
                    // value={productOption}
                    name="type"
                    value={printerType}
                    onChange={handleSelectType}
                >
                    <option value="" label="Select the type of this printer"></option>
                    <option key="BLUETOOTH" value="BLUETOOTH" label="Bluetooth">
                        BLUETOOTH
                    </option>
                    <option key="WIFI" value="WIFI" label="WIFI">
                        WIFI
                    </option>
                    <option key="USB" value="USB" label="USB">
                        USB
                    </option>
                </Select>

                <Input
                    className="mb-4"
                    label="Bluetooth Printer Address 1:"
                    type="text"
                    name="printerMacAddress"
                    value={printerAddress1}
                    placeholder="00:04:61:02:AA:FF"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPrinterAddress1(event.target.value)}
                />

                <Input
                    className="mb-4"
                    label="Bluetooth Printer Address 2:"
                    type="text"
                    name="printerMacAddress"
                    value={printerAddress2}
                    placeholder="00:04:61:02:AA:FF"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPrinterAddress2(event.target.value)}
                />

                <Input
                    className="mb-4"
                    label="Bluetooth Printer Address 3:"
                    type="text"
                    name="printerMacAddress"
                    value={printerAddress3}
                    placeholder="00:04:61:02:AA:FF"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPrinterAddress3(event.target.value)}
                />

                <Button onClick={onPrintTestReceipt}>Print Test Receipt(s)</Button>
            </div>
        </>
    );
};
