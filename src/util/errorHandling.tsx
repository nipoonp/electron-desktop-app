import axios from "axios";

export const sendFailureNotification = async (error: string, context: string) => {
    try {
        console.log("Error: ", error);

        const result = await axios({
            method: "post",
            url: `https://qncdq57gfh.execute-api.ap-southeast-2.amazonaws.com/prod/sendEmail`,
            headers: {
                Accept: "application/json",
            },
            data: {
                error: error,
                event: {},
                context: context,
            },
        });

        console.log("result.data", JSON.stringify(result.data));
    } catch (error) {
        console.error("Error sending failure notification:", error);
    }
};
