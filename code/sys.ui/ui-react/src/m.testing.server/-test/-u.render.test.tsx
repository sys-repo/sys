import { afterEach, describe, expect, it } from '../../-test.ts';
import { DomMock, TestReact } from '../mod.ts';

afterEach(DomMock.unpolyfill);

describe('render', () => {
  it('renders into DOM', async () => {
    const el = (
      <div>
        <span>Hello</span>
      </div>
    );

    const res = await TestReact.render(el);
    try {
      const span = res.container.querySelector('span')!;
      expect(span.innerText).to.eql('Hello');
    } finally {
      res.dispose();
    }
  });

  it('lifecycle', async () => {
    const res = await TestReact.render(
      <div>
        <span>Hello</span>
      </div>,
    );
    let count = 0;
    res.dispose$.subscribe(() => count++);

    try {
      expect(res.disposed).to.eql(false);
      expect(res.container.querySelector('span')!.innerText).to.eql('Hello');

      res.dispose();
      expect(res.disposed).to.eql(true);
      expect(count).to.eql(1);

      // NB: should not find.
      expect(res.container.querySelector('span')).to.eql(null);
    } finally {
      res.dispose();
    }
  });
});
