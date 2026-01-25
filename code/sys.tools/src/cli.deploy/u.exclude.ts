const EXCLUDE: readonly string[] = ['.DS_Store'];

export const shouldExclude = (name: string): boolean => {
  return EXCLUDE.includes(name);
};
