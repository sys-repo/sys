# Style/CSS
Tools for working with Styles/CSS programatically (aka "css-in-js").

Note: This approach is a pure JS-to-CSS/DOM approach, with zero-dependencies on any other
special bundler plugin, or post-css processing type dependencies, which inevitably cause 
problems down stream when importing UI components from registry modules (less moving pieces).


### Usage
Applying within a JSX programming style idiom:

```tsx
import { css } from '@sys/ui-css';

export function Component(props:{}) {
  const styles = {
    base: css({ padding: 10 }),
  };
  return <div className={style.base.class}>{'👋 Hello World!'}</div>
}
```


### CSSProps
Transformation pipeline.

```bash
Input: { PaddingX: [ 10, 30 ] }  ← NB: capitalized "template" expander(s).
↓

CssTransform:
{
  hx: 12868363545722,
  style: [Getter],
  class: [Getter],
  toString: [Function: toString]
}

↑.style: { paddingRight: 30, paddingLeft: 10 }
↑.class: "foo-12868363545722"
↑.toString(): "padding-right: 30px; padding-left: 10px;"

```

The `css` transformer function, generated like so:

```ts
const css = Style.transformer({ prefix: 'my-prefix' })
const base = css({ display: 'grid' });
```

...scopes/namespaces the root of the CSS class-names generated by the `base.class` property.  

When calling this property for the first time the [`CSSStyleSheet`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet) is generated
for the `{style}` based on the hash of the `CssProps` object, and inserted into the DOM.

The CSS class-name is generated from the hash of the style ( `\<prefix\>-<hx>` ) 
and calls to this function are memoized, keyed on the hash, to ensure the function 
is safe to use in "render heavy" frameworks like React (et al.).

