import { useState } from "react";
import { useSalesAnalytics } from "../../../context/salesAnalytics-context";
import { DateRangePicker } from "../../../tabin/components/dateRangePicker";
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import { useHistory } from "react-router";
import { salesAnalyticsPath } from "../../main";

import "./salesAnalyticsWrapper.scss";

export const SalesAnalyticsWrapper = (props: IProps) => {
    const { title, children, showBackButton, onExportAll } = props;
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
                        <div className="sales-analytics-back-button-wrapper">
                            {showBackButton && <FiArrowLeft className="sales-analytics-back-button mr-1" size={24} onClick={onClickBack} />}
                            <div className="h2">{title}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {onExportAll && (
                                <div className="cursor-pointer pr-3" onClick={() => onExportAll()}>
                                    <FiDownload title="Download All" />
                                </div>
                            )}
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onDatesChange={onDatesChange}
                                focusedInput={focusedInput}
                                onFocusChange={onFocusChange}
                            />
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </>
    );
};

interface IProps {
    title: string;
    showBackButton?: boolean;
    children: React.ReactNode;
    onExportAll?: () => void;
}
