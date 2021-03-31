import { useEffect, useState } from "react";
import { Space4, Space6, Space, Space2, Space3 } from "../../tabin/components/spaces";
import { useHistory } from "react-router";
import { useUser } from "../../context/user-context";
import { restaurantPath } from "../main";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import { Title3Font, Title2Font } from "../../tabin/components/fonts";
import { SizedBox } from "../../tabin/components/sizedBox";
import { getCloudFrontDomainName, getPublicCloudFrontDomainName } from "../../private/aws-custom";
import "pure-react-carousel/dist/react-carousel.es.css";
import { IGET_USER_RESTAURANT_ADVERTISEMENT } from "../../graphql/customQueries";
import { number } from "yup";

const styles = require("./beginOrder.module.css");

export const BeginOrder = (props: {}) => {
    const { user } = useUser();

    if (!user) {
        throw "User must log in!";
    }

    if (user.restaurants.items.length == 0) {
        return <div>This user is not an owner of any restaurants</div>;
    }

    const ads = user && user.restaurants.items[0].advertisements.items;

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

const BeginOrderAdvertisements = (props: { ads: IGET_USER_RESTAURANT_ADVERTISEMENT[] }) => {
    const history = useHistory();
    const { user } = useUser();

    const numberOfAds = props.ads.length;
    const [currentAd, setCurrentAd] = useState(0);

    useEffect(() => {
        if (numberOfAds <= 1) return;

        const timerId = setInterval(() => {
            setCurrentAd((prevCurrentAd) => (prevCurrentAd == numberOfAds - 1 ? 0 : prevCurrentAd + 1));
        }, 6000);

        return () => {
            clearInterval(timerId);
        };
    }, []);

    if (!user) {
        throw "User must log in!";
    }

    return (
        <KioskPageWrapper>
            <div style={{ position: "fixed", height: "100vh", width: "100vw" }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "absolute",
                        height: "100%",
                        width: "100%",
                        backgroundColor: "#F2F2F2",
                        overflow: "hidden",
                    }}
                    onClick={() => {
                        const userRestaurantId = user.restaurants.items[0].id;

                        history.push(restaurantPath + "/" + userRestaurantId);
                    }}
                >
                    <div
                        style={{
                            fontSize: "84px",
                            fontWeight: 600,
                            textAlign: "center",
                            paddingTop: "40px",
                        }}
                    >
                        <div>ORDER</div>
                        <Space2 />
                        <div style={{ fontSize: "156px", color: "var(--primary-color)" }}>HERE</div>
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            bottom: "-75px",
                            backgroundColor: "rgb(255, 255, 255)",
                            width: "250px",
                            height: "250px",
                            borderRadius: "50%",
                            zIndex: 1,
                            opacity: 0.8,
                            textAlign: "center",
                            paddingTop: "32px",
                            boxShadow: "0 50px 100px -20px rgba(50,50,93,.25), 0 30px 60px -30px rgba(0,0,0,.3)",
                        }}
                    >
                        <img style={{ height: "76px" }} src={`${getPublicCloudFrontDomainName()}/images/touch-here-dark.png`} />
                        <Space3 />
                        <div
                            style={{
                                fontWeight: 600,
                                fontSize: "20px",
                            }}
                        >
                            <div>TOUCH TO BEGIN</div>
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        pointerEvents: "none",
                    }}
                >
                    {user.restaurants.items[0].advertisements.items.map((advertisement, index) => (
                        <div
                            className={numberOfAds > 1 ? styles.slideAnimation : null}
                            style={{
                                display: currentAd == index ? "flex" : "none",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid transparent",
                                borderRadius: "10px",
                                position: "absolute",
                                width: "100%",
                                height: "100vh",
                                padding: "332px 42px 148px 42px",
                            }}
                        >
                            <img
                                src={`${getCloudFrontDomainName()}/protected/${advertisement.content.identityPoolId}/${advertisement.content.key}`}
                                style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", borderRadius: "10px" }}
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
    const { user } = useUser();

    if (!user) {
        throw "User must log in!";
    }

    return (
        <>
            <KioskPageWrapper>
                <div style={{ position: "fixed", height: "100vh", width: "100vw" }}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100vh",
                            backgroundColor: "var(--primary-color)",
                            padding: "32px",
                            overflow: "auto",
                        }}
                    >
                        <div
                            style={{
                                color: "#ffffff",
                                display: "flex",
                                flex: "1",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                            }}
                            onClick={() => {
                                const userRestaurantId = user.restaurants.items[0].id;

                                history.push(restaurantPath + "/" + userRestaurantId);
                            }}
                        >
                            <div style={{ fontSize: "128px" }}>ORDER</div>
                            <Space6 />
                            <div style={{ fontSize: "220px", fontWeight: "bold" }}>HERE</div>
                            <Space6 />
                            <div style={{ fontSize: "128px" }}>AND PAY</div>
                            <Space size={300} />
                            <img style={{ height: "128px" }} src={`${getPublicCloudFrontDomainName()}/images/touch-here.png`} />
                            <Space4 />
                            <Title3Font style={{ fontWeight: 400 }}>Touch to get started</Title3Font>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#ffffff",
                            }}
                        >
                            <Title2Font
                                style={{
                                    fontWeight: 400,
                                }}
                            >
                                Powered by
                            </Title2Font>
                            <SizedBox width="6px" />
                            <Title2Font
                                style={{
                                    fontSize: "30px",
                                    fontWeight: 600,
                                    fontStyle: "italic",
                                }}
                            >
                                TABIN
                            </Title2Font>
                        </div>
                    </div>
                </div>
            </KioskPageWrapper>
        </>
    );
};
