import React, { useState } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/solid';
import { sendFeedback } from './lib/supabaseClient';
import { isLocalhost, eventFiredThisSession } from './utils';

export const dailyMessages: Record<string, React.ReactNode> = {
  '2026-04-01': (
    <div>
      🎉 <b>April Fools!</b> Poisson d'avril! Pesce d’aprile! エイプリルフール !
      April April! Eén april, Kikker in je bil{' '}
      <span className='text-gray-400 italic'>(??? pardon me?)</span> !{' '}
      Πρωταπριλιά! ¡Inocente, inocente! Aprillia, syö silliä, juo kuravettä
      päälle <span className='text-gray-400 italic'>(???)</span> ! Первое апреля
      никому не ВЕРЯ! Aprilsnar! 만우절 ! April, april, din dumma sill!
      Aprilvis! Primeiro de abril! Prima Aprilis! 愚人节快乐 !
    </div>
  ),
  '2026-05-31': (() => {
    const BapanadaMessage = () => {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <div className='flex justify-center'>
            <button
              onClick={() => {
                setOpen((o) => !o);
                if (
                  !isLocalhost() &&
                  !eventFiredThisSession('[Event] Bapanada')
                )
                  sendFeedback('custom', '`[Event]` Bapanada');
              }}
              className='flex items-center gap-1 cursor-pointer bg-zinc-800'
            >
              <VideoCameraIcon className='w-6 h-6 shrink-0 mr-1' />
              <i>*sigh*</i> ... Bapanada
            </button>
          </div>
          {open && (
            <div className='mt-2 w-full'>
              <div className='relative w-full pb-[56.25%]'>
                <iframe
                  className='absolute inset-0 w-full h-full'
                  src='https://www.youtube.com/embed/s8GpIX1aIiI?controls=0'
                  title='Bapanada'
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      );
    };
    return <BapanadaMessage />;
  })(),
};

/*

France	Poisson d’avril !	April fish!
Italy	Pesce d’aprile !	April fish!
Germany	April, April !	April, April!
Netherlands	Eén april, kikker in je bil !	April 1st, frog in your butt!
Denmark	Aprilsnar !	April fool/jester!
Sweden	April, april, din dumma sill !	April, april, you silly herring!
Poland	Prima aprilis !	First of April!
Brazil	Primeiro de abril!	First of April!
China	愚人节快乐 ! (Yúrénjié kuàilè!)	Happy Fools' Day!
South Korea	만우절 ! (Manujeol!)	April Fools' Day!
Japan	エイプリルフール ! (Eipuriru Fūru!)	April Fool!
Finland  Aprillia, syö silliä, juo kuravettä päälle!
Belgium Aprilvis!
Greek Πρωταπριλιά!
Russian Первое апреля никому не ВЕРЯ!
*/
