import { describe, expect, it, nodeProcess } from './common.ts';
import { setExitCode } from '../u/u.exit.ts';

describe('@sys/cell/cli exit status', () => {
  for (const code of [0, 1, 130, 137]) {
    it(`outcome ${code} → Deno and Node agree before terminal exit hooks`, () => {
      const deno = Deno.exitCode;
      const node = nodeProcess.exitCode;
      try {
        setExitCode(code);
        expect(Deno.exitCode).to.eql(code);
        expect(nodeProcess.exitCode).to.eql(code);
      } finally {
        nodeProcess.exitCode = node;
        Deno.exitCode = deno;
      }
    });
  }
});
