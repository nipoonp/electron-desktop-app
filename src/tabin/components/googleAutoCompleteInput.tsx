import React, { useState, HTMLProps, useEffect } from "react";
import { useGoogleAutoComplete } from "../../hooks/useGoogleAutoComplete";
import Autosuggest from "react-autosuggest";
import { Logger } from "aws-amplify";
import { debounce } from "lodash";
import { useGooglePlaces } from "../../hooks/useGooglePlaces";
import { LocationIconFilled } from "./locationIconFilled";

/* global google */

const logger = new Logger("googleAutoComplete");
const debounceTime = 200;

/*
This component should be used like how <input> is used

An input bar that shows addresses as the user types
Usage:
  <GoogleAutoComplete
     initialValue = { _formattedAddress }
     onSelectedAddress = { onSelectedAddress }
     onChange = { onAddressChange } // do anything when input changes
    />
*/

type AutosuggestTheme = {
  container?: React.CSSProperties;
  containerOpen?: React.CSSProperties;
  input?: React.CSSProperties;
  inputOpen?: React.CSSProperties;
  inputFocused?: React.CSSProperties;
  suggestionsContainer?: React.CSSProperties;
  suggestionsContainerOpen?: React.CSSProperties;
  suggestionsList?: React.CSSProperties;
  suggestion?: React.CSSProperties;
  suggestionFirst?: React.CSSProperties;
  suggestionHighlighted?: React.CSSProperties;
  sectionContainer?: React.CSSProperties;
  sectionContainerFirst?: React.CSSProperties;
  sectionTitle?: React.CSSProperties;
};

const defaultAutoSuggestTheme: AutosuggestTheme = {
  container: {
    position: "relative",
    width: "100%"
  },
  input: {
    height: "46px",
    fontSize: "16px",
    border: "1px solid #ebebeb",
    width: "100%",
    padding: "10px",
    borderRadius: "4px"
  },
  inputFocused: {
    outline: "none"
  },
  inputOpen: {
    borderBottomLeftRadius: "0",
    borderBottomRightRadius: "0"
  },
  suggestionsContainerOpen: {
    boxShadow: "rgba(26, 26, 29, 0.3) 0px 15px 46px -10px",
    position: "absolute",
    top: "100%",
    width: "100%",
    zIndex: 1,
    backgroundColor: "white",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgb(235, 235, 235)",
    borderRadius: "0px 0px 4px 4px",
    margin: "0px",
    overflow: "hidden",
    visibility: "visible",
    padding: "8px 0px 0px",
    display: "block"
  },
  suggestionsList: {
    margin: "0",
    padding: "0",
    listStyleType: "none"
  },
  suggestion: {
    cursor: "pointer",
    padding: "10px 0px",
    overflowWrap: "break-word",
    color: "rgb(72, 72, 72)"
  },
  suggestionHighlighted: {
    backgroundColor: "rgb(242, 242, 242)"
  }
};

