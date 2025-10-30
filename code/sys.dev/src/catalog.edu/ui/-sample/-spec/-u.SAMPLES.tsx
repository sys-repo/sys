import React from 'react';
import { Button, Obj, Str, type t } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type SampleItem = {
  label: string;
  yaml: string;
  dividerAfter?: boolean;
};

export function yamlSamples(debug: DebugSignals) {
  type A = { draft: any; path: t.ObjectPath };
  const changeYaml = (fn: (args: A) => void) => {
    const doc = debug.signals.doc.value;
    const path = debug.props.docPath.value;
    if (doc && path) doc.change((draft) => fn({ draft, path }));
  };

  const hr = true;
  const samples: SampleItem[] = [];
  const sample = (label: string = 'untitled', yaml: string = '', dividerAfter?: boolean) => {
    samples.push({ label, yaml, dividerAfter });
  };

  sample(
    // ✅
    'working: 🌳 { slug:minimal }',
    `
        slug:
          id: example.minimal-01
          traits: []
    `,
  );
  sample(
    // ✅
    'working: 🌳 { slug:index }',
    `
        slug:
          id: my-id.foo-01
          traits:
            - of: slug-index
              as: thing-v1
          data:
            thing-v1:
              name: Name of Index 🌼
              slugs:
                - ref: crdt:create
                  name: Name or Title

    `,
  );
  sample(
    // ✅
    'working: 🌳 { slug:comprehensive }',
    `
        slug:
          id: example.slug-01
          traits:
            - of: video-player
              as: player
            - of: video-recorder
              as: recorder
            - of: slug-index
              as: my-index-1.0
          data:
            my-index-1.0:
              slugs:
                - ref: crdt:create
                  name: my-slugs-1.0

            recorder:
              name: "Recorder A"
              description: The old man was dreaming about the lions.
              file: crdt:create
              # file: urn:crdt:39qozwJjQcq4erBWbMdGc4jkd3Xr/foo
              script: |
                He was an old man who fished alone in a skiff in the Gulf Stream and he had gone
                eighty-four days now without taking a fish.

            player:
              name: "Player A"

    `,
    hr,
  );
  sample(
    'error: 💥 { invalid YAML (syntax) }',
    `
        slug:
          id: example-slug
          traits:
            - of: video-player
              as: primary
          data:
            primary:
              src: "video.mp4   # ← missing closing quote

    `,
  );
  sample(
    'error: 🐷 { unknown trait id ("of") }',
    `
        slug:
          id: example-slug
          traits:
            - of: not-real
              as: foo
          data:
            primary:
              src: "video.mp4"

    `,
  );
  sample(
    'error: 🐷 { duplicate alias }',
    `
        slug:
          id: example-slug
          traits:
            - of: video-player
              as: primary
            - of: video-player
              as: primary
          data:
            primary:
              src: "video.mp4"

    `,
  );
  sample(
    'error: 🐷 { missing props for alias }',
    `
        slug:
          id: example-slug
          traits:
            - of: video-player
              as: primary
          data: {}

    `,
  );
  sample(
    'error: 🐷 { orphan props }',
    `
        slug:
          id: example-slug
          traits:
            - of: video-player
              as: primary
          data:
            primary:
              src: "video.mp4"
            extra:
              note: "no matching trait alias"

    `,
  );
  sample(
    'error: 🐷 { invalid props shape }',
    `
        slug:
          id: example-slug
          traits:
            - of: video-player
              as: primary
          data:
            primary:
              src: ""   # violates minLength: 1 in current schemas

    `,
  );

  return (
    <>
      {samples.map((s, i) => (
        <React.Fragment key={i}>
          <YamlSample debug={debug} label={s.label} yaml={s.yaml} />
          {s.dividerAfter && <hr />}
        </React.Fragment>
      ))}

      {/**
       * 🧨 Catastrophic break:
       *      - Set a non-string at the YAML doc path
       *      - Requires hard reset to recover:
       *        1. set the YAML to "working" state
       *        2. hit "(reset, reload)" button.
       */}
      <hr />
      <Button
        block
        label={() => `cause: 🧨 { catastrophic break } ← requires reset`}
        onClick={() => {
          changeYaml(({ draft, path }) => Obj.Path.Mutate.set(draft, path, { fail: '💥' }));
        }}
      />
    </>
  );
}

function YamlSample(props: { debug: DebugSignals; label: string; yaml: string }) {
  const { debug, label, yaml } = props;

  const changeYaml = (fn: (args: { draft: any; path: t.ObjectPath }) => void) => {
    const doc = debug.signals.doc.value;
    const path = debug.props.docPath.value;
    if (doc && path) doc.change((draft) => fn({ draft, path }));
  };

  return (
    <Button
      block
      label={label}
      onClick={() =>
        changeYaml(({ draft, path }) => Obj.Path.Mutate.set(draft, path, Str.dedent(yaml)))
      }
    />
  );
}
