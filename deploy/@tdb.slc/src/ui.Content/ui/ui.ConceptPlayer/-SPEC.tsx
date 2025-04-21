import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Color, css, Button, Str } from './common.ts';
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
        const isCenter = p.columnAlign.value === 'Center';

        const load = (title: string) => {
          return () => {
            p.columnAlign.value = 'Right';
            p.contentTitle.value = title;
            p.contentBody.value = (
              <div>
                <strong>{title}</strong> <span>{Str.lorem}</span> <span>{Str.lorem}</span>
              </div>
            );
          };
        };

        const styles = {
          content: css({ padding: 30, lineHeight: 1.7, fontSize: 14 }),
          rightBody: css({ padding: 10 }),
          centerBody: css({ padding: 10 }),
          buttons: css({ marginTop: 15, marginLeft: 20, lineHeight: 1.65 }),
        };

        const elContentBody = <div className={styles.content.class}>{p.contentBody.value}</div>;
        const elRightBody = <div className={styles.rightBody.class}>👋 Right Body</div>;
        const elCenterBody = (
          <div className={styles.centerBody.class}>
            <div>
              <strong>👋 Center Body</strong>
            </div>
            <div className={styles.buttons.class}>
              <Button block label={'Module One'} onClick={load('Module One')} />
              <Button block label={'Module Two'} onClick={load('Module Two')} />
              <Button block label={'Module Three'} onClick={load('Module Three')} />
            </div>
          </div>
        );

        return (
          <ConceptPlayer
            theme={'Light'}
            debug={p.debug.value}
            contentTitle={p.contentTitle.value}
            contentBody={elContentBody}
            columnAlign={p.columnAlign.value}
            columnBody={isCenter ? elCenterBody : elRightBody}
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
