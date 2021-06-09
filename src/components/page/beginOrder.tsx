import React, { useEffect, useState } from "react";
import { Space4, Space6, Space, Space2, Space3 } from "../../tabin/components/spaces";
import { useHistory } from "react-router";
import { useUser } from "../../context/user-context";
import { restaurantPath } from "../main";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import { Title3Font, Title2Font } from "../../tabin/components/fonts";
import { SizedBox } from "../../tabin/components/sizedBox";
import { getCloudFrontDomainName, getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { IGET_RESTAURANT_ADVERTISEMENT } from "../../graphql/customQueries";
import { useRestaurant } from "../../context/restaurant-context";

export const BeginOrder = (props: {}) => {
    const { restaurant } = useRestaurant();

    if (!restaurant) {
        return <div>This user has not selected any restaurant</div>;
    }

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
    const history = useHistory();

    const numberOfAds = props.ads.length;
    const [currentAd, setCurrentAd] = useState(0);
    const { restaurant } = useRestaurant();

    useEffect(() => {
        if (numberOfAds <= 1) return;

        const timerId = setInterval(() => {
            setCurrentAd((prevCurrentAd) => (prevCurrentAd == numberOfAds - 1 ? 0 : prevCurrentAd + 1));
        }, 6000);

        return () => {
            clearInterval(timerId);
        };
    }, []);

    if (!restaurant) {
        return <div>This user has not selected any restaurant</div>;
    }

    return (
        <KioskPageWrapper>
            <div className="begin-order">
                <div
                    className="wrapper"
                    onClick={() => {
                        history.push(restaurantPath + "/" + restaurant.id);
                    }}
                >
                    <div className="order-here-text-wrapper">
                        <div className="order-text">ORDER</div>
                        <div className="here-text">HERE</div>
                    </div>
                    <div className="touch-to-begin-wrapper">
                        <img className="icon" src={`${getPublicCloudFrontDomainName()}/images/touch-here-dark.png`} />
                        <div className="h3">TOUCH TO BEGIN</div>
                    </div>
                </div>
                <div className="advertisements-wrapper">
                    {restaurant &&
                        restaurant.advertisements.items.map((advertisement, index) => (
                            <div
                                key={advertisement.id}
                                className={`image-wrapper ${numberOfAds > 1 ? "slide-animation" : ""} ${currentAd == index ? "active" : "inactive"}`}
                            >
                                <img
                                    className="image"
                                    src={`${getCloudFrontDomainName()}/protected/${advertisement.content.identityPoolId}/${
                                        advertisement.content.key
                                    }`}
                                />
                            </div>
                        ))}
                </div>
            </div>
        </KioskPageWrapper>
    );
};

const BeginOrderDefault = () => {
    const history = useHistory();
    const { restaurant } = useRestaurant();

    if (!restaurant) {
        return <div>This user has not selected any restaurant</div>;
    }

    return (
        <>
            <KioskPageWrapper>
                <div className="begin-order-default">
                    <div className="container">
                        <div
                            className="wrapper"
                            onClick={() => {
                                history.push(restaurantPath + "/" + restaurant.id);
                            }}
                        >
                            <div className="order-text">ORDER</div>
                            <div className="here-text">HERE</div>
                            <div className="and-pay-text">AND PAY</div>
                            <img className="touch-icon" src={`${getPublicCloudFrontDomainName()}/images/touch-here.png`} />
                            <div className="touch-icon-text">Touch to get started</div>
                        </div>
                        <div className="powered-by-tabin-wrapper">
                            <div className="h2 powered-by-text">Powered by</div>
                            <div className="h2 tabin-text">TABIN</div>
                        </div>
                    </div>
                </div>
            </KioskPageWrapper>
        </>
    );
};
