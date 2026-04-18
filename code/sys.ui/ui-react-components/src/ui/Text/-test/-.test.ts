import { describe, expect, it } from '../../../-test.ts';

import { TextEllipsize } from '../../Text.Ellipsize/mod.ts';
import { TextInput } from '../../Text.Input/mod.ts';
import { Text } from '../mod.ts';

describe(`@sys/ui-react-components/text`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components/text');
    expect(m.Text).to.equal(Text);
    expect(m.TextInput).to.equal(TextInput);
    expect(m.TextEllipsize).to.equal(TextEllipsize);

    expect(m.Text.Input).to.equal(TextInput);
    expect(m.Text.Ellipsize).to.equal(TextEllipsize);
  });
});
