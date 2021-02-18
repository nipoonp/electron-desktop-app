import React, { useState } from "react";
import { DateRangePicker as ReactDateRangePicker } from "react-dates";
import moment from "moment";

import "./dateRangePicker.css";

// STYLE IS CUSTOMISED FOR DASHBOARD
// TO REUSE THIS COMPONENT, FIGURE OUT HOW TO STYLE USING JS
export const DateRangePicker = (props: {
  startDate: string | null;
  endDate: string | null;
  onDatesChange: (startDate: string | null, endDate: string | null) => void;
  focusedInput: "startDate" | "endDate" | null;
  onFocusChange: (focusedInput: "startDate" | "endDate" | null) => void;
}) => {
  const onDatesChange = (date: {
    startDate: moment.Moment | null;
    endDate: moment.Moment | null;
  }) => {
    const startD = date.startDate
      ? moment(date.startDate).format("YYYY-MM-DD")
      : null;
    const endD = date.endDate
      ? moment(date.endDate).format("YYYY-MM-DD")
      : null;
    props.onDatesChange(startD, endD);
  };

  return (
    <>
      <ReactDateRangePicker
        startDateId="startDate"
        endDateId="endDate"
        startDate={
          props.startDate ? moment(props.startDate, "YYYY-MM-DD") : null
        }
        endDate={props.endDate ? moment(props.endDate, "YYYY-MM-DD") : null}
        onDatesChange={onDatesChange}
        focusedInput={props.focusedInput}
        onFocusChange={props.onFocusChange}
        showDefaultInputIcon={true}
        showClearDates={true}
        displayFormat={"DD/MM/YY"}
        isOutsideRange={() => false}
      />
    </>
  );
};
