// TS 2.4 min
type Diff<T extends string, U extends string> = ({ [P in T]: P } &
  { [P in U]: never } & { [x: string]: never })[T];
type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

namespace ReactAutosuggest {
  type Match = [number, number]; // start, finish
  type Value = string;

  interface InputProps<Suggestion = any>
    extends Omit<
      React.HTMLProps<HTMLInputElement>,
      "value" | "onChange" | "onBlur"
    > {
    value: Value;
    onChange(
      event: React.ChangeEvent<HTMLInputElement>,
      payload: {
        newValue: Value;
        method: "down" | "up" | "escape" | "enter" | "click" | "type";
      }
    ): void;
    onBlur?(
      event: React.FocusEvent<HTMLInputElement>,
      payload: { highlightedSuggestion: Suggestion | null }
    ): void;
  }

  // React.HTMLProps<HTMLInputElement> with mandatory onChange/value
  interface ControlledInputProps
    extends Omit<React.HTMLProps<HTMLInputElement>, "value" | "onChange"> {
    value: Value;
    onChange: React.EventHandler<React.ChangeEvent<HTMLInputElement>>;
  }
}

declare module "react-autosuggest" {
  interface Props<Suggestion, Section> {
    /** These are the suggestions that will be displayed. Items can take an arbitrary shape. */
    suggestions: Suggestion[] | Section[];

    /** Will be called every time you need to recalculate suggestions. */
    onSuggestionsFetchRequested(payload: {
      value: ReactAutosuggest.Value;
      reason:
        | "input-changed"
        | "input-focused"
        | "escape-pressed"
        | "suggestions-revealed"
        | "suggestion-selected";
    }): void;

    /** Will be called every time you need to set suggestions to []. Required unless alwaysRenderSuggestions={true} */
    onSuggestionsClearRequested?(): void;

    /** Implement it to teach Autosuggest what should be the input value when suggestion is clicked. */
    getSuggestionValue(suggestion: Suggestion): string;

    /** Use your imagination to define how suggestions are rendered. */
    renderSuggestion(
      suggestion: Suggestion,
      payload: { query: string; isHighlighted: boolean }
    ): void;

    /** Pass through arbitrary props to the input element. It must contain at least value and onChange. */
    inputProps: ReactAutosuggest.InputProps<Suggestion>;

    /** Will be called every time suggestion is selected via mouse or keyboard. */
    onSuggestionSelected?(
      event: React.FormEvent<HTMLInputElement>,
      payload: {
        suggestion: Suggestion;
        suggestionValue: ReactAutosuggest.Value;
        suggestionIndex: number;
        sectionIndex: number | null;
        method: "click" | "enter";
      }
    ): void;

    /** When the input element is focused, Autosuggest will consult this function when to render suggestions. Use it, for example, if you want to display suggestions when input value is at least 2 characters long. */
    shouldRenderSuggestions?(value: ReactAutosuggest.Value): boolean;

    /** Set it to true if you'd like to render suggestions even when the input element is not focused. */
    alwaysRenderSuggestions?: boolean;

    /** Set it to true if you'd like Autosuggest to automatically highlight the first suggestion. */
    highlightFirstSuggestion?: boolean;

    /** Set it to false if you don't want Autosuggest to keep the input element focused when suggestions are clicked/tapped. */
    focusInputOnSuggestionClick?: boolean;

    /** Set it to true if you'd like to display suggestions in multiple sections (with optional titles). */
    multiSection?: boolean;

    /** Use your imagination to define how section titles are rendered. Required when multiSection={true}	 */
    renderSectionTitle?(section: Section): string | JSX.Element;

    /** Implement it to teach Autosuggest where to find the suggestions for every section. Required when multiSection={true} */
    getSectionSuggestions?(section: Section): Suggestion[];

    /** Use it only if you need to customize the rendering of the input element. */
    renderInputComponent?(
      inputProps: ReactAutosuggest.ControlledInputProps
    ): JSX.Element;

    /** Use it if you want to customize things inside the suggestions container beyond rendering the suggestions themselves. */
    renderSuggestionsContainer?(payload: {
      containerProps: React.HTMLProps<HTMLDivElement>;
      children: (Suggestion | Section)[];
      query: string;
    }): void;

    /** Use your imagination to style the Autosuggest. */
    theme?: {
      container?: string | React.CSSProperties;
      containerOpen?: string | React.CSSProperties;
      input?: string | React.CSSProperties;
      inputOpen?: string | React.CSSProperties;
      inputFocused?: string | React.CSSProperties;
      suggestionsContainer?: string | React.CSSProperties;
      suggestionsContainerOpen?: string | React.CSSProperties;
      suggestionsList?: string | React.CSSProperties;
      suggestion?: string | React.CSSProperties;
      suggestionFirst?: string | React.CSSProperties;
      suggestionHighlighted?: string | React.CSSProperties;
      sectionContainer?: string | React.CSSProperties;
      sectionContainerFirst?: string | React.CSSProperties;
      sectionTitle?: string | React.CSSProperties;
    };

    /** Use it only if you have multiple Autosuggest components on a page. Required when multiple Autosuggest components are rendered on a page. */
    id?: string;
  }

  type Autosuggest<Suggestion = any, Section = void> = React.Component<
    Props<Suggestion, Section>,
    {}
  >;

  const Autosuggest: {
    prototype: Autosuggest;
    new (): Autosuggest;
  };

  export = Autosuggest;
}

declare module "autosuggest-highlight/match" {
  const match: (label: string, query: string) => ReactAutosuggest.Match[];
  export = match;
}

declare module "autosuggest-highlight/parse" {
  const parse: (
    label: string,
    matches: ReactAutosuggest.Match[]
  ) => { highlight: boolean; text: string }[];
  export = parse;
}
