import { add, format, isAfter, isToday, isTomorrow } from "date-fns";
import { useEffect, useState } from "react";
import { Select } from "./select";

import "./orderScheduleDateTime.scss";
import { IGET_RESTAURANT_OPERATING_HOURS } from "../../graphql/customQueries";
import { getIsRestaurantOpen, getRestaurantTimings } from "../../util/util";
import { addMinutes } from "date-fns/esm";

const RESTAURANT_TIMINGS_INTERVAL = 5;

interface IAvailableDay {
    dateValue: string;
    dateLabel: string;
    day: number; //Day starts from 0; 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday etc...
    isOpen: boolean;
    isToday: boolean;
    timings: Date[];
}
export interface IAvailableTime {
    dayTime?: Date;
    timeValue: string;
    timeLabel: string;
    disabled?: boolean;
}

export const OrderScheduleDateTime = (props: IProps) => {
    const { operatingHours, preparationTimeInMinutes } = { ...props };

    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    const [availableDays, setAvailableDays] = useState<IAvailableDay[]>([]);
    const [availableTimes, setAvailableTimes] = useState<IAvailableTime[]>([]);

    useEffect(() => {
        if (selectedTime == "CLOSED") {
            props.onChange("INVALID");
        } else if (!selectedTime) {
            //ASAP selected
            props.onChange(null);
        } else {
            props.onChange(`${selectedDate}T${selectedTime}`);
        }
    }, [selectedDate, selectedTime]);

    useEffect(() => {
        recalculateAvailableDays();
    }, [operatingHours, preparationTimeInMinutes]);

    useEffect(() => {
        recalculateAvailableTimes();
    }, [availableDays, selectedDate]);

    useEffect(() => {
        let timerId: NodeJS.Timeout;

        timerId = setTimeout(() => {
            recalculateAvailableTimes();
        }, 1000 * 60); //Every minute

        return () => {
            clearTimeout(timerId);
        };
    });

    const recalculateAvailableDays = () => {
        const now = new Date();
        const nextDays: IAvailableDay[] = [];
        let firstAvailableDate = "";

        for (var i = 0; i < 8; i++) {
            const selectedDate = add(now, { days: i });
            const day = selectedDate.getDay();
            const isDateToday = isToday(selectedDate);

            const dateValue = format(selectedDate, "yyyy-MM-dd");

            let dateLabel;

            if (isDateToday) {
                dateLabel = "Today";
            } else if (isTomorrow(selectedDate)) {
                dateLabel = "Tomorrow";
            } else {
                dateLabel = format(selectedDate, "eee, do MMM");
            }

            const isOpen = getIsRestaurantOpen(operatingHours, day);

            if (!isOpen) {
                dateLabel += " (CLOSED)";
            }

            if (isOpen && firstAvailableDate == "") {
                firstAvailableDate = dateValue;
            }

            nextDays.push({
                dateValue: dateValue,
                dateLabel: dateLabel,
                day: day,
                isOpen: isOpen,
                isToday: isDateToday,
                timings: getRestaurantTimings(operatingHours, selectedDate, day, RESTAURANT_TIMINGS_INTERVAL),
            });
        }

        setAvailableDays(nextDays);
        setSelectedDate(firstAvailableDate);
    };

    const recalculateAvailableTimes = () => {
        let availTimes: IAvailableTime[] = [];
        let foundMatchingTimeAsBefore = false;

        let nextAvailDateTime = new Date();

        if (preparationTimeInMinutes) {
            nextAvailDateTime = addMinutes(nextAvailDateTime, preparationTimeInMinutes);
        }

        availableDays.forEach((day) => {
            if (day.dateValue == selectedDate) {
                let dayTimings = day.timings;

                dayTimings.forEach((t) => {
                    if (isAfter(t, nextAvailDateTime)) {
                        const timeValue = format(t, "HH:mm:ss"); //HH = 24hour, hh = 12hour
                        const timeLabel = format(t, "hh:mm a");

                        availTimes.push({ dayTime: t, timeValue: timeValue, timeLabel: timeLabel });

                        if (!foundMatchingTimeAsBefore && selectedTime == timeValue) {
                            foundMatchingTimeAsBefore = true;
                        }
                    }
                });

                if (day.isToday && availTimes.length > 0) {
                    const nextAvailDateTimeWithInterval = addMinutes(nextAvailDateTime, RESTAURANT_TIMINGS_INTERVAL);

                    if (availTimes[0].dayTime && isAfter(nextAvailDateTimeWithInterval, availTimes[0].dayTime)) {
                        availTimes = [{ timeValue: "", timeLabel: "ASAP" }, ...availTimes];
                    }
                }

                if (day.isToday && availTimes.length == 0) {
                    availTimes = [{ timeValue: "CLOSED", timeLabel: "CLOSED", disabled: true }, ...availTimes];
                }
            }
        });

        setAvailableTimes(availTimes);

        if (availTimes.length > 0 && !foundMatchingTimeAsBefore) {
            setSelectedTime(availTimes[0].timeValue);
        }
    };

    const onChangeDate = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDate = event.target.value;

        setSelectedDate(selectedDate);
    };

    const onChangeTime = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newTime = event.target.value;

        setSelectedTime(newTime);
    };

    return (
        <div className="order-schedule-date-time-container">
            <div className="order-schedule-date-container">
                <Select name="order-schedule-date" value={selectedDate} onChange={onChangeDate}>
                    {availableDays.map((day) => (
                        <option value={day.dateValue} label={day.dateLabel} disabled={!day.isOpen}>
                            {day.dateLabel}
                        </option>
                    ))}
                </Select>
            </div>
            <div className="mr-1"></div>
            <div className="order-schedule-time-container">
                <Select name="order-schedule-time" value={selectedTime} onChange={onChangeTime}>
                    {availableTimes.map((time) => (
                        <option value={time.timeValue} label={time.timeLabel} disabled={time.disabled}>
                            {time.timeLabel}
                        </option>
                    ))}
                </Select>
            </div>
        </div>
    );
};

export interface IProps {
    onChange: (dateTimeLocalISO: string | null) => void;
    operatingHours: IGET_RESTAURANT_OPERATING_HOURS;
    preparationTimeInMinutes: number;
}
