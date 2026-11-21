import { describe, expect, it } from 'vitest';
import { isRepriceable, needsRepricing } from './repricing';

describe('repricing rule', () => {
  it('flags draf and menunggu-lantikan projects on a closed sebutharga', () => {
    expect(needsRepricing({ status: 'FASA_DRAF' }, 'DITUTUP')).toBe(true);
    expect(needsRepricing({ status: 'MENUNGGU_LANTIKAN' }, 'DITUTUP')).toBe(true);
  });

  it('leaves appointed projects and open contracts alone', () => {
    expect(needsRepricing({ status: 'DALAM_PROSES' }, 'DITUTUP')).toBe(false);
    expect(needsRepricing({ status: 'FASA_DRAF' }, 'AKTIF')).toBe(false);
    expect(needsRepricing({ status: 'FASA_DRAF' }, null)).toBe(false);
  });

  it('treats an issued inden as locked even before the status moves', () => {
    expect(isRepriceable({ status: 'MENUNGGU_LANTIKAN', noInden: 'A0012345' })).toBe(false);
    expect(isRepriceable({ status: 'MENUNGGU_LANTIKAN', noInden: '  ' })).toBe(true);
  });
});
