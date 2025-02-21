export const fn = async () => {
  const { Foo } = await import('./-sample/m.Foo.ts');
  const { FooSample } = await import('./-sample/ui.Foo.tsx');
  return {
    Foo,
    FooSample,
  };
};
