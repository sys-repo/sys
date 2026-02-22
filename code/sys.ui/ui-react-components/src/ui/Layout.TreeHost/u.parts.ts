import { type t, Color, D, Is, Num } from './common.ts';

export type TreeHostResolvedNavMotion =
  | {
      readonly kind: 'spring';
      readonly transition: {
        readonly type: 'spring';
        readonly stiffness: number;
        readonly damping: number;
        readonly mass: number;
        readonly bounce: number;
      };
    }
  | {
      readonly kind: 'tween';
      readonly transition: {
        readonly duration: number;
        readonly ease: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
      };
    };

export type TreeHostResolvedParts = {
  readonly header: { readonly backgroundColor?: t.StringHex };
  readonly nav: {
    readonly backgroundColor?: t.StringHex;
    readonly motion: TreeHostResolvedNavMotion;
  };
  readonly main: { readonly backgroundColor?: t.StringHex };
  readonly footer: { readonly backgroundColor?: t.StringHex };
};

export function resolveParts(props: t.TreeHost.Props): TreeHostResolvedParts {
  const theme = Color.theme(props.theme).name;
  const header = { ...D.parts.header, ...props.parts?.header };
  const nav = { ...D.parts.nav, ...props.parts?.nav };
  const main = { ...D.parts.main, ...props.parts?.main };
  const footer = { ...D.parts.footer, ...props.parts?.footer };

  return {
    header: { backgroundColor: resolvePartBackground(header.background, theme) },
    nav: {
      backgroundColor: resolvePartBackground(nav.background, theme),
      motion: resolveNavMotion(nav.motion, props.nav?.animate),
    },
    main: { backgroundColor: resolvePartBackground(main.background, theme) },
    footer: { backgroundColor: resolvePartBackground(footer.background, theme) },
  };
}

export function resolvePartBackground(
  input: t.TreeHost.PartBackground | undefined,
  theme: t.CommonTheme,
): t.StringHex | undefined {
  if (input === undefined || input === false) return undefined;
  if (input === true) return Color.theme(theme).bg;
  if (Is.func(input)) return input({ theme });
  return undefined;
}

export function resolveNavMotion(
  input: t.TreeHost.PartNavMotion | undefined,
  legacyAnimate?: t.TreeHost.NavAnimate,
): TreeHostResolvedNavMotion {
  if (!input && legacyAnimate) {
    return {
      kind: 'tween',
      transition: {
        duration: (legacyAnimate.duration ?? D.nav.animate.duration) / 1000,
        ease: legacyAnimate.ease ?? D.nav.animate.ease,
      },
    };
  }

  const motion = input ?? D.parts.nav.motion;
  if (motion.kind === 'preset') return presetNavMotion(motion.preset);

  const gentle = PRESET.gentle.transition;
  return {
    kind: 'spring',
    transition: {
      type: 'spring',
      stiffness: clamp(50, 1200, motion.stiffness ?? gentle.stiffness),
      damping: clamp(1, 200, motion.damping ?? gentle.damping),
      mass: clamp(0.1, 5, motion.mass ?? gentle.mass),
      bounce: clamp(0, 0.4, motion.bounce ?? gentle.bounce),
    },
  };
}

const PRESET = {
  gentle: {
    kind: 'spring',
    transition: { type: 'spring', stiffness: 380, damping: 40, mass: 0.95, bounce: 0.03 },
  },
  snappy: {
    kind: 'spring',
    transition: { type: 'spring', stiffness: 560, damping: 32, mass: 0.82, bounce: 0.12 },
  },
  none: {
    kind: 'tween',
    transition: { duration: 0.17, ease: 'easeInOut' },
  },
} as const satisfies Record<'gentle' | 'snappy', TreeHostResolvedNavMotion> & {
  none: Extract<TreeHostResolvedNavMotion, { kind: 'tween' }>;
};

function presetNavMotion(
  preset: t.TreeHost.PartNavMotionPreset['preset'],
): TreeHostResolvedNavMotion {
  return PRESET[preset];
}

function clamp(min: number, max: number, value: number) {
  return Num.clamp(min, max, value);
}
