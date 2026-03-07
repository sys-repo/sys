export function string(input?: any): input is string {
  return typeof input === 'string';
}
