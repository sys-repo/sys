import process from 'node:process';
import { describe, expect, it } from '../../-test.ts';
import { setExitCode } from '../u/u.exit.ts';

describe('@sys/cell/cli exit status', () => {
  for (const code of [0, 1, 130, 137]) {
    it(`outcome ${code} → Deno and Node agree before terminal exit hooks`, () => {
      const deno = Deno.exitCode;
      const node = process.exitCode;
      try {
        setExitCode(code);
        expect(Deno.exitCode).to.eql(code);
        expect(process.exitCode).to.eql(code);
      } finally {
        process.exitCode = node;
        Deno.exitCode = deno;
      }
    });
  }
});
