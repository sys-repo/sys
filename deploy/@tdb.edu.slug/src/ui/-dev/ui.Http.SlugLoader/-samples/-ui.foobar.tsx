import { type t, Color, Num, css, Str, Time } from './common.ts';

type Env = { readonly is: { readonly local: boolean } };
type Params = { readonly label: string; readonly delay: number };

export const FooSample: t.ActionProbe.ProbeSpec<Env, Params> = {
  title: 'Foobar',
  render(e) {
    const label = e.is.local ? 'Local' : 'Remote';
    const delay = Math.floor(Math.random() * (1500 - 300 + 1)) + 300;

    const styles = {
      base: css({ backgroundColor: Color.ruby(0.03), fontStyle: 'italic' }),
    };

    e.params({ label, delay });
    e.element(<div className={styles.base.class}>{Str.Lorem.words(12)}</div>);
    e.item({ k: 'label', v: label });
    e.item({ k: 'delay(ms)', v: delay });
    e.item({ kind: 'hr' });
    e.element(`👋 Hello ${Str.Lorem.words(8)}`);
    e.item({ k: 'final', v: 'thing' });
  },
  async run(e) {
    const params = e.params<Params>();
    const delay = params?.delay ?? 300;
    const label = params?.label ?? 'Unknown';
    await Time.wait(delay);
    e.item({ k: 'latency(ms)', v: delay });
    e.result({
      ok: true,
      value: {
        label,
        delay,
        at: new Date().toISOString(),
      },
    });
  },
};
