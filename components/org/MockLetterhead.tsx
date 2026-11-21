import React from 'react';
import type { OrgProfile } from './orgDefaults';

interface MockLetterheadProps {
  profile: OrgProfile;
  logoSrc: string | null;
  caption?: string;
}

/** A small, paper-like letter top showing how the organisation identity prints. Not the product brand. */
const MockLetterhead: React.FC<MockLetterheadProps> = ({ profile, logoSrc, caption = 'Contoh kepala surat' }) => {
  const contact = [profile.phone && `Tel: ${profile.phone}`, profile.email, profile.website].filter(Boolean).join('  ·  ');
  return (
    <figure className="m-0" data-testid="mock-letterhead">
      <div className="bg-white border border-line rounded-ih-sm px-5 py-6 md:px-8 text-black" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="flex flex-col items-center text-center gap-1.5 pb-3 border-b-2 border-black">
          {logoSrc
            ? <img src={logoSrc} alt={`Logo ${profile.short || profile.name}`} className="h-16 w-auto object-contain" />
            : <div className="h-16 w-16 rounded-full border border-dashed border-line-strong grid place-items-center text-[11px] text-muted">Tiada logo</div>}
          <p className="font-bold text-[15px] tracking-wide uppercase leading-tight">{profile.name}</p>
          <p className="text-[11px] leading-snug">{profile.addressLines.join(' ')}</p>
          {contact && <p className="text-[11px]">{contact}</p>}
        </div>
        <div className="pt-4 space-y-2" aria-hidden>
          <div className="h-2 w-1/3 ml-auto bg-paper-deep rounded" />
          <div className="h-2.5 w-1/2 mx-auto bg-line rounded mt-3" />
          <div className="h-2 w-full bg-paper-deep rounded" />
          <div className="h-2 w-11/12 bg-paper-deep rounded" />
          <div className="h-2 w-4/5 bg-paper-deep rounded" />
        </div>
        <div className="pt-4 space-y-0.5 text-[10px] font-bold">
          {profile.slogans.map((s) => <p key={s}>{s}</p>)}
        </div>
      </div>
      <figcaption className="text-[13px] text-muted mt-2">{caption}</figcaption>
    </figure>
  );
};

export default MockLetterhead;
