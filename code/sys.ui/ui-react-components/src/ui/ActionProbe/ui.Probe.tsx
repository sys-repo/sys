import { type t, Button, Color, css, D, Keyboard, KeyValue } from './common.ts';
import { useProbeRenderModel } from './use.RenderModel.ts';
import { useProbeRun } from './use.Run.ts';
import { useProbeStyles } from './use.Styles.ts';

type EnvObject = Record<string, unknown>;
type ParamsObject = Record<string, unknown>;

/**
 * Component:
 */
export const Probe = <TEnv extends EnvObject, TParams extends ParamsObject>(
  props: t.ActionProbe.ProbeProps<TEnv, TParams>,
) => {
  const { debug = false, sample, env, spinning = false, focused = false } = props;
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
      Padding: [8, 12],
      outline: 'none',
      border: `dashed 1px ${Color.alpha(theme.fg, focused ? 0.6 : 0.25)}`,
      borderRadius: D.borderRadius,
      boxShadow: focused ? `0 3px 35px ${Color.alpha(Color.DARK, 0.14)}` : 'none',
      ':focus': { outline: 'none' },
      ':focus-visible': { outline: 'none' },
      transition: 'box-shadow 50ms ease',
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 8,
    }),
    title: {
      base: css({
        fontSize: 11,
        fontWeight: 600,
        userSelect: 'none',
        display: 'grid',
        gridTemplateColumns: `auto 1fr auto`,
      }),
      left: css({}),
      right: css({}),
    },
    body: css({
      fontSize: 11,
      lineHeight: 1.4,
    }),
  };

  const elTitle = (
    <div className={styles.title.base.class}>
      <div className={styles.title.left.class}>{sample.title ?? 'Untitled Probe'}</div>
      <div />
      <div className={styles.title.right.class}>
        <Button enabled={canRun && !spinning} onClick={run}>
          {spinning ? 'Running...' : 'Run'}
        </Button>
      </div>
    </div>
  );

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
      {elTitle}
      {blocks.map((block, index) => {
        if (block.kind === 'element') {
          return (
            <div key={index} className={styles.body.class}>
              {block.node}
            </div>
          );
        }
        return <KeyValue.UI key={index} theme={theme.name} items={block.items} mono={true} />;
      })}
    </div>
  );
};
