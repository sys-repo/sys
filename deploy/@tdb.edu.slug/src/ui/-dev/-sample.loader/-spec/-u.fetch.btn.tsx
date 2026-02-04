import { type t, Button, Signal } from './-common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export type FetchAction = (e: FetchActionArgs) => Promise<void>;
export type FetchActionArgs = {
  readonly local: boolean;
  readonly origin: t.SlugLoaderOrigin;
  readonly baseUrl?: t.StringUrl;
  readonly manifestsDir?: t.StringDir;
  readonly docid?: t.StringId;
  readonly hash?: string;
  result(value: unknown): void;
};

export function fetchButton(debug: DebugSignals, label: string, fn: FetchAction, index = 0) {
  const p = debug.props;
  const v = Signal.toObject(p);
  return (
    <Button
      key={`btn-${index}`}
      block
      label={label}
      onClick={async () => {
        const origin = v.origin;
        const local = v.originKind === 'localhost';
        if (!origin) return;
        p.spinning.value = true;

        await fn({
          local,
          origin,
          result: (value) => (p.response.value = value),
        });

        p.spinning.value = false;
      }}
    />
  );
}
