@sys.ui-components
markdown-admonition-panel.plan.md
- [x] 6d3e56310 chore(ui-components): scaffold Admonition UI
- [x] 5507287b8 feat(ui-components): render compact Markdown admonitions
- [x] e2dd9ebf6 feat(ui-components): complete the Admonition kind icon set
- [x] 17eae73e2 feat(ui-components): control Admonition text selection
- [x] 3415b11e0 refactor(ui): adopt Admonition for passkey registration guidance
- [x] 554b6d24d fix(ui): improve wrapping in the passkey result row
- [x] 682b76997 fix(ui-components): standardize compact text button focus
- [x] bfb28e7d2 fix(ui): clarify passkey actions and context typography
- [x] ebfbd42a5 fix(ui-components): align Dev.Help Markdown link cues with Admonition
- [x] cb04b7b7c fix(ui-components): strengthen Chip fill and border in dark mode

## The form

`Admonition.UI` is a short editorial aside: one thing worth knowing before continuing.
The [O'Reilly style guide](https://oreillymedia.github.io/production-resources/styleguide/#headings)
calls the form an admonition and makes its title optional. Kinds describe editorial intent, not
announcement urgency. All render a quiet `role="note"`, not an alert or live region.

**Authoring convention:** one Markdown string. A plain paragraph is a complete note. An optional
opening `#` gives the takeaway; a blank line introduces the explanation:

```md
# Use a sample passkey

Restarting the cell's `sys.ui:accounts` service clears its in-memory accounts, registrations,
and sessions.
```

`#` is the title of this fragment, not a new page heading. For the first consumer, use the existing
`Prose.Markdown` heading renderer to present it as a strong paragraph: body-sized, full foreground,
with a compact gap before the body (`0.25rem` to try at 360px). No separate title prop, forced line
break, or guessing from the first bold span. Inline emphasis, inline links (`[label](url)`), and
code chips belong in the body. Reference-style definitions are not supported by `Prose.Markdown`;
any future support belongs there, before the existing URL filter and link renderer.

Reserve `##` for a short label within a longer note, not a second takeaway or a required subtitle.
Author the expanded specimen’s `## Dolor sit amet` in sentence case. Use local CSS for all caps,
`0.05em` tracking, and 40% foreground in both themes. The stronger per-theme colors made the
label compete with the body in the rendered specimen. The `##` label is below WCAG AA normal-text
contrast on the default panels (about 2.22:1 Light and 3.18:1 Dark, versus 4.5:1). This is an
accepted limitation for this release. The owner test checks the label’s hierarchy relative to body
text, not AA compliance. Keep the label close to the paragraph it introduces. Pull ordinary
top-level bullet markers toward the prose edge while retaining a hanging indent. Judge it at 360px in both themes; do not add a heading scale, a
casing prop, or change shared Markdown styles. This is an authoring convention, not a new parser.

## Public contract (`t.ts`, second landing)

- `t.Admonition.Props` takes `markdown: string` and retains the scaffold's optional `debug`, `theme`,
  and `style` props. The same Markdown works with or without a title.
- `kind?: Admonition.Kind` accepts `note`, `tip` (default), `important`, `caution`, and `warning`.
  Keep the Passkey bulb for `tip`; each other kind has its own glyph.
  All glyphs are decorative. Kind does not change the note’s ARIA role or select a color scale.
- `radius?: t.Pixels` sets the corner radius; default 4, with 0 for square corners.
- `id?: string` is forwarded unchanged to the note element. Omit the DOM ID when none is supplied.
  The caller owns any relationship: Passkey already uses React's `useId()` to give the note an ID
  and point eligible Create/Add controls to it with `aria-describedby`.

## Landings

1. **Scaffold only.** Human-led `@sys/tmpl` plain `m.mod.ui` laydown at
   `code/sys.ui/ui-components/src/ui.react/ui/Admonition/`. Review name and landing together. No
   controller, Markdown behavior, or adoption in this commit.
2. **Implement and export.** Start with the public contract and export `Admonition` from
   `@sys/ui-components/react/admonition`. Compose `Prose.Markdown.UI`, `Chip.UI`, the hint icon,
   and the existing Anchor primitives; own the note element, its internal spacing, and local
   typography. Leave shared Markdown defaults unchanged and Dev dependencies out of production.
   Test that omitted and explicit `'tip'` render equivalently and that the caller's ID lands on
   the note itself. Cover titled and untitled notes, ordinary bold body text, chips, and links.
3. **Complete the kind icon set.** Use the existing kind cycle to compare `note`, `tip`,
   `important`, `caution`, and `warning` against identical text at 20px in Light and Dark. Start
   from the Passkey bulb. Choose the set together for legibility and consistent visual weight,
   then replace the dashed fallback and update its owner tests. Keep the glyphs decorative and
   the container’s `role="note"` unchanged for every kind. The chosen set is a closed book for
   `note`, bulb for `tip`, megaphone for `important`, circled `!` for `caution`, and triangle for `warning`.
4. **Control text selection.** Add `selectable?: boolean` (default `true`) to Admonition. Apply
   `user-select` to its Markdown body without changing link behavior; expose a specimen toggle.
5. **Adopt in Passkey.** Replace the sample's local `RegistrationNote`
   with the shared note. Change the advisory's opening markup, not its wording or link destinations.
   The sample owns visibility, the 20px top margin on the note, and `aria-describedby` on eligible
   Create/Add buttons only. Preserve link and button-description regressions; check wrapping at
   360px in Light and Dark without invoking a credential action.
6. **Improve Passkey result wrapping.** Give italic results a 2px inline-end inset for glyph
   overhang and prefer `text-wrap: pretty` for the result. Keep the text and live-region behavior
   unchanged. Check the right edge and final line separately at 360px in Light and Dark.
7. **Standardize compact text Button focus at the owner.** Use the Presentation picker’s focused
   `Actions` row as the reference for the rounded outline and its fade, not for its row height.
   Keep the existing focus recipe (blue arrival → quiet rest), reduced-motion and forced-colors
   behavior. Set Button’s default root radius to 3px; preserve explicit radii, including 0, and
   leave Anchor unchanged. Provide a shared way to show an enabled blue text action at rest,
   without simulating hover or coloring disabled actions as available.

   **Landing check:** In the rejected Passkey capture the top of the `Create Passkey` ring meets
   the bottom of `Sign In`. Keep the text aligned to the column edge and give the ring horizontal
   clearance, but **leave visible space above and below the painted outline**. It must not touch
   a neighboring control or divider, clip the text, or shift rows when focus moves. Verify with
   actual keyboard focus in a compact stacked Button specimen in Light and Dark, both on arrival
   and after the fade. CSS assertions alone do not prove that the painted edges clear one another.
8. **Clarify Passkey actions and Context.** `bfb28e7d2` landed the Passkey hierarchy and typography
   before the shared Button treatment: `Existing account` comes first in reading and tab order,
   `Sign In` stays filled, and `Create Passkey` uses the shared text Button with its neutral label.
   Disabled and pending behavior, the registration-note description on eligible Create controls,
   and signed-in actions are unchanged. Context values inherit sans-serif while preserving exact
   text, selection, wrapping, and the configured Origin link cues.

   The separate [Passkey consumer layout follow-up](../@sys.ui/passkey-panel.plan/ui-nits.md)
   owns accent adoption and focus clearance.
9. **Align Dev.Help links.** Apply the settled Admonition link treatment to equivalent destinations
   in `Dev.Help.Markdown.UI`. Verify equivalent web links carry the same opening cues and handler
   links do not promise a new tab. Preserve caller renderer overrides and the unframed cursor help.
10. **Strengthen Dark Chip contrast.** `Chip.UI` uses 9% theme foreground for the fill and 14%
    for the 1px border in Dark. Light, the unthemed `currentColor` fallback, inherited text color,
    and geometry are unchanged. Both Markdown renderers inherit the treatment. The focused run
    passed 6 tests / 28 steps. The Dark Dev.Help Workflow capture showed that `Apply` stands
    apart without looking clickable. No separate rendered check on the tinted Admonition surface
    was recorded.

## Layout specimen (`-spec`, second landing)

Use one `Dev.List` to switch between named sets of sample content and props on the same
`Admonition.UI`. Start with **Titled**: a short `#` lead, one paragraph, an inline chip, and
`example.com` references. Use lorem ipsum throughout so the specimen never reads as product
instructions. Include **Plain** (one sentence, no title or reserved gap) and **Expanded** (the same
lead/body rhythm plus a secondary `##` label introducing a short list with a wrapped item).
Both include an inline chip and a web link. Center the icon on the first text line, not the note;
try 11px vertical and 10px horizontal padding. Compare Plain for vertical balance and the DEBUG
panel’s tip for wrapping.

Selecting a `Dev.List` sample loads its Markdown and its kind into the specimen. In the DEBUG
panel's top group of prop buttons, cycle all five kinds on the same signal as the sample list.
Show capitalized display names; keep API values lowercase. A separate radius control cycles
0, 4, 8, and 12px. Neither control changes the sample text.
Flip Light/Dark and narrow the host to 360px to compare wrapping and the secondary label's weight.

## Link consistency, not panel unification

[Dev.Help.Markdown](../../../code/sys.ui/ui-components/src/ui.react/dev/m.Help.Markdown/ui.tsx)
is unframed reference prose, not another admonition. Both use `Prose.Markdown`; neither production
code nor shared link policy belongs under `Dev`. For the same web reference requesting a new tab,
prefer `Anchor.Link openIn='new-tab'`: it provides the visible arrow and accessible opening
explanation while preserving the authored title. `Anchor.UI target='_blank'` secures the native
anchor but does not supply those cues. Being in Dev is not itself a reason to omit them.

Do not replace every Markdown anchor mechanically: the Markdown URL policy also admits `mailto:`
and `tel:`, which are handler links rather than new-tab web references. Preserve that policy. The
follow-on aligns link behavior, not the surrounding panels; it does not make Dev.Help render an
admonition or move runtime policy under `Dev`.
