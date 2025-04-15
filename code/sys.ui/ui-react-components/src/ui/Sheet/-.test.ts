import { describe, expect, it, Signal } from '../../-test.ts';
// import { VIDEO } from '../App.Content/mod.ts';
import { Sheet } from './mod.ts';

type T = { id: string };

describe('Sheet', () => {
  describe('Sheet.Signals:stack', () => {
    const a: T = { id: 'a' };
    const b: T = { id: 'b' };
    const c: T = { id: 'c' };

    describe('factory', () => {
      it('passed in signal (param)', () => {
        const signal = Signal.create<T[]>([]);
        const state = Sheet.Signals.stack(signal);

        expect(state.length).to.eql(0);
        expect(state.items).to.eql([]);
        expect(state.items).to.not.equal(signal.value); // NB: cloned array - protect from mutation.
        expect(state.toSignal()).to.equal(signal);

        signal.value = [{ id: 'foo' }];
        expect(state.items).to.eql([{ id: 'foo' }]);
      });

      it('generate signal (no param)', () => {
        const state = Sheet.Signals.stack();

        expect(state.length).to.eql(0);
        state.toSignal().value = [{ id: 'foo' }];
        expect(state.items).to.eql([{ id: 'foo' }]);
      });
    });

    describe('method: push', () => {
      it('push (1) - triggers signal effect', () => {
        const signal = Signal.create<T[]>([]);
        const stack = Sheet.Signals.stack(signal);
        const fired: number[] = [];
        Signal.effect(() => {
          fired.push(signal.value.length);
        });

        expect(stack.length).to.eql(0);
        stack.push(a);
        expect(stack.length).to.eql(1);
        expect(signal.value).to.eql([a]);
        expect(fired).to.eql([0, 1]);

        stack.push(b);
        expect(stack.length).to.eql(2);
        expect(signal.value).to.eql([a, b]);
        expect(fired).to.eql([0, 1, 2]);
      });

      it('push (many)', () => {
        const signal = Signal.create<T[]>([]);
        const stack = Sheet.Signals.stack(signal);
        const fired: number[] = [];
        Signal.effect(() => {
          fired.push(signal.value.length);
        });

        stack.push(a);
        expect(stack.length).to.eql(1);
        expect(fired).to.eql([0, 1]);

        stack.push(b, c);
        expect(stack.length).to.eql(3);
        expect(signal.value).to.eql([a, b, c]);
        expect(fired).to.eql([0, 1, 3]);
      });

      it('push <undefined>', () => {
        const signal = Signal.create<T[]>([]);
        const stack = Sheet.Signals.stack(signal);
        stack.push();
        stack.push(undefined, a, undefined, b);
        expect(stack.length).to.eql(2);
        expect(signal.value).to.eql([a, b]);
      });
    });

    describe('method: clear', () => {
      it('clear all', () => {
        const signal = Signal.create<T[]>([]);
        const stack = Sheet.Signals.stack(signal);
        const fired: number[] = [];
        Signal.effect(() => {
          fired.push(signal.value.length);
        });

        stack.push(a, b);
        expect(signal.value).to.eql([a, b]);
        expect(fired).to.eql([0, 2]);
        expect(stack.length).to.eql(2);

        stack.clear();
        expect(fired).to.eql([0, 2, 0]);
        expect(stack.length).to.eql(0);
      });

      it('clear( leave )', () => {
        const test = (leave: number) => {
          const signal = Signal.create<T[]>([]);
          const stack = Sheet.Signals.stack(signal);
          stack.push(a, b, c);
          expect(stack.length).to.eql(3);

          stack.clear(leave);
          expect(stack.length).to.eql(leave);
        };
        test(0);
        test(1);
        test(2);
      });
    });

    it('method: exists', () => {
      const signal = Signal.create<T[]>([]);
      const stack = Sheet.Signals.stack(signal);
      stack.push(a, b);

      expect(stack.exists((m) => m.id === a.id)).to.eql(true);
      expect(stack.exists((m) => m.id === b.id)).to.eql(true);
      expect(stack.exists((m) => m.id === c.id)).to.eql(false);
    });

    describe('method: pop', () => {
      it('pop: removes top most layer', () => {
        const signal = Signal.create<T[]>([]);
        const stack = Sheet.Signals.stack(signal);
        const fired: number[] = [];
        Signal.effect(() => {
          fired.push(signal.value.length);
        });

        stack.push(a, b, c);
        expect(fired).to.eql([0, 3]);

        stack.pop();
        expect(fired).to.eql([0, 3, 2]);
        expect(signal.value).to.eql([a, b]);

        stack.pop();
        stack.pop();
        expect(fired).to.eql([0, 3, 2, 1, 0]);
        expect(signal.value).to.eql([]);

        stack.pop(); // NB: ← already empty at this point.
        expect(signal.value).to.eql([]);

        expect(fired.length).to.eql(5);
        stack.pop();
        stack.pop();
        expect(fired.length).to.eql(5); // NB: no change (already empty).
      });

      it('pop( leave ) ← retain minimum level', () => {
        const signal = Signal.create<T[]>([]);
        const stack = Sheet.Signals.stack(signal);
        stack.push(a, b, c);
        expect(stack.length).to.eql(3);

        stack.pop(3);
        stack.pop(3);
        expect(stack.length).to.eql(3);

        stack.pop();
        expect(stack.length).to.eql(2);

        stack.pop(1);
        stack.pop(1);
        stack.pop(1);
        expect(stack.length).to.eql(1);

        stack.pop(-1);
        expect(stack.length).to.eql(0);
        stack.pop(-1);
        stack.pop(-1);
        expect(stack.length).to.eql(0);
      });
    });
  });
});
