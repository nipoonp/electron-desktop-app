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
import { toast } from "../../tabin/components/toast";

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
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTimeInMinutes = hours * 60 + minutes; // Convert current time to minutes
        const startTimeInMinutes = 12 * 60; // 12pm in minutes
        const endTimeInMinutes = 21 * 60 + 15; // 9:15pm in minutes

        // Check if the current time is between 12pm and 9:15pm
        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
            // ABC Buzz A
            await disconnectRegister(restaurantRegister2);

            // await delay(1000);

            selectRestaurant(restaurant1);

            await delay(1000);

            await connectRegister(restaurantRegister1);

            navigate(restaurantPath + "/" + restaurant1);
        } else {
            // If not between 12pm and 9:15pm, display an alert to the user
            toast.error("This store is only open between 12pm and 9:15pm.");
        }
    };

    const onClickStore2 = async () => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTimeInMinutes = hours * 60 + minutes; // Convert current time to minutes
    
        let isOpen = false;
        let startTimeInMinutes;
        let endTimeInMinutes = 14 * 60 + 30; // 2:30pm in minutes, common closing time for all open days
    
        switch (dayOfWeek) {
            case 0: // Sunday
            case 6: // Saturday
                startTimeInMinutes = 8 * 60; // 8am in minutes
                isOpen = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
                break;
            case 1: // Monday
            case 2: // Tuesday
                isOpen = false; // Closed all day
                break;
            case 3: // Wednesday
            case 4: // Thursday
            case 5: // Friday
                startTimeInMinutes = 8 * 60 + 30; // 8:30am in minutes
                isOpen = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
                break;
        }
    
        if (isOpen) {
            // Business Logic for Open Hours
            await disconnectRegister(restaurantRegister1);
    
            // await delay(1000);
    
            selectRestaurant(restaurant2);
    
            await delay(1000);
    
            await connectRegister(restaurantRegister2);
    
            navigate(restaurantPath + "/" + restaurant2);
        } else {
            // If not within the specified operating hours, display an error message
            toast.error("This store is currently closed. Please check our operating hours.");
        }
    };
    

    return (
        <>
            <div className="ad-wrapper">
                <img
                    className="ad-image"
                    src="https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/2023-10-14_01-17-16.819-rect17052-6.webp"
                />
                <div className="store-1" onClick={onClickStore1}></div>
                <div className="store-2" onClick={onClickStore2}></div>
            </div>
        </>
    );
};
