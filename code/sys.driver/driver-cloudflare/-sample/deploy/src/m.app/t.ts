/** HTTP application dependency; storage admission belongs to entry composition. */
export type AppOptions = {
  readonly shell: (req: Request) => Promise<Response>;
};
