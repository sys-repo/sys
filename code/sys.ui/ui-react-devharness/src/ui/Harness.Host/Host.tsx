// @ts-types="@types/react"
import React, { useEffect, useState } from 'react';

import { Color, css, DEFAULTS, R, Time, useCurrentState, type t } from '../common.ts';
import { PanelFooter, PanelHeader } from '../Harness.Panel.Edge/mod.ts';
import { BarSpinner } from '../Spinners/mod.ts';
import { HostBackground } from './Host.Background.tsx';
import { HostComponent } from './Host.Component.tsx';
import { HostGrid } from './Host.Grid.tsx';
import { HostLayers } from './Host.Layers.tsx';
import { Wrangle } from './u.ts';

const DEFAULT = DEFAULTS.props.host;

export type HarnessHostProps = {
  instance: t.DevInstance;
  style?: t.CssValue;
  baseRef?: React.RefObject<HTMLDivElement>;
  subjectRef?: React.RefObject<HTMLDivElement>;
};

export const HarnessHost: React.FC<HarnessHostProps> = (props) => {
  const { instance } = props;

  const current = useCurrentState(instance, { distinctUntil });
  const renderProps = current.info?.render.props;
  const isEmpty = !renderProps;
  const host = renderProps?.host;
  const layersAbove = wrangle.layers(host, (i) => i > 0);
  const layersBelow = wrangle.layers(host, (i) => i < 0);

  const [, setRedraw] = useState(0);
  const redraw = () => setRedraw((n: number) => n + 1);

  /**
   * Lifecycle
   */
  useEffect(() => {
    // HACK: Ensure the "empty spinner" is rendered and starts.
    if (isEmpty) Time.delay(redraw);
  }, [isEmpty]);

  /**
   * Render
   */
  const cropmark = wrangle.cropmark(renderProps);
  const backgroundColor =
    host?.backgroundColor === undefined
      ? Color.format(DEFAULT.backgroundColor)
      : Color.format(host.backgroundColor);
  const color =
    host?.color === undefined
      ? //
        Color.format(DEFAULT.color)
      : Color.format(host.color);

  const styles = {
    base: css({ position: 'relative', backgroundColor, color }),
    body: css({ Absolute: 0, display: 'grid', gridTemplateRows: 'auto 1fr auto' }),
    main: css({ position: 'relative', display: 'grid' }),
    empty: css({ Absolute: 0, display: 'grid', placeContent: 'center', userSelect: 'none' }),
  };

  const elBackground = renderProps && <HostBackground renderProps={renderProps} />;

  const elGrid = renderProps && (
    <HostGrid renderProps={renderProps} border={cropmark}>
      <HostComponent
        instance={instance}
        renderProps={renderProps}
        border={cropmark}
        subjectRef={props.subjectRef}
      />
    </HostGrid>
  );

  const elMain = (
    <div className={styles.main.class}>
      <HostLayers instance={instance} layers={layersBelow} />
      {elGrid}
      <HostLayers instance={instance} layers={layersAbove} />
    </div>
  );

  const elBody = (
    <div className={styles.body.class}>
      <PanelHeader instance={instance} current={host?.header} />
      {elMain}
      <PanelFooter instance={instance} current={host?.footer} />
    </div>
  );

  const elEmpty = isEmpty && (
    <div className={styles.empty.class}>
      <BarSpinner />
    </div>
  );

  return (
    <div ref={props.baseRef} className={css(styles.base, props.style).class}>
      {elBackground}
      {elBody}
      {elEmpty}
    </div>
  );
};

/**
 * Helpers
 */
const distinctUntil = (p: t.DevInfoChanged, n: t.DevInfoChanged) => {
  const prev = p.info;
  const next = n.info;
  if (prev.run.results?.tx !== next.run.results?.tx) return false;
  if (!R.equals(prev.render.revision, next.render.revision)) return false;
  return true;
};

const wrangle = {
  layers(host: t.DevRenderPropsHost | undefined, filter: (index: number) => boolean) {
    const obj = host?.layers ?? {};
    const items = Object.keys(obj)
      .map((key) => obj[key])
      .filter((item) => filter(item.index));
    return R.sortBy(R.prop('index'), items);
  },

  cropmark(renderProps?: t.DevRenderProps) {
    const host = renderProps?.host;
    if (host?.tracelineColor === 0) return undefined;

    const subject = renderProps?.subject;
    const size = subject?.size;
    if (size?.mode === 'fill') {
      if (R.equals(Wrangle.fillMargin(size), [0, 0, 0, 0])) return undefined;
    }

    return `solid 1px ${Color.format(host?.tracelineColor ?? DEFAULT.tracelineColor)}`;
  },
} as const;
