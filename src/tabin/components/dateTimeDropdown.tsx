import React, { useState } from "react";
import { Space2, Space3 } from "./spaces";
import { Logger } from "aws-amplify";
import { SelectV2 } from "./selectv2";
import { Title3Font, NormalFont } from "./fonts";

const logger = new Logger("dateTimeDropdown");

export const DateTimeDropdown = (props: {
  onSelectTime: (time: Date | null) => void; // null when selected date has no times available
  dateTimeArray: dateTimeArray;
}) => {
  logger.debug("Props: ", props);

  // state
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // callbacks
  const handleDateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = (e.target.value as unknown) as number;
    setSelectedDateIndex(index);
    props.onSelectTime(
      props.dateTimeArray[index].times.length > 0
        ? props.dateTimeArray[index].times[0].date
        : null
    );
  };

  const handleTimeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let t =
      props.dateTimeArray[selectedDateIndex].times[
        (e.target.value as unknown) as number
      ];
    logger.debug("Selected time: ", t);
    props.onSelectTime(t.date);
  };

  // constants
  const selectedDateHasTimes =
    props.dateTimeArray.length > 0 &&
    props.dateTimeArray[selectedDateIndex].times.length > 0;

  // displays
  const dateOptionsDisplay = (
    <SelectV2 onChange={handleDateSelect} name="date">
      {props.dateTimeArray.map((d, index) => {
        return <option value={index}>{d.date.display}</option>;
      })}
    </SelectV2>
  );

  const timeOptionsDisplay = (
    <SelectV2
      onChange={handleTimeSelect}
      name="time"
      disabled={!selectedDateHasTimes}
    >
      {selectedDateHasTimes &&
        props.dateTimeArray[selectedDateIndex].times.map((t, index) => {
          return <option value={index}>{t.display}</option>;
        })}
      {!selectedDateHasTimes && <option>Closed for today</option>}
    </SelectV2>
  );

  return (
    <>
      <Title3Font>Date</Title3Font>
      <Space2 />
      <NormalFont>{dateOptionsDisplay}</NormalFont>
      <Space3 />
      <Title3Font>Time</Title3Font>
      <Space2 />
      <NormalFont>{timeOptionsDisplay}</NormalFont>
    </>
  );
};

export type dateTimeArray = {
  date: {
    date: Date;
    display: string;
  };
  times: {
    date: Date;
    display: string;
  }[];
}[];
