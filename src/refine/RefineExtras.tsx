import { useState, useEffect } from 'react';
import type { SteamGame } from '../types';

interface RefineExtrasProps {
  game: SteamGame;
  hasExtrasInOrder: boolean;
  // eslint-disable-next-line no-unused-vars
  onToggleExtras: (checked: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onUpdate: (patch: Partial<SteamGame>) => void;
}

interface FetchedAchievement {
  name: string;
  desc?: string;
  img: string;
  achievePercent?: string;
}

export const RefineExtras: React.FC<RefineExtrasProps> = ({
  game,
  hasExtrasInOrder,
  onToggleExtras,
  onUpdate,
}) => {
  const [fetchState, setFetchState] = useState<{
    loading: boolean;
    error: string | null;
    achievements: FetchedAchievement[] | null;
  }>({ loading: true, error: null, achievements: null });
  // Index-based selection to correctly handle achievements with duplicate images
  const [selectedAchievementIndices, setSelectedAchievementIndices] = useState<
    Set<number>
  >(() => new Set());
  // Index-based set tracking which selected achievements should show their percent
  const [showAchievePercentIndices, setShowAchievePercentIndices] = useState<
    Set<number>
  >(() => new Set());

  // Destructure for convenience — all downstream code uses these names unchanged
  const {
    loading: fetchLoading,
    error: fetchError,
    achievements: fetchedAchievements,
  } = fetchState;

  const savedAchievements = game.extrasClue?.achievements ?? [];

  // Auto-fetch achievements when the component mounts
  useEffect(() => {
    let cancelled = false;
    const appId = game.appId;

    const fetchAchievements = async (): Promise<FetchedAchievement[]> => {
      const res = await fetch(
        `/steam-review-proxy/stats/${appId}/achievements`,
      );
      if (!res.ok) throw new Error(`Achievements HTTP ${res.status}`);
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('.achieveRow');
      const results: FetchedAchievement[] = [];
      rows.forEach((row) => {
        const img = row.querySelector<HTMLImageElement>('img');
        const h3 = row.querySelector<HTMLElement>('h3');
        const h5 = row.querySelector<HTMLElement>('h5');
        const percentEl = row.querySelector<HTMLElement>(
          '.achieveTxtHolder .achievePercent',
        );
        if (img?.src && h3?.textContent?.trim()) {
          const desc = h5?.textContent?.trim() || undefined;
          const achievePercent = percentEl?.textContent?.trim() || undefined;
          results.push({
            name: h3.textContent.trim(),
            img: img.src,
            ...(desc ? { desc } : {}),
            ...(achievePercent ? { achievePercent } : {}),
          });
        }
      });
      return results;
    };

    fetchAchievements()
      .then((achievements) => {
        if (cancelled) return;
        // Pre-select indices that match saved achievements (by name)
        const savedNames = new Set(
          (game.extrasClue?.achievements ?? []).map((a) => a.name),
        );
        const initialIndices = new Set(
          achievements
            .map((a, i) => (savedNames.has(a.name) ? i : -1))
            .filter((i) => i !== -1),
        );
        setSelectedAchievementIndices(initialIndices);
        // Pre-populate showAchievePercentIndices from saved data
        const savedShowPercent = new Set(
          (game.extrasClue?.achievements ?? [])
            .filter((a) => a.showAchievePercent)
            .map((a) => a.name),
        );
        const initialShowPercent = new Set(
          achievements
            .map((a, i) => (savedShowPercent.has(a.name) ? i : -1))
            .filter((i) => i !== -1),
        );
        setShowAchievePercentIndices(initialShowPercent);
        setFetchState({ loading: false, error: null, achievements });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Failed to fetch achievements:', err);
        setFetchState({
          loading: false,
          error: 'Failed to fetch achievements.',
          achievements: [],
        });
      });

    return () => {
      cancelled = true;
    };
    // game.extrasClue?.achievements is intentionally excluded: adding it would
    // re-trigger the fetch on every selection change. It's captured via closure
    // at the time the effect runs (i.e., when the appId changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.appId]);

  const isAchievementSelected = (idx: number) =>
    selectedAchievementIndices.has(idx);

  const toggleAchievement = (idx: number) => {
    const newIndices = new Set(selectedAchievementIndices);
    let currentShowIndices = showAchievePercentIndices;
    if (newIndices.has(idx)) {
      newIndices.delete(idx);
      // Clean up show-percent state for deselected achievement
      const newShowIndices = new Set(showAchievePercentIndices);
      newShowIndices.delete(idx);
      setShowAchievePercentIndices(newShowIndices);
      currentShowIndices = newShowIndices;
    } else {
      newIndices.add(idx);
    }
    setSelectedAchievementIndices(newIndices);
    const newList = [...newIndices]
      .sort((a, b) => a - b)
      .map((i) => {
        const ach = fetchedAchievements![i];
        return {
          name: ach.name,
          ...(ach.desc ? { desc: ach.desc } : {}),
          img: ach.img,
          ...(ach.achievePercent ? { achievePercent: ach.achievePercent } : {}),
          ...(currentShowIndices.has(i)
            ? { showAchievePercent: true as const }
            : {}),
        };
      });
    onUpdate({
      extrasClue: {
        achievements: newList.length > 0 ? newList : undefined,
        achievementsTotal:
          fetchedAchievements?.length ?? game.extrasClue?.achievementsTotal,
      },
    });
  };

  const toggleShowPercent = (fetchedIdx: number) => {
    const newShowIndices = new Set(showAchievePercentIndices);
    if (newShowIndices.has(fetchedIdx)) {
      newShowIndices.delete(fetchedIdx);
    } else {
      newShowIndices.add(fetchedIdx);
    }
    setShowAchievePercentIndices(newShowIndices);
    const newList = [...selectedAchievementIndices]
      .sort((a, b) => a - b)
      .map((i) => {
        const ach = fetchedAchievements![i];
        return {
          name: ach.name,
          ...(ach.desc ? { desc: ach.desc } : {}),
          img: ach.img,
          ...(ach.achievePercent ? { achievePercent: ach.achievePercent } : {}),
          ...(newShowIndices.has(i)
            ? { showAchievePercent: true as const }
            : {}),
        };
      });
    onUpdate({
      extrasClue: {
        achievements: newList.length > 0 ? newList : undefined,
        achievementsTotal:
          fetchedAchievements?.length ?? game.extrasClue?.achievementsTotal,
      },
    });
  };

  const hasAnyFetched = (fetchedAchievements?.length ?? 0) > 0;
  const hasSavedExtras = savedAchievements.length > 0;

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='text-xs text-gray-400 uppercase tracking-wide'>
          Extras (Achievements)
        </div>
        <label className='flex items-center gap-2 cursor-pointer'>
          <input
            type='checkbox'
            checked={hasExtrasInOrder}
            onChange={(e) => onToggleExtras(e.target.checked)}
            className='w-4 h-4 accent-amber-500'
          />
          <span className='text-xs text-amber-300'>Use as Clue</span>
        </label>
      </div>

      {fetchLoading && (
        <div className='text-xs text-gray-500 italic'>
          Fetching achievements…
        </div>
      )}

      {fetchError && !fetchLoading && (
        <div className='text-xs text-red-400'>{fetchError}</div>
      )}

      {!fetchLoading && !hasAnyFetched && !hasSavedExtras && (
        <div className='text-xs text-gray-500 italic'>
          No achievements found for this game.
        </div>
      )}

      {/* Achievements */}
      {!fetchLoading && (fetchedAchievements?.length ?? 0) > 0 && (
        <div className='space-y-2'>
          <div className='text-xs text-gray-400'>
            Achievements ({fetchedAchievements!.length} found) — click to
            include in clue:
          </div>
          <div
            className='flex flex-col gap-1 overflow-y-auto'
            style={{ maxHeight: 400 }}
          >
            {fetchedAchievements!.map((ach, idx) => {
              const selected = isAchievementSelected(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleAchievement(idx)}
                  className={`relative rounded transition-all flex items-center gap-3 text-left w-full px-2 py-1 ${
                    selected
                      ? 'ring-2 ring-amber-400 opacity-100 bg-amber-900/20'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className='relative flex-shrink-0'>
                    <img
                      src={ach.img}
                      alt={ach.name}
                      draggable={false}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: 'contain',
                        display: 'block',
                      }}
                      className='rounded'
                    />
                    {selected && (
                      <div
                        className='absolute bottom-0 right-0 w-4 h-4 bg-amber-400 rounded-tl flex items-center justify-center'
                        style={{ fontSize: 10 }}
                      >
                        ✓
                      </div>
                    )}
                  </div>
                  <div className='flex flex-col justify-center min-w-0'>
                    <span className='text-sm text-gray-200 leading-snug truncate'>
                      {ach.name}
                    </span>
                    {ach.desc && (
                      <span className='text-xs text-gray-400 leading-snug mt-0.5 truncate'>
                        {ach.desc}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {savedAchievements.length > 0 && (
            <div className='text-xs text-amber-300'>
              {savedAchievements.length} achievement
              {savedAchievements.length !== 1 ? 's' : ''} selected for clue
            </div>
          )}
        </div>
      )}

      {/* Preview of currently saved extras */}
      {hasSavedExtras && (
        <div className='border border-amber-600/40 rounded p-3 space-y-2 bg-amber-900/10'>
          <div className='text-xs text-amber-300 font-semibold'>
            Saved extras (will appear in clue):
          </div>
          {savedAchievements.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {savedAchievements.map((a, idx) => (
                <img
                  key={idx}
                  src={a.img}
                  alt={a.name}
                  title={a.name}
                  style={{ width: 64, height: 64, objectFit: 'contain' }}
                  className='rounded'
                />
              ))}
            </div>
          )}
          {/* Per-achievement "show percent" checkboxes — only shown after fetch */}
          {!fetchLoading &&
            fetchedAchievements &&
            [...selectedAchievementIndices]
              .sort((a, b) => a - b)
              .some((i) => fetchedAchievements[i]?.achievePercent) && (
              <div className='flex flex-col gap-1 pt-1'>
                {[...selectedAchievementIndices]
                  .sort((a, b) => a - b)
                  .map((fetchedIdx) => {
                    const ach = fetchedAchievements[fetchedIdx];
                    if (!ach?.achievePercent) return null;
                    return (
                      <label
                        key={fetchedIdx}
                        className='flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none'
                      >
                        <input
                          type='checkbox'
                          checked={showAchievePercentIndices.has(fetchedIdx)}
                          onChange={() => toggleShowPercent(fetchedIdx)}
                          className='w-3 h-3 accent-amber-500'
                        />
                        <span className='truncate text-gray-400'>
                          {ach.name}
                        </span>
                        <span className='text-gray-500 italic'>
                          show % ({ach.achievePercent})
                        </span>
                      </label>
                    );
                  })}
              </div>
            )}
        </div>
      )}
    </div>
  );
};
