import React, { useState, useEffect } from "react";
import { Logger } from "aws-amplify";
import { useCart } from "../../context/cart-context";
import { useHistory } from "react-router-dom";
import {
  Space,
  Space2,
  Space3,
  Space4,
  Space1,
  Space6,
} from "../../tabin/components/spaces";
import {
  Title3Font,
  NormalFont,
  Title2Font,
  BoldFont,
  Title1Font,
  Title4Font,
} from "../../tabin/components/fonts";
import { Link } from "../../tabin/components/link";
import { GrayColor, PrimaryColor } from "../../tabin/components/colors";
import { convertCentsToDollars } from "../../util/moneyConversion";
import { useMutation } from "react-apollo-hooks";
import { PROCESS_ORDER } from "../../graphql/customMutations";
import { IGET_DASHBOARD_REGISTER_PRINTER, IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT } from "../../graphql/customQueries";
import {
  restaurantPath,
  beginOrderPath,
  tableNumberPath,
  orderTypePath,
} from "../main";
import { ShoppingBasketIcon } from "../../tabin/components/shoppingBasketIcon";
import { ProductModal } from "../modals/product";
import {
  ICartProduct,
  ISelectedProductModifiers,
  ICartModifierGroup,
  EOrderType,
} from "../../model/model";
import { Separator6 } from "../../tabin/components/separator";
import { useUser } from "../../context/user-context";
import { ModalV2 } from "../../tabin/components/modalv2";
import { format } from "date-fns";
import { KeyboardTextArea } from "../../tabin/components/keyboardTextArea";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import {
  useSmartpay,
  SmartpayTransactionOutcome,
} from "../../context/smartpay-context";
import { KioskModal } from "../../tabin/components/kioskModal";
import { KioskButton } from "../../tabin/components/kioskButton";
import { ItemAddedUpdatedModal } from "../modals/itemAddedUpdatedModal";
import { SizedBox } from "../../tabin/components/sizedBox";
import { OrderType } from "./orderType";
import { KioskStepper } from "../../tabin/components/kioskStepper";
import {
  useVerifone,
  VerifoneTransactionOutcome,
} from "../../context/verifone-context";
import { useRegister } from "../../context/register-context";
import { useReceiptPrinter } from "../../context/receiptPrinter-context";

const styles = require("./checkout.module.css");

const logger = new Logger("checkout");

enum CheckoutTransactionOutcome {
  Success,
  Delay,
  Fail,
}

