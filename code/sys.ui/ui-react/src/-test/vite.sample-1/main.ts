console.log(`⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🐚👋🧠⚠️ 💥👁️💡• ↑↓←→`);
console.log('hello [vite.main.ts]');

const m = import('./main.foo.ts');
m.then((mod) => {
  console.log('dynmaic import', mod);
});

const root = document.getElementById('root')!;
root.innerHTML = 'Hello World 👋';
