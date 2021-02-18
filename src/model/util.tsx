// import { IOrderedModifiers, IOrderedModifier } from "./model";
import { format } from "date-fns";

export const formatTimeISO8601 = (time: Date): string => {
  return format(time, "yyyy-MM-dd'T'HH:mm:ss");
};

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const getVerifoneSocketErrorMessage = (eftposError: string) => {
  if (eftposError.includes("ECONNREFUSED")) {
    return "ECONNREFUSED: Please make sure your Eftpos is powered on and configured correctly.";
  } else if (eftposError.includes("EHOSTUNREACH")) {
    return "ECONNREFUSED: Please make sure your Eftpos is powered on and configured correctly.";
  } else if (eftposError.includes("EISCONN")) {
    return "EISCONN: Another device is already connected to the Eftpos. Please clear previous transaction or try again later.";
    // } else if (eftposError.includes("ECONNABORTED")) {
    //   return "Eftpos ";
  } else if (eftposError.includes("ECONNRESET")) {
    return "ECONNRESET: Lost connection with the Eftpos. Please try again later";
  } else if (eftposError.includes("ETIMEDOUT")) {
    return "ETIMEDOUT: Timed out! Please make sure your Eftpos is powered on and working.";
  } else if (eftposError.includes("EALREADY")) {
    return "EALREADY: Another request is currently in progress. Please try again later.";
  } else {
    return "Oops! Something went wrong. Please try again later.";
  }
};

export const getVerifoneTimeBasedTransactionId = () => {
  return (new Date().getTime() - new Date(2010, 1, 1).getTime()) % 100000000; // 1-8 digits Should not have repeating transactionIds, if you use the same one again, the previous transaction will get overridden? Does it matter, I don't know
  //If multi-merchant is not supported or required then ID ‘0’ should be used
};
