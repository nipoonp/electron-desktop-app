import { SalesReportScreen } from "../../../model/model";

const ExpandableCard = (props: {
    title: string;
    screenName: SalesReportScreen;
    changeScreen: (a: SalesReportScreen) => void;
    children: React.ReactNode;
}) => {
    const { title, screenName, changeScreen } = props;
    return (
        <div className="card" style={{ maxWidth: "100%" }}>
            <div className="card-header">
                {title}
                <span style={{ float: "right" }} onClick={(e) => changeScreen(screenName)}>
                    Open
                </span>
            </div>
            <div className="card-body">{props.children}</div>
        </div>
    );
};

export default ExpandableCard;
