import { format, getDay, isWithinInterval } from "date-fns";
import { IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS, IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES } from "../graphql/customQueries";

export const isItemSoldOut = (soldOut: boolean, soldOutDate: string) => {
  if (soldOut || soldOutDate == format(new Date(), "yyyy-MM-dd")) {
    return true;
  }

  return false;
};


export const isItemAvailable = (availability: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS) => {
  if (!availability) return true;

  const dayTimes: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[] = getDayData(availability);

  if (dayTimes.length == 0) return true;

  const currentDateTime = new Date();
  let isWithinTimeSlot = false;

  dayTimes.forEach((timeSlot) => {
    let startDateTime = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate(), parseInt(timeSlot.startTime.split(":")[0]), parseInt(timeSlot.startTime.split(":")[1]), 0, 0);
    let endDateTime = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate(), parseInt(timeSlot.endTime.split(":")[0]), parseInt(timeSlot.endTime.split(":")[1]), 0, 0);

    const isWithin = (isWithinInterval(currentDateTime, { start: startDateTime, end: endDateTime }));

    if (isWithin && !isWithinTimeSlot) {
      isWithinTimeSlot = true;
    }
  });

  return isWithinTimeSlot;
}

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
    case 7:
      return availability.sunday;
    default:
      return [];
  }
}