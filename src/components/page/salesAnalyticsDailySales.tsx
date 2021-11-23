import { format } from 'date-fns';
import { Card } from '../../tabin/components/card';
import { FullScreenSpinner } from '../../tabin/components/fullScreenSpinner';
import { convertCentsToDollars } from '../../util/util';
import { LineGraph } from './salesAnalytics/salesAnalyticsGraphs';
import { Table } from '../../tabin/components/table';
import { useSalesAnalytics } from '../../context/salesAnalytics-context';
import { SalesAnalyticsWrapper } from './salesAnalytics/salesAnalyticsWrapper';

import './salesAnalytics.scss';
import { taxRate } from '../../model/util';
import { Button } from '../../tabin/components/button';
import { useHistory } from 'react-router-dom';
import { ordersPath } from '../main';

export const SalesAnalyticsDailySales = () => {
    const history = useHistory();
    const { startDate, endDate, salesAnalytics, error, loading } = useSalesAnalytics();

    const graphColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    const onShowOrder = (date: string) => {
        history.push(`${ordersPath}/${date}`);
    };

    if (error) {
        return <h1>Couldn't fetch orders. Try Refreshing</h1>;
    }

    if (loading) {
        return <FullScreenSpinner show={loading} text={'Loading report details...'} />;
    }

    return (
        <>
            <SalesAnalyticsWrapper title="Sales By Day" showBackButton={true}>
                {!startDate || !endDate ? (
                    <div className="text-center">Please select a start and end date.</div>
                ) : salesAnalytics && salesAnalytics.totalSoldItems > 0 ? (
                    <div className="sales-by">
                        <div className="mb-6" style={{ width: '100%', height: '300px' }}>
                            <LineGraph xAxis="date" lines={['sales']} graphData={salesAnalytics?.dayByGraphData} fill={graphColor} />
                        </div>
                        <div className="sales-reading-wrapper mb-6">
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{`$${convertCentsToDollars(salesAnalytics.subTotalCompleted)}`}</div>
                                <div className="text-uppercase">Total Sales</div>
                            </Card>
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{`$${convertCentsToDollars(
                                    isNaN(salesAnalytics.subTotalCompleted / salesAnalytics.totalNumberOfOrdersCompleted)
                                        ? 0
                                        : salesAnalytics.subTotalCompleted / salesAnalytics.totalNumberOfOrdersCompleted
                                )}`}</div>
                                <div className="text-uppercase">Average Sales</div>
                            </Card>
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{salesAnalytics.totalNumberOfOrdersCompleted}</div>
                                <div className="text-uppercase">Sales Count</div>
                            </Card>
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{salesAnalytics.totalSoldItems}</div>
                                <div className="text-uppercase">Items Sold</div>
                            </Card>
                        </div>
                        <div className="sales-table-wrapper">
                            <Table>
                                <thead>
                                    <tr>
                                        <th className="text-left">Date</th>
                                        <th className="text-right">Orders</th>
                                        <th className="text-right">Net</th>
                                        <th className="text-right">Tax</th>
                                        <th className="text-right">Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(salesAnalytics.dailySales).map(([date, sale], index) => (
                                        <tr key={index}>
                                            <td className="sales-analytics-table-date-cell">{format(new Date(date), 'E, dd MMM')}</td>
                                            <td className="text-right">{sale.totalQuantity}</td>
                                            <td className="text-right">{`$${convertCentsToDollars((sale.totalAmount * (100 - taxRate)) / 100)}`}</td>
                                            <td className="text-right">{`$${convertCentsToDollars(sale.totalAmount * (taxRate / 100))}`}</td>
                                            <td className="text-right">{`$${convertCentsToDollars(sale.totalAmount)}`}</td>
                                            <td className="text-right">
                                                <Button
                                                    onClick={() => {
                                                        onShowOrder(date);
                                                    }}
                                                >
                                                    Show Orders
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">No orders were placed during this period. Please select another date range.</div>
                )}
            </SalesAnalyticsWrapper>
        </>
    );
};
