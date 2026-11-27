# Anchor

Use `A` (`Anchor.UI`) for a native link, `Anchor.Link` for a decorated destination, and
`Anchor.Button` for an action that stays on the page. The action is a native, non-submit button:
pass `onClick`, use `enabled={false}` to disable it, and name an icon-only action with `aria-label`
or `aria-labelledby`. A missing or empty link destination renders just its children.

## Browser acceptance

Run `deno task dev` from `code/sys.ui/ui-components`. These are manual checks, not part of the Deno
test suite:

- Open
  [the interaction fixture](http://localhost:1235/ui.react/ui/Anchor/-test.browser/manual.html).
  Follow its keyboard, pointer, form, reflow, and stretched-card instructions. Compare with the
  adjacent native link when checking browser navigation gestures.
- In the **Anchor → Link comparison** specimen, hover and then Tab to **plain / standalone**. The
  dashed underline becomes solid without moving. At the specimen's default size, check for one CSS
  pixel of background between the underline and the settled compact halo. Wrapped prose keeps its
  native stepped outline; don't expect the same clearance on each fragment.
- In **Focus comparison**, check the truncated value and caller-owned outline. Repeat with reduced
  motion (no focus arrival animation) and forced colours (visible system outline). Record the
  browser, zoom, preferences, and observed paint when reporting results.
