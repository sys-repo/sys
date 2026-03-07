import React from 'react';
import { type t } from './common.ts';

type EnvObject = Record<string, unknown>;
type ParamsObject = Record<string, unknown>;

type Args<TEnv extends EnvObject, TParams extends ParamsObject> = {
  run?: t.ActionProbe.ProbeRun<TEnv, TParams>;
  env: TEnv;
  getParams: <T = TParams>() => Readonly<T> | undefined;
  onRunStart?: (args?: t.ActionProbeRunStartArgs) => void;
  onRunTitle?: (title: t.ReactNode) => void;
  onRunEnd?: () => void;
  onRunItem?: (item: t.KeyValueItem) => void;
  onRunResult?: (value: unknown, obj?: t.ActionProbe.ProbeRunObjectConfig) => void;
};

export function useProbeRun<TEnv extends EnvObject, TParams extends ParamsObject>(
  args: Args<TEnv, TParams>,
) {
  const { run: handler, env, getParams, onRunStart, onRunTitle, onRunEnd, onRunItem, onRunResult } =
    args;

  const run = React.useCallback(async () => {
    if (!handler) return;

    onRunStart?.();
    try {
      let obj: t.ActionProbe.ProbeRunObjectConfig | undefined;
      const e: t.ActionProbe.ProbeRunArgs<TEnv, TParams> = {
        ...env,
        params: getParams,
        obj(input) {
          obj = { ...(obj ?? {}), ...input, show: { ...(obj?.show ?? {}), ...(input.show ?? {}) } };
          return e;
        },
        item(item) {
          onRunItem?.(item);
          return e;
        },
        hr() {
          return e.item({ kind: 'hr' });
        },
        title(next) {
          onRunTitle?.(next);
          return e;
        },
        result(value) {
          onRunResult?.(value, obj);
        },
      };
      await handler(e);
    } finally {
      onRunEnd?.();
    }
  }, [env, getParams, handler, onRunEnd, onRunItem, onRunResult, onRunStart, onRunTitle]);

  return { run, canRun: !!handler } as const;
}
