import { useEffect, useState } from "react";
import { useRestaurant } from "../../context/restaurant-context";
import { toDataURL } from "../../util/util";
import { useElectron } from "../../context/electron-context";

import "./cachedImage.scss";

export const CachedImage = (props: IProps) => {
    const { checkParentView } = useElectron();
    const { electron, reactNativeWebView } = checkParentView();
    const isBrowser = !electron && !reactNativeWebView;

    const { restaurantProductImages } = useRestaurant();
    const [imageSrc, setImageSrc] = useState(restaurantProductImages[props.url]);

    useEffect(() => {
        if (isBrowser) return;

        if (!imageSrc) {
            toDataURL(props.url, (dataUrl) => {
                restaurantProductImages[props.url] = dataUrl;
                setImageSrc(dataUrl);
            });
        }
    }, [props.url, isBrowser]);

    return isBrowser ? (
        <img className={props.className} style={props.style} src={props.url} alt={props.alt} />
    ) : imageSrc ? (
        <img className={props.className} style={props.style} src={imageSrc} alt={props.alt} />
    ) : (
        <div className={`placeholder-item ${props.className}`}></div>
    );
};

export interface IProps {
    url: string;
    style?: React.CSSProperties;
    className?: string;
    alt?: string;
}
