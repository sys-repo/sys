import { Keyboard } from '@sys/cli/keyboard';

const expectedKeys = ['keypress', 'Is', 'bind', 'shutdown'] as const;
const actualKeys = Reflect.ownKeys(Keyboard);
if (actualKeys.length !== expectedKeys.length) throw new Error('Unexpected Keyboard entry shape.');
for (let index = 0; index < expectedKeys.length; index += 1) {
  if (actualKeys[index] !== expectedKeys[index]) {
    throw new Error('Unexpected Keyboard entry shape.');
  }
}
if (!Object.isFrozen(Keyboard) || !Object.isFrozen(Keyboard.Is)) {
  throw new Error('Keyboard entry is not frozen.');
}
if (!Keyboard.Is.quit({ key: 'q', ctrlKey: false })) {
  throw new Error('Keyboard entry did not expose canonical controls.');
}

console.info('@sys/cli/keyboard denied-authority process proof passed.');
