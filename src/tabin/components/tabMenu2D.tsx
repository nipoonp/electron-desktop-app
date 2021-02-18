import React, { useState } from "react";
import { useHistory } from "react-router";
import { landingPath } from "../../components/main";
// import { landingPath } from "../../components/main";

export interface ITab {
  id: string;
  name: string;
  icon: JSX.Element;
  subTabs: {
    id: string;
    name: string;
    component?: React.ReactNode;
  }[];
}

export default (props: {
  defaultTab: string;
  defaultSubTab: string;
  tabs: ITab[];
}) => {
  // context
  const history = useHistory();

  // states
  const [selectedTab, setSelectedTab] = useState(props.defaultTab);
  const [selectedSubTab, setSelectedSubTab] = useState(props.defaultSubTab);

  // callbacks
  const onSelectTab = (newID: any) => {
    const subTabs = props.tabs.filter((tab) => tab.id == newID)[0].subTabs;
    let subTab = "";

    //reset subTab to first one whenever we change tabs.
    if (subTabs.length > 0) {
      subTab = subTabs[0].id;
    }

    setSelectedTab(newID);
    setSelectedSubTab(subTab);
  };

  const onSelectSubTab = (newID: any) => {
    setSelectedSubTab(newID);
  };

  const onLogoClick = () => {
    history.push(landingPath);
  };

  //
  const subTabs = props.tabs.filter((tab) => tab.id == selectedTab)[0].subTabs;
  let component;

  if (selectedSubTab) {
    component = subTabs.filter((subTab) => subTab.id == selectedSubTab)[0]
      .component || <ComponentNotImplemented />;
  } else {
    component = <ComponentNotImplemented />;
  }

  // displays
  const logoDisplay = (
    <img
      onClick={onLogoClick}
      alt="Tabin Logo"
      style={{ width: "120px" }}
      src={
        "https://tabin-public.s3-ap-southeast-2.amazonaws.com/logo/tabin-logo.png"
      }
    />
  );

  return (
    <>
      <div>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            backgroundColor: "#f2f2f2",
          }}
        >
          <div
            style={{
              top: "32px",
              position: "fixed",
              width: "300px",
              borderRadius: "10px",
              backgroundColor: "white",
              boxShadow: "rgba(0, 0, 0, 0.02) 10px 10px 10px",
            }}
          >
            <div
              style={{
                width: "300px",
                height: "100px",
                display: "flex",
                alignItems: "center",
                padding: "0 32px",
              }}
            >
              <button>{logoDisplay}</button>
            </div>

            {props.tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                style={{
                  cursor: "pointer",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 32px",
                  fontSize: "18px",
                  fontWeight: 500,
                  margin: "32px 0",
                  color: tab.id == selectedTab ? "#484848" : "#c8c8c8",
                  borderRight:
                    tab.id == selectedTab
                      ? "3px solid var(--primary-color)"
                      : "",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    color: tab.id === selectedTab ? "var(--primary-color)" : "",
                  }}
                >
                  {tab.icon}
                </div>
                <div>{tab.name}</div>
              </div>
            ))}
          </div>

          <div style={{ flex: "1" }}>
            {subTabs.length > 1 && (
              <div
                style={{
                  margin: "32px",
                  marginLeft: "332px",
                  backgroundColor: "white",
                  borderRadius: "10px",
                  boxShadow: "rgba(0, 0, 0, 0.02) 10px 10px 10px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "18px",
                  fontWeight: 500,
                  color: "#c8c8c8",
                }}
              >
                {subTabs.map((subTab) => (
                  <div
                    key={subTab.id}
                    style={{
                      padding: "24px",
                      cursor: "pointer",
                      color: subTab.id == selectedSubTab ? "#484848" : "",
                    }}
                    onClick={() => onSelectSubTab(subTab.id)}
                  >
                    {subTab.name}
                  </div>
                ))}
              </div>
            )}
            <div style={{ padding: "32px", marginLeft: "300px" }}>
              {component}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ComponentNotImplemented = () => {
  return <div>Not Implemented</div>;
};
