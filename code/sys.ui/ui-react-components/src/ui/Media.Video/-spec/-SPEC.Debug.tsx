import React from 'react';
import { Media } from '../../Media/mod.ts';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, Obj, Signal } from '../common.ts';

type P = t.MediaVideoStreamProps;
const Filters = Media.Filters;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const initial = { filters: Filters.values(Obj.keys(Filters.config)) } as const;

  const props = {
    debug: s(false),
    selectedCamera: s<MediaDeviceInfo>(),
    filters: s(initial.filters),

    theme: s<P['theme']>('Dark'),
    filter: s<P['filter']>(Filters.toString(initial.filters)),
    borderRadius: s<P['borderRadius']>(),
    aspectRatio: s<P['aspectRatio']>(),
  };
  const p = props;

  const api = {
    props,
    listen() {
      p.debug.value;
      p.selectedCamera.value;
      p.theme.value;
      p.filter.value;
      p.filters.value;
      p.borderRadius.value;
      p.aspectRatio.value;
    },
  };
  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Media.Devices.UI.List
        filter={(e) => e.kind === 'videoinput'}
        selected={p.selectedCamera.value}
        onSelect={(e) => (p.selectedCamera.value = e.info)}
      />
      <Media.Filters.UI.List
        style={{ margin: 20 }}
        values={p.filters.value}
        onChange={(e) => (p.filters.value = e.values)}
        onChanged={(e) => {
          console.info('⚡️ Filters.onChanged:', e);
          p.filter.value = e.filter;
        }}
      />

      <hr />

      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => {
          const v = p.borderRadius.value;
          return `borderRadius: ${v ?? `<undefined> (default: ${D.borderRadius})`}`;
        }}
        onClick={() => Signal.cycle(p.borderRadius, [undefined, 5, 10, 30])}
      />
      <Button
        block
        label={() => {
          const v = p.aspectRatio.value;
          return `aspectRatio: ${v ?? `<undefined>`}`;
        }}
        onClick={() => Signal.cycle(p.aspectRatio, [undefined, '16/9', '16/10', '21/9'])}
      />

      <hr />
      {filterSampleButtons(p.filter)}

      <hr />
      <ObjectView name={'debug'} data={Signal.toObject(debug.props)} expand={['$']} />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export function filterSampleButtons(signal: t.Signal<P['filter']>) {
  const btn = (label: string, filter?: string) => {
    return (
      <Button
        key={`${label}.${filter}`}
        block
        label={() => label}
        onClick={() => (signal.value = filter)}
        style={{ marginLeft: 20 }}
      />
    );
  };
  return (
    <React.Fragment>
      <div className={Styles.title.class}>{'Filter Samples'}</div>
      {btn('none - <undefined>', undefined)}
      {Object.entries(FILTER_SAMPLES).map(([key, value]) => btn(key, value))}
    </React.Fragment>
  );
}

export const FILTER_SAMPLES = {
  /** “Blown-out spotlight” (extreme) */
  blowOut: 'brightness(180%) contrast(130%) saturate(70%)',

  /** High-key over-exposure (strong but still usable for faces) */
  highKey: 'brightness(160%) contrast(120%) saturate(80%)',

  /** Neutral daylight pop (balanced, vivid) */
  vividPop: 'brightness(115%) contrast(110%) saturate(150%)',

  /** Soft pastel wash (desaturated, low contrast) */
  pastelSoft: 'brightness(110%) contrast(90%) saturate(70%)',

  /** Classic noir (monochrome with punchy tones) */
  noir: 'grayscale(100%) contrast(125%) brightness(110%)',

  /** Vintage sepia */
  sepia: 'sepia(85%) contrast(100%) brightness(105%)',

  /** Warm sunset tint */
  warmTint: 'hue-rotate(-20deg) saturate(120%) brightness(110%)',

  /** Cool arctic tint */
  coolTint: 'hue-rotate(190deg) saturate(120%) brightness(110%)',

  /** Muted documentary (flat, slightly desat) */
  muted: 'saturate(60%) contrast(95%) brightness(105%)',

  /** Dreamy blur-soft focus */
  dreamyBlur: 'blur(4px) brightness(120%) contrast(105%)',
};
