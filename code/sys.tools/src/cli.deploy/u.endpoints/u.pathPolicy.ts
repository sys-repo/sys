import { Is, Path, type t, Yaml } from '../common.ts';

/** Fixed YAML error code required by the upstream error shape. */
export const EndpointYamlErrorCode: t.Yaml.Error['code'] = 'BAD_ALIAS';

const WINDOWS_DEVICE_PATTERN = String
  .raw`(?:[Cc][Oo][Nn]|[Pp][Rr][Nn]|[Aa][Uu][Xx]|[Nn][Uu][Ll]|[Cc][Ll][Oo][Cc][Kk]\$|[Cc][Oo][Nn][Ii][Nn]\$|[Cc][Oo][Nn][Oo][Uu][Tt]\$|[Cc][Oo][Mm][1-9¹²³]|[Ll][Pp][Tt][1-9¹²³])`;
const ROOTED_INTERNAL_PATTERN = String.raw`\.[Ss][Yy][Ss]\.[Rr][Oo][Oo][Tt][Ee][Dd]`;
const GENERATED_STAGING_NAME_PATTERN = String
  .raw`(?:[Dd][Ii][Ss][Tt]\.[Jj][Ss][Oo][Nn]|[Ii][Nn][Dd][Ee][Xx]\.[Hh][Tt][Mm][Ll])`;
const CANONICAL_RELATIVE_PATTERN = String.raw`(?![A-Za-z]:)(?![/\\~])(?!.*\\)` +
  String.raw`(?!${WINDOWS_DEVICE_PATTERN}(?:\.|/|$))` +
  String.raw`(?!${ROOTED_INTERNAL_PATTERN}[^/]*(?:/|$))` +
  String.raw`(?!.*\/${WINDOWS_DEVICE_PATTERN}(?:\.|/|$))` +
  String.raw`(?!.*\/${ROOTED_INTERNAL_PATTERN}[^/]*(?:/|$))` +
  String.raw`(?!\.\.?(?:/|$))(?!.*\/\.\.?(?:/|$))` +
  String.raw`(?!.*\/\/)(?!.*\/$)(?!.*[. ](?:\/|$))` +
  String.raw`(?!.*[\u0000-\u001f\u007f-\u009f])`;

/** Schema patterns mirrored by the pure/runtime path policy below. */
export const sourcePathPattern = String.raw`^(?!\s)(?!.*\s$).+$`;
export const stagingRootPattern = String.raw`^(?!\s)(?!.*\s$)(?:\./)?` +
  CANONICAL_RELATIVE_PATTERN +
  String.raw`(?!.*[:"<>|?*]).+$`;
export const mappingStagingPattern = String.raw`^(?!\s)(?!.*\s$)(?:\./)?` +
  CANONICAL_RELATIVE_PATTERN +
  String.raw`(?!${GENERATED_STAGING_NAME_PATTERN}(?:/|$))` +
  String.raw`(?!.*\/${GENERATED_STAGING_NAME_PATTERN}(?:/|$))` +
  String.raw`(?!.*[:"|?*])(?:(?:[^<>]|<shards?>))+$`;

export type StagingPathIssue =
  | 'required'
  | 'edge-whitespace'
  | 'tilde'
  | 'absolute'
  | 'backslash'
  | 'parent'
  | 'root'
  | 'non-canonical'
  | 'non-portable';

/** Classify one staging authority path without resolving or touching the filesystem. */
export function stagingPathIssue(
  input: string,
  options: {
    allowRoot: boolean;
    allowShardTemplates?: boolean;
    reserveGeneratedNames?: boolean;
  },
): StagingPathIssue | undefined {
  if (!input) return 'required';
  if (input !== input.trim()) return 'edge-whitespace';
  if (options.allowRoot && input === '.') return undefined;

  const relative = input.startsWith('./') ? input.slice(2) : input;
  if (!relative) return options.allowRoot ? 'non-canonical' : 'root';
  if (input.startsWith('~') || relative.startsWith('~')) return 'tilde';
  if (
    Path.Is.absolute(input) ||
    Path.Bounded.Is.windowsDrive(input) ||
    Path.Is.absolute(relative) ||
    Path.Bounded.Is.windowsDrive(relative)
  ) {
    return 'absolute';
  }
  if (input.includes('\\')) return 'backslash';

  const segments = relative.split('/');
  if (segments.some((segment) => segment === '..')) return 'parent';
  if (segments.some((segment) => !segment || segment === '.')) return 'non-canonical';
  if (
    segments.some((segment) =>
      !isPortableSegment(
        segment,
        options.allowShardTemplates === true,
        options.reserveGeneratedNames === true,
      )
    )
  ) {
    return 'non-portable';
  }
  return undefined;
}

