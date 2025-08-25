import type { t } from './common.ts';

/** Used within React's suspense layout system. */
export type LazyViewFactory = React.LazyExoticComponent<React.FC<any>>;

/** Looks up a schema from the given ID. */
export type GetSchema = (id: t.StringId) => t.TSchema | undefined;

/** Looks up the <Component> view for the given ID. */
export type GetView = (id: t.StringId) => Promise<ViewFactoryResult>;
/** Response from a View Factory */
export type ViewFactoryResult = { default: React.FC<any> };

/**
 * An instance of a lookup view/schema factory.
 */
export type Factory = Readonly<{
  getSchema: GetSchema;
  getView: GetView;
}>;
