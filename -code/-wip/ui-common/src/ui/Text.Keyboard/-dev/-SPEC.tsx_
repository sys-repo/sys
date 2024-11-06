import { Keyboard } from '..';
import { Dev, type t } from '../../../test.ui';
import { DevSample } from './DEV.Sample';
import { DevHook } from './DEV.Hook';

type T = { keyboard: t.KeyboardState };
const initial: T = {
  keyboard: Keyboard.Monitor.state,
};

export default Dev.describe('KeyboardMonitor', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    Keyboard.Monitor.subscribe((current) => state.change((d) => (d.keyboard = current)));

    const log = (e: t.KeyMatchSubscriberHandlerArgs) => {
      console.group('🌳 ');
      console.info(`match pattern: "${e.pattern}"`);
      console.info(`pressed:`, e.state.pressed);
      console.log('e', e);
      console.groupEnd();
    };

    /**
     * Single pattern registration.
     */
    Keyboard.Monitor.on('CMD + KeyL', (e) => {
      e.handled();
      log(e);
    });

    /**
     * Regsiter an object-map of patterns.
     */
    Keyboard.Monitor.on({
      'CMD + KeyP'(e) {
        e.handled();
        log(e);
      },
      'SHIFT + ALT + KeyP': (e) => log(e),
      Escape: (e) => log(e),
    });

    /**
     * Patterns with same key, but different modifiers
     * NOTE:
     *    Pipe is the same as backslash.
     *    On MacOS, these will both trigger as the CMD key keeps
     *    the "|" key in a down state until CMD is released.
     *    This may produce subtle bugs (a possibly needs to be worked around
     *    within the monitor).
     */
    Keyboard.Monitor.on({
      'CMD + ALT + Backslash': (e) => console.log('e', e.pattern),
      'CMD + Backslash': (e) => console.log('e', e.pattern),
    });

    ctx.subject
      .display('grid')
      .size([540, 300])
      .render<T>((e) => <DevSample state={e.state.keyboard} />);
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => (
        <Dev.Object
          name={'KeyboardMonitor'}
          data={e.state.keyboard}
          expand={{ level: 1, paths: ['$.current.pressed', '$.current', '$.current.pressed.*'] }}
        />
      ));

    dev.row((e) => <DevHook />);

    dev.hr(5, 20);

    dev.row(async (e) => {
      const { EventProps } = await Keyboard.EventProps();
      const event = e.state.keyboard.last;
      return <EventProps event={event} style={{ MarginX: 15, marginTop: 5 }} />;
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => (
        <Dev.Object
          name={'KeyboardMonitor'}
          data={e.state.keyboard}
          expand={{ level: 1, paths: ['$.current.pressed', '$.current', '$.current.pressed.*'] }}
        />
      ));
  });
});
