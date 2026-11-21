import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ladPolicyAt, locPolicyAt, policyAt, type PolicyRule } from '../domain/policy';
import { apiService } from '../services/apiService';
import type { LookupValue, PolicyRuleRecord } from '../types';

const toRules = (records: PolicyRuleRecord[]): PolicyRule[] =>
  records.map((r) => ({ key: r.key, effective_from: r.effectiveFrom, value: r.value, note: r.note }));

/** Organisation config (profile, texts), lookup lists and dated policy rules, editable in Tetapan. */
export const useOrgConfig = () => {
  const queryClient = useQueryClient();

  const config = useQuery<Record<string, unknown>>({ queryKey: ['org-config'], queryFn: () => apiService.getOrgConfig() });
  const policies = useQuery<PolicyRuleRecord[]>({ queryKey: ['policies'], queryFn: () => apiService.getPolicies() });

  const setConfig = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => apiService.setOrgConfig(key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org-config'] }),
  });

  const addPolicy = useMutation({
    mutationFn: (rule: { key: string; effective_from: string; value: unknown; note?: string }) => apiService.addPolicy(rule),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policies'] }),
  });

  const saveLookups = useMutation({
    mutationFn: ({ list, values }: { list: string; values: LookupValue[] }) => apiService.saveLookups(list, values),
    onSuccess: (_data, { list }) => queryClient.invalidateQueries({ queryKey: ['lookups', list.toUpperCase()] }),
  });

  const rules = toRules(policies.data ?? []);
  return {
    config: config.data ?? {},
    policies: policies.data ?? [],
    isLoading: config.isLoading || policies.isLoading,
    /** Value of a policy on a date (YYYY-MM-DD), e.g. the LAD rate on the project's Tarikh Siap. */
    policyAt: (key: string, isoDate: string) => policyAt(rules, key, isoDate),
    ladPolicyAt: (isoDate: string) => ladPolicyAt(rules, isoDate),
    locPolicyAt: (isoDate: string) => locPolicyAt(rules, isoDate),
    setConfig,
    addPolicy,
    saveLookups,
  };
};

/** Active values of one lookup list (BP, ZON, MUKIM, ...). */
export const useLookups = (list: string) => {
  const query = useQuery<LookupValue[]>({ queryKey: ['lookups', list.toUpperCase()], queryFn: () => apiService.getLookups(list) });
  return { ...query, values: query.data ?? [], active: (query.data ?? []).filter((v) => v.active) };
};
