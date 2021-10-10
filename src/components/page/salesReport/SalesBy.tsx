import { SalesReportScreen } from "../../../model/model";

const SalesBy = (props: {screenName: SalesReportScreen, changeScreen: (a: SalesReportScreen) => void}) => {
    const {screenName} = props;
    return (
        <div className="App">
            <h5 onClick={e => props.changeScreen(SalesReportScreen.DASHBOARD)}>back</h5>
            <div className="report-header">
                <p className="header-title">Sales By {screenName}</p>
                <div>
                    <input type="date" />
                </div>
            </div>
        </div>
    )
}

export default SalesBy;