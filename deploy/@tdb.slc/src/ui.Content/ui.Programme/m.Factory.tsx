import React from 'react';
import { type t, Color, css, Sheet, App, Button, DEFAULTS } from '../common.ts';

/**
 * Content: "Programme"
 */
export function factory() {
  const sheetTheme = DEFAULTS.theme.sheet;
  const content: t.StaticContent = {
    '-type': 'StaticContent',
    id: 'Programme',

    render(props) {
      const styles = {
        base: css({ padding: 10 }),
      };

      return (
        <Sheet {...props} theme={sheetTheme} orientation={'Top:Down'}>
          <div className={styles.base.class}>Hello Programme</div>
          {/* {props.children} */}
        </Sheet>
      );
    },
  };
  return content;
}
