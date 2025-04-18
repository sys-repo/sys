import { Spec } from '../-test.ui.ts';
import { Debug } from './-SPEC.Debug.tsx';
import { Button } from './mod.ts';

export default Spec.describe('Button', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([224, null]).render((e) => {
      return (
        <Button
          onClick={(e) => console.info(`⚡️ onClick:`, e)}
          onMouseDown={(e) => console.info(`⚡️ onMouseDown:`, e)}
          onMouseUp={(e) => console.info(`⚡️ onMouseUp:`, e)}
        >{`👋 Hello Button`}</Button>
      );
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{}} />);
  });
});