// Component
export const Checkout = () => {
  // context
  const history = useHistory();
  const {
    restaurant,
    orderType,
    products,
    notes,
    setNotes,
    tableNumber,
    clearCart,
    total,
    updateItem,
    updateItemQuantity,
    deleteItem,
  } = useCart();
  const { printReceipt1, printReceipt2, printReceipt3 } = useReceiptPrinter();
  const { user } = useUser();
  const {
    createTransaction: smartpayCreateTransaction,
    pollForOutcome: smartpayPollForOutcome,
  } = useSmartpay();
  const { createTransaction: verifoneCreateTransaction } = useVerifone();

  const processOrderMutation = useMutation(PROCESS_ORDER, {
    update: (proxy, mutationResult) => {
      logger.debug("mutation result: ", mutationResult);
    },
  });

  // state
  const [productToEdit, setProductToEdit] = useState<{
    product: ICartProduct;
    displayOrder: number;
  } | null>(null);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showItemUpdatedModal, setShowItemUpdatedModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [
    paymentOutcome,
    setPaymentOutcome,
  ] = useState<CheckoutTransactionOutcome | null>(null);
  const [paymentOutcomeErrorMessage, setPaymentOutcomeErrorMessage] = useState<
    string | null
  >(null);
  const [
    paymentOutcomeDelayedOrderNumber,
    setPaymentOutcomeDelayedOrderNumber,
  ] = useState<string | null>(null);
  const [
    paymentOutcomeApprovedRedirectTimeLeft,
    setPaymentOutcomeApprovedRedirectTimeLeft,
  ] = useState(10);
  const [processOrderError, setProcessOrderError] = useState<string | null>(
    null
  );
  const { register } = useRegister();

  if (!register) {
    throw "Register is not valid";
  }

  useEffect(() => {
    if (showEditProductModal || showPaymentModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [showEditProductModal, showPaymentModal]);

  if (!restaurant) {
    history.push(beginOrderPath);
  }

  if (!restaurant) {
    throw "Restaurant is invalid";
  }

  const onCancelOrder = () => {
    clearCart();
    history.push(beginOrderPath);
  };

  // callbacks
  const onAddItem = () => {
    if (!restaurant) {
      throw "Cart restaurant is null!";
    }

    logger.debug("Routing to ", restaurantPath + "/" + restaurant.id);
    history.push(restaurantPath + "/" + restaurant.id);
  };

  const onUpdateTableNumber = () => {
    history.push(tableNumberPath);
  };

  const onUpdateOrderType = () => {
    history.push(orderTypePath);
  };

  const onCloseEditProductModal = () => {
    setProductToEdit(null);
    setShowEditProductModal(false);
  };

  const onCloseItemUpdatedModal = () => {
    setShowItemUpdatedModal(false);
  };

  const onEditProduct = (product: ICartProduct, displayOrder: number) => {
    setProductToEdit({ product, displayOrder });
    setShowEditProductModal(true);
  };

  const onUpdateProductQuantity = (
    displayOrder: number,
    productQuantity: number
  ) => {
    updateItemQuantity(displayOrder, productQuantity);
  };

  const onRemoveProduct = (displayOrder: number) => {
    deleteItem(displayOrder);
  };

  const onClickOrderButton = async () => {
    setShowPaymentModal(true);

    await onConfirmTotalOrRetryTransaction();
  };

  const onClosePaymentModal = () => {
    setPaymentOutcome(null);
    setPaymentOutcomeErrorMessage(null);
    setPaymentOutcomeDelayedOrderNumber(null);
    setPaymentOutcomeApprovedRedirectTimeLeft(10);

    setShowPaymentModal(false);
  };

  const onNotesChange = (value: string) => {
    setNotes(value);
  };

  // submit callback
  const processOrder = async (orderNumber: string) => {
    if (!user) {
      throw "Invalid user";
    }

    if (!orderType) {
      throw "Invalid order type";
    }

    if (!restaurant) {
      throw "Invalid restaurant";
    }

    if (!products || products.length == 0) {
      throw "No products have been selected";
    }

    try {
      const variables = {
        orderRestaurantId: restaurant.id,
        orderUserId: user.id,
        notes: notes,
        products: JSON.parse(JSON.stringify(products)) as ICartProduct[], // copy obj so we can mutate it later
        type: orderType,
        number: orderNumber,
        table: tableNumber,
        total: total,
        paid: true,
        registerId: register.id,
      };

      if (tableNumber == null || tableNumber == "") {
        delete variables.table;
      }

      variables.products.forEach((product) => {
        if (product.modifierGroups.length == 0) {
          delete product.modifierGroups;
        }

        if (product.image == null) {
          delete product.image;
        }

        if (product.category.image == null) {
          delete product.category.image;
        }
      })

      // process order
      const res = await processOrderMutation({
        variables: variables,
      });

      logger.debug("process order mutation result: ", res);
    } catch (e) {
      throw e;
    }
  };

  const title = (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img
          style={{ height: "72px" }}
          src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/images/shopping-bag-icon.jpg"
        />
        <SizedBox width="12px" />
        <Title1Font>Your Order</Title1Font>
      </div>
    </>
  );

  const orderSummary = (
    <OrderSummary
      onAddItem={onAddItem}
      onNotesChange={onNotesChange}
      onEditProduct={onEditProduct}
      onUpdateProductQuantity={onUpdateProductQuantity}
      onRemoveProduct={onRemoveProduct}
    />
  );

  const getOrderNumber = () => {
    let todayDate = format(new Date(), "dd/MM/yyyy");

    let orderNumberStored: string | null = localStorage.getItem("orderNumber");
    let orderNumberDateStored: string | null = localStorage.getItem(
      "orderNumberDate"
    );

    let orderNumber;

    if (todayDate == orderNumberDateStored) {
      orderNumber = String(Number(orderNumberStored) + 1);

      localStorage.setItem("orderNumber", orderNumber);
    } else {
      orderNumber = String(1);
      localStorage.setItem("orderNumber", orderNumber);
      localStorage.setItem("orderNumberDate", todayDate);
    }

    return orderNumber + (register.orderNumberSuffix || "");
  };

  const beginPaymentOutcomeApprovedTimeout = () => {
    (function myLoop(i) {
      setTimeout(() => {
        i--;
        setPaymentOutcomeApprovedRedirectTimeLeft(i);

        if (i == 0) {
          history.push(beginOrderPath);
          clearCart();
        }

        if (i > 0) myLoop(i); //  decrement i and call myLoop again if i > 0
      }, 1000);
    })(10);
  };

  const filterPrintProducts = (products: ICartProduct[], printer: IGET_DASHBOARD_REGISTER_PRINTER) => {
    if (!printer.ignoreProducts || printer.ignoreProducts.items.length == 0) {
      return products;
    }

    printer.ignoreProducts.items.forEach(ignoreProduct => {
      products.forEach(product => {
        if (ignoreProduct.product.id == product.id) {
          products = products.filter(p => p.id != product.id);
        }
      })
    })

    return products;
  }

  const printReceipts = (orderNumber: string, eftposReceipt?: string) => {
    if (!products || products.length == 0) {
      return;
    }

    if (register.printers && register.printers.items[0] && register.printers.items[0].address) {
      const productsToPrint1 = filterPrintProducts(products, register.printers.items[0]);

      if (productsToPrint1.length > 0) {
        printReceipt1({
          printerAddress: register.printers.items[0].address,
          eftposReceipt: eftposReceipt,
          hideModifierGroupsForCustomer: true,
          restaurant: {
            name: restaurant.name,
            address: `${restaurant.address.aptSuite || ""} ${restaurant.address
              .formattedAddress || ""}`,
          },
          notes: notes,
          products: productsToPrint1,
          total: total,
          type: orderType || EOrderType.TAKEAWAY,
          number: orderNumber,
          table: tableNumber,
        });
      }
    }

    if (register.printers && register.printers.items[1] && register.printers.items[1].address) {
      const productsToPrint2 = filterPrintProducts(products, register.printers.items[1]);

      if (productsToPrint2.length > 0) {
        printReceipt2({
          printerAddress: register.printers.items[1].address,
          restaurant: {
            name: restaurant.name,
            address: `${restaurant.address.aptSuite || ""} ${restaurant.address
              .formattedAddress || ""}`,
          },
          notes: notes,
          products: productsToPrint2,
          total: total,
          type: orderType || EOrderType.TAKEAWAY,
          number: orderNumber,
          table: tableNumber,
        });
      }
    }

    if (register.printers && register.printers.items[2] && register.printers.items[2].address) {
      const productsToPrint3 = filterPrintProducts(products, register.printers.items[2]);

      if (productsToPrint3.length > 0) {
        printReceipt3({
          printerAddress: register.printers.items[2].address,
          restaurant: {
            name: restaurant.name,
            address: `${restaurant.address.aptSuite || ""} ${restaurant.address
              .formattedAddress || ""}`,
          },
          notes: notes,
          products: productsToPrint3,
          total: total,
          type: orderType || EOrderType.TAKEAWAY,
          number: orderNumber,
          table: tableNumber,
        });
      }
    }
  };

  const onSubmitOrder = async (eftposReceipt?: string) => {
    const orderNumber = getOrderNumber();
    setPaymentOutcomeDelayedOrderNumber(orderNumber);

    try {
      if (register.printers && register.printers.items.length > 0) {
        printReceipts(orderNumber, eftposReceipt);
      }

      await processOrder(orderNumber);
    } catch (e) {
      throw e.message;
    }

    beginPaymentOutcomeApprovedTimeout();
  };

  const doTransaction = async () => {
    if (register.eftposProvider == "SMARTPAY") {
      await doTransactionSmartpay();
    } else if (register.eftposProvider == "VERIFONE") {
      await doTransactionVerifone();
    }
  };

  const doTransactionSmartpay = async () => {
    let delayedShown = false;

    let delayed = () => {
      if (!delayedShown) {
        // Don't show it more than once per request...
        delayedShown = true;

        // Might want to let the user know to check if everything is ok with the device
        setPaymentOutcome(CheckoutTransactionOutcome.Delay);
      }
    };

    try {
      let pollingUrl = await smartpayCreateTransaction(total, "Card.Purchase");

      let transactionOutcome: SmartpayTransactionOutcome = await smartpayPollForOutcome(
        pollingUrl,
        delayed
      );

      if (transactionOutcome == SmartpayTransactionOutcome.Accepted) {
        setPaymentOutcome(CheckoutTransactionOutcome.Success);

        try {
          await onSubmitOrder();
        } catch (e) {
          setProcessOrderError(e);
        }
      } else if (transactionOutcome == SmartpayTransactionOutcome.Declined) {
        setPaymentOutcome(CheckoutTransactionOutcome.Fail);
        setPaymentOutcomeErrorMessage(
          "Transaction Declined! Please try again."
        );
      } else if (transactionOutcome == SmartpayTransactionOutcome.Cancelled) {
        setPaymentOutcome(CheckoutTransactionOutcome.Fail);
        setPaymentOutcomeErrorMessage("Transaction Cancelled!");
      } else if (
        transactionOutcome == SmartpayTransactionOutcome.DeviceOffline
      ) {
        setPaymentOutcome(CheckoutTransactionOutcome.Fail);
        setPaymentOutcomeErrorMessage(
          "Transaction Cancelled! Please check if the device is powered on and online."
        );
      } else {
        setPaymentOutcome(CheckoutTransactionOutcome.Fail);
      }
    } catch (errorMessage) {
      setPaymentOutcomeErrorMessage(errorMessage);
    }
  };

  const doTransactionVerifone = async () => {
    try {
      const {
        transactionOutcome,
        eftposReceipt,
      } = await verifoneCreateTransaction(
        total,
        register.eftposIpAddress,
        register.eftposPortNumber,
        restaurant.id
      );

      if (transactionOutcome == VerifoneTransactionOutcome.Approved) {
        setPaymentOutcome(CheckoutTransactionOutcome.Success);

        try {
          await onSubmitOrder(eftposReceipt);
        } catch (e) {
          setProcessOrderError(e);
        }
      } else if (
        transactionOutcome == VerifoneTransactionOutcome.ApprovedWithSignature
      ) {
        // We should not come in here if its on kiosk mode, unattended mode for Verifone
        setPaymentOutcome(CheckoutTransactionOutcome.Success);

        try {
          await onSubmitOrder();
        } catch (e) {
          setProcessOrderError(e);
        }
      } else if (transactionOutcome == VerifoneTransactionOutcome.Cancelled) {
        setPaymentOutcome(CheckoutTransactionOutcome.Fail);
        setPaymentOutcomeErrorMessage("Transaction Cancelled!");
      } else if (transactionOutcome == VerifoneTransactionOutcome.Declined) {
        setPaymentOutcome(CheckoutTransactionOutcome.Fail);
        setPaymentOutcomeErrorMessage(
          "Transaction Declined! Please try again."
        );
      } else if (transactionOutcome == VerifoneTransactionOutcome.SettledOk) {
        alert("Transaction Settled Ok!");
      } else if (
        transactionOutcome == VerifoneTransactionOutcome.HostUnavailable
      ) {
        setPaymentOutcome(CheckoutTransactionOutcome.Fail);
        setPaymentOutcomeErrorMessage(
          "Transaction Host Unavailable! Please check if the device is powered on and online."
        );
      } else if (transactionOutcome == VerifoneTransactionOutcome.SystemError) {
        setPaymentOutcome(CheckoutTransactionOutcome.Fail);
        setPaymentOutcomeErrorMessage(
          "Transaction System Error! Please try again later."
        );
      } else if (
        transactionOutcome == VerifoneTransactionOutcome.TransactionInProgress
      ) {
        // You should never come in this state
        // alert("Transaction In Progress!");
      } else if (
        transactionOutcome == VerifoneTransactionOutcome.TerminalBusy
      ) {
        setPaymentOutcome(CheckoutTransactionOutcome.Fail);
        setPaymentOutcomeErrorMessage(
          "Terminal Is Busy! Please cancel the previous transaction before proceeding."
        );
      } else {
        setPaymentOutcome(CheckoutTransactionOutcome.Fail);
        setPaymentOutcomeErrorMessage("Transaction Failed!");
      }
    } catch (errorMessage) {
      setPaymentOutcome(CheckoutTransactionOutcome.Fail);
      setPaymentOutcomeErrorMessage(errorMessage);
    }
  };

  const onUpdateItem = (index: number, product: ICartProduct) => {
    updateItem(index, product);
    setShowItemUpdatedModal(true);
  };

  const editProductModal = () => {
    let category: IGET_RESTAURANT_CATEGORY | null = null;
    let product: IGET_RESTAURANT_PRODUCT | null = null;

    if (!productToEdit) {
      return <></>;
    }

    restaurant!.categories.items.forEach((c) => {
      if (c.id == productToEdit.product.category.id) {
        category = c;
      }

      c.products.items.forEach((p) => {
        if (p.product.id == productToEdit.product.id) {
          product = p.product;
        }
      });
    });

    if (!product || !category) {
      return <></>;
    }

    let orderedModifiers: ISelectedProductModifiers = {};

    productToEdit.product.modifierGroups.forEach((mg) => {
      orderedModifiers[mg.id] = mg.modifiers;
    });

    console.log("orderedModifiers", orderedModifiers);

    return (
      <ProductModal
        category={category}
        product={product}
        isOpen={showEditProductModal}
        onClose={onCloseEditProductModal}
        onUpdateItem={onUpdateItem}
        restaurantIsAcceptingOrders={true}
        restaurantName={
          "doesn't matter if both restaurantOpen && restaurantIsAcceptingOrders are true"
        }
        editProduct={{
          orderedModifiers: orderedModifiers,
          quantity: productToEdit.product.quantity,
          notes: productToEdit.product.notes,
          productCartIndex: productToEdit.displayOrder,
        }}
      />
    );
  };

  const itemUpdatedModal = (
    <>
      {showItemUpdatedModal && (
        <ItemAddedUpdatedModal
          isOpen={showItemUpdatedModal}
          onClose={onCloseItemUpdatedModal}
          isProductUpdate={true}
        />
      )}
    </>
  );

  const onConfirmTotalOrRetryTransaction = async () => {
    setPaymentOutcome(null);
    setPaymentOutcomeErrorMessage(null);
    setPaymentOutcomeDelayedOrderNumber(null);
    setPaymentOutcomeApprovedRedirectTimeLeft(10);

    await doTransaction();
  };

  const retryButtons = () => (
    <>
      <div style={{ display: "flex" }}>
        <div>
          <KioskButton onClick={onConfirmTotalOrRetryTransaction}>
            <NormalFont>Retry</NormalFont>
          </KioskButton>
        </div>
        <div style={{ width: "24px" }}></div>
        <div>
          <KioskButton
            onClick={onClosePaymentModal}
            style={{
              backgroundColor: "#ffffff",
              color: "#484848",
              border: "1px solid #e0e0e0",
            }}
          >
            <NormalFont>Cancel</NormalFont>
          </KioskButton>
        </div>
      </div>
    </>
  );

  const awaitingCard = () => (
    <>
      <Title4Font style={{ lineHeight: "42px" }}>
        Swipe or insert your card on the terminal to complete your payment.
      </Title4Font>
      <Space6 />
      <img src={require("../../images/awaitingCard.gif")} height="250px" />
    </>
  );

  const paymentAccepted = () => (
    <>
      {/* <img
        src={require("../../images/transaction-approved.png")}
        height="150px"
      />
      <Space4 /> */}
      <Title4Font>All Done!</Title4Font>
      <Space4 />
      <Title2Font>Transaction Accepted!</Title2Font>
      <Space6 />
      <NormalFont>Your order number is</NormalFont>
      <Space1 />
      <Title1Font style={{ fontSize: "200px", lineHeight: "256px" }}>
        {paymentOutcomeDelayedOrderNumber}
      </Title1Font>
      <Space4 />
      <GrayColor>
        <NormalFont>
          Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
          {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
          ...
        </NormalFont>
      </GrayColor>
    </>
  );

  const paymentDelayed = () => (
    <>
      <Title4Font>
        Transaction delayed! Check if the device is powered on and online.
      </Title4Font>
    </>
  );

  const paymentFailed = (errorMessage?: string) => (
    <>
      <Title4Font>Oops! Something went wrong.</Title4Font>
      {errorMessage && (
        <>
          <Space4 />
          <Title2Font>{errorMessage}</Title2Font>
        </>
      )}
      <Space6 />
      {retryButtons()}
    </>
  );

  const processOrderFailed = () => (
    <>
      <Title4Font>Oops! Something went wrong.</Title4Font>
      <Space4 />
      <NormalFont>
        Internal Server Error! Please contact a Tabin representative!
      </NormalFont>
      <Space2 />
      <NormalFont>{processOrderError}</NormalFont>
      <Space2 />
      <KioskButton
        style={{
          backgroundColor: "#ffffff",
          color: "#484848",
          border: "1px solid #e0e0e0",
          padding: "12px 24px",
        }}
        onClick={onCancelOrder}
      >
        <NormalFont style={{ fontWeight: 300 }}>
          Issue Fixed? Restart
        </NormalFont>
      </KioskButton>
    </>
  );

  const getActivePaymentModalComponent = () => {
    if (paymentOutcomeErrorMessage) {
      return paymentFailed(paymentOutcomeErrorMessage);
    }

    if (processOrderError) {
      return processOrderFailed();
    }

    if (paymentOutcome == null) {
      return awaitingCard();
    }

    if (paymentOutcome == CheckoutTransactionOutcome.Success) {
      return paymentAccepted();
    } else if (paymentOutcome == CheckoutTransactionOutcome.Fail) {
      return paymentFailed();
    } else if (paymentOutcome == CheckoutTransactionOutcome.Delay) {
      return paymentDelayed();
    } else {
      return paymentFailed();
    }
  };

  const paymentModal = (
    <>
      <KioskModal isOpen={showPaymentModal}>
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center",
            padding: "128px 256px",
          }}
        >
          {getActivePaymentModalComponent()}
        </div>
      </KioskModal>
    </>
  );

  const modalsAndSpinners = (
    <>
      {/* <FullScreenSpinner show={loading} text={loadingMessage} /> */}
      {editProductModal()}
      {paymentModal}
      {itemUpdatedModal}
    </>
  );

  const cartEmptyDisplay = (
    <>
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <GrayColor style={{ color: "hsl(0,0%,80%)" }}>
          <ShoppingBasketIcon height={"72px"}></ShoppingBasketIcon>
        </GrayColor>
        <Space3 />
        <Title1Font style={{ textAlign: "center" }}>Empty cart</Title1Font>
        <Space3 />
        <Title3Font style={{ textAlign: "center", fontWeight: 400 }}>
          Show some love and start ordering!
        </Title3Font>
        <Space6 />
        <KioskButton
          onClick={() => {
            history.push(restaurantPath + "/" + restaurant!.id);
          }}
        >
          Back To Menu
        </KioskButton>
      </div>
    </>
  );

  const onOrderMore = () => {
    history.push(`/restaurant/${restaurant.id}`);
  };

  const checkoutFooter = (
    <div>
      <div style={{ textAlign: "center" }}>
        <Title1Font>Total: ${convertCentsToDollars(total)}</Title1Font>
      </div>
      <Space4 />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <KioskButton
          onClick={onOrderMore}
          style={{
            backgroundColor: "#ffffff",
            color: "#484848",
            border: "1px solid #e0e0e0",
            width: "350px",
          }}
        >
          <NormalFont style={{ fontSize: "22px" }}>Order More</NormalFont>
        </KioskButton>
        <SizedBox width="24px" />
        <KioskButton
          onClick={onClickOrderButton}
          cy-data="add-to-order"
          style={{
            width: "350px",
          }}
        >
          <NormalFont style={{ fontSize: "22px" }}>Complete Order</NormalFont>
        </KioskButton>
      </div>
      <Space4 />
      <KioskButton
        style={{
          backgroundColor: "#ffffff",
          color: "#484848",
          border: "1px solid #e0e0e0",
          padding: "12px 24px",
        }}
        onClick={onCancelOrder}
      >
        <NormalFont style={{ fontWeight: 300 }}>Cancel Order</NormalFont>
      </KioskButton>
    </div>
  );

  const restaurantOrderType = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
      }}
    >
      <Title3Font>Order Type: {orderType}</Title3Font>
      <Link onClick={onUpdateOrderType}>Change</Link>
    </div>
  );

  const restaurantTableNumber = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
      }}
    >
      <Title3Font>Table Number: {tableNumber}</Title3Font>
      <Link onClick={onUpdateTableNumber}>Change</Link>
    </div>
  );

  const restaurantNotes = (
    <>
      <Title2Font>Special instructions</Title2Font>
      <Space3 />
      {/* this condition is required because we cannot have two keyboards active at a time, we would have checkout and product keyboards active at a time and it would not work */}
      {/* can figure out a better way to do it in the future with refs */}
      {!showEditProductModal && (
        <KeyboardTextArea
          placeholder={"Leave a note for the restaurant"}
          value={notes}
          onChangeKeyboard={onNotesChange}
        />
      )}
    </>
  );

  const content = (
    <>
      <Space size={84} />
      {title}
      <Space6 />
      {restaurantOrderType}
      <Space2 />
      {tableNumber && (
        <>
          {restaurantTableNumber}
          <Space4 />
        </>
      )}
      <Separator6 />
      {orderSummary}
      {restaurantNotes}
    </>
  );

  return (
    <>
      <KioskPageWrapper>
        <div
          style={{ height: "100vh", display: "flex", flexDirection: "column" }}
        >
          <div style={{ display: "flex", flex: "1", overflow: "scroll" }}>
            <div
              style={{
                overflow: "scroll",
                padding: "0 84px 84px 84px",
                width: "100%",
              }}
              className={styles.checkoutContentWrapper}
            >
              {(!products || products.length == 0) && cartEmptyDisplay}
              {products && products.length > 0 && content}
            </div>
          </div>
          {products && products.length > 0 && (
            <div style={{ padding: "24px", borderTop: "1px solid #e0e0e0" }}>
              {checkoutFooter}
            </div>
          )}
        </div>
        {modalsAndSpinners}
      </KioskPageWrapper>
    </>
  );
};

