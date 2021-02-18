// https://stackoverflow.com/questions/6427204/date-parsing-in-javascript-is-different-between-safari-and-chrome
// https://stackoverflow.com/questions/50515136/utc-date-in-date-object-outputs-differently-in-safari
// Use this for local date time string ONLY
// "2020-01-10T09:00:00" - use
// "2020-01-10T09:00:00Z" - do not use
export const parseISO8601WithoutTimezoneAsLocalTime = (dateString: string) => {
  var arr = dateString.split(/\D/);

  return new Date(
    parseInt(arr[0]),
    parseInt(arr[1]) - 1,
    parseInt(arr[2]),
    parseInt(arr[3]),
    parseInt(arr[4]),
    parseInt(arr[5])
  );
};
