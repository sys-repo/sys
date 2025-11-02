import { describe, expect, it } from '../../../-test.ts';
import { Pattern } from '../m.Pattern.ts';

import { CrdtRef } from '../u.ref.CrdtRef.ts';
import { Id } from '../u.ref.Id.ts';
import { Cropmarks } from '../u.ui.Cropmarks.ts';
import { Css } from '../u.ui.Css.ts';

describe('Pattern', () => {
  it('API', () => {
    expect(Pattern.Id).to.equal(Id);
    expect(Pattern.CrdtRef).to.equal(CrdtRef);
    expect(Pattern.UI.Css).to.equal(Css);
    expect(Pattern.UI.Cropmarks).to.equal(Cropmarks);
  });
});
