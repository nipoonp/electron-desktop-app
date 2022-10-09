import { useEffect, useState } from "react";
import { FiExternalLink, FiX } from "react-icons/fi";
import { useRestaurant } from "../../context/restaurant-context";
import { ISubTab, ITab } from "../../model/model";

import "./menu.scss";

let electron: any;
let ipcRenderer: any;
try {
    electron = window.require("electron");
    ipcRenderer = electron.ipcRenderer;
} catch (e) {}

export const Menu = (props: { tabs: ITab[]; onClickMenuRoute: (route: string) => void; onHideMenu: () => void }) => {
    const { restaurant } = useRestaurant();
    const [selectedTabId, setSelectedTabId] = useState<string>("");
    const [subTabs, setSubTabs] = useState<ITab[] | null>(null);

    useEffect(() => {
        const ticker = setTimeout(() => {
            props.onHideMenu();
        }, 10 * 1000);

        return () => clearTimeout(ticker);
    }, []);

    if (!restaurant) return <></>;

    const selectTab = (tab: ITab) => {
        if (tab.route) {
            props.onClickMenuRoute(tab.route);
        } else if (subTabs && tab.subTabs) {
            setSelectedTabId("");
            setSubTabs(null);
        } else if (tab.subTabs) {
            setSelectedTabId(tab.id);
            setSubTabs(tab.subTabs);
        }
    };

    const selectSubTab = (subTab: ISubTab) => {
        if (subTab.route) {
            props.onClickMenuRoute(subTab.route);
        }
    };

    const selectTabExit = () => {
        ipcRenderer && ipcRenderer.send("EXIT_ELECTRON_APP");
    };

    return (
        <div className="menu">
            <div className="menu-header">
                <img className="menu-logo" alt="Tabin Logo" src={"https://tabin-public.s3-ap-southeast-2.amazonaws.com/logo/tabin-logo.png"} />
                <div>
                    <FiX className="payment-modal-close-button" size={36} onClick={props.onHideMenu} />
                </div>
            </div>
            <div className="separator-2"></div>
            <div className="text-bold">{restaurant.name}</div>
            <div className="separator-2"></div>
            {props.tabs.map((tab: ITab) => (
                <div key={tab.id} className="menu-tab-wrapper">
                    <div key={tab.id} onClick={() => selectTab(tab)} className="menu-tab">
                        <div className="menu-tab-icon">{tab.icon}</div>
                        <div className="menu-tab-text">{tab.name}</div>
                    </div>
                    {tab.id === selectedTabId &&
                        subTabs &&
                        subTabs.map((subTab) => (
                            <div key={subTab.id} onClick={() => selectSubTab(subTab)} className="menu-subTab">
                                <div className="menu-subTab-text">{subTab.name}</div>
                            </div>
                        ))}
                </div>
            ))}
            <div onClick={() => selectTabExit()} className="menu-tab-exit">
                <div className="menu-tab-icon-exit">
                    <FiExternalLink height="20px" />
                </div>
                <div className="menu-tab-text-exit">Exit</div>
            </div>
        </div>
    );
};
