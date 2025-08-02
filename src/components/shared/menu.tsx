import { useEffect, useState } from "react";
import { FiExternalLink, FiX } from "react-icons/fi";
import { useRestaurant } from "../../context/restaurant-context";
import { ERegisterType, ISubTab, ITab } from "../../model/model";
import config from "./../../../package.json";
import { useRegister } from "../../context/register-context";
import { BsDisplay } from "react-icons/bs";

import "./menu.scss";
import { useElectron } from "../../context/electron-context";

export const Menu = (props: { tabs: ITab[]; onClickMenuRoute: (route: string) => void; onHideMenu: () => void }) => {
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { send } = useElectron();

    const [selectedTabId, setSelectedTabId] = useState<string>("");
    const [subTabs, setSubTabs] = useState<ITab[] | null>(null);

    useEffect(() => {
        const ticker = setTimeout(() => {
            props.onHideMenu();
        }, 10 * 1000);

        return () => clearTimeout(ticker);
    }, []);

    if (!restaurant) return <></>;
    if (!register) return <></>;

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

    const selectOpenCustomerDisplay = () => {
        send("OPEN_CUSTOMER_DISPLAY");
    };

    const selectTabExit = () => {
        send("EXIT_ELECTRON_APP");
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
            <div className="text-bold">
                {restaurant.name} ({register.name})
            </div>
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
            {/* {register.type === ERegisterType.POS && ( */}
            <div onClick={() => selectOpenCustomerDisplay()} className="menu-tab-customer-display">
                <div className="menu-tab-icon-customer-display">
                    <BsDisplay height="20px" />
                </div>
                <div className="menu-tab-text-customer-display">Open Customer Display</div>
            </div>
            {/* )} */}
            <div onClick={() => selectTabExit()} className="menu-tab-exit">
                <div className="menu-tab-icon-exit">
                    <FiExternalLink height="20px" />
                </div>
                <div className="menu-tab-text-exit">Exit</div>
            </div>
            <div className="mt-2 text-center">{`Version: ${config.version}`}</div>
        </div>
    );
};
