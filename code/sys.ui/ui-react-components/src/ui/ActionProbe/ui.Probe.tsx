import { type t, Color, css, D, Keyboard } from './common.ts';
import { useProbeRenderModel } from './use.RenderModel.ts';
import { useProbeRun } from './use.Run.ts';
import { useProbeStyles } from './use.Styles.ts';
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
    borderRadius = D.borderRadius,
  } = props;
  const theme = Color.theme(props.theme);
  const { componentAttr } = useProbeStyles(theme.fg);
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
    header: css({ borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}` }),
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
        if (!Keyboard.Is.command(e) || e.key !== 'Enter') return;
        if (!canRun || spinning) return;
        e.preventDefault();
        run();
      }}
    >
      <Header
        title={sample.title}
        canRun={canRun}
        spinning={spinning}
        focused={focused}
        onRun={run}
        style={styles.header}
      />
      <Body blocks={blocks} theme={theme.name} style={styles.body} />
    </div>
  );
};
