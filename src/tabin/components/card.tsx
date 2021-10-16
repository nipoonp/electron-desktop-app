import "./card.scss";
import { FaExpandAlt } from "react-icons/fa";

export const Card = (props: IProps) => {
    const { title, onOpen } = props;

    return (
        <div className={`card ${props.className}`}>
            <div className="card-header">
                {title && <div className="h4">{title}</div>}
                {onOpen && (
                    <div className="c-pointer" onClick={() => onOpen()}>
                        <FaExpandAlt />
                    </div>
                )}
            </div>
            <div className="card-body">{props.children}</div>
        </div>
    );
};

export interface IProps {
    title?: string;
    onOpen?: () => void;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}
