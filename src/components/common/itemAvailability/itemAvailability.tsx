import React, { useState } from "react";
import ItemAvailabilityTimeDropdown from "./itemAvailabilityTimeDropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlusCircle,
  faMinusCircle,
} from "@fortawesome/fontawesome-free-solid";
import { Checkbox } from "../../../tabin/components/checkbox";
import { Logger } from "aws-amplify";
import {
  timeStringToDate,
  dateToTimeString,
} from "../../../util/timeConversion";
import { IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS, IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES } from "../../../graphql/customQueries";

const logger = new Logger("Create Restaurant ItemAvailability Hours");
const styles = require("./itemAvailability.module.css");

const defaultStartTime = "09:00";
const defaultEndTime = "17:00";
const timeSlotInterval = 15;

export default (props: IProps) => {
  const { itemAvailability, setItemAvailability } = props;

  if (!itemAvailability) {
    let defaultItemAvailability = {
      monday: [{ startTime: defaultStartTime, endTime: defaultEndTime }],
      tuesday: [{ startTime: defaultStartTime, endTime: defaultEndTime }],
      wednesday: [
        { startTime: defaultStartTime, endTime: defaultEndTime },
      ],
      thursday: [
        { startTime: defaultStartTime, endTime: defaultEndTime },
      ],
      friday: [{ startTime: defaultStartTime, endTime: defaultEndTime }],
      saturday: [
        { startTime: defaultStartTime, endTime: defaultEndTime },
      ],
      sunday: [{ startTime: defaultStartTime, endTime: defaultEndTime }],
    };

    setItemAvailability(defaultItemAvailability);
  }

  const onSetItemAvailability = (itemAvailability: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS) => {
    logger.debug("itemAvailability", itemAvailability);
    setItemAvailability(itemAvailability);
  };

  const addIntervalToDate = (date: Date, interval: number) => {
    let minutes = date.getMinutes() + interval;

    date.setMinutes(minutes);

    return date;
  };

  const onAddTimeGroup = (day: string) => {
    if (!itemAvailability) {
      return;
    }

    let timeGroup: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS = { ...itemAvailability };
    let timeGroupSize = timeGroup[day].length;

    let itemAvailabilityTime = timeStringToDate(
      timeGroup[day][timeGroupSize - 1].endTime
    );
    let itemAvailabilityTimeWithInterval = addIntervalToDate(
      itemAvailabilityTime,
      timeSlotInterval
    );

    let endTime = timeStringToDate(
      timeGroup[day][timeGroupSize - 1].endTime
    );
    let endTimeWithInterval = addIntervalToDate(
      endTime,
      timeSlotInterval * 2
    );

    timeGroup[day].push({
      startTime: dateToTimeString(itemAvailabilityTimeWithInterval),
      endTime: dateToTimeString(endTimeWithInterval),
    });
    setItemAvailability(timeGroup);
  };

  const onRemoveTimeGroup = (day: string, dayTimeGroup: number) => {
    if (!itemAvailability) {
      return;
    }

    let timeGroup: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS = { ...itemAvailability };

    timeGroup[day] = timeGroup[day].filter(
      (timeGroup, indx) => indx != dayTimeGroup
    );
    setItemAvailability(timeGroup);
  };

  return (
    <>
      {itemAvailability &&
        Object.keys(itemAvailability).map((day: string) => (
          <>
            <div className={styles.itemAvailabilityWrapper}>
              <ItemAvailabilityDay
                day={day}
                itemAvailability={itemAvailability}
                setItemAvailability={onSetItemAvailability}
              />
              <div>
                {itemAvailability[day].map(
                  (itemAvailabilityTime: IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES, index: number) => (
                    <ItemAvailabilityTimeGroup
                      firstItem={index == 0}
                      day={day}
                      dayTimeGroup={index}
                      itemAvailabilityTime={itemAvailabilityTime}
                      onAddTimeGroup={onAddTimeGroup}
                      onRemoveTimeGroup={onRemoveTimeGroup}
                      itemAvailability={itemAvailability}
                      setItemAvailability={onSetItemAvailability}
                      convertItemAvailabilityToDate={timeStringToDate}
                    />
                  )
                )}
              </div>
            </div>
          </>
        ))}
    </>
  );
};

interface IItemAvailabilityDay {
  day: string;
  itemAvailability: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS;
  setItemAvailability: (itemAvailability: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS) => void;
}

const ItemAvailabilityDay = (props: IItemAvailabilityDay) => {
  const { day, itemAvailability, setItemAvailability } = props;

  const onClickDayOpen = () => {
    let itemAvailabilityTemp = { ...itemAvailability };

    itemAvailabilityTemp[day].push({
      startTime: defaultStartTime,
      endTime: defaultEndTime,
    });
    setItemAvailability(itemAvailabilityTemp);
  };

  const onClickDayClose = () => {
    let itemAvailabilityTemp = { ...itemAvailability };

    itemAvailabilityTemp[day] = [];
    setItemAvailability(itemAvailabilityTemp);
  };

  return (
    <>
      <div className={styles.itemAvailabilityDay}>
        <div className={styles.day}>{day.toUpperCase()}</div>

        <div className={styles.checkboxWrapper}>
          <Checkbox
            cyData="itemAvailability-hours-day-open-checkbox"
            checked={itemAvailability[day].length > 0 ? true : false}
            onCheck={() => onClickDayOpen()}
            onUnCheck={() => onClickDayClose()}
          />
        </div>

        <div className={styles.checkboxText}>
          <div>{itemAvailability[day].length > 0 ? "Custom" : "Available"}</div>
        </div>
      </div>
    </>
  );
};

