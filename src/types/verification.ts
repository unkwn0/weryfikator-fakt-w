export type Category = 'Polityka' | 'Gospodarka' | 'Historia' | 'Nauka' | 'Inne';
export type Urgency = 'Niski' | 'Średni' | 'Wysoki';
export type Verdict = 'Prawda' | 'Fałsz' | 'Częściowo prawda' | 'Nieweryfikowalne' | 'W toku';

export interface VerificationStep {
  label: string;
  checked: boolean;
  notes: string;
  sourceUrl: string;
}

export interface Verification {
  id: string;
  claim: string;
  category: Category;
  urgency: Urgency;
  steps: VerificationStep[];
  verdict: Verdict;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_STEPS: string[] = [
  'Identyfikacja źródła pierwotnego',
  'Weryfikacja źródła pierwotnego',
  'Źródło wtórne nr 1',
  'Źródło wtórne nr 2',
  'Weryfikacja krzyżowa',
  'Kontekst i data publikacji',
  'Potencjalne motywacje źródła',
  'Werdykt końcowy',
];

export const CATEGORIES: Category[] = ['Polityka', 'Gospodarka', 'Historia', 'Nauka', 'Inne'];
export const URGENCIES: Urgency[] = ['Niski', 'Średni', 'Wysoki'];
export const VERDICTS: Verdict[] = ['Prawda', 'Fałsz', 'Częściowo prawda', 'Nieweryfikowalne', 'W toku'];

export function createEmptyVerification(): Verification {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    claim: '',
    category: 'Polityka',
    urgency: 'Średni',
    steps: DEFAULT_STEPS.map(label => ({ label, checked: false, notes: '', sourceUrl: '' })),
    verdict: 'W toku',
    confidence: 50,
    createdAt: now,
    updatedAt: now,
  };
}

export function getVerdictBadgeClass(verdict: Verdict): string {
  switch (verdict) {
    case 'Prawda': return 'badge-true';
    case 'Fałsz': return 'badge-false';
    case 'Częściowo prawda': return 'badge-partial';
    case 'Nieweryfikowalne': return 'badge-unverifiable';
    case 'W toku': return 'badge-progress';
  }
}

export function getConfidenceLabel(value: number): string {
  if (value <= 33) return 'Niska';
  if (value <= 66) return 'Średnia';
  return 'Wysoka';
}
