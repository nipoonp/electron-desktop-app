import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { restaurantPath } from "../main";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { getCloudFrontDomainName, getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { IGET_RESTAURANT_ADVERTISEMENT, IGET_RESTAURANT_PING_DATA } from "../../graphql/customQueries";
import { useRestaurant } from "../../context/restaurant-context";
import { CachedImage } from "../../tabin/components/cachedImage";

import "./beginOrder.scss";
import { isItemAvailable, isVideoFile } from "../../util/util";
import { useRegister } from "../../context/register-context";
import { useGetRestaurantPingDataLazyQuery } from "../../hooks/useGetRestaurantPingDataLazyQuery";

export default () => {
    const { restaurant } = useRestaurant();
    const { isPOS } = useRegister();
    const { getRestaurantPingData } = useGetRestaurantPingDataLazyQuery();

    const getAvailableAds = (restaurantPingData: IGET_RESTAURANT_ADVERTISEMENT[]) => {
        const ads: IGET_RESTAURANT_ADVERTISEMENT[] = [];

        restaurantPingData.forEach((ad) => {
            if (isItemAvailable(ad.availability)) ads.push(ad);
        });

        return ads;
    };

    const [availableAds, setAvailableAds] = useState<IGET_RESTAURANT_ADVERTISEMENT[]>(
        restaurant && restaurant.advertisements.items ? getAvailableAds(restaurant && restaurant.advertisements.items) : []
    );

    const [preparationTimeInMinutes, setPreparationTimeInMinutes] = useState(restaurant ? restaurant.preparationTimeInMinutes : 0);

    useEffect(() => {
        if (!restaurant) return;

        const fetchDataAndUpdate = async () => {
            const restaurantPreparationTimeRes = await getRestaurantPingData({
                variables: {
                    restaurantId: restaurant.id,
                },
            });

            const restaurantPingData = restaurantPreparationTimeRes.data.getRestaurant;

            setPreparationTimeInMinutes(restaurantPingData.preparationTimeInMinutes);
            setAvailableAds(getAvailableAds(restaurantPingData.advertisements.items));
        };

        // Calculate delay until the next 5 minute mark
        // const now = new Date();
        // const delay = (5 - (now.getMinutes() % 5)) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();

        // Delay until the schedule aligns with a 5-minute interval, then start interval
        // const timeoutId = setTimeout(() => {
        const intervalId = setInterval(fetchDataAndUpdate, 30000); // Start an interval every 5 minutes after the delay

        return () => clearInterval(intervalId);
        // }, 5000);

        // return () => clearTimeout(timeoutId);
    }, []);

    if (!restaurant) return <div>This user has not selected any restaurant</div>;

    return (
        <>
            {!isPOS && preparationTimeInMinutes ? (
                <div className="preparation-time h2">
                    Current wait time is {preparationTimeInMinutes} {preparationTimeInMinutes > 1 ? "minutes" : "minute"}
                </div>
            ) : (
                <></>
            )}
            {availableAds.length > 0 ? <BeginOrderAdvertisements availableAds={availableAds} /> : <BeginOrderDefault />}
        </>
    );
};

const BeginOrderAdvertisements = (props: { availableAds: IGET_RESTAURANT_ADVERTISEMENT[] }) => {
    const { availableAds } = props;
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();

    const [currentAd, setCurrentAd] = useState(0);

    useEffect(() => {
        const timerId = setInterval(() => {
            if (availableAds.length <= 1) {
                setCurrentAd(0);
            } else {
                setCurrentAd((prevCurrentAd) => (prevCurrentAd === availableAds.length - 1 ? 0 : prevCurrentAd + 1));
            }
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
