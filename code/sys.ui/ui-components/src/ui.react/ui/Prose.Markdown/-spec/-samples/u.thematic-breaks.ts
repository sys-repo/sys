import { Str } from '../common.ts';

export const thematicBreaks = {
  label: 'sample: thematic-break source DSL',
  viewport: 'scroll',
  value: Str.dedent(`
    ### Solid · hyphen

    \`1px · full\`

    ---

    \`1px · light\`

    - - -

    \`2px · full\`

    ----

    \`2px · light\`

    - - - -

    \`4px · full\`

    ------

    \`4px · light\`

    - - - - - -

    \`10px · full\`

    ------------

    \`10px · light\`

    - - - - - - - - - - - -

    ### Dashed · underscore

    \`1px · full\`

    ___

    \`1px · light\`

    _ _ _

    \`2px · full\`

    ____

    \`2px · light\`

    _ _ _ _

    \`4px · full\`

    ______

    \`4px · light\`

    _ _ _ _ _ _

    \`10px · full\`

    ____________

    \`10px · light\`

    _ _ _ _ _ _ _ _ _ _ _ _

    ### Dotted · asterisk

    \`1px · full\`

    ***

    \`1px · light\`

    * * *

    \`2px · full\`

    ****

    \`2px · light\`

    * * * *

    \`4px · full\`

    ******

    \`4px · light\`

    * * * * * *

    \`10px · full\`

    ************

    \`10px · light\`

    * * * * * * * * * * * *
  `),
} as const;
