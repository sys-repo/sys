import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Log } from '../mod.ts';
import { stubConsole } from './-u.stub.ts';

describe('Log', () => {
  it('API', async () => {
    const a = await import('../../mod.ts');
    const b = await import('@sys/std/log');
    expect(a.Log).to.equal(Log);
    expect(b.Log).to.equal(Log);
  });

  describe('Logger', () => {
    it('make(...) returns a callable logger with metadata', () => {
      const log = Log.make('A');
      expect(log).to.be.a('function');
      expect((log as any).category).to.equal('A');
      expect(typeof (log as any).make).to.equal('function');

      // Type assertions (shape-only)
      expectTypeOf(log).toMatchTypeOf<(...args: readonly unknown[]) => void>();
      expectTypeOf((log as any).category).toEqualTypeOf<string>();
      expectTypeOf((log as any).make).toMatchTypeOf<
        (
          sub: string,
          options?: { enabled?: unknown; method?: unknown; formatTime?: (d: Date) => string },
        ) => unknown
      >();
    });

    it('emits via console.info by default with stable prefix', () => {
      const { calls, restore } = stubConsole('info');
      try {
        const log = Log.make('A', { formatTime: () => 'TIME' });
        log('hello', { x: 1 });
        expect(calls.info.length).to.equal(1);
        const [first, second, third] = calls.info[0];
        expect(first).to.equal('[A] TIME'); // prefix
        expect(second).to.equal('hello');
        expect(third).to.eql({ x: 1 });
      } finally {
        restore();
      }
    });

    it('child logger concatenates category using ":"', () => {
      const { calls, restore } = stubConsole('info');
      try {
        const parent = Log.make('A', { formatTime: () => 'T' });
        const child = parent.make('B');
        child('msg');
        expect(calls.info.length).to.equal(1);
        expect(calls.info[0][0]).to.equal('[A:B] T');
        expect(calls.info[0][1]).to.equal('msg');
      } finally {
        restore();
      }
    });

    it('respects console method option (log/info/warn/error/debug)', () => {
      const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
      for (const m of methods) {
        const { calls, restore } = stubConsole(m);
        try {
          const log = Log.make('A', { method: m, formatTime: () => 'T' });
          log('x');
          expect(calls[m].length).to.equal(1);
          expect(calls[m][0][0]).to.equal('[A] T');
          expect(calls[m][0][1]).to.equal('x');
        } finally {
          restore();
        }
      }
    });

    it('enabled: defaults to true (undefined)', () => {
      const { calls, restore } = stubConsole('info');
      try {
        const log = Log.make('A', { formatTime: () => 'T' });
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
          const log = Log.make('A', { enabled: false as boolean, formatTime: () => 'T' });
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
          const log = Log.make('A', { enabled: true as boolean, formatTime: () => 'T' });
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
        const log = Log.make('A', { enabled: flag, formatTime: () => 'T' });

        log('one');
        expect(calls.info.length).to.equal(1);

        flag.value = false;
        log('two');
        expect(calls.info.length).to.equal(1); // unchanged, suppressed

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
        const log = Log.make('A', { enabled: () => on, formatTime: () => 'T' });

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

        const parent = Log.make('A', { enabled: parentFlag, formatTime: () => 'T' });
        const child = parent.make('B', { enabled: childFlag });

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
        expect(calls.info[1][0]).to.equal('[A:B] T');
        expect(calls.info[1][1]).to.equal('4');
      } finally {
        restore();
      }
    });

    it('formatTime override is used for the prefix', () => {
      const { calls, restore } = stubConsole('info');
      try {
        const log = Log.make('A', { formatTime: () => 'CUSTOM' });
        log('x');
        expect(calls.info.length).to.equal(1);
        expect(calls.info[0][0]).to.equal('[A] CUSTOM');
      } finally {
        restore();
      }
    });

    it('child logger inherits options and can override them', () => {
      const { calls, restore } = stubConsole('warn');
      try {
        const parent = Log.make('A', { method: 'warn', formatTime: () => 'T', enabled: true });
        const child = parent.make('B', { enabled: false }); // override off
        child('x');
        expect(calls.warn.length).to.equal(0);

        const child2 = parent.make('C'); // inherits enabled: true
        child2('y');
        expect(calls.warn.length).to.equal(1);
        expect(calls.warn[0][0]).to.equal('[A:C] T');
      } finally {
        restore();
      }
    });

    it('child logger is a different function (not identity) with correct metadata', () => {
      const a = Log.make('Root');
      const b = a.make('Leaf');
      expect(a).to.not.equal(b);
      expect((b as any).category).to.equal('Root:Leaf');
    });
  });
});
