# Goal
Prove an end-to-end slug → PlaybackDriver pipeline
inside a directionally-correct navigation frame,
such that real JSON-backed video plays in stable layout slots,
while the nav structure reflects the slug architecture without becoming throwaway UI.


====================================================================================================

## Design Frame
We are designing a single recursive host primitive (“sheet”) that instantiates
a complete context inside itself.

Each sheet is trait-driven:
- a sheet-tree-primitive defines navigation and selection
- content traits (media-composition, essay, etc) define rendering and slots

Navigation has only two outcomes:
- update selection within the current sheet
- open a new sheet (a new host instance) with its own traits and tree

A sheet never changes mode in place.
It re-instantiates the same host recursively.

The goal is one generic host, many trait modes, unbounded nesting,
with no special cases as content types or depth increase.


====================================================================================================


## Recursive Sheet Primitive (Canonical)
- **SlugSheet** is the atomic unit: a render context hosting named slots; traits inhabit those slots.
- **SlugSheetController** owns sheet-local state: selection/path, resolved traits, slot composition, navigation intents.
- **SlugSheetStackController** (singular) owns recursion only: push/pop, focus, lifecycle, parent ↔ child wiring.
- Navigation has exactly two outcomes:
  - select within the current SlugSheet
  - push a new SlugSheet via a slug reference (overlay/sheet)
- Content never switches modes in place.
  Different content = a new SlugSheet instance.
- Traits decide *what* renders (media-composition, essay, slug-tree, etc).
  The stack decides *where* and *how deep* it renders.
- In YAML: `- slug: … display: overlay` means **push new SlugSheet**, not a view swap.

One mechanism. Uniform at every depth. No special roots. No special cases.


====================================================================================================

## Yaml

```yaml
data:
  sequence:
    - pause: 3s
      title: Venture Examples
      text:
        body: |
          Venture Examples

    # ↓ THIS is the sheet jump
    - slug: /:core-slugs/3.1.4-the-venture-example-library
      display: overlay
```