const OrderSummary = (props: {
  onAddItem: () => void;
  onEditProduct: (product: ICartProduct, displayOrder: number) => void;
  onRemoveProduct: (displayOrder: number) => void;
  onUpdateProductQuantity: (
    displayOrder: number,
    productQuantity: number
  ) => void;
  onNotesChange: (value: string) => void;
}) => {
  // context
  const { products } = useCart();

  // displays
  if (!products || products == []) {
    return (
      <>
        <h1>No items in cart!</h1>
      </>
    );
  }

  const orderItems = (
    <>
      {products &&
        products.map((product, index) => {
          // using index as key because products can be duplicated
          if (product) {
            return (
              <div
                key={index}
              // onClick={() => props.onEditProduct(product, index)}
              >
                <OrderItem
                  product={product}
                  displayOrder={index}
                  onEditProduct={props.onEditProduct}
                  onUpdateProductQuantity={props.onUpdateProductQuantity}
                  onRemoveProduct={props.onRemoveProduct}
                />
                <Separator6 />
              </div>
            );
          }
        })}
    </>
  );

  return (
    <>
      <div>{orderItems}</div>
    </>
  );
};

const OrderItem = (props: {
  product: ICartProduct;
  displayOrder: number;
  onEditProduct: (product: ICartProduct, displayOrder: number) => void;
  onUpdateProductQuantity: (
    displayOrder: number,
    productQuantity: number
  ) => void;
  onRemoveProduct: (displayOrder: number) => void;
}) => {
  // constants
  let itemPrice = props.product.price * props.product.quantity;

  props.product.modifierGroups.forEach((mg) => {
    mg.modifiers.forEach((m) => {
      const changedQuantity = m.quantity - m.preSelectedQuantity;

      if (changedQuantity > 0) {
        itemPrice += m.price * changedQuantity * props.product.quantity;
      }
    });
  });

  // displays
  const quantity = (
    <KioskStepper
      count={props.product.quantity}
      min={1}
      onUpdate={(count: number) =>
        props.onUpdateProductQuantity(props.displayOrder, count)
      }
      size={32}
    />
  );

  const price = (
    <PrimaryColor>
      <Title2Font>${convertCentsToDollars(itemPrice)}</Title2Font>
    </PrimaryColor>
  );

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gridColumnGap: "32px",
          alignItems: "center",
        }}
      >
        {quantity}
        <OrderItemDetails
          name={props.product.name}
          notes={props.product.notes}
          modifierGroups={props.product.modifierGroups}
          onEditProduct={() =>
            props.onEditProduct(props.product, props.displayOrder)
          }
        />
        <div style={{ textAlign: "center" }}>
          {price}
          <Space2 />
          <KioskButton
            style={{
              backgroundColor: "#ffffff",
              color: "#484848",
              border: "1px solid #e0e0e0",
              padding: "6px 18px",
            }}
            onClick={() => props.onRemoveProduct(props.displayOrder)}
          >
            <NormalFont style={{ fontWeight: 300 }}>Remove</NormalFont>
          </KioskButton>
        </div>
      </div>
    </>
  );
};

