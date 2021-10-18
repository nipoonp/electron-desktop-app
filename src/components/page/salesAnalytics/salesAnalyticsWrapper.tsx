import { useState } from "react";
import { useSalesAnalytics } from "../../../context/salesAnalytics-context";
import { DateRangePicker } from "../../../tabin/components/dateRangePicker";
import { FiArrowLeft } from "react-icons/fi";

import "./salesAnalyticsWrapper.scss";
import { useHistory } from "react-router";
import { salesAnalyticsPath } from "../../main";

export const SalesAnalyticsWrapper = (props: IProps) => {
    const history = useHistory();
    const [focusedInput, setFocusedInput] = useState<"startDate" | "endDate" | null>(null);

    const { startDate, endDate, onDatesChange } = useSalesAnalytics();

    const onFocusChange = (focusedInput: "startDate" | "endDate" | null) => {
        setFocusedInput(focusedInput);
    };

    const onClickBack = () => {
        history.push(salesAnalyticsPath);
    };

    return (
        <>
            <div className="sales-analytics-wrapper">
                <div className="sales-analytics p-3">
                    <div className="sales-analytics-header mb-3">
                        <div className="sales-analytics-back-button mb-3">
                            {props.showBackButton && <FiArrowLeft className="mr-1" size={24} onClick={onClickBack} />}
                            <div className="h2">{props.title}</div>
                        </div>
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onDatesChange={onDatesChange}
                            focusedInput={focusedInput}
                            onFocusChange={onFocusChange}
                        />
                    </div>
                    {props.children}
                </div>
            </div>
        </>
    );
};

interface IProps {
    title: string;
    showBackButton?: boolean;
    children: React.ReactNode;
}
