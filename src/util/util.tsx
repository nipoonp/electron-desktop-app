import { format, getDay, isWithinInterval } from "date-fns";
import { IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS, IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES } from "../graphql/customQueries";

export const isItemSoldOut = (soldOut?: boolean, soldOutDate?: string) => {
    if (soldOut || soldOutDate == format(new Date(), "yyyy-MM-dd")) {
        return true;
    }

    return false;
};

export const isItemAvailable = (availability?: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS) => {
    if (!availability) return true;

    const dayTimes: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[] = getDayData(availability);

    if (dayTimes.length == 0) return true;

    const currentDateTime = new Date();
    let isWithinTimeSlot = false;

    dayTimes.forEach((timeSlot) => {
        let startDateTime = new Date(
            currentDateTime.getFullYear(),
            currentDateTime.getMonth(),
            currentDateTime.getDate(),
            parseInt(timeSlot.startTime.split(":")[0]),
            parseInt(timeSlot.startTime.split(":")[1]),
            0,
            0
        );
        let endDateTime = new Date(
            currentDateTime.getFullYear(),
            currentDateTime.getMonth(),
            currentDateTime.getDate(),
            parseInt(timeSlot.endTime.split(":")[0]),
            parseInt(timeSlot.endTime.split(":")[1]),
            0,
            0
        );

        const isWithin = isWithinInterval(currentDateTime, { start: startDateTime, end: endDateTime });

        if (isWithin && !isWithinTimeSlot) {
            isWithinTimeSlot = true;
        }
    });

    return isWithinTimeSlot;
};

const getDayData = (availability: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS) => {
    const day: number = getDay(new Date());

    switch (day) {
        case 1:
            return availability.monday;
        case 2:
            return availability.tuesday;
        case 3:
            return availability.wednesday;
        case 4:
            return availability.thursday;
        case 5:
            return availability.friday;
        case 6:
            return availability.saturday;
        case 0: //0 is sunday in date-fns
            return availability.sunday;
        default:
            return [];
    }
};

export const toLocalISOString = (date: Date) => {
    const tzo = -date.getTimezoneOffset();

    const pad = (num: number) => {
        var norm = Math.floor(Math.abs(num));
        return (norm < 10 ? "0" : "") + norm;
    };

    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        "T" +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes()) +
        ":" +
        pad(date.getSeconds()) +
        "." +
        pad(date.getMilliseconds())
    );
};

export const convertDollarsToCents = (price: number) => (price * 100).toFixed(0);

export const convertCentsToDollars = (price: number) => (price / 100).toFixed(2);

// https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-string
export const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});

export const toDataURL = (url, callback) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
        const reader = new FileReader();

        reader.onloadend = () => {
            callback(reader.result);
        };

        reader.readAsDataURL(xhr.response);
    };

    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
};
