import { type t, Str } from '../common.ts';

export const typescript = 'const foo: number = 123;';
export const javascript = 'const foo = 123;';

export const python = `
def greet(name):
    if not name:
        return "Name is empty!"
    return f"Hello, {name}!"

names = ["Alice", "", "Bob"]
for name in names:
    greeting = greet(name)
    if "empty" in greeting:
        print("Skipping empty name...")
        continue
    print(greeting)
else:
    print("End of names list.")

`;

export const markdown = `
# Markdown Title
- one
- two
- three

---

${Str.Lorem.toString()}
`;

export const go = `
// Q (Compute Language)
// example: Yao's hidden millionare:
// ref: https://quilibrium.com/docs

func main(a, b) bool {
  return a.TotalBalance < b.TotalBalance
}
`;

export const yaml = `
foo:
  - one
  - two
  - three
`;

export const json = JSON.stringify({ name: 'foo', version: '0.1.2' }, null, '  ');

export const rust = `
fn main() {
  println!("Hello, Rust!");
}
`;

/**
 * Index
 */
type T = { [key in t.EditorLanguage]: string };
export const SAMPLE_CODE: Partial<T> = {
  go,
  python,
  typescript,
  javascript,
  markdown,
  yaml,
  json,
  rust,
};
