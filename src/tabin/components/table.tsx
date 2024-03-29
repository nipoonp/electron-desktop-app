import "./table.scss";

export const Table = (props: IProps) => {
    return <table className={`table ${props.className}`}>{props.children}</table>;
};

interface IProps {
    children: React.ReactNode;
    className?: string;
}

// export default React.forwardRef(Button);
