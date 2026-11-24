import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';
import { Is } from '../common.ts';
import { Button } from '../mod.ts';
import { button } from './u.fixture.ts';
import { ruleText } from './u.fixture.focus.ts';

// Declaration coverage only; real track/item widths and focus clearance need a browser.
describe('Button: bounded content layout', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const slot of ['label', 'children'] as const) {
    it(`${slot} → one shrinkable column without clipping the focus root`, async () => {
      const text = '/-sample/not-a-real-path/long-directory-name/example.bundle.js.map';
      const content = <span>{text}</span>;
      const props = { style: { width: 120 }, [slot]: content };
      const res = await TestReact.render(<Button {...props} />);
      try {
        const root = button(res.container);
        const body = root.firstElementChild;
        if (Is.nil(body)) throw new Error('Missing Button body.');
        const rootRule = ruleText(root);
        const bodyRule = ruleText(body);
        expect(rootRule).to.include('width: 120px;');
        expect(bodyRule).to.include('display: grid;');
        expect(bodyRule).to.include('grid-template-columns: minmax(0, 1fr);');
        expect(rootRule).not.to.include('overflow:');
        expect(bodyRule).not.to.include('overflow:');
        expect(root.textContent).to.eql(text);
      } finally {
        act(() => res.dispose());
      }
    });
  }
});
