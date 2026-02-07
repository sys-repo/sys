import { type t, Button, Signal } from './common.ts';

/**
 * Generate a fetch-sample button.
 */
export function fetchButton(
  debug: t.DebugSignals,
  label: t.ReactNode | (() => t.ReactNode),
  fn: t.FetchAction__,
  index = 0,
) {
  const p = debug.props;
  const v = Signal.toObject(p);
  return (
    <Button
      key={`btn-${index}`}
      block
      label={label}
      onClick={async () => {
        const origin = v.origin;
        const local = v.env === 'localhost';
        if (!origin) return;
        p.spinning.value = true;

        await fn({
          origin,
          is: { local },
          result: (value) => (p.response.value = value),
        });

        p.spinning.value = false;
      }}
    />
  );
}
