/**
 * A version of <Partial> allowing an entire
 * tree hierarchy to be considered <Partial>.
 *
 * See:
 *    https://www.typescriptlang.org/docs/handbook/utility-types.html
 *
 */
export type PartialDeep<T> = {
  [P in keyof T]?: PartialDeep<T[P]>;
};
