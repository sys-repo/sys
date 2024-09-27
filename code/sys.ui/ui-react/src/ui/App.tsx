import { useState } from 'react';

import { Pkg } from '../common.ts';
import './App.css';

import { Foo } from '@my-module/foo';

const m = import('@my-module/foo');

function App() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount((n) => n + 1);

  console.log('m', m);
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
