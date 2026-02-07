import { type t, Color, css, Num, Str, Time } from '../common.ts';

type Env = { readonly is: { readonly local: boolean } };
type Params = { readonly label: string; readonly delay: number };

export const FooSample: t.ActionProbe.ProbeSpec<Env, Params> = {
  title: 'Foobar',
  render(e) {
    const label = e.is.local ? 'Local' : 'Remote';
    const delay = Num.random.int(300, 1500);

    const styles = {
      base: css({ fontStyle: 'italic' }),
    };

    e.params({ label, delay });
    e.element(<div className={styles.base.class}>{Str.Lorem.words(12)}</div>);
    e.item({ k: 'label-1', v: label });
    e.item({ k: 'label-2', v: '🐷' });
    e.item({ kind: 'hr' });
    e.item({ k: 'delay(ms)', v: delay });
    e.element(`Hello ${Str.Lorem.words(8).toLowerCase()}`);
    e.item({ k: 'the last', v: 'word 👋' });
  },
  async run(e) {
    const params = e.params<Params>();
    const delay = params?.delay ?? 300;
    const label = params?.label ?? 'Unknown';
    await Time.wait(delay);
    e.item({ k: 'latency', v: `${delay}ms` });
    e.item({ k: 'foo', v: `bar 👋` });
    e.obj({ expand: ['$', '$.value'] }).result({
      ok: true,
      value: {
        label,
        delay,
        at: new Date().toISOString(),
        list: Array.from({ length: 50 }).map((_, i) => `${i}-${Num.random.int(0, 1000)}`),
      },
    });
  },
};
