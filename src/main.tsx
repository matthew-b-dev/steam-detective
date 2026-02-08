import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase } from './lib/supabaseClient';

document.title = 'SteamDetective';

// Log page view exactly once per page load (skip on localhost)
(async () => {
  if (
    !window.location.hostname.includes('localhost') &&
    window.location.hostname !== '127.0.0.1'
  ) {
    await supabase.from('page_views').insert([
      {
        path: window.location.pathname,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        app_name: 'steam',
      },
    ]);
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
