import { describe, expect, it } from '../../-test.ts';
import { dependentClosure } from '../u.plan.ts';

describe('@sys/workspace/bump plan helpers', () => {
  it('includes generated tmpl coupling in the bump closure', () => {
    const res = dependentClosure('code/-tmpl', [{ from: 'code/-tmpl', to: 'code/sys.tools' }], [
      'code/-tmpl',
      'code/sys.tools',
    ]);

    expect(res).to.include('code/-tmpl');
    expect(res).to.include('code/sys.tools');
  });

  it('includes generated driver-agent coupling in the bump closure', () => {
    const res = dependentClosure(
      'code/sys.driver/driver-agent',
      [{ from: 'code/sys.driver/driver-agent', to: 'code/sys.tools' }],
      ['code/sys.driver/driver-agent', 'code/sys.tools'],
    );

    expect(res).to.include('code/sys.driver/driver-agent');
    expect(res).to.include('code/sys.tools');
  });
});
