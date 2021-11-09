import { useState } from 'react';
import { useSalesAnalytics } from '../../../context/salesAnalytics-context';
import { DateRangePicker } from '../../../tabin/components/dateRangePicker';
import { FiArrowLeft, FiDownload, FiFilter } from 'react-icons/fi';
import { useHistory } from 'react-router';
import { salesAnalyticsPath } from '../../main';

import './salesAnalyticsWrapper.scss';
import { IGET_RESTAURANT_REGISTER } from '../../../graphql/customQueries';
import { EOrderType } from '../../../model/model';
import { Checkbox } from '../../../tabin/components/checkbox';
import { useRestaurant } from '../../../context/restaurant-context';

export const SalesAnalyticsWrapper = (props: IProps) => {
    const { title, children, showBackButton, onExportAll } = props;
    const history = useHistory();
    const { restaurant } = useRestaurant();
    const [focusedInput, setFocusedInput] = useState<'startDate' | 'endDate' | null>(null);

    const [isFilter, setIsFilter] = useState(false);

    const { startDate, endDate, registerFilters, orderFilters, onDatesChange, onRegisterFilterChange, onOrderFilterChange } = useSalesAnalytics();

    const onFocusChange = (focusedInput: 'startDate' | 'endDate' | null) => {
        setFocusedInput(focusedInput);
    };

    const onClickBack = () => {
        history.push(salesAnalyticsPath);
    };

    const onOrderFilterUnCheck = (value: EOrderType) => {
        const index = orderFilters.indexOf(value);
        if(index > -1) {
            orderFilters.splice(index, 1);
            onRegisterFilterChange();
        }
    };

    const onRegisterFilterUnCheck = (value: IGET_RESTAURANT_REGISTER) => {
        const index = registerFilters.findIndex(r => r.id === value.id);
        if(index > -1) {
            registerFilters.splice(index, 1);
            onOrderFilterChange();
        }
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
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {onExportAll && (
                                <div className="cursor-pointer pr-3" onClick={() => onExportAll()}>
                                    <FiDownload title="Download All" />
                                </div>
                            )}
                            <div
                                className={`sales-filter-icon cursor-pointer pr-3 mr-2 ${isFilter ? 'sales-filter-icon-on' : ''}`}
                                onClick={() => setIsFilter(!isFilter)}
                            >
                                <span>
                                    <FiFilter size="20" color={isFilter ? 'white' : ''} />
                                </span>
                            </div>
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onDatesChange={onDatesChange}
                                focusedInput={focusedInput}
                                onFocusChange={onFocusChange}
                            />
                        </div>
                    </div>
                    {isFilter && (
                        <div className="sales-filters mb-3">
                            <div className="filter m-1">
                                <div className="text-bold mr-2">Order Type: </div>
                                {Object.values(EOrderType).map((value, index) => {
                                    return (
                                        <Checkbox key={index}
                                            className="mr-2"
                                            onCheck={() => onOrderFilterChange(value)}
                                            onUnCheck={() => onOrderFilterUnCheck(value)}
                                            checked={orderFilters.includes(value)}
                                        >
                                            {value}
                                        </Checkbox>
                                    );
                                })}
                            </div>
                            <div className="filter m-1">
                                <div className="text-bold mr-2">Register Type: </div>
                                {restaurant?.registers.items.map((register) => {
                                    return (
                                        <Checkbox key={register.id}
                                            className="mr-2"
                                            onCheck={() => onRegisterFilterChange(register)}
                                            onUnCheck={() => onRegisterFilterUnCheck(register)}
                                            checked={registerFilters.some(r => r.id === register.id)}
                                        >
                                            {register.name}
                                        </Checkbox>
                                    );
                                })}
                            </div>
                        </div>
                    )}
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
