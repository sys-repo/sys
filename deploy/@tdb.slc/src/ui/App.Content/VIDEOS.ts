const vimeo = (id: number) => {
  return { id, src: `vimeo/${id}` } as const;
};

/**
 * Index of Video IDs.
 */
export const VIDEO = {
  Tubes: vimeo(499921561),
  GroupScale: vimeo(727951677),
  Trailer: vimeo(1068502644),
  Overview: vimeo(1068653222),
} as const;
