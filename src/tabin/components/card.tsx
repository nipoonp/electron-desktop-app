import "./card.scss";
import { FaExpandAlt } from "react-icons/fa";

export const Card = (props: IProps) => {
    const { title, onOpen, onExport } = props;

    return (
        <div className={`card ${props.className}`}>
            <div className="card-header">
                {title && <div className="h4">{title}</div>}
                <div style={{display:"flex"}}>
                    {onExport && (
                        <div>
                            <button onClick={onExport}>Export</button>{" "}
                        </div>
                    )}
                    {onOpen && (
                        <div className="cursor-pointer" onClick={() => onOpen()}>
                            <FaExpandAlt />
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
