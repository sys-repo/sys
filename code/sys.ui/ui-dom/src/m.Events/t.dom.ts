/**
 * DOM UI event contracts.
 */
export declare namespace UIEvent {
  /** Base properties of a UI event in the DOM. */
  export type Base = {
    readonly bubbles: boolean;
    readonly cancelable: boolean;
    readonly eventPhase: number;
    readonly timeStamp: number;
    readonly isTrusted: boolean;
  };

  /** Modifier key state carried by a UI event. */
  export type ModifierKeys = {
    readonly altKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
  };
}
