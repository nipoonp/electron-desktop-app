import { FallbackProps } from "react-error-boundary";

export const ErrorBoundaryFallback = (props: FallbackProps) => {
    return (
        <div>
            <div>Something went wrong</div>
            <div>{props.error instanceof Error ? props.error.message : String(props.error)}</div>
        </div>
    );
};
