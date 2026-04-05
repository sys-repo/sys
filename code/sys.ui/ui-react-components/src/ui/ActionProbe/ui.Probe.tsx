import { useCallback, useEffect, useRef, useState } from 'react';
import { type t, Color, css, D, Is, Keyboard, Time } from './common.ts';
import { Body } from './ui.Probe.Body.tsx';
import { Header } from './ui.Probe.Header.tsx';
import { useProbeRenderModel } from './use.RenderModel.ts';
import { useProbeRun } from './use.Run.ts';
import { useScopedStyles } from './use.Styles.ts';

type EnvObject = Record<string, unknown>;
type ParamsObject = Record<string, unknown>;

/**
 * Component:
 */
export const Probe = <TEnv extends EnvObject, TParams extends ParamsObject>(
  props: t.ActionProbe.ProbeProps<TEnv, TParams>,
) => {
  const {
    debug = false,
    spec,
    env,
    runRequest,
    spinning = false,
    focused = false,
    actOn = D.Probe.actOn,
    borderRadius = D.borderRadius,
  } = props;

  const [isActOnClickDown, setActOnClickDown] = useState(false);
  const [running, setRunning] = useState(false);
  const runRef = useRef(false);
  const runRequestRef = useRef(runRequest);
  const didMountRef = useRef(false);
  const { componentAttr } = useScopedStyles(props);
  const { blocks, getParams } = useProbeRenderModel({ spec, env, theme: props.theme });
  const { run, canRun } = useProbeRun({
    run: spec.run,
    env,
    getParams,
    onRunStart: () => props.onRunStart?.({ title: spec.title }),
    onRunTitle: props.onRunTitle,
    onRunEnd: props.onRunEnd,
    onRunItem: props.onRunItem,
    onRunResult: props.onRunResult,
  });
  const invokeRun = useCallback(async () => {
    if (!canRun) return false;
    if (spinning || runRef.current) return false;
    runRef.current = true;
    setRunning(true);
    try {
      await run();
      return true;
    } finally {
      runRef.current = false;
      setRunning(false);
    }
  }, [canRun, run, spinning]);

  const triggerDoubleClickPulse = async () => {
    if (spinning || runRef.current) return;
    setActOnClickDown(true);
    await Time.wait(D.Probe.doubleClickPulse);
    setActOnClickDown(false);
    void invokeRun();
  };

  /**
   * External run trigger:
   * run only when token changes after mount.
   */
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      runRequestRef.current = runRequest;
      return;
    }
    if (Object.is(runRequestRef.current, runRequest)) return;
    runRequestRef.current = runRequest;
    if (runRequest === undefined) return;
    void invokeRun();
  }, [runRequest, invokeRun]);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: focused ? theme.bg : Color.alpha(theme.fg, 0.03),
      outline: 'none',
      border: `dashed 1px ${Color.alpha(theme.fg, focused ? 0.6 : 0.25)}`,
      borderRadius,
      boxShadow: focused ? `0 3px 35px ${Color.alpha(Color.DARK, 0.12)}` : 'none',
      ':focus': { outline: 'none' },
      ':focus-visible': { outline: 'none' },
      transition: 'box-shadow 40ms ease',
      transform: isActOnClickDown ? 'translateY(1px)' : 'translateY(0)',
    }),
    header: css({ borderBottom: `dashed 1px ${Color.alpha(theme.fg, 0.2)}` }),
    body: css({}),
  };

  return (
    <div
      data-component={componentAttr}
      className={css(styles.base, props.style).class}
      tabIndex={0}
      onFocus={props.onFocus}
      onBlur={() => {
        setActOnClickDown(false);
        props.onBlur?.();
      }}
      onMouseDown={(e) => setActOnClickDown(wrangle.shouldActOnClick(e, actOn))}
      onMouseUp={() => setActOnClickDown(false)}
      onMouseLeave={() => setActOnClickDown(false)}
      onKeyDown={(e) => {
        if (!wrangle.shouldActOnKeydown(e, actOn)) return;
        if (!canRun || spinning || runRef.current) return;
        e.preventDefault();
        void invokeRun();
      }}
      onClick={(e) => {
        if (!wrangle.shouldActOnClick(e, actOn)) return;
        if (!canRun || spinning || runRef.current) return;
        const target = e.target as HTMLElement | null;
        if (target?.closest('[role="button"]')) return;
        e.preventDefault();
        void invokeRun();
      }}
      onDoubleClick={(e) => {
        if (!canRun || spinning || runRef.current) return;
        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-part="probe-body-content"]')) return;
        if (target?.closest('[role="button"]')) return;
        void triggerDoubleClickPulse();
      }}
    >
      <Header
        title={spec.title}
        canRun={canRun && !running}
        spinning={spinning || running}
        focused={focused}
        actOn={actOn}
        theme={props.theme}
        onRun={() => void invokeRun()}
        style={styles.header}
      />
      <Body blocks={blocks} theme={theme.name} style={styles.body} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  acts(actOn: t.ActionProbe.ActOn) {
    if (actOn === null) return [];
    return Is.array(actOn) ? actOn : [actOn];
  },

  shouldActOnKeydown(
    e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>,
    actOn: t.ActionProbe.ActOn,
  ) {
    return wrangle.acts(actOn).some((kind) => {
      if (kind === null) return false;
      if (kind === 'Cmd+Enter') return Keyboard.Is.command(e) && e.key === 'Enter';
      if (kind === 'Enter')
        return e.key === 'Enter' && !Keyboard.Is.modified(Keyboard.modifiers(e));
      return false;
    });
  },

  shouldActOnClick(
    e: Pick<MouseEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>,
    actOn: t.ActionProbe.ActOn,
  ) {
    return wrangle.acts(actOn).some((kind) => {
      if (kind === null) return false;
      if (kind === 'Cmd+Click') return Keyboard.Is.command(e);
      return false;
    });
  },
} as const;
