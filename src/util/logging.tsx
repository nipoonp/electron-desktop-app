export const logSlackError = (payloadString: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        var data = { payload: payloadString };

        var xhr = new XMLHttpRequest();

        xhr.open("POST", "https://z0g2nmkm0b.execute-api.ap-southeast-2.amazonaws.com/prod/error", true);

        xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var res = JSON.parse(xhr.response);

                console.log(res);

                resolve();
            }

            reject();
        };

        xhr.send(JSON.stringify(data));
    });
};
