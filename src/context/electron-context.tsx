import React, { useEffect, useState } from "react";
import { Title1Font } from "../tabin/components/fonts";

const electron = window.require("electron");
const ipcRenderer = electron.ipcRenderer;

type ContextProps = {};

const ElectronContext = React.createContext<ContextProps>({});

const ElectronProvider = (props: { children: React.ReactNode }) => {
    const [electronUpdaterMessage, setElectronUpdaterMessage] = useState<string | null>(null);
    const [isOnline, setNetwork] = useState<boolean>(window.navigator.onLine);

    const updateNetwork = () => {
        console.log("network:", window.navigator.onLine);
        setNetwork(window.navigator.onLine);
    };

    useEffect(() => {
        ipcRenderer.on("ELECTRON_UPDATER", (event: any, arg: string) => {
            console.log("ELECTRON_UPDATER:", arg);
            setElectronUpdaterMessage(arg);
        });
    }, []);

    useEffect(() => {
        window.addEventListener("offline", updateNetwork);
        window.addEventListener("online", updateNetwork);

        return () => {
            window.removeEventListener("offline", updateNetwork);
            window.removeEventListener("online", updateNetwork);
        };
    }, []);

    const NoInternetConnection = () => {
        return (
            <div style={{ padding: "64px 48px", textAlign: "center" }}>
                <Title1Font>Lost connection with the internet. Please check for any issues...</Title1Font>
            </div>
        );
    };

    const UpdaterMessage = () => {
        return (
            <div style={{ padding: "64px 48px", textAlign: "center" }}>
                <Title1Font>{electronUpdaterMessage}</Title1Font>
            </div>
        );
    };

    const children = <>{!isOnline ? <NoInternetConnection /> : electronUpdaterMessage ? <UpdaterMessage /> : props.children}</>;

    return <ElectronContext.Provider value={{}} children={children} />;
};

const useElectron = () => {
    const context = React.useContext(ElectronContext);
    if (context === undefined) {
        throw new Error(`useElectron must be used within a ElectronProvider`);
    }
    return context;
};

export { ElectronProvider, useElectron };
