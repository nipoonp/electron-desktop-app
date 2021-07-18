import { useState } from "react";

import { Input } from "../../../tabin/components/input";
import { useReceiptPrinter } from "../../../context/receiptPrinter-context";
import { EOrderType, EReceiptPrinterType, ICartProduct } from "../../../model/model";
import { useRegister } from "../../../context/register-context";
import { Button } from "../../../tabin/components/button";
import { Select } from "../../../tabin/components/select";

const TEST_PRODUCT: ICartProduct[] = [
    {
        id: "",
        name: "Samosa",
        price: 1,
        image: null,
        quantity: 2,
        category: {
            id: "",
            name: "Test Category",
            image: null,
        },
        modifierGroups: [
            {
                id: "",
                name: "Choice of Sauce 1",
                choiceDuplicate: 1,
                choiceMin: 0,
                choiceMax: 1,
                hideForCustomer: true,
                modifiers: [
                    {
                        id: "",
                        name: "Sauce",
                        price: 50,
                        preSelectedQuantity: 0,
                        quantity: 1,
                        image: null,
                    },
                ],
            },
            {
                id: "",
                name: "Choice of Sauce 2",
                choiceDuplicate: 1,
                choiceMin: 0,
                choiceMax: 1,
                modifiers: [
                    {
                        id: "",
                        name: "Sauce",
                        price: 50,
                        preSelectedQuantity: 0,
                        quantity: 2,
                        image: null,
                    },
                ],
            },
            {
                id: "",
                name: "Choice of Sauce 3",
                choiceDuplicate: 1,
                choiceMin: 0,
                choiceMax: 1,
                modifiers: [
                    {
                        id: "",
                        name: "Sauce",
                        price: 50,
                        preSelectedQuantity: 1,
                        quantity: 1,
                        image: null,
                    },
                ],
            },
            {
                id: "",
                name: "Choice of Sauce 4",
                choiceDuplicate: 1,
                choiceMin: 0,
                choiceMax: 1,
                modifiers: [
                    {
                        id: "",
                        name: "Sauce",
                        price: 50,
                        preSelectedQuantity: 1,
                        quantity: 0,
                        image: null,
                    },
                ],
            },
            {
                id: "",
                name: "Choice of Sauce 5",
                choiceDuplicate: 1,
                choiceMin: 0,
                choiceMax: 1,
                modifiers: [
                    {
                        id: "",
                        name: "Sauce",
                        price: 50,
                        preSelectedQuantity: 2,
                        quantity: 1,
                        image: null,
                    },
                ],
            },
        ],
        notes: "Product notes",
    },
];

export const ReceiptPrinter = () => {
    const { register } = useRegister();
    const [printerType, setPrinterType] = useState(EReceiptPrinterType.USB);
    const [printerAddress1, setPrinterAddress1] = useState(register?.printers?.items[0]?.address || "192.168.1.200");
    const [printerAddress2, setPrinterAddress2] = useState(register?.printers?.items[1]?.address || "192.168.1.201");
    const [printerAddress3, setPrinterAddress3] = useState(register?.printers?.items[2]?.address || "192.168.1.202");

    const { printReceipt } = useReceiptPrinter();

    const onPrintTestReceipt = async () => {
        if (printerAddress1) {
            printReceipt({
                printerType: printerType,
                printerAddress: printerAddress1,
                hideModifierGroupsForCustomer: true,
                eftposReceipt: "",
                restaurant: {
                    name: "Test Tabin Restaurant",
                    address: "Receipt Printer 1",
                    gstNumber: "123-456-789",
                },
                notes: "Order notes",
                products: TEST_PRODUCT,
                total: 100,
                paid: true,
                type: EOrderType.TAKEAWAY,
                number: "18",
                table: "8",
            });
        }

        if (printerAddress2) {
            printReceipt({
                printerType: printerType,
                printerAddress: printerAddress2,
                restaurant: {
                    name: "Test Tabin Restaurant",
                    address: "Receipt Printer 2",
                    gstNumber: "123-456-789",
                },
                notes: "Order notes",
                products: TEST_PRODUCT,
                total: 100,
                paid: false,
                type: EOrderType.TAKEAWAY,
                number: "18",
                table: "8",
            });
        }

        if (printerAddress3) {
            printReceipt({
                printerType: printerType,
                printerAddress: printerAddress3,
                restaurant: {
                    name: "Test Tabin Restaurant",
                    address: "Receipt Printer 3",
                    gstNumber: "123-456-789",
                },
                notes: "Order notes",
                products: TEST_PRODUCT,
                total: 100,
                paid: true,
                type: EOrderType.TAKEAWAY,
                number: "18",
                table: "8",
            });
        }
    };

    const handleSelectType = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPrinterType(EReceiptPrinterType[event.target.value]);
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
                    <option value="" label="Select the type of this printer" />
                    <option key="BLUETOOTH" value="BLUETOOTH" label="Bluetooth" />
                    <option key="WIFI" value="WIFI" label="WIFI" />
                    <option key="USB" value="USB" label="USB" />
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
