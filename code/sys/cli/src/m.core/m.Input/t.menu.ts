/**
 * Discrete outcomes returned from a menu interaction.
 *
 * Semantics:
 * - `exit` → terminate the menu entirely.
 * - `back` → navigate to the previous menu level.
 * - `stay` → remain on the current menu.
 *
 * Used as:
 * - a bare `MenuResultKind` value, or
 * - an object wrapper `{ kind }` when future metadata is needed.
 */
export const MenuResultKind = {
  Exit: 'exit',
  Back: 'back',
  Stay: 'stay',
} as const;

/**
 * Union of all valid menu result discriminants.
 */
export type MenuResultKind = (typeof MenuResultKind)[keyof typeof MenuResultKind];

/**
 * Result returned from a menu handler.
 *
 * Forms:
 * - `undefined` → no-op / ignored input.
 * - `MenuResultKind` → shorthand result.
 * - `{ kind }` → structured result.
 */
export type MenuResult =
  | {
      /** Structured menu result discriminant. */
      readonly kind: MenuResultKind;
    }
  | MenuResultKind
  | undefined;
