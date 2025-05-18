import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { SampleBody } from './-SPEC.ui.tsx';
import { Color } from './common.ts';
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
        return (
          <ConceptPlayer
            theme={p.theme.value}
            debug={p.debug.value}
            // Content:
            contentTitle={p.contentTitle.value}
            contentBody={p.contentBody.value}
            // Column:
            columnAlign={p.columnAlign.value}
            columnBody={<SampleBody debug={debug} />}
            columnVideo={p.columnVideo.value}
            columnVideoVisible={p.columnVideoVisible.value}
            // Events:
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
