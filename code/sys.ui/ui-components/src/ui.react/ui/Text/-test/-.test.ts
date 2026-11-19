import { describe, expect, it } from '../../../-test.ts';

import { TextEllipsize } from '../../Text.Ellipsize/mod.ts';
import { TextInput } from '../../Text.Input/mod.ts';
import { TextLabel } from '../../Text.Label/mod.ts';
import { Text } from '../mod.ts';

describe(`@sys/ui-components/react/text`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-components/react/text');
    expect(m.Text).to.equal(Text);
    expect(m.TextInput).to.equal(TextInput);
    expect(m.TextEllipsize).to.equal(TextEllipsize);
    expect(m.TextLabel).to.equal(TextLabel);

    expect(m.Text.Input).to.equal(TextInput);
    expect(m.Text.Ellipsize).to.equal(TextEllipsize);
    expect(m.Text.Label).to.equal(TextLabel);
    const alias = await import('@sys/ui-components/text');
    expect(alias.Text.Label).to.equal(TextLabel);
  });
});
