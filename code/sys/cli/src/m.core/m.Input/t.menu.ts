/**
 * Discrete outcomes returned from a menu interaction.
 *
 * Semantics:
 * - `exit` → terminate the menu entirely.
 * - `back` → navigate to the previous menu level.
 * - `stay` → remain on the current menu.
 *
 * The canonical `CliInput.Menu.ResultKind` type is derived from this literal source.
 */
export const MenuResultKind = {
  Exit: 'exit',
  Back: 'back',
  Stay: 'stay',
} as const;
