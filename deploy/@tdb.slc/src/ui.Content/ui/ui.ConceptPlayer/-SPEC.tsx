import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Color, css } from './common.ts';
import { ConceptPlayer } from './mod.ts';

export default Spec.describe('ConceptPlayer', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      ctx.host.tracelineColor(Color.alpha(Color.CYAN, 0.2));
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => {
        const styles = {
          content: css({ padding: 10 }),
          column: css({ padding: 10 }),
        };

        const elContentBody = <div className={styles.content.class}>👋 Content Body</div>;
        const elColumnBody = <div className={styles.column.class}>👋 Content Body</div>;

        return (
          <ConceptPlayer
            theme={'Light'}
            debug={p.debug.value}
            contentTitle={'My Title'}
            contentBody={elContentBody}
            columnAlign={p.columnAlign.value}
            columnBody={elColumnBody}
            onBackClick={() => (p.columnAlign.value = 'Center')}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
