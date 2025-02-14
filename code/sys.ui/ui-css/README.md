# Style/CSS
Tools for working with Styles/CSS programatically (aka "css-in-js").



### Usage
Applying to a JSX style idiom:

```tsx
import { css } from '@sys/ui-css';

export function View(props:{}) {
  const styles = {
    base: css({ padding: 10 }),
  };
  return <div className={style.base.class}>{'👋 Hello World!'}</div>
}
```


### CSSProps

```bash
Input: { PaddingX: [ 10, 30 ] }
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
