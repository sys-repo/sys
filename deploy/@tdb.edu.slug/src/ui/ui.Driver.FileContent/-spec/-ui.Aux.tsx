import React from 'react';
import { type t, Color, css, Is } from './common.ts';

import { LogoCanvas } from '@tdb/slc-std/ui';
import type { CanvasPanel } from '@tdb/slc-std/t';

type O = Record<string, unknown>;

export type AuxSlotProps = {
  frontmatter?: O;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const AuxSlot: React.FC<AuxSlotProps> = (props) => {
  const selected = wrangle.canvasSections(props.frontmatter);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      padding: 40,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <LogoCanvas theme={theme.name} selected={selected} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  canvasSections(frontmatter?: O): CanvasPanel[] | undefined {
    if (!Is.record(frontmatter)) return;

    const tags = frontmatter.tags;
    if (!Is.record(tags)) return;

    const sections = tags['canvas-sections'];
    if (!Is.array(sections)) return;

    const ids = sections.filter((m): m is string => Is.str(m));
    return PANELS.filter((panel) => ids.some((id) => id.includes(panel)));
  },
} as const;

const PANELS: CanvasPanel[] = [
  'purpose',
  'impact',
  'problem',
  'solution',
  'metrics',
  'uvp',
  'advantage',
  'channels',
  'customers',
  'costs',
  'revenue',
];
