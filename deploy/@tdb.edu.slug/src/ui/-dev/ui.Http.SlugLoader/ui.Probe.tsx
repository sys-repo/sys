import React from 'react';
import { type t, Button, Color, css, KeyValue, Obj } from './common.ts';

type EnvObject = Record<string, unknown>;
type ParamsObject = Record<string, unknown>;

/**
 * Component:
 */
export const Probe = <TEnv extends EnvObject, TParams extends ParamsObject>(
  props: t.ActionProbe.ProbeProps<TEnv, TParams>,
) => {
  const { debug = false, sample, env, spinning = false } = props;
  type Block = { kind: 'element'; node: t.ReactNode } | { kind: 'kv'; items: t.KeyValueItem[] };

  /**
   * State:
   */
  type TArgs = t.ActionProbe.ProbeRenderArgs<TEnv, TParams>;
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const paramsRef = React.useRef<TParams | undefined>(undefined);

  /**
   * Effect:
   */
  React.useEffect(() => {
    const theme = props.theme;
    const common = env;
    paramsRef.current = undefined;
    const blocks: Block[] = [];
    let currentItems: t.KeyValueItem[] | undefined;

    const args: TArgs = {
      ...common,
      theme,
      params(value) {
        paramsRef.current = Object.freeze(value);
        return args;
      },
      element(node) {
        currentItems = undefined;
        blocks.push({ kind: 'element', node });
        return args;
      },
      item(item) {
        if (!currentItems) {
          currentItems = [];
          blocks.push({ kind: 'kv', items: currentItems });
        }
        currentItems.push(item);
        return args;
      },
    };

    sample.render(args);
    setBlocks(blocks);
  }, [props.theme, Obj.hash(env)]);

  const run = React.useCallback(async () => {
    const handler = sample.run;
    if (!handler) return;

    props.onRunStart?.();
    try {
      const args: t.ActionProbe.ProbeRunArgs<TEnv, TParams> = {
        ...env,
        params<T = TParams>() {
          return paramsRef.current as Readonly<T> | undefined;
        },
        item(item) {
          props.onRunItem?.(item);
          return args;
        },
        result(value) {
          props.onRunResult?.(value);
        },
      };
      await handler(args);
    } finally {
      props.onRunEnd?.();
    }
  }, [env, props, sample]);

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
        <Button enabled={!!sample.run && !spinning} onClick={run}>
          {spinning ? 'Running...' : 'Run'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
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
