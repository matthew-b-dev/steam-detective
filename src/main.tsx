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

// Render the refine tool on localhost at /refine, games at /games, otherwise render the main app
const isRefinePage = isLocalhost && window.location.pathname === '/refine';
const isGamesPage = isLocalhost && window.location.pathname === '/games';
const isDailyDashPage = window.location.pathname === '/dailydash';
const isArchivesPage = window.location.pathname === '/archives';
const isLandingPage =
  window.location.pathname === '/' && !window.location.search.startsWith('?/');

if (isRefinePage) {
  import('./refine/RefinePage').then(({ RefinePage }) => {
    document.title = 'Refine SteamDetective';
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <RefinePage />,
    );
  });
} else if (isGamesPage) {
  import('./games/GamesIndex.tsx').then(({ GamesIndex }) => {
    document.title = 'Steam Games Library';
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <GamesIndex />,
    );
  });
} else if (isDailyDashPage) {
  import('./daily/DailyDashboard').then(({ DailyDashboard }) => {
    document.title = 'Daily Dashboard';
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <DailyDashboard />,
    );
  });
} else if (isArchivesPage) {
  import('./challenges/ChallengesIndex').then(({ ChallengesIndex }) => {
    document.title = 'Case File Archives';
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <ChallengesIndex />,
    );
  });
} else if (isLandingPage) {
  import('./LandingPage').then(({ LandingPage }) => {
    document.title = 'SteamDetective.wtf';
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <LandingPage />,
    );
  });
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
}
