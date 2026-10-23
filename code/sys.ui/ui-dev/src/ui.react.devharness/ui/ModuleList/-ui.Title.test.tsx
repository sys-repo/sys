import { renderToStaticMarkup } from 'react-dom/server';
import { act, renderHook } from '@sys/ui-react/testing/server';
import {
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  type t,
  Testing,
  Time,
} from '../../-test.ts';
import { View } from './ui.tsx';

const hash = `sha256-${'a'.repeat(64)}`;
// Shape-only remote observation, independently authored here rather than a downstream fixture.
const manifest: t.DistPkg = {
  type: 'https://example.test/dist',
  build: {
    time: 1,
    size: { total: 42, pkg: 12 },
    builder: '@sample/builder@1.0.0',
    runtime: 'test',
    hash: { policy: 'https://example.test/policy' },
  },
  hash: { scheme: 'sys.dist/v2', digest: hash, parts: { 'index.html': `${hash}:size=1` } },
};

const cases = [
  ['missing size', undefined],
  ['null size', null],
  ['transport failure', 'reject'],
  ['remote success', manifest.build.size],
] as const;

describe('ModuleList View: current artifact observation', () => {
  DomMock.init({ beforeEach, afterEach });

  for (const [name, size] of cases) {
    it(`${name} → ${name === 'remote success' ? 'remote artifact link' : 'no synthetic artifact link'}`, async () => {
      const original = globalThis.fetch;
      const location = Object.getOwnPropertyDescriptor(globalThis, 'location');
      const requests: string[] = [];
      try {
        Object.defineProperty(globalThis, 'location', {
          configurable: true,
          value: { href: 'https://example.test/app/' },
        });
        globalThis.fetch = (input) => {
          requests.push(String(input));
          if (size === 'reject') return Promise.reject(new Error('Fixture transport failure.'));
          const response = Testing.Http.json({ ...manifest, build: { ...manifest.build, size } });
          Object.defineProperty(response, 'url', { value: String(input) });
          return Promise.resolve(response);
        };
        // Execute real View hook wiring, then render its returned tree; scroll layout is not tested.
        const hook = renderHook(() => View({ title: 'Modules', scroll: false }));
        try {
          await act(async () => {
            await Time.wait(0);
          });
          const html = renderToStaticMarkup(await hook.result.current);
          expect(html).to.include('Modules');
          expect(requests).to.eql(['https://example.test/app/dist.json']);
          if (name === 'remote success') {
            expect(html).to.include('href="./dist.json"');
            expect(html).to.include('dist:#aaaaa');
            expect(html).not.to.include('dist:#00000');
          } else {
            expect(html).not.to.include('href="./dist.json"');
            expect(html).not.to.include('dist:#');
          }
        } finally {
          hook.unmount();
        }
      } finally {
        globalThis.fetch = original;
        if (location) Object.defineProperty(globalThis, 'location', location);
        else Reflect.deleteProperty(globalThis, 'location');
      }
    });
  }
});
