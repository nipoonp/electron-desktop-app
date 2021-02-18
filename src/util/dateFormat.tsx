export const simpleDateTimeFormat = (date: Date) => {
  return (
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2) +
    "_" +
    ("0" + date.getHours()).slice(-2) +
    ":" +
    ("0" + date.getMinutes()).slice(-2) +
    ":" +
    ("0" + date.getSeconds()).slice(-2) +
    "." +
    date.getMilliseconds()
  );
};

export const simpleDateTimeFormatUTC = (date: Date) => {
  return (
    date.getUTCFullYear() +
    "-" +
    ("0" + date.getUTCMonth()).slice(-2) +
    "-" +
    ("0" + date.getUTCDate()).slice(-2) +
    "_" +
    ("0" + date.getUTCHours()).slice(-2) +
    ":" +
    ("0" + date.getUTCMinutes()).slice(-2) +
    ":" +
    ("0" + date.getUTCSeconds()).slice(-2) +
    "." +
    date.getUTCMilliseconds()
  );
};