export const GoogleAutoCompleteInput = (props: {
  // can be a constant / state
  initialValue?: string;

  // if value is provided, this component becomes controlled
  value?: string;

  // callbacks
  onSelectedAddress?: (address: string, lat: number, lng: number) => void;
  onInputChange?: (
    event: React.ChangeEvent<HTMLInputElement>,
    payload: {
      newValue: string;
      method: "type" | "down" | "up" | "escape" | "enter" | "click";
    }
  ) => void;
  onInputFocus?: () => void;
  onInputBlur?: (
    event: React.FocusEvent<HTMLInputElement>,
    payload: {
      highlightedSuggestion: any;
    }
  ) => void;

  // settings
  alwaysRenderSuggestions?: boolean;
  highlightFirstSuggestion?: boolean;
  placeholder?: string;

  // styling
  autosuggestTheme?: AutosuggestTheme;

  // used for customizing beyond rendering
  renderSuggestion?: (
    suggestion: google.maps.places.AutocompletePrediction
  ) => JSX.Element;
  renderInputComponent?: (
    inputProps: ReactAutosuggest.ControlledInputProps
  ) => JSX.Element;
  renderSuggestionsContainer?: (payload: {
    containerProps: HTMLProps<HTMLDivElement>;
    children: any[];
    query: string;
  }) => void;
}) => {
  // context
  const { autoComplete, getPrediction } = useGoogleAutoComplete(
    process.env.REACT_APP_GOOGLE_MAPS_KEY!
  );
  const { places, getFormattedAddressAndLatLng } = useGooglePlaces(
    process.env.REACT_APP_GOOGLE_MAPS_KEY!
  );

  // states
  const [inputValue, setInputValue] = useState(
    props.value ? props.value : props.initialValue!
  );
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [autosuggestTheme, setAutoSuggestTheme] = useState(
    defaultAutoSuggestTheme
  );

  useEffect(() => {
    // controlled
    logger.debug("parents's value changed");
    if (typeof props.value !== "undefined") {
      setInputValue(props.value);
    }
  }, [props.value]);

  useEffect(() => {
    setAutoSuggestTheme({
      ...defaultAutoSuggestTheme,
      ...props.autosuggestTheme
    });
  }, [props.autosuggestTheme]);

  // functions
  const fetchResults = debounce((inputValue: string) => {
    getPrediction({
      input: inputValue,
      // https://developers.google.com/places/supported_types#table3
      // types: ["geocode"],
      // types: ["address"],
      // types: ["region"],
      componentRestrictions: { country: "nz" }
    })
      .then(result => {
        setSuggestions(result ? result : []);
      })
      .catch(e => {
        logger.debug("Error: ", e);
      })

      .finally(() => {
        setLoadingResults(false);
      });
  }, debounceTime);

  // autoSuggest props
  const onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    payload: {
      newValue: string;
      method: "type" | "down" | "up" | "escape" | "enter" | "click";
    }
  ) => {
    // if controlled
    if (props.value && props.onInputChange) {
      props.onInputChange(event, payload);
    } else {
      setInputValue(payload.newValue);
      props.onInputChange && props.onInputChange(event, payload);
    }
  };

  const onFocus = () => {
    if (props.onInputFocus) {
      props.onInputFocus();
    }
  };

  const onBlur = (
    event: React.FocusEvent<HTMLInputElement>,
    payload: {
      highlightedSuggestion: any;
    }
  ) => {
    if (props.onInputBlur) {
      props.onInputBlur(event, payload);
    }
  };

  function getSuggestionValue(
    suggestion: google.maps.places.AutocompletePrediction
  ) {
    return suggestion.description;
  }

  const onSuggestionsFetchRequested = async (payload: {
    value: string;
    reason:
      | "input-changed"
      | "input-focused"
      | "escape-pressed"
      | "suggestions-revealed"
      | "suggestion-selected";
  }) => {
    setLoadingResults(true);
    fetchResults(payload.value);
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const onSuggestionSelected = (
    event: React.FormEvent<HTMLInputElement>,
    payload: {
      suggestion: google.maps.places.AutocompletePrediction;
      suggestionValue: string;
      suggestionIndex: number;
      sectionIndex: number | null;
      method: "click" | "enter";
    }
  ) => {
    logger.debug("Selected: ", payload.suggestion);
    getFormattedAddressAndLatLng(payload.suggestion.place_id)
      .then(r => {
        if (props.onSelectedAddress) {
          props.onSelectedAddress(r.formattedAddress, r.lat, r.lng);
        }
      })
      .catch(e => {
        logger.error(
          "Failed to get formatted address and latlng from google place: ",
          e
        );
      });
  };

  function renderSuggestion(
    suggestion: google.maps.places.AutocompletePrediction
  ) {
    if (props.renderSuggestion) {
      return props.renderSuggestion(suggestion);
    } else {
      return <span>{suggestion.description}</span>;
    }
  }

  // displays
  if (autoComplete) {
    return (
      <>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={onSuggestionsFetchRequested}
          onSuggestionsClearRequested={onSuggestionsClearRequested}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          highlightFirstSuggestion={props.highlightFirstSuggestion}
          focusInputOnSuggestionClick={false}
          inputProps={{
            placeholder: props.placeholder,
            value: inputValue,
            onChange: onChange,
            onFocus: onFocus,
            onBlur: onBlur
          }}
          renderInputComponent={props.renderInputComponent}
          renderSuggestionsContainer={props.renderSuggestionsContainer}
          onSuggestionSelected={onSuggestionSelected}
          theme={autosuggestTheme}
          alwaysRenderSuggestions={props.alwaysRenderSuggestions}
        />
      </>
    );
  }
  return <></>;
};

GoogleAutoCompleteInput.defaultProps = {
  initialValue: "",
  highlightFirstSuggestion: true,
  alwaysRenderSuggestions: false,
  renderSuggestion: (suggestion: google.maps.places.AutocompletePrediction) => {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgb(241,241,241)",
              minWidth: "48px",
              height: "48px",
              borderRadius: "8px",
              border: "1px solid rgba(176,176,176,0.2)",
              marginRight: "16px"
            }}
          >
            <LocationIconFilled height={"22px"} />
          </div>
          <div>
            <span style={{ WebkitTextSizeAdjust: "none", fontSize: "14px" }}>
              {suggestion.description}
            </span>
          </div>
        </div>
      </>
    );
  }
};
