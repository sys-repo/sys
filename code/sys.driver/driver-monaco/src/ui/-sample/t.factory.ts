export type LazyViewFactory = React.LazyExoticComponent<React.FC<any>>;

/**
 * Response from a View Factory
 */
export type ViewFactoryResponse = { default: React.FC<any> };
