import React from 'react';
import {
  type t,
  Str,
  Color,
  css,
  D,
  EffectController,
  KeyValue,
  ObjectView,
  Player,
} from './common.ts';

export type DriverInfoProps = {
  title?: string;
  controller?: t.SlugPlaybackController;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component: Diagnostic panel showing SlugPlaybackController state.
 */
export const DriverInfo: React.FC<DriverInfoProps> = (props) => {
  const { debug = false, title = D.name, controller } = props;

  /**
   * Hooks:
   */
  const state = EffectController.useEffectController(controller);
  const selectedPath = state?.selectedPath;
  const path = selectedPath ? `/${Str.trimLeadingSlashes(selectedPath?.join('/'))}` : '-';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  const mono = true;
  const items: t.KeyValueItem[] = [{ kind: 'title', v: title }];
  const add = (k: string, v: t.ReactNode) => items.push({ k, v, mono });
  const hr = () => items.push({ kind: 'hr' });

  add('base url', controller?.props.baseUrl ?? '-');
  add('selected path', Str.ellipsize(path, 45, '..'));
  add('slug', state?.bundle?.docid ?? '-');
  add('timeline', wrangle.bundle(state));
  hr();
  add('loading', String(state?.isLoading ?? false));
  add('error', state?.error?.message ?? '-');

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI items={items} theme={theme.name} />

      {debug && <ObjectView name={'state'} data={state} style={{ marginTop: 6 }} expand={1} />}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  bundle(state?: t.SlugPlaybackState) {
    const spec = state?.bundle?.spec;
    if (!spec) return '-';

    const total = { segs: spec.composition.length, beats: spec.beats.length };
    const plural = {
      segs: Str.plural(total.segs, 'segment', 'segments'),
      beats: Str.plural(total.beats, 'beat', 'beats'),
    };

    return `${total.segs}-${plural.segs} / ${total.beats}-${plural.beats}`;
  },
} as const;
