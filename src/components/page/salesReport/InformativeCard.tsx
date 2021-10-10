import "./InformativeCard.scss";

const InformativeCard = (props: { primaryText: string; secondaryText: string }) => {
    const { primaryText, secondaryText } = props;
    return (
        <div className="card informative-card" style={{ textAlign: "center" }}>
            <p>
                <b>{primaryText}</b>
            </p>
            <p style={{ textTransform: "uppercase" }}>{secondaryText}</p>
        </div>
    );
};

export default InformativeCard;
