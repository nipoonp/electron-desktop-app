import { FallbackProps } from "react-error-boundary";

export const ErrorBoundaryFallback = (props: FallbackProps) => {
    console.log("xxx...I AM HERE", props);
    return (
        <div>
            <div>Something went wrong</div>
            <div>{props.error.message}</div>
        </div>
    );
};
