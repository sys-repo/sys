/**
 * @module Trait-Schemas
 * Aggregates all trait prop-schema modules.
 */
import { type t, Slug } from './common.ts';
import { Is } from './m.Is.ts';

import { ConceptLayoutPropsSchema } from './s.concept-layout/mod.ts';
import {
  FileListItemSchema,
  FileListPropsInputSchema,
  FileListPropsSchema,
  normalizeFileList,
} from './s.file-list/mod.ts';
import { TimeMapPropsSchema, TimeMapValueItemSchema } from './s.time-map/mod.ts';
import { VideoPlayerPropsSchema } from './s.video-player/mod.ts';
import { VideoRecorderPropsSchema } from './s.video-recorder/mod.ts';
import { ViewRendererPropsSchema } from './s.view-renderer/mod.ts';

export const Traits: t.SlugTraitsLib = {
  get Is() {
    return Is;
  },

  // Schemas:
  Schema: {
    get SlugTree() {
      return Slug.Schema.Slug.Tree;
    },
    get VideoPlayer() {
      return { Props: VideoPlayerPropsSchema };
    },
    get VideoRecorder() {
      return { Props: VideoRecorderPropsSchema };
    },
    get ViewRenderer() {
      return { Props: ViewRendererPropsSchema };
    },
    get ConceptLayout() {
      return { Props: ConceptLayoutPropsSchema };
    },
    get FileList() {
      return {
        Item: FileListItemSchema,
        Props: FileListPropsSchema,
        Input: FileListPropsInputSchema,
        normalize: normalizeFileList,
      };
    },
    get TimeMap() {
      return { Props: TimeMapPropsSchema, Item: TimeMapValueItemSchema };
    },
  },
};
