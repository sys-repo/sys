import { describe, expect, it } from '../../../-test.ts';
import { Spinner } from '../mod.ts';

describe('CLI: Spinner', () => {
  it('stops the spinner after async work', async () => {
    const events: string[] = [];
    const original = Spinner.start;

    Object.defineProperty(Spinner, 'start', {
      value: (text = '') => {
        events.push(`start:${text}`);
        return {
          text,
          start(next = text) {
            events.push(`restart:${next}`);
            this.text = next;
            return this;
          },
          stop() {
            events.push('stop');
            return this;
          },
          succeed(next = text) {
            events.push(`succeed:${next}`);
            this.text = next;
            return this;
          },
          fail(next = text) {
            events.push(`fail:${next}`);
            this.text = next;
            return this;
          },
        };
      },
    });

    try {
      const result = await Spinner.with('working...', async (spinner) => {
        spinner.text = 'done';
        return 42;
      });

      expect(result).to.eql(42);
      expect(events).to.eql(['start:working...', 'stop']);
    } finally {
      Object.defineProperty(Spinner, 'start', { value: original });
    }
  });
});
