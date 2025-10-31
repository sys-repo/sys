import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { D, Is } from '../common.ts';
import { Log } from '../mod.ts';
import { stubConsole } from './-u.stub.ts';

describe('Log.logger (make)', () => {
  it('types', () => {
    // Function shape via exported types (no ad-hoc clones):
    expectTypeOf(Log.logger).toMatchTypeOf<t.LogLib['logger']>();

    // Return type + members are correctly typed:
    const log = Log.logger('Foobar');
    expectTypeOf(log).toMatchTypeOf<t.Logger>();
    expectTypeOf(log.category).toEqualTypeOf<string>();
    expectTypeOf(log.sub).toMatchTypeOf<t.Logger['sub']>();
  });

  it('category(...) returns a callable logger with metadata', () => {
    const log = Log.logger('Foobar');
    expect(log).to.be.a('function');
    expect((log as any).category).to.equal('Foobar');
    expect(typeof (log as any).sub).to.equal('function');

    expectTypeOf(log).toMatchTypeOf<(...args: readonly unknown[]) => void>();
    expectTypeOf((log as any).category).toEqualTypeOf<string>();
    expectTypeOf((log as any).sub).toMatchTypeOf<
      (
        sub: string,
        options?: {
          enabled?: boolean | (() => boolean) | { readonly value: boolean };
          method?: t.LogLevel;
          formatTime?: ((now: Date) => string | null) | null;
        },
      ) => any
    >();
  });

  it('emits via console.info by default (with custom timestamp formatter)', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const log = Log.logger('Foobar', { timestamp: () => 'T' });
      log('hello', { x: 1 });
      expect(calls.info.length).to.equal(1);
      const [first, second, third] = calls.info[0];
      expect(first).to.equal('[Foobar] T');
      expect(second).to.equal('hello');
      expect(third).to.eql({ x: 1 });
    } finally {
      restore();
    }
  });

  it('omits timestamp when formatTime is null', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const log = Log.logger('Foobar', { timestamp: null });
      log('msg');
      expect(calls.info.length).to.equal(1);
      expect(calls.info[0][0]).to.equal('[Foobar]');
      expect(calls.info[0][1]).to.equal('msg');
    } finally {
      restore();
    }
  });

  it('child logger concatenates category with ":"', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const parent = Log.logger('Foobar', { timestamp: () => 'T' });
      const child = parent.sub('Subpart');
      child('connected');
      expect(calls.info.length).to.equal(1);
      expect(calls.info[0][0]).to.equal('[Foobar:Subpart] T');
      expect(calls.info[0][1]).to.equal('connected');
    } finally {
      restore();
    }
  });

  it('respects console method option (log/info/warn/error/debug)', () => {
    const methods: readonly t.LogLevel[] = ['log', 'info', 'warn', 'error', 'debug'];
    for (const m of methods) {
      const { calls, restore } = stubConsole(m);
      try {
        const log = Log.logger('Foobar', { method: m, timestamp: () => 'T' });
        log('x');
        expect(calls[m].length).to.equal(1);
        expect(calls[m][0][0]).to.equal('[Foobar] T');
        expect(calls[m][0][1]).to.equal('x');
      } finally {
        restore();
      }
    }
  });

  it('enabled: defaults to true when undefined', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const log = Log.logger('Foobar', { timestamp: () => 'T' });
      log('x');
      expect(calls.info.length).to.equal(1);
    } finally {
      restore();
    }
  });

  it('enabled: boolean false suppresses output; true allows', () => {
    // false
    {
      const { calls, restore } = stubConsole('info');
      try {
        const log = Log.logger('Foobar', { enabled: false, timestamp: () => 'T' });
        log('x');
        expect(calls.info.length).to.equal(0);
      } finally {
        restore();
      }
    }
    // true
    {
      const { calls, restore } = stubConsole('info');
      try {
        const log = Log.logger('Foobar', { enabled: true, timestamp: () => 'T' });
        log('x');
        expect(calls.info.length).to.equal(1);
      } finally {
        restore();
      }
    }
  });

  it('enabled: { value } reactive ref', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const flag = { value: true };
      const log = Log.logger('Foobar', { enabled: flag, timestamp: () => 'T' });

      log('one');
      expect(calls.info.length).to.equal(1);

      flag.value = false;
      log('two');
      expect(calls.info.length).to.equal(1);

      flag.value = true;
      log('three');
      expect(calls.info.length).to.equal(2);
      expect(calls.info[1][1]).to.equal('three');
    } finally {
      restore();
    }
  });

  it('enabled: () => boolean getter', () => {
    const { calls, restore } = stubConsole('info');
    try {
      let on = true;
      const log = Log.logger('Foobar', { enabled: () => on, timestamp: () => 'T' });

      log('a');
      expect(calls.info.length).to.equal(1);

      on = false;
      log('b');
      expect(calls.info.length).to.equal(1);

      on = true;
      log('c');
      expect(calls.info.length).to.equal(2);
    } finally {
      restore();
    }
  });

  it('enabled composition: parent AND child', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const parentFlag = { value: true };
      const childFlag = { value: true };

      const parent = Log.logger('Foobar', { enabled: parentFlag, timestamp: () => 'T' });
      const child = parent.sub('Subpart', { enabled: childFlag });

      child('1');
      expect(calls.info.length).to.equal(1);

      parentFlag.value = false; // parent off -> all off
      child('2');
      expect(calls.info.length).to.equal(1);

      parentFlag.value = true; // parent on but child off -> off
      childFlag.value = false;
      child('3');
      expect(calls.info.length).to.equal(1);

      childFlag.value = true; // both on -> logs
      child('4');
      expect(calls.info.length).to.equal(2);
      expect(calls.info[1][0]).to.equal('[Foobar:Subpart] T');
      expect(calls.info[1][1]).to.equal('4');
    } finally {
      restore();
    }
  });

  it('parent disabled -> child (subcategory) is also disabled (no prints)', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const parentFlag = { value: false }; // parent OFF
      const parent = Log.logger('Foobar', { enabled: parentFlag, timestamp: () => 'T' });
      const child = parent.sub('Subpart'); // inherits parent OFF

      parent('p');
      child('c');

      expect(calls.info.length).to.equal(0);
    } finally {
      restore();
    }
  });

  it('child disabled does not print, while parent still prints (vice versa check)', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const parentFlag = { value: true }; // parent ON
      const childFlag = { value: false }; // child OFF

      const parent = Log.logger('Foobar', { enabled: parentFlag, timestamp: () => 'T' });
      const child = parent.sub('Subpart', { enabled: childFlag });

      parent('parent-msg');
      child('child-msg');

      // parent logs
      expect(calls.info.length).to.equal(1);
      expect(calls.info[0][0]).to.equal('[Foobar] T');
      expect(calls.info[0][1]).to.equal('parent-msg');
      // child does not
    } finally {
      restore();
    }
  });

  it('timestamp: null removes timestamp even if parent provided a formatter', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const parent = Log.logger('Foobar', { timestamp: () => 'PARENT' });
      const child = parent.sub('Subpart', { timestamp: null });
      child('x');
      expect(calls.info.length).to.equal(1);
      expect(calls.info[0][0]).to.equal('[Foobar:Subpart]');
    } finally {
      restore();
    }
  });

  it('child inherits options and can override them', () => {
    const { calls, restore } = stubConsole('warn');
    try {
      const parent = Log.logger('Foobar', {
        method: 'warn',
        timestamp: () => 'T',
        enabled: true,
      });
      const child = parent.sub('Subpart', { enabled: false }); // override off
      child('x');
      expect(calls.warn.length).to.equal(0);

      const child2 = parent.sub('Other');
      child2('y');
      expect(calls.warn.length).to.equal(1);
      expect(calls.warn[0][0]).to.equal('[Foobar:Other] T');
    } finally {
      restore();
    }
  });

  it('sub-category: sub(...) returns a new function (not identity) with correct metadata', () => {
    const a = Log.logger('Root');
    const b = a.sub('Leaf');
    expect(a).to.not.equal(b);
    expect((b as any).category).to.equal('Root:Leaf');
  });

  it('omits timestamp when formatTime is null (root logger)', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const log = Log.logger('Foobar', { timestamp: null });
      log('hello');
      expect(calls.info.length).to.equal(1);
      expect(calls.info[0][0]).to.equal('[Foobar]');
      expect(calls.info[0][1]).to.equal('hello');
    } finally {
      restore();
    }
  });

  it('child with [timestamp:null] removes timestamp even if parent provided one', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const parent = Log.logger('Foobar', { timestamp: () => 'PARENT' });
      const child = parent.sub('Sub', { timestamp: null });
      child('msg');
      expect(calls.info.length).to.equal(1);
      expect(calls.info[0][0]).to.equal('[Foobar:Sub]');
      expect(calls.info[0][1]).to.equal('msg');
    } finally {
      restore();
    }
  });

  it('child can enable timestamp when parent disabled it (override from null)', () => {
    const { calls, restore } = stubConsole('info');
    try {
      const parent = Log.logger('Foobar', { timestamp: null });
      const child = parent.sub('Sub', { timestamp: () => 'CHILD' });
      child('msg');
      expect(calls.info.length).to.equal(1);
      expect(calls.info[0][0]).to.equal('[Foobar:Sub] CHILD');
      expect(calls.info[0][1]).to.equal('msg');
    } finally {
      restore();
    }
  });

  describe('Browser/CSS prefix color behavior', () => {
    it('browser: uses %c and default prefix color (normalized)', () => {
      const { calls, restore } = stubConsole('info');
      const orig = Is.browser;
      try {
        (Is as any).browser = () => true;

        const log = Log.logger('Foobar', { timestamp: () => 'T' });
        log('hello', 123);

        expect(calls.info.length).to.equal(1);
        const [fmt, css, second, third] = calls.info[0];

        expect(fmt).to.equal('%c[Foobar] T');
        // default color should be used as-is (already valid hex) and formatted into CSS:
        expect(css).to.equal(`color:${D.prefixColor};font-weight:bold;`);
        expect(second).to.equal('hello');
        expect(third).to.equal(123);
      } finally {
        (Is as any).browser = orig;
        restore();
      }
    });

    it('browser: provided prefix color is normalized (case, leading "#")', () => {
      const { calls, restore } = stubConsole('info');
      const orig = Is.browser;
      try {
        (Is as any).browser = () => true;

        const input = '#F06' as t.StringHex; // 3-digit, mixed case
        const expected = '#f06'; // normalized lower-case
        const log = Log.logger('Foobar', { prefixColor: input, timestamp: () => 'T' });
        log('x');

        expect(calls.info.length).to.equal(1);
        const [fmt, css, msg] = calls.info[0];
        expect(fmt).to.equal('%c[Foobar] T');
        expect(css).to.equal(`color:${expected};font-weight:bold;`);
        expect(msg).to.equal('x');
      } finally {
        (Is as any).browser = orig;
        restore();
      }
    });

    it('browser: child inherits parent prefix color unless overridden (normalized)', () => {
      const { calls, restore } = stubConsole('info');
      const orig = Is.browser;
      try {
        (Is as any).browser = () => true;

        const parentInput = '#0A0' as t.StringHex;
        const childInput = '#A00' as t.StringHex;
        const parent = Log.logger('Root', { prefixColor: parentInput, timestamp: () => 'T' });
        const child1 = parent.sub('One'); // inherit
        const child2 = parent.sub('Two', { prefixColor: childInput }); // override

        child1('a');
        child2('b');

        expect(calls.info.length).to.equal(2);

        {
          const [fmt, css, msg] = calls.info[0];
          expect(fmt).to.equal('%c[Root:One] T');
          expect(css).to.equal('color:#0a0;font-weight:bold;');
          expect(msg).to.equal('a');
        }
        {
          const [fmt, css, msg] = calls.info[1];
          expect(fmt).to.equal('%c[Root:Two] T');
          expect(css).to.equal('color:#a00;font-weight:bold;');
          expect(msg).to.equal('b');
        }
      } finally {
        (Is as any).browser = orig;
        restore();
      }
    });

    it('browser: invalid prefixColor falls back to #000000', () => {
      const { calls, restore } = stubConsole('info');
      const orig = Is.browser;
      try {
        (Is as any).browser = () => true;

        const log = Log.logger('Foo', {
          prefixColor: 'red' as unknown as t.StringHex,
          timestamp: () => 'T',
        });
        log('x');

        expect(calls.info.length).to.equal(1);
        const [fmt, css] = calls.info[0];
        expect(fmt).to.equal('%c[Foo] T');
        expect(css).to.equal('color:#000000;font-weight:bold;');
      } finally {
        (Is as any).browser = orig;
        restore();
      }
    });

    it('browser: long hex is normalized to lower-case (#FF00AA88 → #ff00aa88)', () => {
      const { calls, restore } = stubConsole('info');
      const orig = Is.browser;
      try {
        (Is as any).browser = () => true;

        const log = Log.logger('Foo', {
          prefixColor: '#FF00AA88' as t.StringHex,
          timestamp: () => 'T',
        });
        log('x');

        expect(calls.info.length).to.equal(1);
        const [fmt, css] = calls.info[0];
        expect(fmt).to.equal('%c[Foo] T');
        expect(css).to.equal('color:#ff00aa88;font-weight:bold;');
      } finally {
        (Is as any).browser = orig;
        restore();
      }
    });
  });
});