const OrderItemDetails = (props: {
  name: string;
  notes: string | null;
  modifierGroups: ICartModifierGroup[];
  onEditProduct: () => void;
}) => {
  // functions
  const modifierString = (
    preSelectedQuantity: number,
    quantity: number,
    name: string,
    price: number
  ) => {
    const changedQuantity = quantity - preSelectedQuantity;
    let mStr = "";

    if (
      changedQuantity < 0 &&
      Math.abs(changedQuantity) == preSelectedQuantity
    ) {
      mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)} x ` : ""
        }${name}`;
    } else {
      mStr = `${quantity > 1 ? `${Math.abs(quantity)} x ` : ""}${name}`;
    }

    if (price > 0 && changedQuantity > 0) {
      mStr += ` ($${convertCentsToDollars(price)})`;
    }

    return mStr;
  };

  // displays

  const editButton = (
    <>
      <KioskButton
        style={{
          backgroundColor: "#ffffff",
          color: "#484848",
          border: "1px solid #e0e0e0",
          padding: "6px 18px",
          display: "inline-block",
          marginLeft: "12px",
        }}
        onClick={() => props.onEditProduct()}
      >
        <NormalFont style={{ fontWeight: 300 }}>Edit</NormalFont>
      </KioskButton>
    </>
  );

  const nameDisplay = (
    <Title2Font>
      {props.name} {editButton}
    </Title2Font>
  );

  const modifiersDisplay = (
    <>
      {props.modifierGroups.map((mg, index) => (
        <>
          {!mg.hideForCustomer && (
            <>
              <Space1 />
              <BoldFont key={mg.id}>{mg.name}</BoldFont>
              {mg.modifiers.map((m, index2) => (
                <>
                  <NormalFont key={m.id}>
                    {modifierString(
                      m.preSelectedQuantity,
                      m.quantity,
                      m.name,
                      m.price
                    )}
                  </NormalFont>
                </>
              ))}
            </>
          )}
        </>
      ))}
    </>
  );

  const notesDisplay = (
    <>
      {props.notes && (
        <>
          <GrayColor>
            <NormalFont>Notes: {props.notes}</NormalFont>
          </GrayColor>
        </>
      )}
    </>
  );

  return (
    <div
      style={{
        display: "grid",
        gridAutoRows: "auto" /* shrink to min size*/,
        gridRowGap: "4px",
      }}
    >
      {nameDisplay}
      {modifiersDisplay}
      {notesDisplay}
    </div>
  );
};
