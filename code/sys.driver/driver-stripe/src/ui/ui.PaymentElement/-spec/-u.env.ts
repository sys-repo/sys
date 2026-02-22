/// <reference types="vite/client" />

export function readEnv() {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '';
  const clientSecret = import.meta.env.VITE_STRIPE_CLIENT_SECRET ?? '';
  return { publishableKey, clientSecret } as const;
}
