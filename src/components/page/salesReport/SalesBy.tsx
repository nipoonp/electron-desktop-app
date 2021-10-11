import { SalesReportScreen } from "../../../model/model";
import { Card } from "../../../tabin/components/card";
import { convertCentsToDollars } from "../../../util/util";
import { Graph } from "./Graph";

export const SalesBy = (props: {
    screenName: SalesReportScreen;
    changeScreen: (a: SalesReportScreen) => void;
    graphDetails: IGraphDetails;
    salesSummaryData: any;
}) => {
    const { screenName, graphDetails, salesSummaryData } = props;
    return (
        <>
            <div className="h3 pb-2">Sales By {screenName}</div>
            <div className="h5 pb-2">
                <span className="c-pointer" onClick={(e) => props.changeScreen(SalesReportScreen.DASHBOARD)}>back</span>
            </div>
            <div className="pb-3" style={{ width: "100%", height: "300px" }}>
                <Graph xAxis={graphDetails.xAxis} lines={graphDetails.lines} graphData={graphDetails.graphData} />
            </div>
            {salesSummaryData !== {} && (
                <div className="sales-reading-wrapper">
                    <Card className="text-center sales-reading">
                        <div className="h3 mb-1">{`$${convertCentsToDollars(salesSummaryData.subTotalCompleted)}`}</div>
                        <div className="text-uppercase">Total Sales</div>
                    </Card>
                    <Card className="text-center sales-reading">
                        <div className="h3 mb-1">{`$${convertCentsToDollars(
                            isNaN(salesSummaryData.subTotalCompleted / salesSummaryData.totalNumberOfOrdersCompleted)
                                ? 0
                                : salesSummaryData.subTotalCompleted / salesSummaryData.totalNumberOfOrdersCompleted
                        )}`}</div>
                        <div className="text-uppercase">Average Sales</div>
                    </Card>
                    <Card className="text-center sales-reading">
                        <div className="h3 mt-1">{salesSummaryData.totalNumberOfOrdersCompleted}</div>
                        <div className="text-uppercase">Sales Count</div>
                    </Card>
                    <Card className="text-center sales-reading">
                        <div className="h3 mb-1">{salesSummaryData.totalSoldItems}</div>
                        <div className="text-uppercase">Items Sold</div>
                    </Card>
                </div>
            )}
            <div className="table-wrapper">
                <table>
                    <tr>
                        <th>Date</th>
                        <th>Orders</th>
                        <th>Total</th>
                        <th>Category</th>
                    </tr>
                    <tr>
                        <td>Date</td>
                        <td>Orders</td>
                        <td>Total</td>
                        <td>Category</td>
                    </tr>
                    <tr>
                        <td>Date</td>
                        <td>Orders</td>
                        <td>Total</td>
                        <td>Category</td>
                    </tr>
                    <tr>
                        <td>Date</td>
                        <td>Orders</td>
                        <td>Total</td>
                        <td>Category</td>
                    </tr>
                </table>
            </div>
        </>
    );
};

interface IGraphDetails {
    graphData: any;
    xAxis: string;
    lines: string[];
}
