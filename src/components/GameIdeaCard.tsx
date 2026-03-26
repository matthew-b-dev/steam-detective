import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, LinkIcon } from '@heroicons/react/16/solid';
import {
  LightBulbIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import { sendFeedback } from '../lib/supabaseClient';
import { isLocalhost } from '../utils';
import { steamGameDetails } from '../steam_game_detail.generated';
import { STEAM_DETECTIVE_DEMO_DAYS } from '../demos';

// Build a reverse map: game name (lowercase) -> date used
const gameNameToDateUsed: Record<string, string> = {};
for (const [date, cases] of Object.entries(STEAM_DETECTIVE_DEMO_DAYS)) {
  for (const name of Object.values(cases)) {
    if (name) gameNameToDateUsed[name.toLowerCase()] = date;
  }
}

interface FormState {
  steamUrl: string;
  notes: string;
  contact: string;
  credit: string;
}

const EMPTY_FORM: FormState = {
  steamUrl: '',
  notes: '',
  contact: '',
  credit: '',
};

const GameIdeaModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useBodyScrollLock(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({});

  // Keep modal anchored to the visual viewport so iOS keyboard doesn't push it off-screen
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setViewportStyle({
        height: `${vv.height}px`,
        transform: `translateY(${vv.offsetTop}px)`,
      });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  const extractAppId = (url: string): string | null => {
    const match = url.match(/\/app\/(\d+)/);
    return match ? match[1] : null;
  };

  const appId = extractAppId(form.steamUrl);
  const appInDetails = appId !== null && appId in steamGameDetails;
  const alreadyUsedName = appInDetails ? steamGameDetails[appId!].name : null;
  const alreadyUsedDate =
    alreadyUsedName != null
      ? (gameNameToDateUsed[alreadyUsedName.toLowerCase()] ?? null)
      : null;
  // Only block if the date the game was used is today or in the past (UTC)
  const todayUtc = new Date().toISOString().slice(0, 10);
  const alreadyUsed =
    appInDetails && (alreadyUsedDate === null || alreadyUsedDate <= todayUtc);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadyUsed) return;
    setSubmitting(true);

    const lines = [
      `Steam URL: ${form.steamUrl}`,
      form.notes ? `Notes: ${form.notes}` : null,
      form.contact ? `Contact: ${form.contact}` : null,
      form.credit ? `Credit: ${form.credit}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    await sendFeedback('custom', `\`[Idea]\` Game Idea submitted\n${lines}`);
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <motion.div
      className='fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black bg-opacity-80'
      style={viewportStyle}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className='bg-zinc-900 rounded-lg px-5 py-6 sm:px-8 sm:py-8 max-w-md w-full mx-2 sm:mx-4 relative overflow-y-auto max-h-[90%]'
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close */}
        <button
          className='absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 transition-colors bg-transparent p-1'
          onClick={onClose}
          aria-label='Close'
        >
          <XMarkIcon className='h-5 w-5' />
        </button>

        {!submitted && (
          <h2 className='text-xl font-bold text-center mb-5'>
            Suggest a Case File
          </h2>
        )}

        {submitted ? (
          <div className='text-center py-8 space-y-3'>
            <p className='text-5xl'>🙌</p>
            <p className='text-gray-200 font-semibold'>Thanks for the idea!</p>
            <p className='text-gray-400 text-sm pb-6'>
              I've received your suggestion. There's a good chance you will see
              this integrated very soon!
            </p>
            <button
              onClick={onClose}
              className='mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm transition'
            >
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                (e.target as HTMLElement).tagName !== 'TEXTAREA'
              ) {
                e.preventDefault();
              }
            }}
            className='space-y-4 text-sm'
          >
            {/* Steam Game URL */}
            <div>
              <label className='flex items-center gap-1 text-gray-300 font-medium'>
                <LinkIcon className='h-3.5 w-3.5 shrink-0' />
                Steam Game URL <span className='text-red-400'>*</span>
              </label>
              <p className='mb-1 flex items-center gap-1 text-xs text-zinc-400'>
                <InformationCircleIcon className='h-3.5 w-3.5 shrink-0' />
                <span>
                  Note: Games must have{' '}
                  <span className='text-yellow-500'>at least 7.5k reviews</span>{' '}
                  to be considered.
                </span>
              </p>
              <input
                type='text'
                name='steamUrl'
                required
                maxLength={255}
                value={form.steamUrl}
                onChange={handleChange}
                placeholder='e.g. https://store.steampowered.com/...'
                className={`w-full bg-zinc-800 border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-400 ${
                  alreadyUsed
                    ? 'border-red-500'
                    : form.steamUrl.length >= 255
                      ? 'border-yellow-500'
                      : 'border-zinc-600'
                }`}
              />
              {form.steamUrl.length >= 255 && (
                <p className='mt-1 text-xs text-yellow-500 font-medium'>
                  ⚠ Maximum 255 characters reached.
                </p>
              )}
              {!form.steamUrl && (
                <p className='mt-1 text-xs text-zinc-500'>
                  <b>Checked automatically</b> to see if the game has already
                  been used.
                </p>
              )}
              {alreadyUsed && (
                <p className='mt-1 text-xs text-red-400 font-medium'>
                  ⚠ <strong>{alreadyUsedName}</strong> has already been used as
                  a case file{alreadyUsedDate ? ` (${alreadyUsedDate})` : ''}.
                </p>
              )}
              {appId && !alreadyUsed && (
                <p className='mt-1 text-xs text-green-400'>
                  ✅ App ID: {appId}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className='flex items-center gap-1 text-gray-300 mb-1 font-medium'>
                <LightBulbIcon className='h-3.5 w-3.5 shrink-0' />
                Notes
              </label>
              <textarea
                name='notes'
                rows={4}
                maxLength={1500}
                value={form.notes}
                onChange={handleChange}
                placeholder='Anything else I should know?'
                className={`w-full bg-zinc-800 border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-400 resize-y ${
                  form.notes.length >= 1500
                    ? 'border-yellow-500'
                    : 'border-zinc-600'
                }`}
              />
              {form.notes.length >= 1500 && (
                <p className='mt-1 text-xs text-yellow-500 font-medium'>
                  ⚠ Maximum 1500 characters reached.
                </p>
              )}
            </div>

            {/* Follow-up contact */}
            <div>
              <label className='block text-gray-300 mb-0.5 font-medium'>
                <b>OPTIONAL</b>: Follow-up contact
              </label>
              <p className='text-xs text-zinc-400 mb-1'>
                Leave an email or Discord handle if you're open to questions, or
                just allow me to thank you!
              </p>
              <input
                type='text'
                name='contact'
                maxLength={255}
                value={form.contact}
                onChange={handleChange}
                placeholder='Discord handle / Email'
                className={`w-full bg-zinc-800 border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-400 ${
                  form.contact.length >= 255
                    ? 'border-yellow-500'
                    : 'border-zinc-600'
                }`}
              />
              {form.contact.length >= 255 && (
                <p className='mt-1 text-xs text-yellow-500 font-medium'>
                  ⚠ Maximum 255 characters reached.
                </p>
              )}
            </div>

            {/* Credit */}
            <div>
              <label className='block text-gray-300 mb-0.5 font-medium'>
                <b>OPTIONAL</b>: How can I credit you for your idea?
              </label>
              <p className='text-xs text-zinc-400 mb-1'>
                Displayed in-game once the case file is complete.
              </p>
              <p className='text-xs text-zinc-400 mb-1'>
                Could be your name, initials, online handle, etc.
              </p>
              <input
                type='text'
                name='credit'
                maxLength={255}
                value={form.credit}
                onChange={handleChange}
                placeholder='Name / initials / handle / anything'
                className={`w-full bg-zinc-800 border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-400 ${
                  form.credit.length >= 255
                    ? 'border-yellow-500'
                    : 'border-zinc-600'
                }`}
              />
              {form.credit.length >= 255 && (
                <p className='mt-1 text-xs text-yellow-500 font-medium'>
                  ⚠ Maximum 255 characters reached.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className='flex gap-3 justify-end pt-1'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition text-sm'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={submitting || alreadyUsed}
                className='px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 rounded transition text-sm font-semibold text-black'
              >
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

const GameIdeaCard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className='text-sm text-gray-400 text-center'>
        Have an idea for a case file? You can{' '}
        <button
          onClick={() => {
            setShowModal(true);
            if (!isLocalhost())
              sendFeedback(
                'custom',
                '`[Event]` Opened Suggest Case File Modal',
              );
          }}
          className='text-yellow-500 hover:text-yellow-400 underline bg-transparent border-0 p-0 cursor-pointer outline-none'
        >
          fill out a simple form
        </button>{' '}
        without leaving this site.
      </div>
      {showModal && <GameIdeaModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default GameIdeaCard;
