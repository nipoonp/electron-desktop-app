// export const timeArray = () => {
//   let arr = [];
//   for (let i = 0; i < 24; i++) {
//     for (let j = 0; j < 4; j++) {
//       arr.push(i + ":" + (j === 0 ? "00" : 15 * j));
//     }
//   }

//   const d = new Date();
//   const h = d.getHours();
//   const m = 15 * Math.floor(d.getMinutes() / 15);
//   const stamp = h + ":" + (m === 0 ? "00" : m);

//   const pos = arr.indexOf(stamp);
//   return arr.slice(pos).concat(arr.slice(0, pos));
// };

export const createTimeArray = (
  start: Date,
  end: Date,
  interval: number,
  startAfterNow?: boolean,
  startAfterOffsetMinutes?: number
) => {
  let result: { date: Date; display: string }[] = [];

  // Create new dates, because Date objs are references
  // don't want to change the input args now do we
  const s = new Date(start);
  const e = new Date(end);

  if (e <= s) {
    return result;
  }

  let startMin = new Date(s);
  if (startAfterNow) {
    const now = new Date();
    if (startAfterOffsetMinutes) {
      now.setMinutes(now.getMinutes() + startAfterOffsetMinutes);
    }
    if (s < now) {
      startMin.setHours(now.getHours());
      startMin.setMinutes(now.getMinutes());
    }
  }

  for (let d = s; d <= end; d.setMinutes(d.getMinutes() + interval)) {
    if (d >= startMin) {
      result.push({
        date: new Date(d),
        display: format(d)
      });
    }
  }

  return result;
};

const format = (inputDate: Date) => {
  let hours = inputDate.getHours();
  let minutes = inputDate.getMinutes();
  const ampm = hours < 12 ? "AM" : ((hours = hours % 12), "PM");
  const hoursStr = hours == 0 ? "12" : hours < 10 ? "0" + hours : String(hours);
  const minutesStr = minutes < 10 ? "0" + minutes : String(minutes);
  // hours = hours == 0 ? 12 : hours < 10 ? "0" + hours : hours;
  //   minutes = minutes < 10 ? "0" + minutes : minutes;
  return hoursStr + ":" + minutesStr + " " + ampm;
};
