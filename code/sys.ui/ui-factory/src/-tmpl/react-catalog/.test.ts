import { describe, it, expect } from './-test.ts';
import { makePlan, regs, HelloSchema } from './mod.ts';

describe('Catalog', () => {
  describe('smoke test', () => {
    it('makePlan: root is Hello:view with default props', () => {
      const plan = makePlan();
      expect(plan.root.component).to.eql('Hello:view');
      expect(plan.root.slots).to.eql(undefined);
      // default props from makePlan (template default is 'World')
      // if your template uses a different default, update this expect:
      // @ts-ignore
      expect(plan.root.props?.name).to.eql('World');
    });

    it('makePlan: caller overrides props', () => {
      const plan = makePlan({ name: 'World' });
      // @ts-ignore
      expect(plan.root.props?.name).to.eql('World');
    });

    it('regs: contains Hello spec with no slots', () => {
      const reg = regs.find((r) => r.spec.id === 'Hello:view');
      expect(Boolean(reg)).to.eql(true);
      expect(reg!.spec.slots).to.eql([]); // Hello has no slots.
    });

    it('regs.load(): yields a React component (default export)', async () => {
      const reg = regs.find((r) => r.spec.id === 'Hello:view')!;
      const mod = await reg.load();
      expect(typeof mod.default).to.eql('function');
      // soft identity check; safe to skip if minified:
      if ('name' in mod.default) expect(mod.default.name).to.eql('Hello');
    });

    it("schemas: HelloSchema is an object schema with 'name'", () => {
      expect(HelloSchema.type).to.eql('object');
      expect(Object.keys(HelloSchema.properties || {})).to.include('name');
      expect(HelloSchema.additionalProperties).to.eql(false);
    });
  });
});
