import React, { useEffect, useState } from 'react';
import { Field, Input } from '../ui';
import { cx } from '../ui/cx';
import MockLetterhead from './MockLetterhead';
import { CONFIG_KEYS, type OrgProfile } from './orgDefaults';
import { SaveBar, SectionCard, SectionHistory, TEXTAREA, useSaveState } from './orgUi';

interface ProfileSectionProps {
  profile: OrgProfile;
  logoSrc: string | null;
  onSave: (profile: OrgProfile) => Promise<unknown>;
}

const lines = (text: string): string[] => text.split('\n').map((l) => l.trim()).filter(Boolean);

type TextKey = 'name' | 'short' | 'government' | 'department' | 'procurementUnit' | 'phone' | 'email' | 'website';

const TEXT_FIELDS: { key: TextKey; label: string; hint: string; type?: string }[] = [
  { key: 'name', label: 'Nama penuh', hint: 'Dicetak pada sijil, notis dan surat.' },
  { key: 'short', label: 'Nama ringkas', hint: 'Cth. MPS. Dipakai dalam ayat seperti "pihak MPS".' },
  { key: 'government', label: 'Baris kerajaan', hint: 'Baris pertama kepala sijil.' },
  { key: 'department', label: 'Jabatan', hint: 'Jabatan yang menandatangani notis.' },
  { key: 'procurementUnit', label: 'Unit perolehan', hint: 'Penerima salinan Borang Prestasi.' },
  { key: 'phone', label: 'Telefon', hint: 'Talian pertanyaan dalam Notis Pemberitahuan.', type: 'tel' },
  { key: 'email', label: 'Emel', hint: 'Dicetak pada kepala surat jika diaktifkan.', type: 'email' },
  { key: 'website', label: 'Laman web', hint: 'Dicetak pada kepala surat jika diaktifkan.', type: 'url' },
];

const ProfileSection: React.FC<ProfileSectionProps> = ({ profile, logoSrc, onSave }) => {
  const [draft, setDraft] = useState(profile);
  const [address, setAddress] = useState(profile.addressLines.join('\n'));
  const [slogans, setSlogans] = useState(profile.slogans.join('\n'));
  const save = useSaveState();

  const saved = JSON.stringify(profile);
  useEffect(() => {
    setDraft(profile);
    setAddress(profile.addressLines.join('\n'));
    setSlogans(profile.slogans.join('\n'));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the saved value really changes
  }, [saved]);

  const next: OrgProfile = { ...draft, addressLines: lines(address), slogans: lines(slogans) };
  const dirty = JSON.stringify(next) !== JSON.stringify(profile);
  const missingName = !next.name.trim();

  return (
    <SectionCard id="profil" eyebrow="Profil" title="Profil organisasi" description="Nama, alamat dan slogan yang dicetak pada setiap dokumen. Ubah di sini sekali; semua sijil dan notis ikut.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {TEXT_FIELDS.map(({ key, label, hint, type }) => (
            <Field key={key} label={label} htmlFor={`org-${key}`} hint={hint} error={key === 'name' && missingName ? 'Nama penuh diperlukan.' : undefined}
              className={key === 'name' ? 'sm:col-span-2' : undefined}>
              <Input id={`org-${key}`} type={type ?? 'text'} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
            </Field>
          ))}
          <Field label="Alamat" htmlFor="org-address" hint="Satu baris setiap talian, seperti dicetak." className="sm:col-span-2">
            <textarea id="org-address" rows={3} className={TEXTAREA} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Slogan" htmlFor="org-slogans" hint="Satu slogan setiap baris; dicetak di atas tandatangan notis." className="sm:col-span-2">
            <textarea id="org-slogans" rows={4} className={TEXTAREA} value={slogans} onChange={(e) => setSlogans(e.target.value)} />
          </Field>
          <label className={cx('sm:col-span-2 flex items-start gap-3 min-h-11 rounded-ih-md border p-3 cursor-pointer', draft.printLetterhead ? 'border-emerald bg-emerald-tint' : 'border-line-strong bg-surface')}>
            <input type="checkbox" className="mt-1 w-5 h-5 accent-emerald" checked={draft.printLetterhead}
              onChange={(e) => setDraft({ ...draft, printLetterhead: e.target.checked })} />
            <span>
              <span className="block font-bold text-ink">Cetak kepala surat pada notis</span>
              <span className="block text-sm text-muted">Biarkan tutup jika notis dicetak pada kertas berkepala surat. Buka untuk mencetak logo, nama dan alamat di ruang atas surat.</span>
            </span>
          </label>
        </div>
        <div className="lg:sticky lg:top-24 self-start">
          <MockLetterhead profile={next} logoSrc={logoSrc} caption="Pratonton langsung: berubah semasa anda menaip." />
        </div>
      </div>
      <SaveBar dirty={dirty && !missingName} saving={save.saving} savedAt={save.savedAt} error={save.error}
        onSave={() => save.run(() => onSave(next))} label="Simpan profil" testId="save-profil" />
      <SectionHistory entity="config" entityId={CONFIG_KEYS.profile} />
    </SectionCard>
  );
};

export default ProfileSection;
