import React, { useEffect, useRef, type FC } from 'react';
import { HarnessHost } from '../Harness.Host/mod.ts';
import { DebugPanel } from '../Harness.Panel.Debug/mod.ts';
import {
  COLORS,
  Color,
  ErrorBoundary,
  css,
  useBusController,
  useRubberband,
  useSizeObserver,
  type t,
} from '../common.ts';
import { ErrorFallback } from './ErrorFallback.tsx';

type Size = { width: number; height: number };

export const Harness: FC<t.HarnessProps> = (props: t.HarnessProps) => {
  useRubberband(props.allowRubberband ?? false);

  /**
   * Hooks:
   */
  const baseRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const debugRef = useRef<HTMLDivElement>(null);
  const resize = useSizeObserver([baseRef, hostRef, subjectRef]);
  const size = toSize(baseRef.current);

  const controller = useBusController({
    runOnLoad: true,
    bus: props.instance?.bus,
    id: props.instance?.id,
    bundle: props.spec,
    env: props.env,
  });
  const { instance } = controller;

  /**
   * Effects:
   */
  useEffect(() => {
    const events = controller.events;
    if (!events) return;
    if (!(resize.ready && controller.ready)) return;

    // Bubble resize events:
    events.props.change.fire((d) => {
      d.size.harness = toSize(baseRef.current);
      d.size.host = toSize(hostRef.current);
      d.size.subject = toSize(subjectRef.current);
      d.size.debug = toSize(debugRef.current);
    });

    events.redraw.subject();
  }, [controller.ready, resize.count, baseRef.current, hostRef.current, subjectRef.current]);

  /**
   * Render:
   */
  const styles = {
    reset: css({
      color: COLORS.DARK,
      fontFamily: 'sans-serif',
      fontSize: 16,
    }),
    base: css({
      position: 'relative',
      backgroundColor: Color.format(props.background),
      pointerEvents: 'auto',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
    }),
  };

  const elBody = size.ready && (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <HarnessHost instance={instance} baseRef={hostRef} subjectRef={subjectRef} />
      {size.width > 950 && <DebugPanel instance={instance} baseRef={debugRef} />}
    </ErrorBoundary>
  );

  return (
    <div
      ref={baseRef}
      data-component={'sys.ui.dev.harness'}
      className={css(styles.reset, styles.base, props.style).class}
    >
      {elBody}
    </div>
  );
};

/**
 * Helpers:
 */
const toSize = (el?: HTMLDivElement | null): Size & { ready?: boolean } => {
  if (!el) return { ready: false, width: -1, height: -1 };
  const { width, height } = el.getBoundingClientRect();
  return { ready: true, width, height };
};
