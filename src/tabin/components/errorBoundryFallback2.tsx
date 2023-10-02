import { FallbackProps } from "react-error-boundary";

export const ErrorBoundaryFallback = (props: FallbackProps) => {
    return (
        <div>
            <div>Something went wrong</div>
            <div>{props.error.message}</div>
        </div>
    );
};
