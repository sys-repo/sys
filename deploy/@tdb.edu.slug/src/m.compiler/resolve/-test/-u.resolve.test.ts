import { type t, describe, it, expect } from '../../-test.ts';
import { Slug } from '../../slug/mod.ts';

type Dag = t.Graph.Dag.Result;
type Node = t.Graph.Dag.Node;

type SlugLike = {
  readonly title?: string;
  readonly description?: string;
  readonly traits?: readonly t.SlugTrait[];
  readonly [key: string]: unknown;
};

describe('Resolve', () => {
  const SLUG_YAML = `
    # Slug: Concept Player
    title: Example Concept
    description: Short description.

    traits:
      - of: media-composition
        as: sequence
      - of: slug-list
        as: solo

    alias:
      :index: crdt:index-root
      :core-videos: :index/:assets/core
      :core-images: :index/:assets/images

    data:
      sequence:
        - video: /:core-videos/example.webm
          timestamps:
            00:00:00:
              title: Intro
              pause: 3s
  `;

  const SLUG_NO_MEDIA_TRAIT_YAML = `
    # Slug: Non-media slug
    title: Other Concept
    description: No media-composition trait.

    traits:
      - of: slug-list
        as: overlay

    data:
      overlay:
        - slug: /:core-slugs/other
          display: inline
  `;

  const docid = 'crdt:test-doc' as t.Crdt.Id;
  const node = { id: docid, doc: { current: SLUG_YAML } } as unknown as Node;
  const dag = { nodes: [node] } as unknown as Dag;

  describe('Slug.parser / Resolve.slug', () => {
    it('parses YAML into a slug object', () => {
      const yamlPath = [] as unknown as t.ObjectPath;
      const parser = Slug.parser(yamlPath);

      const root = parser.parseRoot(dag);
      expect(root.node).to.equal(node);

      const slug = root.slug as SlugLike | undefined;
      expect(slug).to.be.ok;
      if (!slug) return;

      expect(slug.title).to.eql('Example Concept');
      expect(slug.description).to.eql('Short description.');

      const traits = slug.traits;
      expect(Array.isArray(traits)).to.eql(true);
      expect(traits && traits.length).to.eql(2);
    });
  });

  describe('Slug.parser / Resolve.slugParts', () => {
    it('exposes alias, data, and traits from the slug', () => {
      const yamlPath = [] as unknown as t.ObjectPath;
      const parser = Slug.parser(yamlPath);

      const { alias, data, traits } = parser.Resolve.slugParts(node);

      // alias table
      expect(alias).to.be.ok;
      const aliasMap = alias as Record<string, string> | undefined;
      expect(aliasMap && aliasMap[':core-videos']).to.eql(':index/:assets/core');

      // data shape: carries the raw sequence array as authored
      expect(data).to.be.ok;
      const dataObj = data as Record<string, unknown> | undefined;
      const seq = (dataObj?.sequence ?? []) as unknown[];
      expect(Array.isArray(seq)).to.eql(true);
      expect(seq.length).to.eql(1);
      const first = seq[0] as { video?: string };
      expect(first.video).to.eql('/:core-videos/example.webm');

      // traits
      expect(traits).to.be.ok;
      const traitList = traits as readonly t.SlugTrait[] | undefined;
      expect(Array.isArray(traitList)).to.eql(true);

      const mediaTrait = traitList!.find((t) => t.of === 'media-composition');
      expect(mediaTrait).to.be.ok;
      expect(mediaTrait!.as).to.eql('sequence');

      const slugListTrait = traitList!.find((t) => t.of === 'slug-list');
      expect(slugListTrait).to.be.ok;
      expect(slugListTrait!.as).to.eql('solo');
    });

    it('behaves sanely when there is no media-composition trait', () => {
      const yamlPath = [] as unknown as t.ObjectPath;
      const parser = Slug.parser(yamlPath);

      const nodeNoMedia = {
        id: 'crdt:no-media' as t.Crdt.Id,
        doc: { current: SLUG_NO_MEDIA_TRAIT_YAML },
      } as unknown as Node;

      const { alias, data, traits } = parser.Resolve.slugParts(nodeNoMedia);

      // No alias block in this slug.
      expect(alias).to.be.undefined;

      // Data exists, but is keyed by the non-media trait ("overlay").
      const dataObj = data as Record<string, unknown> | undefined;
      expect(dataObj).to.be.ok;
      if (!dataObj) return;

      const overlay = dataObj.overlay as unknown[];
      expect(Array.isArray(overlay)).to.eql(true);
      expect(overlay.length).to.eql(1);

      // Traits present, but none with of === "media-composition".
      const list = traits;
      expect(Array.isArray(list)).to.eql(true);
      if (!list) return;

      const mediaTrait = list.find((t) => t.of === 'media-composition');
      expect(mediaTrait).to.be.undefined;

      const slugListTrait = list.find((t) => t.of === 'slug-list');
      expect(slugListTrait).to.be.ok;
      expect(slugListTrait!.as).to.eql('overlay');
    });
  });
});
