const TopCard = (props: { details: ITopCardDetails }) => {
    const { details } = props;
    const getImage = () => {
        if (details.image) {
            return <img alt={details.topProductName} height="100%" width="100%" src={details.image}></img>;
        }
        return <> </>;
    };
    return (
        <div className="flex-responsive" style={{ alignItems: "center" }}>
            <div style={{ textAlign: "center", width: "100%" }}>
                {getImage()}
                <p>{details.topProductName}</p>
            </div>
            <div style={{ textAlign: "center", width: "100%" }}>
                <p>Quantity</p>
                <p>{details.quantity}</p>
                <p>Sale Amount</p>
                <p>{details.saleAmount}</p>
                <p>% of Sales</p>
                <p>{details.perSales}</p>
            </div>
        </div>
    );
};

interface ITopCardDetails {
    image: string;
    topProductName: string;
    quantity: number;
    saleAmount: string;
    perSales: string;
}

export default TopCard;
