import { type t, css, Num, Str, Time } from '../common.ts';

type Env = { readonly is: { readonly local: boolean } };
type Params = { readonly label: string; readonly delay: number };

export const BarSample: t.ActionProbe.ProbeSpec<Env, Params> = {
  title: 'ƒ • Barbaz',
  render(e) {
    const label = e.is.local ? 'Local' : 'Remote';
    const delay = Num.random.int(300, 1500);

    const styles = { description: css({ fontStyle: 'italic' }) };
    const description = (
      <div className={styles.description.class}>
        {Str.Lorem.words(12)} <code>bar.baz</code> {Str.Lorem.words(4)}
      </div>
    );

    e.params({ label, delay });
    e.element(description);
    e.item({ k: 'hello-1', v: label });
    e.item({ k: 'wowow-2', v: '🐷' });
    e.hr();
    e.item({ k: 'delay', v: `${delay.toLocaleString()} ms` });
    e.element(`Hello ${Str.Lorem.words(8).toLowerCase()}`);
    e.item({ k: 'the last', v: 'bing 🥧' });
  },

  async run(e) {
    const params = e.params<Params>();
    const delay = params?.delay ?? 300;
    const label = params?.label ?? 'Unknown';

    e.title('My runner title');

    await Time.wait(delay);
    e.item({ k: 'latency', v: `${delay}ms` });
    e.item({ k: 'bar', v: `baz` });
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