/** Validate endpoint path policy without resolving or touching the filesystem. */
export function endpointPathErrors(input: unknown): readonly t.Yaml.Error[] {
  const errors: t.Yaml.Error[] = [];
  if (!Is.object(input)) return Object.freeze(errors);

  const doc = input as Record<string, unknown>;
  const sourceRoot = doc.source;
  if (Is.object(sourceRoot)) {
    const value = (sourceRoot as Record<string, unknown>).dir;
    if (Is.str(value)) validateSourcePath(value, 'source.dir', errors);
  }

  const staging = doc.staging;
  if (Is.object(staging)) {
    const value = (staging as Record<string, unknown>).dir;
    if (Is.str(value)) {
      validateStagingPath(value, 'staging.dir', errors, {
        allowRoot: false,
        allowShardTemplates: false,
      });
    }
  }

  const mappings = doc.mappings;
  if (!Is.array(mappings)) return Object.freeze(errors);

  for (let index = 0; index < mappings.length; index += 1) {
    const mapping = mappings[index];
    if (!Is.object(mapping)) continue;
    const mappingRecord = mapping as Record<string, unknown>;
    const dir = mappingRecord.dir;
    if (!Is.object(dir)) continue;

    const values = dir as Record<string, unknown>;
    const hasShards = Is.object(mappingRecord.shards);
    const source = values.source;
    if (Is.str(source)) {
      if (mappingRecord.mode === 'index') {
        validateStagingPath(source, `mappings[${index}].dir.source`, errors, {
          allowRoot: true,
          allowShardTemplates: hasShards,
          reserveGeneratedNames: true,
        });
      } else {
        validateSourcePath(source, `mappings[${index}].dir.source`, errors);
      }
    }

    const target = values.staging;
    if (Is.str(target)) {
      validateStagingPath(target, `mappings[${index}].dir.staging`, errors, {
        allowRoot: true,
        allowShardTemplates: hasShards,
        reserveGeneratedNames: true,
      });
    }
  }

  return Object.freeze(errors);
}

function validateSourcePath(input: string, label: string, errors: t.Yaml.Error[]): void {
  if (!input.trim()) {
    errors.push(pathError(`${label} is required.`));
  } else if (input !== input.trim()) {
    errors.push(pathError(`${label} must not have leading or trailing whitespace.`));
  }
}

function validateStagingPath(
  input: string,
  label: string,
  errors: t.Yaml.Error[],
  options: {
    allowRoot: boolean;
    allowShardTemplates: boolean;
    reserveGeneratedNames?: boolean;
  },
): void {
  const issue = stagingPathIssue(input, options);
  const { allowRoot } = options;
  if (!issue) return;

  if (issue === 'required') {
    errors.push(pathError(`${label} is required.`));
    return;
  }
  if (issue === 'edge-whitespace') {
    errors.push(pathError(`${label} must not have leading or trailing whitespace.`));
    return;
  }
  if (issue === 'tilde' || issue === 'absolute' || issue === 'backslash') {
    const rootSuffix = allowRoot ? " (or '.')" : '';
    errors.push(pathError(`${label} must be relative${rootSuffix}: ${input}`));
    return;
  }
  if (issue === 'parent') {
    errors.push(pathError(`${label} must not contain '..': ${input}`));
    return;
  }
  if (issue === 'root') {
    errors.push(pathError(`${label} must name a dedicated descendant of the deploy cwd.`));
    return;
  }
  if (issue === 'non-canonical') {
    errors.push(pathError(`${label} must use canonical relative path segments: ${input}`));
    return;
  }
  errors.push(pathError(`${label} contains a non-portable path segment: ${input}`));
}

function isPortableSegment(
  input: string,
  allowShardTemplates: boolean,
  reserveGeneratedNames: boolean,
): boolean {
  const segment = allowShardTemplates
    ? input.replaceAll('<shards>', '1').replaceAll('<shard>', '0')
    : input;
  const lower = segment.toLowerCase();
  // deno-lint-ignore no-control-regex -- Staging authority paths reject ASCII and C1 controls.
  const control = /[\u0000-\u001f\u007f-\u009f]/;
  const windowsDevice =
    /^(con|prn|aux|nul|clock\$|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i;
  return !(
    segment.endsWith('.') ||
    segment.endsWith(' ') ||
    control.test(segment) ||
    /[:"<>|?*]/.test(segment) ||
    windowsDevice.test(segment) ||
    lower.startsWith('.sys.rooted') ||
    (reserveGeneratedNames && reservedGeneratedNameOf(segment) !== undefined)
  );
}

/** Resolve one basename under the host-independent namespace owned by Dist finalization. */
export function reservedGeneratedNameOf(
  basename: string,
): 'dist.json' | 'index.html' | undefined {
  const streamless = basename.normalize('NFC').split(':', 1)[0]!;
  const portable = streamless.replace(/[. ]+$/u, '').toLowerCase();
  if (portable === 'dist.json' || portable === 'index.html') return portable;
}

function pathError(message: string): t.Yaml.Error {
  return Yaml.Error.synthetic({
    message,
    code: EndpointYamlErrorCode,
    pos: [0, 0],
  });
}
