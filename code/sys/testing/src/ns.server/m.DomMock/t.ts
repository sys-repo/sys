/**
 * Represents the overall DOM Mock Library.
 */
export type DomMockLib = {
  /** Ensure `globalThis` is polyfilled with window/document. */
  polyfill(): void;

  /** Returns the `globalThis` to it's original state. */
  unpolyfill(): void;

  /** Keyboard event utilities. */
  readonly Keyboard: DomMockKeyboardLib;
};

export type DomMockKeyboardLib = {
  /**
   * Creates a KeyboardEvent with the specified parameters.
   * @param type - The type of the event (e.g., 'keydown', 'keyup').
   * @param key - The key value of the key represented by the event.
   * @param keyCode - The numeric key code of the key represented by the event.
   * @param code - The physical key code (e.g., 'KeyZ'). Defaults to `Key${key.toUpperCase()}` if not provided.
   * @returns A new KeyboardEvent instance.
   */
  event(type: string, key?: string, keyCode?: number, code?: string): KeyboardEvent;

  /**
   * Creates a 'keydown' KeyboardEvent.
   * @param key - The key value. Defaults to 'z'.
   * @param keyCode - The key code. Defaults to 90.
   * @returns A new 'keydown' KeyboardEvent instance.
   */
  keydownEvent(key?: string, keyCode?: number): KeyboardEvent;

  /**
   * Creates a 'keyup' KeyboardEvent.
   * @param key - The key value. Defaults to 'z'.
   * @param keyCode - The key code. Defaults to 90.
   * @returns A new 'keyup' KeyboardEvent instance.
   */
  keyupEvent(key?: string, keyCode?: number): KeyboardEvent;

  /**
   * Dispatches a KeyboardEvent to the document. If no event is provided, it dispatches a default 'keydown' event.
   * @param event - The KeyboardEvent to dispatch. Defaults to a 'keydown' event if not provided.
   */
  fire(event?: KeyboardEvent): void;
};
