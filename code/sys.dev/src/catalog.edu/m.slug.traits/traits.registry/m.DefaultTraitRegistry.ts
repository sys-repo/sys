import { type t, Slug } from './common.ts';

import { ConceptLayoutPropsSchema } from '../traits.schema/schema.concept-layout.ts';
import { FileListPropsSchema } from '../traits.schema/schema.file-list.ts';
import { TimeMapPropsSchema } from '../traits.schema/schema.time-map.ts';
import { VideoPlayerPropsSchema } from '../traits.schema/schema.video-player.ts';
import { VideoRecorderPropsSchema } from '../traits.schema/schema.video-recorder.ts';
import { ViewRendererPropsSchema } from '../traits.schema/schema.view-renderer.ts';

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
      { id: 'file-list', propsSchema: FileListPropsSchema },
      { id: 'time-map', propsSchema: TimeMapPropsSchema },
      { id: 'video-recorder', propsSchema: VideoRecorderPropsSchema },
      { id: 'video-player', propsSchema: VideoPlayerPropsSchema },
    ] as const;
  },
};
