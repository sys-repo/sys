import { type t } from './common.ts';

let _userHasInteracted = false as boolean;

/** Tracks whether the user has interacted with the current browser window. */
export const UserHas: t.UserHas.Lib = {
  get interacted() {
    return _userHasInteracted;
  },
};

/**
 * Initial environment monitor:
 */
function listen() {
  /**
   * NB: enables capture-mode to catch the events before they reach any other listener.
   */
  const capture = true;

  // Listen for first gesture:
  function onFirstGesture() {
    _userHasInteracted = true;
    window.removeEventListener('click', onFirstGesture, capture);
    window.removeEventListener('keydown', onFirstGesture, capture);
    window.removeEventListener('touchstart', onFirstGesture, capture);
  }

  window.addEventListener('click', onFirstGesture, capture);
  window.addEventListener('keydown', onFirstGesture, capture);
  window.addEventListener('touchstart', onFirstGesture, capture);
}

if (globalThis.window) listen();
