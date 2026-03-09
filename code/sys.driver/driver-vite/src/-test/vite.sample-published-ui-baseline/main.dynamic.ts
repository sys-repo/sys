/**
 * Variant: Dynamic imports
 */
async function main() {
  const { Dom, Keyboard } = await import('@sys/ui-dom');
  const { UserAgent } = await import('@sys/ui-dom/user-agent');
  const { LocalStorage } = await import('@sys/ui-dom/local-storage');
  const { css, Style } = await import('@sys/ui-css');
  const { Signal, FC } = await import('@sys/ui-react');

  console.info(Dom, Keyboard, UserAgent, LocalStorage);
  console.info(css, Style);
  console.info(Signal, FC);
}

await main();
