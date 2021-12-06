import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRestaurant } from "../../context/restaurant-context";
import { EMAIL_SALES_REPORTS } from "../../graphql/customMutations";
import { Button } from "../../tabin/components/button";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { toast } from "../../tabin/components/toast";

import "./reports.scss";

export const Reports = () => {
    const { restaurant } = useRestaurant();
    const [showSpinner, setShowSpinner] = useState(false);

    const [emailSalesReportsMutation] = useMutation(EMAIL_SALES_REPORTS, {
        update: (proxy, mutationResult: any) => {},
    });

    const onEmailSalesReports = async () => {
        if (!restaurant || !restaurant.salesReportMailingList) return;

        setShowSpinner(true);

        try {
            setShowSpinner(true);
            await emailSalesReportsMutation({
                variables: {
                    restaurantId: restaurant.id,
                    emails: restaurant.salesReportMailingList,
                },
            });

            toast.success("Reports successfully sent to your email");
        } catch (e) {
            console.log("error: ", e);
            toast.error(e);
        } finally {
            setShowSpinner(false);
        }
    };

    return (
        <>
            <FullScreenSpinner show={showSpinner} />
            <div className="reports-container">
                <div className="h2 mb-6">Send Reports to Email</div>
                <Button onClick={onEmailSalesReports}>Email Now</Button>
            </div>
        </>
    );
};
