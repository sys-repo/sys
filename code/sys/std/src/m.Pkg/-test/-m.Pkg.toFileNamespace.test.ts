import { describe, expect, it } from '../../-test.ts';
import { Pkg } from '../mod.ts';

describe('Pkg.toFileNamespace', () => {
  it('flattens package names to filesystem namespace segments', () => {
    const pkg = Pkg.fromJson({ name: '@sys/cell', version: '1.2.3' });
    const area = Pkg.fromJson({ name: '@sys/model/files', version: '1.2.3' });
    const collapsed = Pkg.fromJson({ name: '@sys////model/files', version: '1.2.3' });

    expect(Pkg.toFileNamespace(pkg)).to.eql('@sys.cell');
    expect(Pkg.toFileNamespace(area)).to.eql('@sys.model.files');
    expect(Pkg.toFileNamespace(collapsed)).to.eql('@sys.model.files');
  });

  it('rejects unknown or invalid package names', () => {
    const unknown = Pkg.fromJson({ name: '<unknown>', version: '0.0.0' });
    const spaces = Pkg.fromJson({ name: '@sys/foo bar', version: '0.0.0' });
    const chars = Pkg.fromJson({ name: '@sys/foo🐷', version: '0.0.0' });

    expect(() => Pkg.toFileNamespace(unknown)).to.throw(Error);
    expect(() => Pkg.toFileNamespace(spaces)).to.throw(Error);
    expect(() => Pkg.toFileNamespace(chars)).to.throw(Error);
  });
});
