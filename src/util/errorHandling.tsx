import axios from "axios";

export const sendFailureNotification = async (error: string, context: string) => {
    try {
        console.log("Error: ", error);

        const result = await axios.post(
            `https://z7oa0cw11d.execute-api.ap-southeast-2.amazonaws.com/sandbox/sendEmail`,
            {
                error: error,
                event: {},
                context: context,
            },
            {
                headers: {
                    "Content-Type": "application/xml",
                },
            }
        );

        console.log("Error result.data", JSON.stringify(result.data));
    } catch (error) {
        console.error("Error sending failure notification:", error);
    }
};
