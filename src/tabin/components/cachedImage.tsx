import { useEffect, useState } from "react";
import { useRestaurant } from "../../context/restaurant-context";
import { toDataURL } from "../../util/util";

import "./cachedImage.scss";

export const CachedImage = (props: IProps) => {
    const { restaurantProductImages } = useRestaurant();
    const [imageSrc, setImageSrc] = useState(restaurantProductImages[props.url]);

    useEffect(() => {
        if (!imageSrc) {
            toDataURL(props.url, (dataUrl) => {
                restaurantProductImages[props.url] = dataUrl;
                setImageSrc(dataUrl);
            });
        }
    }, [props.url]);

    return imageSrc ? (
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
