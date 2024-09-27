import { useState } from 'react';

import { Pkg } from '../common.ts';
import './App.css';

import { Foo } from '@sys/tmp/foo';

function App() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount((n: number) => n + 1);

  return (
    <>
      <h1>{`${Pkg.name} @ ${Pkg.version}`}</h1>
      <div className="card">
        <button onClick={handleClick}>{`count is ${count}`}</button>
      </div>
      <Foo />
    </>
  );
}

export default App;
