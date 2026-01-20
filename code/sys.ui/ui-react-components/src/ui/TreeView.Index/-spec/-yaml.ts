/**
 * Canonical demo: exercises scalar leaves, object leaves, meta labels,
 * children (array & record), id overrides, and multi‑level nesting.
 */
export const SAMPLE_YAML = `
- Getting Started: crdt:ref

- Foo:
  - a: 1
  - b: 2

- Bar:
  .: { label: 'Bar (custom)', enabled: false }
  a: 1
  b: 2

- Examples:
    .: { note: 'group', id: 'examples' }
    info: 'group details'        # becomes part of node.value
    children:
      - SubTree:
          .: { note: 'nested group', id: 'sub' }
          children:
            - Alpha: ref:alpha
            - Beta: ref:beta
      - Bar: hello

- Section:
    children:
      A: ref:a
      B:
        .: { label: 'Bee', id: 'b-id' }
        children:
          C: ref:c
          D:
            .: { label: 'Dee' }
            children:
              E: ref:e

- ArrayLeaf:
  - 1: true
  - 2: false
  - 3: hello
`;
