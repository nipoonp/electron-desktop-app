import "./card.scss";
import { FiMaximize2, FiDownload, FiPrinter } from "react-icons/fi";

export const Card = (props: IProps) => {
    const { title, onOpen, onExport, onPrint } = props;

    return (
        <div className={`card ${props.className}`}>
            <div className="card-header">
                {title && <div className="h4">{title}</div>}
                <div style={{ display: "flex" }}>
                    {onPrint && (
                        <div className="cursor-pointer pl-2" onClick={() => onPrint()}>
                            <FiPrinter title="Print" />
                        </div>
                    )}
                    {onExport && (
                        <div className="cursor-pointer pl-2" onClick={() => onExport()}>
                            <FiDownload title="Download" />
                        </div>
                    )}
                    {onOpen && (
                        <div className="cursor-pointer pl-2" onClick={() => onOpen()}>
                            <FiMaximize2 title="Expand" />
                        </div>
                    )}
                </div>
            </div>
            <div className="card-body">{props.children}</div>
        </div>
    );
};

export interface IProps {
    title?: string;
    onOpen?: () => void;
    onExport?: () => void;
    onPrint?: () => void;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}
