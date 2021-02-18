import React, { useState, useEffect } from "react";
import { createTimeArray } from "../../../util/timeArray";
import Select from "../../../tabin/components/select";
import { Logger } from "aws-amplify";
const logger = new Logger("ItemAvailabilityTimeDropdown");

export default (props: IProps) => {
  const [times, setTimes] = useState<{ date: Date; display: string }[]>([]);

  useEffect(() => {
    let start;

    if (props.startTime) {
      start = new Date(props.startTime);
    } else {
      start = new Date();
      start.setHours(0);
      start.setMinutes(0);
      start.setSeconds(0);
      start.setMilliseconds(0);
    }

    let end;

    if (props.endTime) {
      end = new Date(props.endTime);
    } else {
      end = new Date();
      end.setHours(23);
      end.setMinutes(59);
      end.setSeconds(59);
      end.setMilliseconds(59);
    }

    let times = createTimeArray(start, end, 15, false, 0);

    setTimes(times);
  }, [props.startTime, props.endTime]);

  const handleTimeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let time = e.target.value;
    logger.debug("Selected time: ", time);
    props.onSelectTime(
      time ? new Date(time) : null,
      props.day,
      props.dayTimeGroup,
      props.isStartTime
    );
  };

  return (
    <div>
      <Select
        cyData={props.cyData}
        onChange={handleTimeSelect}
        disabled={times.length === 0}
        value={props.value ? props.value.toString() : ""}
      >
        {/* <option value=""></option> */}
        {times.length > 0 &&
          times.map((time) => (
            <option value={time.date.toString()}>{time.display}</option>
          ))}
      </Select>
    </div>
  );
};

interface IProps {
  value: Date | null;
  day: string;
  dayTimeGroup: number;
  startTime: Date | null;
  endTime: Date | null;
  isStartTime: boolean;
  onSelectTime: (
    time: Date | null,
    day: string,
    dayTimeGroup: number,
    openTimeDropdown: boolean
  ) => void;
  cyData?: string;
}
