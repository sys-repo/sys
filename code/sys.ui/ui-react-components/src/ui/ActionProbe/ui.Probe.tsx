import { type t, Color, css, D, Is, Keyboard } from './common.ts';
import { useProbeRenderModel } from './use.RenderModel.ts';
import { useProbeRun } from './use.Run.ts';
import { useScopedStyles } from './use.Styles.ts';
import { Header } from './ui.Probe.Header.tsx';
import { Body } from './ui.Probe.Body.tsx';

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
    sample,
    env,
    spinning = false,
    focused = false,
    actOn = D.actOn,
    borderRadius = D.borderRadius,
  } = props;

  const { componentAttr } = useScopedStyles(props);
  const { blocks, getParams } = useProbeRenderModel({ sample, env, theme: props.theme });
  const { run, canRun } = useProbeRun({
    run: sample.run,
    env,
    getParams,
    onRunStart: () => props.onRunStart?.({ title: sample.title }),
    onRunEnd: props.onRunEnd,
    onRunItem: props.onRunItem,
    onRunResult: props.onRunResult,
  });

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: Color.alpha(theme.fg, 0.03),
      outline: 'none',
      border: `dashed 1px ${Color.alpha(theme.fg, focused ? 0.6 : 0.25)}`,
      borderRadius,
      boxShadow: focused ? `0 3px 35px ${Color.alpha(Color.DARK, 0.12)}` : 'none',
      ':focus': { outline: 'none' },
      ':focus-visible': { outline: 'none' },
      transition: 'box-shadow 40ms ease',
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
      onBlur={props.onBlur}
      onKeyDown={(e) => {
        if (!wrangle.shouldActOnKeydown(e, actOn)) return;
        if (!canRun || spinning) return;
        e.preventDefault();
        run();
      }}
      onClick={(e) => {
        if (!wrangle.shouldActOnClick(e, actOn)) return;
        if (!canRun || spinning) return;
        const target = e.target as HTMLElement | null;
        if (target?.closest('[role="button"]')) return;
        e.preventDefault();
        run();
      }}
      onDoubleClick={(e) => {
        if (!canRun || spinning) return;
        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-part="probe-body-content"]')) return;
        if (target?.closest('[role="button"]')) return;
        run();
      }}
    >
      <Header
        title={sample.title}
        canRun={canRun}
        spinning={spinning}
        focused={focused}
        actOn={actOn}
        onRun={run}
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
