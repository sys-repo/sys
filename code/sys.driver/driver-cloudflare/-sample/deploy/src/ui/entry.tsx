import { createRoot, Is, React } from './common.ts';

/**
 * Application Root
 */
function App() {
  const [message, setMessage] = React.useState('Loading…');
  React.useEffect(() => startMessageLoad(setMessage), []);
  return (
    <main>
      <h1>R2 + Deno</h1>
      <p role='status'>
        message: <code>"{message}"</code>
      </p>
      <p>
        This page’s HTML and JavaScript are stored in Cloudflare R2 and served by Deno.
        <br />
        The message comes from the same server’s <a href='/api/hello'>/api/hello</a> endpoint.
      </p>
    </main>
  );
}

function startMessageLoad(onMessage: (message: string) => void): () => void {
  const controller = new AbortController();

  async function load() {
    const signal = controller.signal;
    const response = await fetch('/api/hello', { signal });
    if (!response.ok) throw new Error('Request failed.');

    const data: unknown = await response.json();
    if (!Is.record(data) || !Is.str(data.msg)) throw new Error('Invalid reply.');
    onMessage(data.msg);
  }

  load().catch(() => {
    if (!controller.signal.aborted) onMessage('Could not load the message.');
  });

  return () => controller.abort();
}

/**
 * Main:
 */
createRoot(document.getElementById('root')!).render(<App />);
