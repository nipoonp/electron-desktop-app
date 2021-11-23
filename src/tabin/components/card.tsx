import "./card.scss";
import { FiMaximize2, FiDownload } from "react-icons/fi";

export const Card = (props: IProps) => {
    const { title, onOpen, onExport } = props;

    return (
        <div className={`card ${props.className}`}>
            <div className="card-header">
                {title && <div className="h4">{title}</div>}
                <div style={{ display: "flex" }}>
                    {onExport && (
                        <div className="cursor-pointer pl-1" onClick={() => onExport()}>
                            <FiDownload title="Download" />
                        </div>
                    )}
                    {onOpen && (
                        <div className="cursor-pointer pl-1" onClick={() => onOpen()}>
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
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}
