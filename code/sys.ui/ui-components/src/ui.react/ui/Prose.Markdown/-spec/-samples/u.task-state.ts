import { Str } from '../common.ts';

export const taskState = {
  label: 'sample: task-state `<Switch>` override',
  value: Str.dedent(`
    Caller-owned task-state renderer:

    - [x] completed through \`Buttons.Switch\`
    - [ ] pending through \`Buttons.Switch\`
    - [x] this deliberately longer task wraps within the prose measure so continuation lines stay aligned with the task body instead of sliding beneath the switch marker
  `),
} as const;
