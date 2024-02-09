import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { restaurantPath } from "../main";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { S3Image } from "aws-amplify-react";
import {
  getCloudFrontDomainName,
  getPublicCloudFrontDomainName,
} from "../../private/aws-custom";
import {
  IGET_RESTAURANT_ADVERTISEMENT,
  IGET_RESTAURANT_PING_DATA,
} from "../../graphql/customQueries";
import { useRestaurant } from "../../context/restaurant-context";
import { CachedImage } from "../../tabin/components/cachedImage";

import "./beginOrder.scss";
import { isItemAvailable, isVideoFile } from "../../util/util";
import { useRegister } from "../../context/register-context";
import { useGetRestaurantPingDataLazyQuery } from "../../hooks/useGetRestaurantPingDataLazyQuery";

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  const { restaurant } = useRestaurant();
  const { isPOS } = useRegister();
  const { getRestaurantPingData } = useGetRestaurantPingDataLazyQuery();

  const getAvailableAds = (
    restaurantPingData: IGET_RESTAURANT_ADVERTISEMENT[]
  ) => {
    const ads: IGET_RESTAURANT_ADVERTISEMENT[] = [];

    restaurantPingData.forEach((ad) => {
      if (isItemAvailable(ad.availability)) ads.push(ad);
    });

    return ads;
  };

  const [availableAds, setAvailableAds] = useState<
    IGET_RESTAURANT_ADVERTISEMENT[]
  >(
    restaurant && restaurant.advertisements.items
      ? getAvailableAds(restaurant && restaurant.advertisements.items)
      : []
  );

  const [preparationTimeInMinutes, setPreparationTimeInMinutes] = useState(
    restaurant ? restaurant.preparationTimeInMinutes : 0
  );

  useEffect(() => {}, []);

  useEffect(() => {
    if (!restaurant) return;
    let availableAddForCheck, intervalId, shortIntervalId;

    startDefaultInterval();
    function startDefaultInterval() {
      if (!restaurant) return;
      const fetchDataAndUpdate = async () => {
        const restaurantPreparationTimeRes = await getRestaurantPingData({
          variables: {
            restaurantId: restaurant.id,
          },
        });

        const restaurantPingData =
          restaurantPreparationTimeRes.data.getRestaurant;

        if (restaurantPingData?.advertisements?.items.length) {
          availableAddForCheck = restaurantPingData.advertisements.items;
          const availableAdd = getAvailableAds(
            restaurantPingData.advertisements.items
          );
          // console.log("availableAdd", availableAdd);
          if (availableAdd.length) {
            clearInterval(intervalId);
            // console.log("availableAdd in side length after clear");
            startShortInterval();
          }
          setAvailableAds(availableAdd);
          setPreparationTimeInMinutes(
            restaurantPingData.preparationTimeInMinutes
          );
        }
      };

      intervalId = setInterval(fetchDataAndUpdate, 3000);
    }
    function startShortInterval() {
      shortIntervalId = setInterval(function () {
        // console.log("availableAddForCheck", availableAddForCheck);
        if (availableAddForCheck) {
          const isInCurrentTime = getAvailableAds(availableAddForCheck);
          // console.log("isInCurrentTime", isInCurrentTime);
          if (!isInCurrentTime.length) {
            clearInterval(shortIntervalId);
            startDefaultInterval();
          }
        }
      }, 1000);
    }

    return () => {
      clearInterval(intervalId);
      clearInterval(shortIntervalId);
    };
  }, []);

  if (!restaurant) return <div>This user has not selected any restaurant</div>;

  return (
    <>
      {!isPOS && preparationTimeInMinutes ? (
        <div className="preparation-time h2">
          Current wait time is {preparationTimeInMinutes}{" "}
          {preparationTimeInMinutes > 1 ? "minutes" : "minute"}
        </div>
      ) : (
        <></>
      )}
      {availableAds.length > 0 ? (
        <BeginOrderAdvertisements availableAds={availableAds} />
      ) : (
        <BeginOrderDefault />
      )}
    </>
  );
};

const BeginOrderAdvertisements = (props: {
  availableAds: IGET_RESTAURANT_ADVERTISEMENT[];
}) => {
  const { availableAds } = props;
  const navigate = useNavigate();
  const { restaurant } = useRestaurant();

  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    const timerId = setInterval(() => {
      if (availableAds.length <= 1) {
        setCurrentAd(0);
      } else {
        setCurrentAd((prevCurrentAd) =>
          prevCurrentAd === availableAds.length - 1 ? 0 : prevCurrentAd + 1
        );
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
            <CachedImage
              className="icon"
              url={`${getPublicCloudFrontDomainName()}/images/touch-here-dark.png`}
              alt="hand-icon"
            />
            <div className="h3">TOUCH TO BEGIN</div>
          </div>
        </div>
        <div className="advertisements-wrapper">
          {availableAds.map((advertisement, index) => (
            <div
              key={advertisement.id}
              className={`image-wrapper ${
                availableAds.length > 1 ? "slide-animation" : ""
              } ${currentAd == index ? "active" : "inactive"}`}
            >
              {isVideoFile(advertisement.content.key) ? (
                <video className="splash-screen-video" autoPlay loop muted>
                  <source
                    src={`${getCloudFrontDomainName()}/${
                      advertisement?.content?.level
                        ? advertisement.content.level
                        : "protected"
                    }/${advertisement.content.identityPoolId}/${
                      advertisement.content.key
                    }`}
                  />
                </video>
              ) : (
                <>
                  <S3Image
                    imgKey={advertisement.content.key}
                    level={
                      advertisement?.content?.level
                        ? advertisement?.content?.level
                        : "protected"
                    }
                    className="image mb-2"
                  />
                  {/* <CachedImage
                            className="image"
                            url={`${getCloudFrontDomainName()}/${
                            advertisement?.content?.level
                                ? advertisement.content.level
                                : "protected"
                            }/${advertisement.content.identityPoolId}/${
                            advertisement.content.key
                            }`}
                            alt="advertisement-image"
                        /> */}
                </>
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
