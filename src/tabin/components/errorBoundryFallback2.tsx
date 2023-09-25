import { FallbackProps } from "react-error-boundary";
import { useRestaurant } from "../../context/restaurant-context";

export const ErrorBoundaryFallback2 = (props: FallbackProps) => {
    const { restaurant } = useRestaurant();

    console.log("xxx...I AM HERE222", props);
    return (
        <div>
            <div>Something went wrong</div>
            <div>{props.error.message}</div>
        </div>
    );
};
