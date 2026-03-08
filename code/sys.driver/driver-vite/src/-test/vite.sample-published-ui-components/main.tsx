async function main() {
  const { Button } = await import('@sys/ui-react-components');
  const { useKeyboard } = await import('@sys/ui-react-devharness');
  console.info(Button, useKeyboard);
}

await main();
