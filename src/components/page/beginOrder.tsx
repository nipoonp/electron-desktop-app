import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { restaurantPath } from "../main";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { getCloudFrontDomainName, getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { IGET_RESTAURANT_ADVERTISEMENT, IGET_RESTAURANT_PING_DATA } from "../../graphql/customQueries";
import { useRestaurant } from "../../context/restaurant-context";
import { CachedImage } from "../../tabin/components/cachedImage";

import "./beginOrder.scss";
import { delay, isItemAvailable, isVideoFile } from "../../util/util";
import { useRegister } from "../../context/register-context";
import { useGetRestaurantPingDataLazyQuery } from "../../hooks/useGetRestaurantPingDataLazyQuery";

export default () => {
    const navigate = useNavigate();
    const { register, connectRegister, disconnectRegister } = useRegister();
    const { restaurant, selectRestaurant } = useRestaurant();

    if (!restaurant) return <div>This user has not selected any restaurant</div>;

    const restaurant1 = "00f05bb8-baca-46e7-b6e1-5c81e4fd1d3f"; //Boss Don
    const restaurantRegister1 = "c60d89f7-7177-4331-924e-339956dc84c1";
    const restaurant2 = "97f47fc8-462d-4d33-b530-0fe900048b01"; //Auckland Bagel Club
    const restaurantRegister2 = "aaefa4b7-f1e4-4000-b6cc-7045d95501a3";

    const onClickStore1 = async () => {
        // ABC Buzz A
        await disconnectRegister(restaurantRegister2);

        // await delay(1000);

        selectRestaurant(restaurant1);

        await delay(1000);

        await connectRegister(restaurantRegister1);

        navigate(restaurantPath + "/" + restaurant1);
    };

    const onClickStore2 = async () => {
        //Boss Don
        await disconnectRegister(restaurantRegister1);

        // await delay(1000);

        selectRestaurant(restaurant2);

        await delay(1000);

        await connectRegister(restaurantRegister2);

        navigate(restaurantPath + "/" + restaurant2);
    };

    return (
        <>
            <div className="ad-wrapper">
                <img
                    className="ad-image"
                    src="https://tabin182909-prod.s3.ap-southeast-2.amazonaws.com/protected/ap-southeast-2%3A8cf93543-6537-4120-b190-d98eb9b7b010/2023-10-14_01%3A17%3A16.819-rect17052-6.webp"
                />
                <div className="store-1" onClick={onClickStore1}></div>
                <div className="store-2" onClick={onClickStore2}></div>
            </div>
        </>
    );
};
