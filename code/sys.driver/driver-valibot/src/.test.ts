import { type t, describe, it, expect, Pkg, pkg, c } from './-test.ts';
import * as v from '@valibot/valibot';

type O = Record<string, unknown>;

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('exists', () => {
    console.info(`💦 Module`, pkg);
    expect(typeof pkg.name === 'string').to.be.true;
  });

  /**
   * https://github.com/fabian-hiller/valibot?tab=readme-ov-file#example
   */
  it('sample', () => {
    // Create login schema with email and password
    const LoginSchema = v.object({
      email: v.pipe(v.string(), v.email()),
      password: v.pipe(v.string(), v.minLength(8)),
    });

    // Infer output TypeScript type of login schema.
    type MyType = v.InferOutput<typeof LoginSchema>; // { email: string; password: string }
    const Sample: MyType = { email: 'name@domain.com', password: '12345678' };

    // Throws error for `email` and `password`.
    const fn = () => v.parse(LoginSchema, { email: '', password: '' });
    expect(fn).to.throw();

    const print = (obj: O, title?: string) => {
      const fmtTypename = c.brightCyan(`T:${c.bold('MyType')}`);
      const fmtInferred = `v.InferOutput<typeof ${c.bold('MyType')}>`;
      const fmtTitle = title ? c.white(`: ${title}`) : '';
      console.info();
      console.info(c.gray(`${fmtTypename} ← ${fmtInferred} ${fmtTitle}`));
      console.info(obj);
      console.info();
    };

    // Returns data as { email: string; password: string }
    const parsed = v.parse(LoginSchema, { email: 'jane@example.com', password: '12345678' });
    print(parsed, 'success');

    const safeParsed = v.safeParse(LoginSchema, { email: '', password: '' });
    print(safeParsed, 'fail');
    const issues = safeParsed.issues ?? [];

    expect(safeParsed.success).to.eql(false);
    expect(issues.length).to.be.greaterThan(1);
    expect(issues[0]?.type === 'email').to.eql(true);
    expect(issues[1]?.type === 'min_length').to.eql(true);

    const regex = issues[0]?.requirement! as RegExp;
    expect(regex.test('foo')).to.eql(false);
    expect(regex.test('name@domain.com')).to.eql(true);
  });
});
