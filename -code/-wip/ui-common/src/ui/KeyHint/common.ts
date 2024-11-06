import { pkg, type t } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
const os: t.UserAgentOSKind = 'macOS';

const modifiers = {
  macOS: { meta: '⌘', alt: '⌥', ctrl: '⇧', shift: '⌃' },
  posix: { meta: '⊞', alt: 'Alt', ctrl: 'Ctrl', shift: 'Shift' },
  windows: { meta: '⊞', alt: 'Alt', ctrl: 'Ctrl', shift: 'Shift' },
};

export const DEFAULTS = {
  displayName: {
    KeyHint: `${pkg.name}.KeyHint`,
    KeyHintCombo: `${pkg.name}.KeyHint.Combo`,
  },
  modifiers,
  os,
  text: '⍰',
  parse: true,
  enabled: true,
} as const;
