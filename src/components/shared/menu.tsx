import { useState } from "react";
import { useRestaurant } from "../../context/restaurant-context";
import { ISubTab, ITab } from "../../model/model";

import "./menu.scss";

export const Menu = (props: { tabs: ITab[]; onClickMenuRoute: (route: string) => void }) => {
    const { restaurant } = useRestaurant();
    const [selectedTabId, setSelectedTabId] = useState<string>("");
    const [subTabs, setSubTabs] = useState<ITab[] | null>(null);

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

    return (
        <div className="menu">
            <img className="menu-logo" alt="Tabin Logo" src={"https://tabin-public.s3-ap-southeast-2.amazonaws.com/logo/tabin-logo.png"} />
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
        </div>
    );
};
