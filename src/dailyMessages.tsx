import React from 'react';

export const dailyMessages: Record<string, React.ReactNode> = {
  '2026-04-01': (
    <div>
      🎉 April Fools! Poisson d'avril! Pesce d’aprile! エイプリルフール ! April
      April! Eén april, Kikker in je bil{' '}
      <span className='text-gray-400 italic'>(??? pardon me?)</span> !
      Aprilsnar! 만우절 ! April, april, din dumma sill! Prima aprilis! Primeiro
      de abril! Dumma sill! Prima Aprilis! 愚人节快乐 !
    </div>
  ),
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

*/
