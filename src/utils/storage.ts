import { Verification } from '@/types/verification';

const STORAGE_KEY = 'fact-checker-verifications';

export function loadVerifications(): Verification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveVerification(v: Verification): void {
  const all = loadVerifications();
  const idx = all.findIndex(x => x.id === v.id);
  if (idx >= 0) {
    all[idx] = { ...v, updatedAt: new Date().toISOString() };
  } else {
    all.unshift(v);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteVerification(id: string): void {
  const all = loadVerifications().filter(x => x.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function saveAllVerifications(verifications: Verification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(verifications));
}
