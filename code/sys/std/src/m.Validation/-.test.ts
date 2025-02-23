import { describe, expect, it } from '../-test.ts';
import { V } from './mod.ts';

/**
 * https://valibot.dev
 */
describe('Validation: Valibot', () => {
  it('string: AlphanumericWithHyphens', () => {
    const AlphanumericWithHyphens = V.pipe(
      V.string(),
      V.regex(
        /^[A-Za-z][A-Za-z0-9-]*$/,
        'String must start with a letter and can contain letters, digits, and hyphens (hyphen not allowed at the beginning)',
      ),
    );

    const test = (input: string) => {
      const fn = () => V.parse(AlphanumericWithHyphens, input);
      expect(fn).to.throw(
        /String must start with a letter and can contain letters, digits, and hyphens \(hyphen not allowed at the beginning\)/,
      );
    };
    test('123foo'); // NB: Starts with a number.
    test(' 123-foo ');
    test('-foo');
    test('-');
    test('foo*bar');
  });

  it('{object}: type declaration', () => {
    type LoginData = { email: string; password: string };

    const LoginSchema = V.object({
      email: V.string(),
      password: V.string(),
    }) satisfies V.BaseSchema<LoginData, LoginData, V.BaseIssue<unknown>>;

    const a = V.safeParse(LoginSchema, { email: 'name@domain.com', password: 'abc' });
    const b = V.safeParse(LoginSchema, { email: 123, password: 'abc' });

    expect(a.typed && a.success).to.eql(true);
    expect(b.typed && b.success).to.eql(false);
  });
});
