import React from 'react';
import { type t, BulletList, Button, Color, css, Signal } from './common.ts';

export type FontStyleProps = {
  debug: t.DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const WEIGHTS: Record<t.Fonts.FontName, readonly t.FontWeight[]> = {
  ETBook: [400, 600, 700],
  SourceSans3: [200, 300, 400, 500, 600, 700, 800, 900],
};

const ITALIC_WEIGHTS: Record<t.Fonts.FontName, readonly t.FontWeight[]> = {
  ETBook: [400],
  SourceSans3: WEIGHTS.SourceSans3,
};

/**
 * Component:
 */
export const FontStyle: React.FC<FontStyleProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  const font = (v.font ?? 'ETBook') as t.Fonts.FontName;
  const resolved = resolveStyle(font, v.weight, v.italic);
  const selected = String(resolved.weight);

  React.useEffect(() => {
    if (p.weight.value !== resolved.weight) p.weight.value = resolved.weight;
    if (Boolean(p.italic.value) !== resolved.italic) p.italic.value = resolved.italic;
  }, [p, resolved.italic, resolved.weight]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      gap: 8,
      marginTop: 8,
    }),
    title: css({
      fontSize: 11,
      fontWeight: 600,
      opacity: 0.6,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>Font Style</div>

      <Button
        block
        label={() => `italic: ${resolved.italic}`}
        onClick={() => Signal.toggle(p.italic)}
      />

      <BulletList.UI
        theme={theme.name}
        selected={selected}
        columns={2}
        items={WEIGHTS[font].map((weight) => ({
          id: String(weight),
          label: `weight: ${weight}`,
        }))}
        onSelect={(e) => (p.weight.value = Number(e.id) as t.FontWeight)}
      />
    </div>
  );
};

/**
 * Helpers
 */
export function resolveStyle(
  font: t.Fonts.FontName,
  weight: t.FontWeight | undefined,
  italic: boolean | undefined,
): { readonly weight: t.FontWeight; readonly italic: boolean } {
  const normalWeights = WEIGHTS[font];
  const italicWeights = ITALIC_WEIGHTS[font];
  const requestedWeight = weight ?? normalWeights[0];
  const nextItalic = Boolean(italic) && italicWeights.length > 0;
  const allowed = nextItalic ? italicWeights : normalWeights;
  const nextWeight = allowed.includes(requestedWeight) ? requestedWeight : allowed[0];
  return {
    weight: nextWeight,
    italic: nextItalic,
  };
}
