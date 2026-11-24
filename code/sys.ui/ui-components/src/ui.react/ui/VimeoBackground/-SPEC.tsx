import { Harness, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { VimeoBackground } from './mod.ts';

export default Spec.describe('VimeoBackground', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    return (
      <VimeoBackground
        theme={p.theme.value}
        video={p.video.value}
        opacity={p.opacity.value}
        blur={p.blur.value}
        playing={p.playing.value}
        playingTransition={p.playingTransition.value}
        jumpTo={p.jumpTo.value}
        onReady={(api) => {
          console.info(`⚡️ onReady`, api);
          p.vimeo.value = api;
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: 'fill', display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
