import { type t, Slug } from './common.ts';

import {
  ConceptLayoutPropsSchema,
  FileListPropsInputSchema,
  TimeMapSchema,
  VideoPlayerPropsSchema,
  VideoRecorderPropsSchema,
  ViewRendererPropsSchema,
} from '../traits.schema/mod.ts';

/**
 * Default schema registry.
 */
export const DefaultTraitRegistry: t.SchemaTraitRegistry = {
  get(id) {
    return DefaultTraitRegistry.all.find((e) => e.id === id);
  },
  get all() {
    return [
      { id: 'view-renderer', propsSchema: ViewRendererPropsSchema },
      { id: 'slug-tree', propsSchema: Slug.Schema.Slug.Tree.Props },
      { id: 'concept-layout', propsSchema: ConceptLayoutPropsSchema },
      { id: 'file-list', propsSchema: FileListPropsInputSchema },
      { id: 'time-map', propsSchema: TimeMapSchema },
      { id: 'video-recorder', propsSchema: VideoRecorderPropsSchema },
      { id: 'video-player', propsSchema: VideoPlayerPropsSchema },
    ] as const;
  },
};
