export const toArrayBuffer = (input: Uint8Array): ArrayBuffer => {
  const out = new Uint8Array(input.byteLength);
  out.set(input);
  return out.buffer as ArrayBuffer;
};
