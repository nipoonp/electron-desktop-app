// E.g. "12:00", "19:00"
export const timeStringToDate = (timeString: string, date?: Date) => {
  const timeParts = timeString.split(":");
  let _date;

  if (date) {
    _date = new Date(date);
  } else {
    _date = new Date();
  }

  _date.setHours(parseInt(timeParts[0]));
  _date.setMinutes(parseInt(timeParts[1]));
  _date.setSeconds(0);
  _date.setMilliseconds(0);

  return _date;
};

export const dateToTimeString = (date: Date) => {
  return date.getHours() + ":" + (date.getMinutes() + "0").slice(0, 2);
};
