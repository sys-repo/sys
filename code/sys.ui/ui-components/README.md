# @sys/ui-components

React primitives for composing controls, content, layouts, and media interfaces.

The package root and `/react` export only `pkg`. Import components from explicit `/react/*`
subpaths; `/t` provides types only.

## Entry points

Start with the group that matches the interface:

- **Controls and presentation:** [Button](https://jsr.io/@sys/ui-components/doc/react/button),
  [Icon](https://jsr.io/@sys/ui-components/doc/react/icon), and related primitives.
- **Content:** [Prose](https://jsr.io/@sys/ui-components/doc/react/prose) and
  [ObjectView](https://jsr.io/@sys/ui-components/doc/react/object-view).
- **Layout:** [SplitPane](https://jsr.io/@sys/ui-components/doc/react/layout/split-pane) and
  [Tabs](https://jsr.io/@sys/ui-components/doc/react/layout/tabs).
- **Media:** [Media](https://jsr.io/@sys/ui-components/doc/react/media) and
  [Player](https://jsr.io/@sys/ui-components/doc/react/player).
- **Focus styling:** `FocusStyle` from `@sys/ui-components/style/focus` shares the focus-arrival
  policy with component-owned paint.

Add a public subpath only when callers need to import a feature on its own. A new directory or API
member is not reason enough.

## Component guides

- [Button](./src/ui.react/ui/Button/README.md) — text actions and keyboard focus.

See the [API documentation](https://jsr.io/@sys/ui-components/doc) for component props and exports.
