import React from 'react';
import { type t, Obj } from './common.ts';

type EnvObject = Record<string, unknown>;
type ParamsObject = Record<string, unknown>;

type Args<TEnv extends EnvObject, TParams extends ParamsObject> = {
  sample: t.ActionProbe.ProbeSpec<TEnv, TParams>;
  env: TEnv;
  theme?: t.CommonTheme;
};

export function useProbeRenderModel<TEnv extends EnvObject, TParams extends ParamsObject>(
  args: Args<TEnv, TParams>,
) {
  const { sample, env, theme } = args;
  type TRenderArgs = t.ActionProbe.ProbeRenderArgs<TEnv, TParams>;

  /**
   * Hooks:
   */
  const paramsRef = React.useRef<TParams | undefined>(undefined);
  const [blocks, setBlocks] = React.useState<t.ActionProbe.ProbeRenderBlock[]>([]);
  const getParams = React.useCallback(
    <T = TParams>() => paramsRef.current as Readonly<T> | undefined,
    [],
  );

  /**
   * Effect:
   */
  React.useEffect(() => {
    paramsRef.current = undefined;
    const blocks: t.ActionProbe.ProbeRenderBlock[] = [];
    let currentItems: t.KeyValueItem[] | undefined;

    const e: TRenderArgs = {
      ...env,
      theme,
      params(value) {
        paramsRef.current = Object.freeze(value);
        return e;
      },
      element(node) {
        currentItems = undefined;
        blocks.push({ kind: 'element', node });
        return e;
      },
      item(item) {
        if (!currentItems) {
          currentItems = [];
          blocks.push({ kind: 'kv', items: currentItems });
        }
        currentItems.push(item);
        return e;
      },
    };

    sample.render(e);
    setBlocks(blocks);
  }, [sample, theme, Obj.hash(env)]);

  return { blocks, getParams } as const;
}
