import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { restaurantPath } from "../main";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { getCloudFrontDomainName, getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { IGET_RESTAURANT_ADVERTISEMENT } from "../../graphql/customQueries";
import { useRestaurant } from "../../context/restaurant-context";
import { CachedImage } from "../../tabin/components/cachedImage";

import "./beginOrder.scss";
import { isItemAvailable, isVideoFile } from "../../util/util";

export default (props: {}) => {
    const { restaurant } = useRestaurant();

    if (!restaurant) return <div>This user has not selected any restaurant</div>;

    const ads = restaurant && restaurant.advertisements.items;

    return (
        <>
            {ads.length > 0 ? (
                <>
                    <BeginOrderAdvertisements ads={ads} />
                </>
            ) : (
                <>
                    <BeginOrderDefault />
                </>
            )}
        </>
    );
};

const BeginOrderAdvertisements = (props: { ads: IGET_RESTAURANT_ADVERTISEMENT[] }) => {
    const navigate = useNavigate();

    const [availableAds, setAvailableAds] = useState<IGET_RESTAURANT_ADVERTISEMENT[]>([]);
    const [currentAd, setCurrentAd] = useState(0);
    const { restaurant } = useRestaurant();

    useEffect(() => {
        const availableAds: IGET_RESTAURANT_ADVERTISEMENT[] = [];

        props.ads.forEach((ad) => {
            if (isItemAvailable(ad.availability)) availableAds.push(ad);
        });

        setAvailableAds(availableAds);
    }, []);

    useEffect(() => {
        if (availableAds.length <= 1) return;

        const timerId = setInterval(() => {
            setCurrentAd((prevCurrentAd) => (prevCurrentAd === availableAds.length - 1 ? 0 : prevCurrentAd + 1));
        }, 6000);

        return () => clearInterval(timerId);
    }, [availableAds]);

    if (!restaurant) return <div>This user has not selected any restaurant</div>;

    return (
        <PageWrapper>
            <div className="begin-order">
                <div
                    className="wrapper"
                    onClick={() => {
                        navigate(restaurantPath + "/" + restaurant.id);
                    }}
                >
                    <div className="touch-to-begin-wrapper">
                        <CachedImage className="icon" url={`${getPublicCloudFrontDomainName()}/images/touch-here-dark.png`} alt="hand-icon" />
                        <div className="h3">TOUCH TO BEGIN</div>
                    </div>
                </div>
                <div className="advertisements-wrapper">
                    {availableAds.map((advertisement, index) => (
                        <div
                            key={advertisement.id}
                            className={`image-wrapper ${availableAds.length > 1 ? "slide-animation" : ""} ${
                                currentAd == index ? "active" : "inactive"
                            }`}
                        >
                            {isVideoFile(advertisement.content.key) ? (
                                <video className="splash-screen-video" autoPlay loop muted>
                                    <source
                                        src={`${getCloudFrontDomainName()}/protected/${advertisement.content.identityPoolId}/${
                                            advertisement.content.key
                                        }`}
                                    />
                                </video>
                            ) : (
                                <CachedImage
                                    className="image"
                                    url={`${getCloudFrontDomainName()}/protected/${advertisement.content.identityPoolId}/${
                                        advertisement.content.key
                                    }`}
                                    alt="advertisement-image"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </PageWrapper>
    );
};

const BeginOrderDefault = () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();

    if (!restaurant) {
        return <div>This user has not selected any restaurant</div>;
    }

    return (
        <>
            <PageWrapper>
                <div className="begin-order-default">
                    <div className="container">
                        <div
                            className="wrapper"
                            onClick={() => {
                                navigate(restaurantPath + "/" + restaurant.id);
                            }}
                        >
                            <div className="order-text">ORDER</div>
                            <div className="here-text">HERE</div>
                            <div className="and-pay-text">AND PAY</div>
                            <CachedImage
                                className="touch-icon"
                                url={`${getPublicCloudFrontDomainName()}/images/touch-here.png`}
                                alt="touch-here-icon"
                            />
                            <div className="touch-icon-text">Touch to get started</div>
                        </div>
                        <div className="powered-by-tabin-wrapper">
                            <div className="h2 powered-by-text">Powered by</div>
                            <div className="h2 tabin-text">TABIN</div>
                        </div>
                    </div>
                </div>
            </PageWrapper>
        </>
    );
};
