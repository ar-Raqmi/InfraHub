import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useContracts } from '../../../hooks/useContracts';

interface Props {
  /** sebutharga = the old per-year number list; pustaka = the legacy library editor (now writes versions). */
  variant: 'sebutharga' | 'pustaka';
  className?: string;
}

/** Points officers from the old year-bound settings to Kontrak & buku kadar, where sebutharga now live. */
const KontrakMovedBanner: React.FC<Props> = ({ variant, className = '' }) => {
  const { activeContract } = useContracts();
  const code = activeContract?.code;
  const version = activeContract?.stats?.currentVersion;
  return (
    <div role="note" data-testid={`kontrak-banner-${variant}`} className={`rounded-ih-md border border-kontrak-line bg-kontrak-tint p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${className}`}>
      <BookOpen className="w-6 h-6 text-kontrak shrink-0" aria-hidden />
      <div className="flex-1 min-w-0 text-[15px] text-ink">
        {variant === 'sebutharga' ? (
          <>
            <p className="font-bold text-kontrak">Sebutharga kini diurus di Kontrak & buku kadar.</p>
            <p className="text-sm text-ink-soft mt-0.5">Senarai mengikut tahun ini disimpan untuk rekod lama sahaja. Sebutharga baharu, kadarnya, panel syarikat dan sejarah perubahan dicipta di Kontrak, oleh mana-mana pegawai, dengan memuat naik BQ induk.</p>
          </>
        ) : (
          <>
            <p className="font-bold text-kontrak">Pustaka ini ialah buku kadar kontrak AKTIF{code ? ` ${code}` : ''}{version ? ` (v${version})` : ''}.</p>
            <p className="text-sm text-ink-soft mt-0.5">Editor ini masih berfungsi. Setiap kali anda menekan Simpan Pustaka, versi baharu jenis “Suntingan” dicipta dalam log versi kontrak itu; versi lama tidak dipadam. Untuk kadar sebutharga baharu, gunakan Import BQ Excel di Kontrak.</p>
          </>
        )}
      </div>
      <a href={activeContract && variant === 'pustaka' ? `/kontrak.html?c=${encodeURIComponent(activeContract.id)}&tab=versi` : '/kontrak.html'}
        className="shrink-0 inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-ih-md bg-kontrak text-white font-bold text-[15px]">
        {variant === 'pustaka' ? 'Lihat log versi' : 'Buka Kontrak'} <ArrowRight className="w-4 h-4" aria-hidden />
      </a>
    </div>
  );
};

export default KontrakMovedBanner;
