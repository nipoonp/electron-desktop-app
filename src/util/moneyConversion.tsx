export const convertDollarsToCents = (price: number) =>
  (price * 100).toFixed(0);

export const convertCentsToDollars = (price: number) =>
  (price / 100).toFixed(2);

// https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-string
export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});
