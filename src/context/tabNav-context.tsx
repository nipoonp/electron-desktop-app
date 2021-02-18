import React, { useState, useEffect } from "react";
import { Logger } from "aws-amplify";
import { isMobile } from "react-device-detect";

const logger = new Logger("tabNavContext");

// CONTEXT
type ContextProps = {
  selectedTab: Tab; // for tabNav component
  tabsHidden: boolean; // for tabNav component
  setSelectedTab: (tab: Tab) => void; // for pages and tabNav component
  setTabsHidden: (tabsHidden: boolean) => void; // for pages
};

type Tab = "explore" | "orders" | "login" | "profile" | "rewards";

// INITIAL VALUES
const TabNavContext = React.createContext<ContextProps>({
  selectedTab: "explore",
  setSelectedTab: () => {},
  tabsHidden: false,
  setTabsHidden: () => {}
});

// EXPORTS
const TabNavProvider = (props: { children: React.ReactNode }) => {
  const [selectedTab, _setSelectedTab] = useState<Tab>("explore");
  const [tabsHidden, _setTabsHidden] = useState<boolean>(true);

  const setSelectedTab = (tab: Tab) => {
    logger.debug("Setting tab: ", tab);
    _setSelectedTab(tab);
  };

  const setTabsHidden = (hidden: boolean) => {
    logger.debug("Setting tab: ", hidden);
    _setTabsHidden(hidden);
  };

  return (
    // Default 60px margin if mobile (to account for tabNav)
    <div style={isMobile && !tabsHidden ? { marginBottom: "60px" } : {}}>
      <TabNavContext.Provider
        value={{
          selectedTab,
          setSelectedTab,
          tabsHidden,
          setTabsHidden
        }}
        children={props.children}
      />
    </div>
  );
};

const useTabNav = () => {
  const context = React.useContext(TabNavContext);

  if (context === undefined) {
    throw new Error(`useTabNav must be used within a TabNavContext`);
  }

  return context;
};

export { TabNavProvider, useTabNav };
