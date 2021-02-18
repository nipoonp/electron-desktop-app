import { useState, useEffect } from "react";
// https://github.com/jmarceli/react-hook-google-maps
/* global google */

const initialized: HTMLScriptElement[] = [];

export function useGoogleMapsApi(apiKey: string) {
  const [googleApi, setGoogleApi] = useState<typeof google | null>(null);

  useEffect(() => {
    // if window.google object is already available just use it
    if ((window as any).google) {
      setGoogleApi((window as any).google);
      return;
    }

    const onLoad = () => {
      setGoogleApi((window as any).google);
    };

    const src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      apiKey +
      "&libraries=places";

    const existingScript = initialized.find(el => el.src === src);

    // if script tag was added by other element just check when it is loaded
    if (existingScript) {
      existingScript.addEventListener("load", onLoad);
      return;
    }

    const script = document.createElement(`script`);
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener(`load`, onLoad);
    (document.head as any).appendChild(script);
    initialized.push(script);

    // cleanup
    return () => {
      script.removeEventListener(`load`, onLoad);
      script.remove();
      initialized.splice(
        initialized.findIndex(el => el.src === src),
        1
      );
    };
  }, [apiKey]);

  return googleApi;
}
