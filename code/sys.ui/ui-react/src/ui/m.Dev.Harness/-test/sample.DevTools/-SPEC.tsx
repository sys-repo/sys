import { ButtonSample } from '.';
import { Spec } from '../common';
import { DevTools } from './DevTools';

let _count = 0;

export default Spec.describe('sample.DevTools.Button', (e) => {
  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    ctx.subject
      .display('grid')
      .size([200, null])
      .render((e) => {
        return (
          <ButtonSample
            ctx={ctx}
            label={'My Button'}
            onClick={() => console.info('init/onClick', e)}
          />
        );
      });
    Spec.once(e, (ctx) => {});
  });

  e.it('Buttons', (e) => {
    const dev = DevTools.init(e);

    dev.button((btn) => {
      btn.label('change state').onClick(async (e) => {
        type T = { count: number };
        const state = await e.ctx.state<T>({ count: 0 });
        await state.change((s) => s.count++);

        console.log('-------------------------------------------');
        console.log('e.ctx.toObject()', e.ctx.toObject());
        console.log('e.ctx.toObject().props', e.ctx.toObject().props);
        console.log('state.current', state.current);
        btn.label(`state | count: ${state.current.count}`);
      });
    });

    dev.button((btn) => {
      btn.label('change button label').onClick(async (e) => {
        _count++;
        btn.label(`renamed-${_count}`);
      });
    });

    dev.hr();

    dev.button((btn) => btn.label('👋'));
  });
});
