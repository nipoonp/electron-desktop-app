import React, { useState } from "react";
import { Logger } from "aws-amplify";
import { ICartProduct, EOrderType } from "../model/model";
import { IGET_RESTAURANT } from "../graphql/customQueries";

const initialRestaurant = null;
const initialOrderType = null;
const initialTableNumber = null;
const initialProducts = null;
const initialNotes = "";
const initialTotal = 0;

type ContextProps = {
  restaurant: IGET_RESTAURANT | null;
  setRestaurant: (restaurant: IGET_RESTAURANT) => void;
  orderType: EOrderType | null;
  setOrderType: (orderType: EOrderType) => void;
  tableNumber: string | null;
  setTableNumber: (tableNumber: string) => void;
  products: ICartProduct[] | null;
  addItem: (product: ICartProduct) => void;
  updateItem: (index: number, product: ICartProduct) => void;
  updateItemQuantity: (index: number, quantity: number) => void;
  deleteItem: (index: number) => void; // has a index input because multiple products in cart could have the same id
  clearCart: () => void;
  notes: string;
  setNotes: (notes: string) => void;
  total: number;
};

const CartContext = React.createContext<ContextProps>({
  restaurant: initialRestaurant,
  setRestaurant: () => {},
  orderType: initialOrderType,
  setOrderType: () => {},
  tableNumber: initialTableNumber,
  setTableNumber: () => {},
  products: initialProducts,
  addItem: () => {},
  updateItem: () => {},
  updateItemQuantity: () => {},
  deleteItem: () => {},
  clearCart: () => {},
  notes: initialNotes,
  setNotes: () => {},
  total: initialTotal,
});

const CartProvider = (props: { children: React.ReactNode }) => {
  const [restaurant, _setRestaurant] = useState<IGET_RESTAURANT | null>(
    initialRestaurant
  );
  const [orderType, _setOrderType] = useState<EOrderType | null>(
    initialOrderType
  );
  const [tableNumber, _setTableNumber] = useState<string | null>(
    initialTableNumber
  );
  const [products, _setProducts] = useState<ICartProduct[] | null>(
    initialProducts
  );
  const [notes, _setNotes] = useState<string>(initialNotes);
  const [total, _setTotal] = useState<number>(initialTotal);

  const recalculateTotal = (products: ICartProduct[] | null) => {
    let totalPrice = 0;

    products &&
      products.forEach((p) => {
        totalPrice += p.price * p.quantity;
        p.modifierGroups.forEach((mg) => {
          mg.modifiers.forEach((m) => {
            const changedQuantity = m.quantity - m.preSelectedQuantity;

            if (changedQuantity > 0) {
              totalPrice += m.price * changedQuantity * p.quantity;
            }
          });
        });
      });

    return totalPrice;
  };

  const setRestaurant = (restaurant: IGET_RESTAURANT) => {
    _setRestaurant(restaurant);
  };

  const setOrderType = (orderType: EOrderType) => {
    _setOrderType(orderType);
  };

  const setTableNumber = (tableNumber: string) => {
    _setTableNumber(tableNumber);
  };

  const addItem = (product: ICartProduct) => {
    let newProducts = products;

    if (newProducts != null) {
      newProducts.push(product);
    } else {
      newProducts = [product];
    }

    _setProducts(newProducts);
    _setTotal(recalculateTotal(newProducts));
  };

  const updateItem = (index: number, product: ICartProduct) => {
    if (products == null) {
      // should never really end up here
      return;
    }

    const newProducts = products;
    newProducts[index] = product;

    _setProducts(newProducts);
    _setTotal(recalculateTotal(newProducts));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (products == null) {
      // should never really end up here
      return;
    }

    const newProducts = products;
    const productAtIndex = newProducts[index];

    productAtIndex.quantity = quantity;
    newProducts[index] = productAtIndex;

    _setProducts(newProducts);
    _setTotal(recalculateTotal(newProducts));
  };

  const deleteItem = (index: number) => {
    if (products == null) {
      // should never really end up here
      return;
    }

    let newProducts = products;
    newProducts.splice(index, 1);

    _setProducts(newProducts);
    _setTotal(recalculateTotal(newProducts));
  };

  const clearCart = () => {
    _setRestaurant(initialRestaurant);
    _setOrderType(initialOrderType);
    _setProducts(initialProducts);
    _setNotes(initialNotes);
    _setTotal(initialTotal);
    _setTableNumber(initialTableNumber);
  };

  const setNotes = (notes: string) => {
    _setNotes(notes);
  };

  return (
    <CartContext.Provider
      value={{
        restaurant: restaurant,
        setRestaurant: setRestaurant,
        orderType: orderType,
        setOrderType: setOrderType,
        tableNumber: tableNumber,
        setTableNumber: setTableNumber,
        products: products,
        addItem: addItem,
        updateItem: updateItem,
        updateItemQuantity: updateItemQuantity,
        deleteItem: deleteItem,
        clearCart: clearCart,
        notes: notes,
        setNotes: setNotes,
        total: total,
      }}
      children={props.children}
    />
  );
};

const useCart = () => {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error(`useCart must be used within a CartProvider`);
  }
  return context;
};

export { CartProvider, useCart };
