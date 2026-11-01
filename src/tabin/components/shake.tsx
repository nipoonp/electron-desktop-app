import "./shake.scss";

export const Shake = (props: IProps) => {
    return <div className={props.active ? "shake-active" : ""}>{props.children}</div>;
};

export interface IProps {
    active: boolean;
    children: React.ReactNode;
}
