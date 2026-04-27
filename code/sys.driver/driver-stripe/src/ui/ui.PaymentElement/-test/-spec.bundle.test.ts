import { describe, expect, it, Path } from '../../../-test.ts';

const FORBIDDEN_STRIPE_PATTERNS = [
  /VITE_STRIPE_CLIENT_SECRET/,
  /VITE_STRIPE_PUBLISHABLE_KEY/,
  /sk_(test|live)_[A-Za-z0-9]+/,
  /pk_(test|live)_[A-Za-z0-9]+/,
  /pi_[A-Za-z0-9_]+_secret_[A-Za-z0-9]+/,
] as const;

const FORBIDDEN_BROWSER_RUNTIME_PATTERNS = [
  /@cliffy/,
  /unsupported runtime/,
  /Deno\.stdin/,
  /process\.stdin/,
] as const;

describe('Stripe.PaymentElement spec bundle safety', () => {
  it('source → does not read browser-inlined Stripe secrets', async () => {
    const root = Path.resolve('./src/ui/ui.PaymentElement/-spec');
    const files = await collectTextFiles(root);
    const hits = await findForbiddenMatches(files, FORBIDDEN_STRIPE_PATTERNS);
    expect(hits).to.eql([]);
  });

  it('dist → is safe for browser runtime and contains no baked Stripe secrets', async () => {
    const root = Path.resolve('./dist');
    if (!(await exists(root))) return;

    const files = await collectTextFiles(root);

    const stripeHits = await findForbiddenMatches(files, FORBIDDEN_STRIPE_PATTERNS);
    expect(stripeHits).to.eql([]);

    const runtimeHits = await findForbiddenMatches(files, FORBIDDEN_BROWSER_RUNTIME_PATTERNS);
    expect(runtimeHits).to.eql([]);
  });
});

/**
 * Helpers:
 */
async function collectTextFiles(root: string): Promise<readonly string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(root)) {
    const path = Path.join(root, entry.name);
    if (entry.isDirectory) {
      files.push(...await collectTextFiles(path));
    } else if (isTextFile(path)) {
      files.push(path);
    }
  }
  return files;
}

async function findForbiddenMatches(files: readonly string[], patterns: readonly RegExp[]) {
  const hits: string[] = [];
  for (const file of files) {
    const text = await Deno.readTextFile(file);
    patterns.forEach((pattern) => {
      if (pattern.test(text)) hits.push(`${trimCwd(file)} :: ${pattern.source}`);
    });
  }
  return hits;
}

async function exists(path: string) {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

function trimCwd(path: string) {
  const rel = Path.relative(Deno.cwd(), path);
  return rel.startsWith('..') ? path : rel;
}

function isTextFile(path: string) {
  return /\.(html|js|json|map|ts|tsx|md)$/i.test(path);
}
