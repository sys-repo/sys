# Color
Tools for working with color values.

### Example
General [RGBA](https://en.wikipedia.org/wiki/RGBA_color_model) helpers:
```ts
import { Color, Theme } from 'jsr:@sys/color/rgb';

const theme = Theme.create('Dark');
const overlay = Color.alpha(theme.fg, 0.3);
```

[ANSI](https://en.wikipedia.org/wiki/ANSI_escape_code) colors for working with the command-line (terminal):
```ts
import { c, Color } from 'jsr:@sys/color/ansi';
```
