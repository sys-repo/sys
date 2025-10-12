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

  const samples: SampleItem[] = [
    // ✅ Working:
    {
      dividerAfter: true, // ← insert <hr /> right after this one
      label: 'working: 🌳 { slug }',
      yaml: `
        slug:
          id: example.slug-01
          traits:
            - as: player
              id: video-player
            - as: recorder
              id: video-recorder
          props:
            recorder:
              name: "Recorder A"
              description: The old man was dreaming about the lions.
              # file: urn:crdt:39qozwJjQcq4erBWbMdGc4jkd3Xr/foo
              file: crdt:create
            player:
              name: "Player A"

      `,
    },

    // 💥 Invalid YAML (syntax):
    {
      label: 'error: 💥 { invalid YAML (syntax) }',
      yaml: `
        slug:
          id: example-slug
          traits:
            - as: primary
              id: video-player
          props:
            primary:
              src: "video.mp4   # ← missing closing quote
      `,
    },

    // 🐷 Unknown trait id (semantic):
    {
      label: 'error: 🐷 { unknown trait id }',
      yaml: `
        slug:
          id: example-slug
          traits:
            - as: primary
              id: not-real
          props:
            primary:
              src: "video.mp4"

      `,
    },

    // 🐷 Duplicate alias:
    {
      label: 'error: 🐷 { duplicate alias }',
      yaml: `
        slug:
          id: example-slug
          traits:
            - as: primary
              id: video-player
            - as: primary
              id: video-player
          props:
            primary:
              src: "video.mp4"

      `,
    },

    // 🐷 Missing props for alias:
    {
      label: 'error: 🐷 { missing props for alias }',
      yaml: `
        slug:
          id: example-slug
          traits:
            - as: primary
              id: video-player
          props: {}

      `,
    },

    // 🐷 Orphan props:
    {
      label: 'error: 🐷 { orphan props }',
      yaml: `
        slug:
          id: example-slug
          traits:
            - as: primary
              id: video-player
          props:
            primary:
              src: "video.mp4"
            extra:
              note: "no matching trait alias"

      `,
    },

    // 🐷 Invalid props shape:
    {
      label: 'error: 🐷 { invalid props shape }',
      yaml: `
        slug:
          id: example-slug
          traits:
            - as: primary
              id: video-player
          props:
            primary:
              src: ""   # violates minLength: 1 in current schemas

      `,
    },
  ];

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
