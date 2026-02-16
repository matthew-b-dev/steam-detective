import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase } from './lib/supabaseClient';

document.title = 'SteamDetective.wtf';

const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// Log page view exactly once per page load (skip on localhost)
(async () => {
  if (!isLocalhost) {
    await supabase.from('page_views').insert([
      {
        path: `${window.location.pathname}${window.location.search ?? ''}`,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        app_name: 'steam',
      },
    ]);
  }
})();

// Render the refine tool on localhost at /refine, otherwise render the main app
const isRefinePage = isLocalhost && window.location.pathname === '/refine';

if (isRefinePage) {
  import('./refine/RefinePage').then(({ RefinePage }) => {
    document.title = 'Refine SteamDetective';
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <RefinePage />,
    );
  });
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
}
