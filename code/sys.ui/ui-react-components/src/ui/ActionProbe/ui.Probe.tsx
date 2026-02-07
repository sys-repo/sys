import React from 'react';
import { type t, Button, Color, css, KeyValue } from './common.ts';
import { useProbeRenderModel } from './use.RenderModel.ts';
import { useProbeRun } from './use.Run.ts';

type EnvObject = Record<string, unknown>;
type ParamsObject = Record<string, unknown>;

/**
 * Component:
 */
export const Probe = <TEnv extends EnvObject, TParams extends ParamsObject>(
  props: t.ActionProbe.ProbeProps<TEnv, TParams>,
) => {
  const { debug = false, sample, env, spinning = false } = props;
  const { blocks, getParams } = useProbeRenderModel({ sample, env, theme: props.theme });
  const { run, canRun } = useProbeRun({
    run: sample.run,
    env,
    getParams,
    onRunStart: props.onRunStart,
    onRunEnd: props.onRunEnd,
    onRunItem: props.onRunItem,
    onRunResult: props.onRunResult,
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: Color.alpha(theme.fg, 0.03),
      border: `dashed 1px ${Color.alpha(theme.fg, 0.25)}`,
      borderRadius: 4,
      Padding: [8, 12],
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
    <div className={css(styles.base, props.style).class} onDoubleClick={run}>
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
