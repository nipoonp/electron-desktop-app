import { useState, useEffect } from "react";
import { useGoogleMapsApi } from "./useGoogleMapsApi";
/* global google */

export const useGoogleAutoComplete = (apiKey: string) => {
  const googleApi = useGoogleMapsApi(apiKey);
  const [
    autoComplete,
    setAutoComplete,
  ] = useState<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    if (!googleApi) {
      return;
    }

    setAutoComplete(new google.maps.places.AutocompleteService());
  }, [googleApi]);

  const getPrediction = (options: google.maps.places.AutocompletionRequest) => {
    return new Promise<google.maps.places.AutocompletePrediction[]>(
      (resolve, reject) => {
        if (!autoComplete) {
          throw new Error("Autocomplete service is not loaded");
        }

        autoComplete.getPlacePredictions(options, (result, status) => {
          switch (status) {
            case google.maps.places.PlacesServiceStatus.OK:
              resolve(result);
              break;
            // case google.maps.places.PlacesServiceStatus.ERROR:
            //   reject(new Error("ERROR"));
            //   break;
            case google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
              reject(new Error("INVALID_REQUEST"));
              break;
            case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
              reject(new Error("OVER_QUERY_LIMIT"));
              break;
            case google.maps.places.PlacesServiceStatus.NOT_FOUND:
              reject(new Error("NOT_FOUND"));
              break;
            case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
              reject(new Error("REQUEST_DENIED"));
              break;
            case google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR:
              reject(new Error("UNKNOWN_ERROR"));
              break;
            case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
              reject(new Error("ZERO_RESULTS"));
              break;
          }
        });
        return;
      }
    );
  };

  return { autoComplete, googleApi, getPrediction };
};
