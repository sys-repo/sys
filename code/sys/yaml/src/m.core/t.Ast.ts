import type * as Y from 'yaml';
import type { t } from './common.ts';

/**
 * Parsed YAML Abstract Syntax Tree (AST).
 * Note: `.toJS()` intentionally omitted to force usage of safe Yaml.toJS().
 */
export type YamlAst = Omit<Y.Document.Parsed, 'toJS'>;

/**
 * Inputs accepted by `Yaml.toJS`:
 * - full parsed document (`YamlAst`)
 * - AST node (`Yaml.Node`)
 * - collection pair node (`Yaml.Pair`)
 *
 * When given a document, we delegate to the underlying `Document.toJS`
 * and preserve alias error semantics (may yield `ok: false` with diagnostics).
 *
 * When given a node/pair, we convert that subtree only:
 *   - Scalars → primitive values
 *   - Sequences → JS arrays (recursive)
 *   - Maps → JS objects (string keys, recursive)
 *   - Aliases / unknown → `undefined` (but `ok` remains `true`)
 */
export type YamlToJsInput = t.YamlAst | t.Yaml.Node | t.Yaml.Pair;

/**
 * Safely converts a parsed YAML AST document or subtree into a JavaScript value.
 * Always returns a normalized result object instead of throwing.
 */
export type YamlToJs = <T = unknown>(input: YamlToJsInput) => YamlToJsResult<T>;
export type YamlToJsResult<T = unknown> = {
  /** True if conversion succeeded without errors. */
  readonly ok: boolean;
  /** Parsed JavaScript value, present only if `ok` is true. */
  readonly data?: T;
  /** Normalized YAML diagnostics (e.g., unresolved alias, parser error). */
  readonly errors: readonly t.YamlDiagnostic[];
};

/**
 * Root YAML AST document type used for walking.
 */
export type YamlAstDocument = t.YamlAst;

/**
 * Content nodes within a YAML document (things that appear under `doc.contents`).
 */
export type YamlAstContentNode = t.Yaml.Scalar | t.Yaml.Map | t.Yaml.Seq | t.Yaml.Alias;

/**
 * All nodes that may be visited during a walk.
 * Includes collection entries (`Pair`) as well as value nodes.
 */
export type YamlAstNode = YamlAstContentNode | Y.Pair<Y.Node, Y.Node>;

/**
 * Possible parents of a visited node.
 * - The document itself
 * - Collections (Map / Seq)
 * - Pair (for key/value children)
 */
export type YamlAstParent = YamlAstDocument | t.Yaml.Map | t.Yaml.Seq | t.Yaml.Pair;

/**
 * Event payload passed to each visitor call during a YAML AST walk.
 *
 * Parallel to `ObjWalkFnArgs`, but in terms of AST nodes:
 * - `node` is the current AST node
 * - `parent` is the AST parent (if any)
 * - `path` is the logical data path (`t.ObjectPath`) from the document root
 */
export type YamlAstWalkEvent = {
  /**
   * The owning YAML document.
   * Useful when operations need access to schema, anchors, or directives.
   */
  readonly doc: YamlAstDocument;

  /**
   * Parent AST node of the current node.
   * Undefined when visiting the document root.
   */
  readonly parent?: YamlAstParent;

  /**
   * The current AST node being visited.
   */
  readonly node: YamlAstNode;

  /**
   * Logical object-path from the document root value to this node's
   * value position, eg:
   *
   *   foo:
   *     bar:
   *       - baz
   *
   * → ['foo', 'bar', 0]
   */
  readonly path: t.ObjectPath;

  /**
   * Logical key/index from the parent to this node.
   * - Map entry: string key
   * - Seq entry: numeric index
   * - Document root: null
   */
  readonly key: string | number | null;

  /**
   * Stop the walk entirely (global break), mirroring `Obj.walk`'s `stop()`.
   */
  stop(): void;
};

/**
 * Callback used by the YAML AST walker.
 */
export type YamlAstWalkFn = (e: YamlAstWalkEvent) => void;

/**
 * Walks a YAML AST (recursive descent), invoking a visitor for each node.
 * This is the YAML-AST counterpart to `Obj.walk`.
 */
export type YamlAstWalk = (doc: YamlAstDocument, fn: YamlAstWalkFn) => void;
