import { useState, useMemo } from 'react';
import type { SteamGame } from '../types';
import {
  renderCensoredDescription,
  decodeHtmlEntities,
} from '../components/SteamDetective/utils';

interface RefineMoreFromDeveloperProps {
  game: SteamGame;
  // eslint-disable-next-line no-unused-vars
  onUpdate: (patch: Partial<SteamGame>) => void;
}

/** Parses game {id, name} entries from Steam search results_html. */
const parseSearchResultsHtml = (
  resultsHtml: string,
  excludeAppId: number,
): { id: number; name: string }[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(resultsHtml, 'text/html');
  const results: { id: number; name: string }[] = [];
  const seen = new Set<number>();

  for (const el of doc.querySelectorAll('[data-ds-appid]')) {
    const rawId = el.getAttribute('data-ds-appid');
    if (!rawId) continue;
    const id = Number(rawId);
    if (isNaN(id) || seen.has(id) || id === excludeAppId) continue;
    seen.add(id);
    const titleEl = el.querySelector('.title');
    const name = titleEl?.textContent?.trim() ?? '';
    results.push({ id, name });
  }

  return results;
};

export const RefineMoreFromDeveloper: React.FC<
  RefineMoreFromDeveloperProps
> = ({ game, onUpdate }) => {
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<
    { id: number; name: string }[] | null
  >(null);

  const items = game.moreFromThisDeveloper ?? [];
  const hasMfd = items.length > 0;

  const handleScrape = async () => {
    setImportError(null);
    setImportLoading(true);
    try {
      const developer = game.developer?.replaceAll('|', '');
      if (!developer) {
        setImportError('No developer name found for this game.');
        return;
      }
      const url = `/steam-store-proxy/search/results/?developer=${encodeURIComponent(developer)}&infinite=1`;
      const res = await fetch(url);
      if (!res.ok) {
        setImportError(`Fetch failed: HTTP ${res.status}`);
        return;
      }
      const json = (await res.json()) as {
        success: number;
        results_html?: string;
      };
      if (!json.results_html) {
        setImportError('No results returned from Steam search.');
        return;
      }
      const ids = parseSearchResultsHtml(json.results_html, game.appId);
      if (ids.length === 0) {
        setImportError(`No other games found for developer "${developer}".`);
        return;
      }
      setPreviewItems(ids);
    } catch (e) {
      setImportError(`Error fetching page: ${String(e)}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleApplyPreview = () => {
    if (!previewItems) return;
    onUpdate({ moreFromThisDeveloper: previewItems });
    setPreviewItems(null);
  };

  const handleRemove = (id: number) => {
    const updated = items.filter((item) => item.id !== id);
    onUpdate({
      moreFromThisDeveloper: updated.length > 0 ? updated : undefined,
    });
  };

  const handleToggleBlur = (id: number) => {
    const updated = items.map((item) =>
      item.id === id
        ? { ...item, blurred: item.blurred ? undefined : true }
        : item,
    );
    onUpdate({ moreFromThisDeveloper: updated });
  };

  const handleClearAll = () => {
    onUpdate({ moreFromThisDeveloper: undefined });
  };

  return (
    <div className='space-y-3'>
      {/* Scrape button */}
      <div className='flex items-center gap-3'>
        <button
          onClick={handleScrape}
          disabled={importLoading}
          className='text-xs px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-50 whitespace-nowrap'
        >
          {importLoading ? 'Fetching…' : 'Fetch from Steam'}
        </button>
        {importError && (
          <div className='text-xs text-red-400'>{importError}</div>
        )}
      </div>

      {/* Preview of scraped games before applying */}
      {previewItems && (
        <div className='border border-blue-600/50 rounded p-3 space-y-2 bg-blue-900/10'>
          <div className='text-xs text-blue-300 font-semibold'>
            Found {previewItems.length} game
            {previewItems.length !== 1 ? 's' : ''} - preview:
          </div>
          <div className='flex gap-2 overflow-x-auto pb-1'>
            {previewItems.map((item) => (
              <div
                key={item.id}
                className='flex-shrink-0'
                style={{ width: 120 }}
              >
                <img
                  src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`}
                  alt={item.name}
                  className='w-full rounded'
                />
                <div
                  className='text-[10px] text-gray-400 mt-1 text-center truncate'
                  title={item.name}
                >
                  {item.name}
                </div>
              </div>
            ))}
          </div>
          <div className='flex gap-2'>
            <button
              onClick={handleApplyPreview}
              className='text-xs px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-white'
            >
              Apply
            </button>
            <button
              onClick={() => setPreviewItems(null)}
              className='text-xs px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white'
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Current saved list */}
      {hasMfd && (
        <div className='space-y-2'>
          <div className='text-xs text-gray-400 uppercase tracking-wide flex items-center justify-between'>
            <span>Saved ({items.length})</span>
            <button
              onClick={handleClearAll}
              className='text-xs text-red-400 hover:text-red-300'
            >
              Clear all
            </button>
          </div>
          <div className='flex flex-wrap gap-2'>
            {items.map((item) => (
              <div
                key={item.id}
                className='relative flex-shrink-0'
                style={{ width: 120 }}
              >
                <img
                  src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`}
                  alt={item.name}
                  className={`w-full rounded ${item.blurred ? 'opacity-40' : ''}`}
                />
                <div
                  className='text-[10px] text-gray-500 mt-0.5 text-center truncate'
                  title={item.name}
                >
                  {item.name}
                </div>
                {/* Blur toggle button */}
                <button
                  onClick={() => handleToggleBlur(item.id)}
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center opacity-80 hover:opacity-100 ${
                    item.blurred
                      ? 'bg-teal-600 hover:bg-teal-500'
                      : 'bg-zinc-600 hover:bg-zinc-500'
                  }`}
                  title={item.blurred ? 'Unblur' : 'Blur (censor in-game)'}
                >
                  B
                </button>
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className='absolute top-1 right-1 w-5 h-5 rounded-full bg-red-700 hover:bg-red-600 text-white text-xs flex items-center justify-center opacity-80 hover:opacity-100'
                  title='Remove'
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasMfd && !previewItems && (
        <div className='text-xs text-gray-500 italic'>
          No "More from this Developer" games set.
        </div>
      )}

      {/* About the Developer textarea - only shown when MFD games are configured */}
      {hasMfd && (
        <DevDescriptionEditor
          value={game.developerDescription ?? ''}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

interface DevDescriptionEditorProps {
  value: string;
  // eslint-disable-next-line no-unused-vars
  onUpdate: (patch: Partial<SteamGame>) => void;
}

const DevDescriptionEditor: React.FC<DevDescriptionEditorProps> = ({
  value,
  onUpdate,
}) => {
  const censoredPreview = useMemo(
    () =>
      value.trim()
        ? renderCensoredDescription(decodeHtmlEntities(value))
        : null,
    [value],
  );

  return (
    <div className='space-y-2'>
      <div className='text-xs text-gray-400 uppercase tracking-wide'>
        About the Developer
        <span className='ml-2 text-gray-600 normal-case'>
          (optional — supports ||censored|| markers)
        </span>
      </div>
      {censoredPreview && (
        <div className='text-sm text-gray-200 leading-relaxed max-w-[600px] rounded bg-zinc-900/60 px-3 py-2'>
          <div className='text-gray-400 text-xs uppercase'>
            About the Developer:
          </div>
          <div className='mt-2'>{censoredPreview}</div>
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) =>
          onUpdate({
            developerDescription: e.target.value || undefined,
          })
        }
        rows={3}
        placeholder='We generally make games that encourage you to think of clever plans and/or ||knock someone through|| a window.'
        className='w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-400 resize-y'
      />
    </div>
  );
};
