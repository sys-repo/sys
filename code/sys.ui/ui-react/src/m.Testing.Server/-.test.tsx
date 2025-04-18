import { describe, expect, it } from '../-test.ts';
import { TestReact } from './mod.ts';

describe('TestReact (Server)', { sanitizeOps: false, sanitizeResources: false }, () => {
  describe('render', () => {
    it('renders into DOM', async () => {
      const el = (
        <div>
          <span>Hello</span>
        </div>
      );

      const res = await TestReact.render(el);
      const span = res.container.querySelector('span')!;
      expect(span.innerText).to.eql('Hello');
    });

    it('lifecycle', async () => {
      const res = await TestReact.render(
        <div>
          <span>Hello</span>
        </div>,
      );
      let count = 0;
      res.dispose$.subscribe(() => count++);

      expect(res.disposed).to.eql(false);
      expect(res.container.querySelector('span')!.innerText).to.eql('Hello');

      res.dispose();
      expect(res.disposed).to.eql(true);
      expect(count).to.eql(1);

      // NB: should not find.
      expect(res.container.querySelector('span')).to.eql(null);
    });
  });
});
