import React, { useRef, useState } from 'react';
import { ImageOff, RotateCcw, Upload } from 'lucide-react';
import { Button, Chip } from '../ui';
import MockLetterhead from './MockLetterhead';
import { CONFIG_KEYS, DEFAULT_LOGO, type OrgLogo, type OrgProfile } from './orgDefaults';
import { SaveBar, SectionCard, SectionHistory, useSaveState } from './orgUi';

// The logo is stored as a downscaled PNG data URL in app_config: the PDF exporters need base64 anyway, and the
// storage upload route files images into the project photo gallery, where a crest does not belong.
const MAX_SIDE = 512;
const MAX_DATA_URL = 350_000;

function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Fail ini bukan imej yang boleh dibaca.')); };
    img.src = url;
  });
}

interface LogoSectionProps {
  profile: OrgProfile;
  logo: OrgLogo | null;
  onSave: (logo: OrgLogo | null) => Promise<unknown>;
}

const sameLogo = (a: OrgLogo | null, b: OrgLogo | null) => (a?.src ?? null) === (b?.src ?? null);

const LogoSection: React.FC<LogoSectionProps> = ({ profile, logo, onSave }) => {
  const [draft, setDraft] = useState<OrgLogo | null>(logo);
  const [savedLogo, setSavedLogo] = useState<OrgLogo | null>(logo);
  const [problem, setProblem] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const save = useSaveState();

  if (!sameLogo(savedLogo, logo)) { setSavedLogo(logo); setDraft(logo); }

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setProblem(null);
    try {
      const src = await downscale(file);
      if (src.length > MAX_DATA_URL) throw new Error('Logo terlalu besar selepas dikecilkan. Guna imej yang lebih ringkas (PNG/JPG).');
      setDraft({ src, fileName: file.name });
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'Gagal membaca imej.');
    }
  };

  return (
    <SectionCard id="logo" eyebrow="Logo organisasi" title="Logo pada dokumen"
      description="Logo atau jata organisasi anda, dicetak pada Borang Prestasi dan pada kepala surat notis jika diaktifkan. Logo InfraHub (produk) tidak berubah.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-ih-md border border-line bg-paper p-4">
            <div className="w-20 h-20 shrink-0 rounded-ih-sm bg-white border border-line grid place-items-center overflow-hidden">
              {draft ? <img src={draft.src} alt="Logo organisasi semasa" className="max-w-full max-h-full object-contain" /> : <ImageOff className="w-7 h-7 text-muted" aria-hidden />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-ink break-words">{draft ? draft.fileName ?? 'Logo tersimpan' : 'Tiada logo'}</p>
              <div className="mt-1">{sameLogo(draft, DEFAULT_LOGO) ? <Chip tone="neutral">Logo asal sistem</Chip> : draft ? <Chip tone="emerald">Logo dimuat naik</Chip> : <Chip tone="amber">Dokumen dicetak tanpa logo</Chip>}</div>
            </div>
          </div>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" data-testid="logo-file"
            onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={Upload} onClick={() => input.current?.click()}>Muat naik logo</Button>
            <Button variant="ghost" icon={RotateCcw} onClick={() => setDraft(DEFAULT_LOGO)} disabled={sameLogo(draft, DEFAULT_LOGO)}>Guna logo asal</Button>
            <Button variant="danger" icon={ImageOff} onClick={() => setDraft(null)} disabled={!draft}>Tanpa logo</Button>
          </div>
          {problem && <p role="alert" className="text-sm font-bold text-danger">{problem}</p>}
          <p className="text-sm text-muted">PNG atau JPG berlatar putih/lutsinar paling jelas. Imej dikecilkan ke {MAX_SIDE} px sebelum disimpan.</p>
        </div>
        <MockLetterhead profile={profile} logoSrc={draft?.src ?? null} caption="Pratonton kepala surat dengan logo ini." />
      </div>
      <SaveBar dirty={!sameLogo(draft, logo)} saving={save.saving} savedAt={save.savedAt} error={save.error}
        onSave={() => save.run(() => onSave(draft))} label="Simpan logo" testId="save-logo" />
      <SectionHistory entity="config" entityId={CONFIG_KEYS.logo} />
    </SectionCard>
  );
};

export default LogoSection;
