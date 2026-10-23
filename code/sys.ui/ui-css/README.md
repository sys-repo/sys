# @sys/ui-css

Typed CSS composition and runtime stylesheet helpers. Styles become CSS rules without a special
bundler plugin or PostCSS step. The runtime is not tied to React; this example uses React TSX.

## Usage

Use a TSX toolchain that resolves JSR imports and a browser DOM/CSSOM for installed styles:

```tsx
import { css, type t } from 'jsr:@sys/ui-css';

export function Greeting(props: { style?: t.Style.Input } = {}) {
  const base = css({ padding: 10, color: 'navy' });
  const style = css(base, props.style);
  return <div className={style.class}>{'Hello'}</div>;
}
```

`css` accepts style objects, previous transform results, and nested input arrays; later inputs
override earlier properties. Nullish inputs and `false` are ignored. A result exposes the
transformed `.style`, CSS text through `.toString()`, and a generated `.class` for the element.

Transforming can acquire or create a stylesheet; reading `.class` registers the corresponding rule.
This is runtime DOM styling, not a guarantee of server-rendering or hydration integration.

## Further styling

The root also exports `Style`, `Color`, and `WebFont`. Use `Style` for templates, spacing, and
stylesheet control, and `WebFont` for font definitions and injection. Types are available through
`type t` or the `/t` entry.

For custom class prefixes, supply `Style.Dom.stylesheet({ classPrefix: 'my-app' })` as the `sheet`
option to `Style.transformer`; `prefix` is not a transformer option. A class prefix is naming, not
style isolation.

Transform results support `.rule(...)` for scoped selectors and `.container(...)` for container
queries; the containing element still needs an appropriate `containerType`. See the
[API documentation](https://jsr.io/@sys/ui-css/doc) for these advanced surfaces.
