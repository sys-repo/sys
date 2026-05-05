export * from '../common.ts';

export const IdPattern = '^[a-z][a-z0-9.-]*$';
export const IdRegex = new RegExp(IdPattern);

export const RelativePathPattern = '^\\./.+';
export const ExportNamePattern = '^[A-Za-z_$][A-Za-z0-9_$]*$';
