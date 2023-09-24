import axios from "axios";

export const sendFailureNotification = async (error) => {
    try {
        // const result = await axios({
        //     method: "post",
        //     url: `https://z7oa0cw11d.execute-api.ap-southeast-2.amazonaws.com/sandbox/sendEmail`, //Change this later for prod
        //     headers: {
        //         Accept: "application/json",
        //     },
        //     data: {
        //         error: error,
        //     },
        // });

        const result = await axios.post(
            `https://z7oa0cw11d.execute-api.ap-southeast-2.amazonaws.com/sandbox/sendEmail`,
            {
                event: {},
                context: {},
                error: error,
            },
            {
                headers: {
                    "Content-Type": "application/xml",
                },
            }
        );

        console.log("xxx...result.data", JSON.stringify(result.data));
    } catch (error) {
        console.error("Error sending failure notification:", error);
    }
};
