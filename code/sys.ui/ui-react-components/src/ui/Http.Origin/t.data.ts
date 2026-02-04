import type { t } from './common.ts';

/**
 * URL value for a single row (supports single or multiple origins).
 */
export type HttpOriginValue = t.StringUrl | readonly t.StringUrl[];

export type HttpOriginMap__LEGACY = {
  app: t.StringUrl;
  cdn: { default: t.StringUrl; video: t.StringUrl };
};

/**
 * Data structure for modelling a map of origin-urls.
 */
export type HttpOriginDataLib = {};

/**
 * Group node (contains children).
 */
export type HttpOriginGroup<E extends string = string> = {
  readonly kind: 'group';
  readonly key: string;
  readonly label?: string;
  readonly children: readonly HttpOriginNode<E>[];
};

/**
 * Leaf node (contains per-env values).
 */
export type HttpOriginLeaf<E extends string = string> = {
  readonly kind: 'leaf';
  readonly key: string;
  readonly label?: string;
  readonly values: Readonly<Record<E, HttpOriginValue>>;
};

/**
 * Self-describing origin tree node.
 * Leaf nodes carry values per env; group nodes carry children.
 */
export type HttpOriginNode<E extends string = string> = HttpOriginGroup<E> | HttpOriginLeaf<E>;

/**
 * Root spec for a self-describing origin tree.
 */
export type HttpOriginSpec<E extends string = string> = {
  readonly envs: readonly E[];
  readonly tree: HttpOriginNode<E>;
};

/**
 * Example: legacy shape (app + cdn.default + cdn.video).
 */
export type HttpOriginLegacyTree<E extends string = string> = HttpOriginGroup<E> & {
  readonly key: 'root';
  readonly children: readonly [
    HttpOriginLeaf<E> & { readonly key: 'app' },
    HttpOriginGroup<E> & {
      readonly key: 'cdn';
      readonly children: readonly [
        HttpOriginLeaf<E> & { readonly key: 'default' },
        HttpOriginLeaf<E> & { readonly key: 'video' },
      ];
    },
  ];
};

/**
 * Example: media stack (api + assets.images + assets.video + stream.hls + stream.dash).
 */
export type HttpOriginMediaTree<E extends string = string> = HttpOriginGroup<E> & {
  readonly key: 'root';
  readonly children: readonly [
    HttpOriginLeaf<E> & { readonly key: 'api' },
    HttpOriginGroup<E> & {
      readonly key: 'assets';
      readonly children: readonly [
        HttpOriginLeaf<E> & { readonly key: 'images' },
        HttpOriginLeaf<E> & { readonly key: 'video' },
      ];
    },
    HttpOriginGroup<E> & {
      readonly key: 'stream';
      readonly children: readonly [
        HttpOriginLeaf<E> & { readonly key: 'hls' },
        HttpOriginLeaf<E> & { readonly key: 'dash' },
      ];
    },
  ];
};
