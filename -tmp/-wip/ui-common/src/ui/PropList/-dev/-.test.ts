import { PropList } from '../mod.ts';
import { describe, expect, it } from '../../../-test.ts';

describe('PropList', () => {
  type TField = 'Foo' | 'Bar' | 'Zoo';
  type TInput = TField | null | undefined;

  describe('Wrangle.fields', () => {
    it('undefined ← defaults', () => {
      const defaults: TField[] = ['Foo', 'Zoo'];
      const res1 = PropList.Wrangle.fields(undefined);
      const res2 = PropList.Wrangle.fields(undefined, defaults);
      expect(res1).to.eql([]);
      expect(res2).to.eql(defaults);
    });

    it('dense array', () => {
      const fields: TField[] = ['Foo', 'Zoo'];
      const res = PropList.Wrangle.fields(fields);
      expect(res).to.eql(fields);
      expect(res[0] === 'Foo').to.eql(true); // NB: inferred typed.
    });

    it('sparse array', () => {
      const fields: (TField | undefined | null)[] = ['Foo', undefined, 'Zoo', null, undefined];
      const res = PropList.Wrangle.fields(fields);
      expect(res).to.eql(['Foo', 'Zoo']);
    });
  });

  describe('Wrangle.toggleField', () => {
    it('undefined | empty ([]) ← toggle on', () => {
      const res1 = PropList.Wrangle.toggleField<TField>(undefined, 'Foo');
      const res2 = PropList.Wrangle.toggleField<TField>([], 'Foo');
      const res3 = PropList.Wrangle.toggleField<TField>([undefined, null], 'Foo');
      expect(res1).to.eql(['Foo']);
      expect(res2).to.eql(['Foo']);
      expect(res3).to.eql(['Foo']);
    });

    it('toggle off', () => {
      const fields: TInput[] = ['Bar', 'Foo', undefined, 'Zoo', null];
      const res = PropList.Wrangle.toggleField(fields, 'Foo');
      expect(res).to.eql(['Bar', 'Zoo']);
    });

    it('immutable responses', () => {
      const fields: TInput[] = ['Bar', 'Foo', undefined, 'Zoo', null];
      const res1 = PropList.Wrangle.toggleField(fields, 'Foo');
      const res2 = PropList.Wrangle.toggleField(res1, 'Foo');

      expect(res1).to.not.equal(res2);
      expect(res1).to.eql(['Bar', 'Zoo']);
      expect(res2).to.eql(['Bar', 'Zoo', 'Foo']);
    });
  });
});
