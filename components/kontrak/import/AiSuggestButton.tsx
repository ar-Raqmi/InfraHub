// Optional AI suggestions. Hidden unless the organisation config switches it on (`ai.matchSuggest: true`),
// so a server without an AI binding (501) never shows a button or an error.
// LOCAL ADAPTER (see NEEDS-lead.md): apiService has no aiMatchSuggest method yet.
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../../ui';
import { useOrgConfig } from '../../../hooks/useOrgConfig';
import { rateBookKeys } from '../../../hooks/useRateBook';

function actorHeader(): Record<string, string> {
  try {
    const id = JSON.parse(localStorage.getItem('infrahub_user') ?? 'null')?.id;
    return id ? { 'X-InfraHub-User': String(id) } : {};
  } catch {
    return {};
  }
}

const AiSuggestButton: React.FC<{ versionId: string }> = ({ versionId }) => {
  const { config } = useOrgConfig();
  const queryClient = useQueryClient();
  const [state, setState] = useState<'idle' | 'busy' | 'gone'>('idle');
  if (config['ai.matchSuggest'] !== true || state === 'gone') return null;

  const ask = async () => {
    setState('busy');
    const res = await fetch('/api/ai/match-suggest', { method: 'POST', headers: { 'Content-Type': 'application/json', ...actorHeader() }, body: JSON.stringify({ versionId }) }).catch(() => null);
    if (!res || !res.ok) { setState('gone'); return; }
    await queryClient.invalidateQueries({ queryKey: rateBookKeys.version(versionId) });
    setState('idle');
  };

  return <Button variant="ghost" icon={Sparkles} disabled={state === 'busy'} onClick={ask}>{state === 'busy' ? 'Meminta cadangan…' : 'Cadangan AI'}</Button>;
};

export default AiSuggestButton;
