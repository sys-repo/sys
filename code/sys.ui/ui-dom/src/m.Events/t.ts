/**
 * Represents the base properties of a UI event in the Document Object Model (DOM).
 *
 * @typedef {Object} UIEventBase
 * @property {boolean} bubbles - Indicates whether the event bubbles up through the DOM or not.
 * @property {boolean} cancelable - Indicates whether the event's default action can be prevented.
 * @property {number} eventPhase - Specifies the current phase of the event flow (capturing, at target, bubbling).
 * @property {number} timeStamp - The time at which the event was created.
 * @property {boolean} isTrusted - Indicates whether the event was initiated by the browser (trusted) or by script (untrusted).
 */
export type UIEventBase = {
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly eventPhase: number;
  readonly timeStamp: number;
  readonly isTrusted: boolean;
};

/**
 * Represents the state of modifier keys during a UI event.
 *
 * @typedef {Object} UIModifierKeys
 * @property {boolean} altKey - Indicates if the Alt (Option) key was pressed.
 * @property {boolean} ctrlKey - Indicates if the Control key was pressed.
 * @property {boolean} metaKey - Indicates if the Meta key (e.g., Command key on Mac keyboards) was pressed.
 * @property {boolean} shiftKey - Indicates if the Shift key was pressed.
 */
export type UIModifierKeys = {
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
};
