import { describe, expect, it, JsrUrl } from './common.ts';

describe('JsrUrl.Pkg.Is', () => {
  it('name', () => {
    expect(JsrUrl.Pkg.Is.name('@sys/std')).to.eql(true);
    expect(JsrUrl.Pkg.Is.name('@sys-labs/std-tools')).to.eql(true);
    expect(JsrUrl.Pkg.Is.name('@Sys/std')).to.eql(false);
    expect(JsrUrl.Pkg.Is.name('sys/std')).to.eql(false);
    expect(JsrUrl.Pkg.Is.name('@sys/')).to.eql(false);
    expect(JsrUrl.Pkg.Is.name('@sys/std/path')).to.eql(false);
    expect(JsrUrl.Pkg.Is.name(123)).to.eql(false);
  });
});
