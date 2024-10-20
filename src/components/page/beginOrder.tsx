import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { restaurantPath } from "../main";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { getCloudFrontDomainName, getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { IGET_RESTAURANT_ADVERTISEMENT, IGET_RESTAURANT_PING_DATA } from "../../graphql/customQueries";
import { useRestaurant } from "../../context/restaurant-context";
import { CachedImage } from "../../tabin/components/cachedImage";
import { isItemAvailable, isVideoFile } from "../../util/util";
import { useRegister } from "../../context/register-context";
import { useGetRestaurantPingDataLazyQuery } from "../../hooks/useGetRestaurantPingDataLazyQuery";

import "./beginOrder.scss";

export default () => {
    const { restaurant } = useRestaurant();
    const { isPOS } = useRegister();
    const navigate = useNavigate();

    useEffect(() => {
        if (isPOS) navigate(restaurantPath + "/" + restaurant?.id);
    }, []);

    if (!restaurant) return <div>This user has not selected any restaurant</div>;

    const ads = restaurant && restaurant.advertisements.items;

    return (
        <>
            {restaurant.preparationTimeInMinutes && <PreparationTime />}
            {ads.length > 0 ? <BeginOrderAdvertisements ads={ads} /> : <BeginOrderDefault />}
        </>
    );
};

const PreparationTime = () => {
    const { restaurant } = useRestaurant();
    const { isPOS } = useRegister();

    const { getRestaurantPingData } = useGetRestaurantPingDataLazyQuery();

    const [preparationTimeInMinutes, setPreparationTimeInMinutes] = useState(restaurant ? restaurant.preparationTimeInMinutes : 0);

    useEffect(() => {
        if (!restaurant) return;
        if (!restaurant.preparationTimeInMinutes) return;

        const intervalId = setInterval(async () => {
            const restaurantPreparationTimeRes = await getRestaurantPingData({
                variables: {
                    restaurantId: restaurant.id,
                },
            });

            const preparationTimeResponse: IGET_RESTAURANT_PING_DATA = restaurantPreparationTimeRes.data.getRestaurant;

            setPreparationTimeInMinutes(preparationTimeResponse.preparationTimeInMinutes);
        }, 2 * 60 * 1000); //2 mins

        return () => clearInterval(intervalId);
    }, [restaurant]);

    return (
        <>
            {!isPOS && preparationTimeInMinutes ? (
                <div className="wait-time h2">
                    Current wait time is {preparationTimeInMinutes} {preparationTimeInMinutes > 1 ? "minutes" : "minute"}
                </div>
            ) : (
                <></>
            )}
        </>
    );
};

const BeginOrderAdvertisements = (props: { ads: IGET_RESTAURANT_ADVERTISEMENT[] }) => {
    const navigate = useNavigate();

    const [availableAds, setAvailableAds] = useState<IGET_RESTAURANT_ADVERTISEMENT[]>([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const { restaurant } = useRestaurant();

    useEffect(() => {
        setCurrentAdIndex((oldAdIndex) => processAds(oldAdIndex));
    }, []);

    const processAds = (oldAdIndex: number) => {
        let newIndex = 0;
        const newAvailAds: IGET_RESTAURANT_ADVERTISEMENT[] = [];

        props.ads.forEach((ad) => {
            if (isItemAvailable(ad.availability)) newAvailAds.push(ad);
        });

        // Check if the lengths are different
        const areAdsDifferent =
            availableAds.length !== newAvailAds.length ||
            // Check if any ad.id in availableAds is not found in newAvailAds
            availableAds.some((ad) => !newAvailAds.some((newAd) => newAd.id === ad.id)) ||
            // Also check the other way around to ensure all ids in newAvailAds are in availableAds
            newAvailAds.some((newAd) => !availableAds.some((ad) => ad.id === newAd.id));

        if (areAdsDifferent) {
            setAvailableAds(newAvailAds);
            newIndex = 0;
        } else {
            newIndex = oldAdIndex >= newAvailAds.length - 1 ? 0 : oldAdIndex + 1;
        }

        return newIndex;
    };

    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentAdIndex((oldAdIndex) => processAds(oldAdIndex));
        }, 6 * 1000);

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
                    {/* <div className="touch-to-begin-wrapper">
                        <CachedImage className="icon" url={`${getPublicCloudFrontDomainName()}/images/touch-here-dark.png`} alt="hand-icon" />
                        <div className="h3">TOUCH TO BEGIN</div>
                    </div> */}
                </div>
                <div className="advertisements-wrapper">
                    {availableAds.map((advertisement, index) => (
                        <div
                            key={advertisement.id}
                            className={`image-wrapper ${availableAds.length > 1 ? "slide-animation" : ""} ${
                                currentAdIndex == index ? "active" : "inactive"
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

    if (!restaurant) return <div>This user has not selected any restaurant</div>;

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
