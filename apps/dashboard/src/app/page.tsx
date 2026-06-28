import { LONG_SESSION_REQS } from '@crux/core/constants';

export default function Home() {
  return (
    <main>
      <h1>Crux Dashboard</h1>
      <p>Long session threshold: {LONG_SESSION_REQS} requests</p>
    </main>
  );
}
