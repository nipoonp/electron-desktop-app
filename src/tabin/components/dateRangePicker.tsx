import { DateRangePicker as ReactDateRangePicker, isInclusivelyBeforeDay } from "react-dates";
import moment from "moment";
import { isMobile } from "react-device-detect";
import { FiCalendar, FiX } from "react-icons/fi";

import "./dateRangePicker.scss";

// STYLE IS CUSTOMISED FOR DASHBOARD
// TO REUSE THIS COMPONENT, FIGURE OUT HOW TO STYLE USING JS
export const DateRangePicker = (props: {
    startDate: string | null;
    endDate: string | null;
    onDatesChange: (startDate: string | null, endDate: string | null) => void;
    focusedInput: "startDate" | "endDate" | null;
    onFocusChange: (focusedInput: "startDate" | "endDate" | null) => void;
}) => {
    const onDatesChange = (date: { startDate: moment.Moment | null; endDate: moment.Moment | null }) => {
        const startD = date.startDate ? moment(date.startDate).format("YYYY-MM-DD") : null;
        const endD = date.endDate ? moment(date.endDate).format("YYYY-MM-DD") : null;
        props.onDatesChange(startD, endD);
    };

    const onClearDates = () => {
        props.onDatesChange(null, null);
    };

    return (
        <>
            <div className="date-range-picker-container">
                <FiCalendar size={18} />
                <div>
                    <ReactDateRangePicker
                        startDateId="startDate"
                        endDateId="endDate"
                        startDate={props.startDate ? moment(props.startDate, "YYYY-MM-DD") : null}
                        endDate={props.endDate ? moment(props.endDate, "YYYY-MM-DD") : null}
                        onDatesChange={onDatesChange}
                        focusedInput={props.focusedInput}
                        onFocusChange={props.onFocusChange}
                        displayFormat={"DD/MM/YY"}
                        verticalHeight={370}
                        orientation={isMobile ? "vertical" : "horizontal"}
                        numberOfMonths={isMobile ? 1 : 2}
                        isOutsideRange={(day) => !isInclusivelyBeforeDay(day, moment())}
                    />
                </div>
                <FiX className="cursor-pointer" size={20} onClick={onClearDates} />
            </div>
        </>
    );
};
