import { FallbackProps } from "react-error-boundary";
import { Button } from "./button";

export const ErrorBoundaryFallback = (props: FallbackProps) => {
    return (
        <div className="p-6">
            <div className="h1 mb-2">Something went wrong.</div>
            <div className="h3 mb-2">Please contact a Tabin support person instantly.</div>
            <div className="h3 mb-2">{props.error.message}</div>
            {/* <Button onClick={props.resetErrorBoundary}>Reset</Button> */}
        </div>
    );
};
