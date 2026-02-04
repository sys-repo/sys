import { type t, Button, Signal } from './-common.ts';

/**
 * Generate a fetch-sample button.
 */
export function fetchButton(debug: t.DebugSignals, label: string, fn: t.FetchAction, index = 0) {
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
