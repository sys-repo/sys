import { useState } from 'react';

import { Pkg } from '../common.ts';
import './App.css';

import { join } from 'jsr:@std/path'; // ← import module from JSR
import { Path } from '@sys/std'; //      ← importing module from self/mono-repo (pre JSR)

/**
 * uncomment these lines to cause the imports to fail in Vite.
 */
// console.log('join', join);
// console.log('Path', Path);

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>{`${Pkg.name} @ ${Pkg.version}`}</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>{`count is ${count}`}</button>
      </div>
    </>
  );
}

export default App;
