import React, { useState } from "react";
// https://react-google-maps-api-docs.netlify.com
import { GoogleMap } from "@react-google-maps/api";
import { Logger } from "aws-amplify";
import ReactDOM from "react-dom";

const styles = require("./googleMapSelectLocation.module.css");
const logger = new Logger("googleMaps");
/* global google */

/*

  Allows selection a location on a map

  example: https://codesandbox.io/s/react-google-maps-api-h1044

  Usage:
    <GoogleMapSelectLocation onLocationSave={onLocationSave} center={location!} />

*/

// TODO: use useGoogleMaps hook to get a map reference

export const GoogleMapSelectLocation = (props: {
  center: { lat: number; lng: number };
  onLocationSave: (location: { lat: number; lng: number }) => void;
}) => {
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(props.center);

  const onCenterChanged = () => {
    if (mapRef) {
      const newCenter = mapRef.getCenter();
      logger.debug("Maps center: ", newCenter.toJSON());
      setCenter(newCenter.toJSON());
    }
  };

  const onLocationSave = (location: { lat: number; lng: number }) => {
    props.onLocationSave(location);
  };

  const loadHandler = (map: google.maps.Map) => {
    // Store a reference to the google map instance in state
    setMapRef(map);

    // create custom control
    let controlButton = document.createElement("div");
    ReactDOM.render(
      <>
        <AdjustButton onSave={onLocationSave} map={map}></AdjustButton>
      </>,
      controlButton
    );
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlButton);
  };

  return (
    <GoogleMap
      id="map"
      mapContainerClassName={styles.mapContainer} // for centering marker always
      mapContainerStyle={{
        height: "100%",
        width: "100%",
        position: "relative"
      }}
      zoom={18}
      onLoad={loadHandler}
      center={props.center}
      onCenterChanged={onCenterChanged}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        mapTypeControl: false
      }}
    >
      {/* Use for checking the manual marker position (in googleMap.module.css) */}
      {/* <Marker position={center} /> */}
    </GoogleMap>
  );
};

const AdjustButton = (props: {
  map: google.maps.Map;
  onSave: (location: { lat: number; lng: number }) => void;
}) => {
  const [mapFixed, setMapFixed] = useState(true);

  const onAdjustButtonClick = () => {
    if (!mapFixed) {
      props.onSave({
        lat: props.map.getCenter().lat(),
        lng: props.map.getCenter().lng()
      });
    }
    setMapFixed(!mapFixed);
  };

  props.map.set("draggable", !mapFixed);
  props.map.set("draggableCursor", mapFixed ? "default" : "grab");

  return (
    <>
      <button
        onClick={onAdjustButtonClick}
        style={{
          fontSize: "20px",
          borderRadius: "4px",
          backgroundColor: "white",
          padding: "10px 20px",
          margin: "20px"
        }}
      >
        {mapFixed ? "Adjust" : "Save"}
      </button>
    </>
  );
};
