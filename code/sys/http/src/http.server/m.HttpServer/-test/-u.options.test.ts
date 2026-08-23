import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { optionsWith } from '../u/u.options.ts';

describe('HttpServer.options', () => {
  it('bypasses port selection only for an explicit strict port', () => {
    const selected: Array<t.PortNumber | undefined> = [];
    const selectedPort = 49_153 as t.PortNumber;
    const deps: Parameters<typeof optionsWith>[0] = {
      selectPort(port) {
        selected.push(port);
        return selectedPort;
      },
    };

    const strictPort = 49_152 as t.PortNumber;
    const strict = optionsWith(deps, { port: strictPort, strictPort: true });
    expect(strict.port).to.eql(strictPort);
    expect(selected).to.eql([]);

    const zero = optionsWith(deps, { port: 0, strictPort: true });
    expect(zero.port).to.eql(0);
    expect(selected).to.eql([]);

    const fallback = optionsWith(deps, { port: strictPort });
    expect(fallback.port).to.eql(selectedPort);
    expect(selected).to.eql([strictPort]);

    const omitted = optionsWith(deps, { strictPort: true });
    expect(omitted.port).to.eql(selectedPort);
    expect(selected).to.eql([strictPort, undefined]);
  });
});
