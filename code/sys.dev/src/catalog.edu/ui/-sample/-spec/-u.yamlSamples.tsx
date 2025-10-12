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
    // ✅ WORKING
    {
      dividerAfter: true, // ← insert <hr /> right after this one
      label: 'change: 🌳 { working slug }',
      yaml: `
        slug:
          id: example-slug
          traits:
            - as: player
              id: video-player
            - as: recorder
              id: video-recorder
          props:
          recorder:
            name: "Recorder A"
            player:
              name: "Player A"

      `,
    },

    // 💥 invalid YAML (syntax)
    {
      label: 'change: 💥 { invalid YAML (syntax) }',
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

    // 🐷 unknown trait id (semantic)
    {
      label: 'change: 🐷 { unknown trait id }',
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

    // 🐷 duplicate alias
    {
      label: 'change: 🐷 { duplicate alias }',
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

    // 🐷 missing props for alias
    {
      label: 'change: 🐷 { missing props for alias }',
      yaml: `
        slug:
          id: example-slug
          traits:
            - as: primary
              id: video-player
          props: {}

      `,
    },

    // 🐷 orphan props
    {
      label: 'change: 🐷 { orphan props }',
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

    // 🐷 invalid props shape
    {
      label: 'change: 🐷 { invalid props shape }',
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

      {/* terminal break: set a non-string at the YAML doc path (forces reset) */}
      <hr />
      <Button
        block
        label={() => `change: 🧨 { terminal break } ← requires reset`}
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
