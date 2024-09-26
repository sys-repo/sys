import { useState } from 'react';

import { Pkg } from '../common.ts';
import './App.css';

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