interface IItemAvailabilityTimeGroup {
  firstItem: boolean;
  day: string;
  dayTimeGroup: number;
  itemAvailabilityTime: IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES;
  onAddTimeGroup?: (day: string) => void;
  onRemoveTimeGroup?: (day: string, dayTimeGroup: number) => void;
  itemAvailability: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS;
  setItemAvailability: (itemAvailability: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS) => void;
  convertItemAvailabilityToDate: (itemAvailability: string) => Date;
}

const ItemAvailabilityTimeGroup = (props: IItemAvailabilityTimeGroup) => {
  const {
    firstItem,
    day,
    dayTimeGroup,
    itemAvailabilityTime,
    onAddTimeGroup,
    onRemoveTimeGroup,
    itemAvailability,
    setItemAvailability,
    convertItemAvailabilityToDate,
  } = props;

  const onSelectTime = (
    time: Date | null,
    day: string,
    dayTimeGroup: number,
    isStartTime: boolean
  ) => {
    let newTimeGroup: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS = { ...itemAvailability };
    let newTime = time
      ? ("0" + time.getHours()).slice(-2) +
      ":" +
      (time.getMinutes() + "0").slice(0, 2)
      : "";

    if (isStartTime) {
      newTimeGroup[day][dayTimeGroup].startTime = newTime;
    } else {
      newTimeGroup[day][dayTimeGroup].endTime = newTime;
    }

    setItemAvailability(newTimeGroup);
  };

  const getItemAvailabilityStartTime = () => {
    if (dayTimeGroup == 0) {
      return getStartOfDay();
    } else {
      return convertItemAvailabilityToDate(
        itemAvailability[day][dayTimeGroup - 1].endTime
      );
    }
  };

  const getItemAvailabilityEndTime = () => {
    return convertItemAvailabilityToDate(itemAvailabilityTime.endTime);
  };

  const getClosingStartTime = () => {
    return convertItemAvailabilityToDate(itemAvailabilityTime.startTime);
  };

  const getClosingEndTime = () => {
    if (dayTimeGroup == itemAvailability[day].length - 1) {
      return getEndOfDay();
    } else {
      return convertItemAvailabilityToDate(
        itemAvailability[day][dayTimeGroup + 1].startTime
      );
    }
  };

  const getStartOfDay = () => {
    let date = new Date();

    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date;
  };

  const getEndOfDay = () => {
    let date = new Date();

    date.setHours(23);
    date.setMinutes(59);
    date.setSeconds(59);
    date.setMilliseconds(59);

    return date;
  };

  return (
    <>
      <div className={styles.itemAvailabilityTimeGroup}>
        <div className={styles.itemAvailabilityTime}>
          <ItemAvailabilityTimeDropdown
            cyData="itemAvailability-hours-opening-time"
            day={day}
            dayTimeGroup={dayTimeGroup}
            value={convertItemAvailabilityToDate(itemAvailabilityTime.startTime)}
            startTime={getItemAvailabilityStartTime()}
            endTime={getItemAvailabilityEndTime()}
            isStartTime={true}
            onSelectTime={onSelectTime}
          />
        </div>
        <div className={styles.itemAvailabilityTimeDropdownSeparator}>to</div>
        <div className={styles.itemAvailabilityTime}>
          <ItemAvailabilityTimeDropdown
            cyData="itemAvailability-hours-closing-time"
            day={day}
            dayTimeGroup={dayTimeGroup}
            value={convertItemAvailabilityToDate(itemAvailabilityTime.endTime)}
            startTime={getClosingStartTime()}
            endTime={getClosingEndTime()}
            isStartTime={false}
            onSelectTime={onSelectTime}
          />
        </div>
        {onAddTimeGroup && firstItem && (
          <AddTimeGroupIcon onAddTimeGroup={onAddTimeGroup} day={day} />
        )}
        {onRemoveTimeGroup && !firstItem && (
          <RemoveTimeGroupIcon
            onRemoveTimeGroup={onRemoveTimeGroup}
            day={day}
            dayTimeGroup={dayTimeGroup}
          />
        )}
      </div>
    </>
  );
};

const AddTimeGroupIcon = (props: IAddTimeGroupIcon) => {
  return (
    <>
      <div
        cy-data="itemAvailability-time-group-add"
        onClick={() => props.onAddTimeGroup(props.day)}
      >
        <FontAwesomeIcon
          className={styles.addRemoveTimeGroupIcon}
          icon={faPlusCircle as any}
        />
      </div>
    </>
  );
};

const RemoveTimeGroupIcon = (props: IRemoveTimeGroupIcon) => {
  return (
    <>
      <div
        cy-data="itemAvailability-time-group-remove"
        onClick={() =>
          props.onRemoveTimeGroup &&
          props.onRemoveTimeGroup(props.day, props.dayTimeGroup)
        }
      >
        <FontAwesomeIcon
          className={styles.addRemoveTimeGroupIcon}
          icon={faMinusCircle as any}
        />
      </div>
    </>
  );
};

interface IAddTimeGroupIcon {
  onAddTimeGroup: (day: string) => void;
  day: string;
}

interface IRemoveTimeGroupIcon {
  onRemoveTimeGroup: (day: string, dayTimeGroup: number) => void;
  day: string;
  dayTimeGroup: number;
}

interface IProps {
  itemAvailability: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS | null;
  setItemAvailability: (itemAvailability: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS) => void;
}
