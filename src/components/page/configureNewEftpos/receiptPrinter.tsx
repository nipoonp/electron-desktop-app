import React, { useState } from "react";
import { ButtonV2 } from "../../../tabin/components/buttonv2";
import { Title3Font } from "../../../tabin/components/fonts";
import { Space4, Space2 } from "../../../tabin/components/spaces";
import { InputV2 } from "../../../tabin/components/inputv2";
import { useReceiptPrinter } from "../../../context/receiptPrinter-context";
import { EOrderType, ICartProduct } from "../../../model/model";
import { useRegister } from "../../../context/register-context";

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
        hideForCustomer: true,
        modifiers: [
          {
            id: "",
            name: "Sauce",
            price: 50,
            preSelectedQuantity: 0,
            quantity: 1,
          },
        ],
      },
      {
        id: "",
        name: "Choice of Sauce 2",
        modifiers: [
          {
            id: "",
            name: "Sauce",
            price: 50,
            preSelectedQuantity: 0,
            quantity: 2,
          },
        ],
      },
      {
        id: "",
        name: "Choice of Sauce 3",
        modifiers: [
          {
            id: "",
            name: "Sauce",
            price: 50,
            preSelectedQuantity: 1,
            quantity: 1,
          },
        ],
      },
      {
        id: "",
        name: "Choice of Sauce 4",
        modifiers: [
          {
            id: "",
            name: "Sauce",
            price: 50,
            preSelectedQuantity: 1,
            quantity: 0,
          },
        ],
      },
      {
        id: "",
        name: "Choice of Sauce 5",
        modifiers: [
          {
            id: "",
            name: "Sauce",
            price: 50,
            preSelectedQuantity: 2,
            quantity: 1,
          },
        ],
      },
    ],
    notes: "Product notes",
  },
];

export const ReceiptPrinter = () => {
  const { register } = useRegister();
  const [printerAddress1, setPrinterAddress1] = useState(
    register?.printers?.items[0]?.address || "192.168.1.87"
  );
  const [printerAddress2, setPrinterAddress2] = useState(
    register?.printers?.items[1]?.address || "192.168.1.90"
  );
  const [printerAddress3, setPrinterAddress3] = useState(
    register?.printers?.items[2]?.address || "192.168.1.90"
  );

  const { printReceipt1, printReceipt2, printReceipt3 } = useReceiptPrinter();

  const onPrintTestReceipt = async () => {
    if (printerAddress1) {
      printReceipt1({
        printerAddress: printerAddress1,
        hideModifierGroupsForCustomer: true,
        eftposReceipt: "",
        restaurant: {
          name: "Test Tabin Restaurant",
          address: "Receipt Printer 1",
        },
        notes: "Order notes",
        products: TEST_PRODUCT,
        total: 100,
        type: EOrderType.TAKEAWAY,
        number: "18",
        table: "8",
      });
    }

    if (printerAddress2) {
      printReceipt2({
        printerAddress: printerAddress2,
        restaurant: {
          name: "Test Tabin Restaurant",
          address: "Receipt Printer 2",
        },
        notes: "Order notes",
        products: TEST_PRODUCT,
        total: 100,
        type: EOrderType.TAKEAWAY,
        number: "18",
        table: "8",
      });
    }

    if (printerAddress3) {
      printReceipt3({
        printerAddress: printerAddress3,
        restaurant: {
          name: "Test Tabin Restaurant",
          address: "Receipt Printer 3",
        },
        notes: "Order notes",
        products: TEST_PRODUCT,
        total: 100,
        type: EOrderType.TAKEAWAY,
        number: "18",
        table: "8",
      });
    }
  };

  return (
    <>
      <div>
        <Title3Font>Configure your Receipt Printer(s)</Title3Font>
        <Space4 />
        <label>Bluetooth Printer Address 1:</label>
        <Space2 />
        <InputV2
          type="text"
          name="printerMacAddress"
          value={printerAddress1}
          placeholder="00:04:61:02:AA:FF"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setPrinterAddress1(event.target.value)
          }
        />
        <Space4 />
        <Title3Font>Configure your Receipt Printer(s)</Title3Font>
        <Space4 />
        <label>Bluetooth Printer Address 2:</label>
        <Space2 />
        <InputV2
          type="text"
          name="printerMacAddress"
          value={printerAddress2}
          placeholder="00:04:61:02:AA:FF"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setPrinterAddress2(event.target.value)
          }
        />
        <Space4 />
        <Title3Font>Configure your Receipt Printer(s)</Title3Font>
        <Space4 />
        <label>Bluetooth Printer Address 3:</label>
        <Space2 />
        <InputV2
          type="text"
          name="printerMacAddress"
          value={printerAddress3}
          placeholder="00:04:61:02:AA:FF"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setPrinterAddress3(event.target.value)
          }
        />
        <Space4 />
        <ButtonV2 onClick={onPrintTestReceipt}>Print Test Receipt(s)</ButtonV2>
      </div>
    </>
  );
};
