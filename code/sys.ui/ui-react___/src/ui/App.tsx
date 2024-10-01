import { useState } from 'react';

import { Pkg } from '../common.ts';
import './App.css';

/**
 * Import via module/alias
 * See: /vite.config.json
 */
import { Foo } from '@sys/tmp/ui';

function App() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount((n: number) => n + 1);

  return (
    <>
      <h1>{`${Pkg.name} @ ${Pkg.version}`}</h1>
      <div className="card">
        <button onClick={handleClick}>{`count is ${count}`}</button>
      </div>
      <div>
        <code>{'imported → '}</code>
        <Foo />
      </div>
    </>
  );
}

export default App;
