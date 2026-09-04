import { Str } from '../common.ts';

export const headings = {
  label: 'sample: headings',
  value: Str.dedent(`
    # Heading level 1

    ## Heading level 2

    ### Heading level 3

    #### Heading level 4

    ##### Heading level 5

    ###### Heading level 6
  `),
} as const;
