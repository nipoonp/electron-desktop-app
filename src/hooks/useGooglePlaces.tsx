import { useState, useEffect } from "react";
import { useGoogleMapsApi } from "./useGoogleMapsApi";

/* global google */

export const useGooglePlaces = (apiKey: string) => {
  const googleApi = useGoogleMapsApi(apiKey);
  const [places, setPlaces] = useState<google.maps.places.PlacesService | null>(
    null
  );

  useEffect(() => {
    if (!googleApi) {
      return;
    }

    setPlaces(
      // use a map or a div
      new google.maps.places.PlacesService(document.createElement("div"))
    );
  }, [googleApi]);

  const placeRequest = (request: google.maps.places.PlaceDetailsRequest) => {
    return new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
      if (!places) {
        throw new Error("Places service is not loaded");
      }

      places.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(place);
        } else {
          reject();
        }
      });
    });
  };

  const getFormattedAddressAndLatLng = (placeID: string) => {
    const request = {
      placeId: placeID,
      fields: ["address_components", "formatted_address", "geometry"]
    };

    return placeRequest(request).then(r => {
      // https://developers.google.com/maps/documentation/geocoding/intro#Types
      if (!r.geometry || !r.formatted_address) {
        throw "Must specify ['formatted_address', 'geometry'] in google.maps.places.PlaceDetailsRequest";
      }

      const lat = r.geometry.location.lat();
      const lng = r.geometry.location.lng();
      const formattedAddress = r.formatted_address;

      return { lat, lng, formattedAddress };
    });
  };

  return { places, googleApi, getFormattedAddressAndLatLng };
};
