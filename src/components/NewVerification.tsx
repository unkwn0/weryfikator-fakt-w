import { useState } from 'react';
import { Verification, createEmptyVerification, CATEGORIES, URGENCIES, VERDICTS, getVerdictBadgeClass, getConfidenceLabel, Category, Urgency, Verdict } from '@/types/verification';
import { saveVerification } from '@/utils/storage';
import { exportPDF, copyMarkdown } from '@/utils/export';
import { toast } from '@/hooks/use-toast';

interface Props {
  editingVerification?: Verification | null;
  onSaved: () => void;
}

export default function NewVerification({ editingVerification, onSaved }: Props) {
  const [data, setData] = useState<Verification>(editingVerification ?? createEmptyVerification());
  const [claimError, setClaimError] = useState(false);

  const update = <K extends keyof Verification>(key: K, val: Verification[K]) => {
    setData(prev => ({ ...prev, [key]: val }));
    if (key === 'claim') setClaimError(false);
  };

  const updateStep = (idx: number, field: 'checked' | 'notes', val: boolean | string) => {
    setData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === idx ? { ...s, [field]: val } : s),
    }));
  };

  const handleSave = () => {
    if (!data.claim.trim()) {
      setClaimError(true);
      return;
    }
    saveVerification(data);
    toast({ title: 'Zapisano weryfikację', duration: 3000 });
    onSaved();
  };

  const handleExportPDF = async () => {
    if (!data.claim.trim()) {
      setClaimError(true);
      return;
    }
    await exportPDF(data);
    toast({ title: 'Eksportowano PDF', duration: 3000 });
  };

  const handleCopyMD = async () => {
    if (!data.claim.trim()) {
      setClaimError(true);
      return;
    }
    await copyMarkdown(data);
    toast({ title: 'Skopiowano do schowka', duration: 3000 });
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6 space-y-6">
      {/* Claim */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Weryfikowane twierdzenie</label>
        <textarea
          className={`w-full bg-input border rounded-sm p-3 font-mono text-sm text-foreground resize-y min-h-[120px] focus:outline-none focus:ring-1 focus:ring-ring ${claimError ? 'border-destructive' : 'border-border'}`}
          value={data.claim}
          onChange={e => update('claim', e.target.value)}
          placeholder="Wpisz twierdzenie do weryfikacji..."
        />
        {claimError && <p className="text-destructive text-xs mt-1">To pole jest wymagane</p>}
      </div>

      {/* Category + Urgency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Kategoria</label>
          <select
            className="w-full bg-input border border-border rounded-sm p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={data.category}
            onChange={e => update('category', e.target.value as Category)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Poziom pilności</label>
          <div className="flex gap-4 pt-1">
            {URGENCIES.map(u => (
              <label key={u} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={data.urgency === u}
                  onChange={() => update('urgency', u as Urgency)}
                  className="accent-primary"
                />
                <span className={data.urgency === u ? 'text-foreground' : 'text-muted-foreground'}>{u}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-3">Kroki weryfikacji</label>
        <div className="space-y-2">
          {data.steps.map((step, i) => (
            <div key={i} className="step-box">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={step.checked}
                  onChange={e => updateStep(i, 'checked', e.target.checked)}
                  className="w-4 h-4 accent-primary rounded-sm"
                />
                <span className={`text-sm font-medium ${step.checked ? 'text-primary' : 'text-foreground'}`}>
                  {i + 1}. {step.label}
                </span>
              </div>
              <textarea
                className="w-full mt-2 bg-background border border-border rounded-sm p-2 font-mono text-xs text-muted-foreground resize-y min-h-[48px] focus:outline-none focus:ring-1 focus:ring-ring"
                value={step.notes}
                onChange={e => updateStep(i, 'notes', e.target.value)}
                placeholder="Notatki..."
              />
            </div>
          ))}
        </div>
      </div>

      {/* Verdict */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Werdykt</label>
          <select
            className="w-full bg-input border border-border rounded-sm p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={data.verdict}
            onChange={e => update('verdict', e.target.value as Verdict)}
          >
            {VERDICTS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Ocena pewności: {data.confidence}% — <span className={
              data.confidence <= 33 ? 'text-destructive' : data.confidence <= 66 ? 'text-status-partial' : 'text-primary'
            }>{getConfidenceLabel(data.confidence)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={data.confidence}
            onChange={e => update('confidence', Number(e.target.value))}
            className="w-full accent-primary mt-1"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-sm text-sm hover:opacity-90 transition-opacity">
          Zapisz weryfikację
        </button>
        <button onClick={handleExportPDF} className="flex-1 bg-secondary text-secondary-foreground font-medium py-2.5 px-4 rounded-sm text-sm border border-border hover:bg-muted transition-colors">
          Eksportuj PDF
        </button>
        <button onClick={handleCopyMD} className="flex-1 bg-secondary text-secondary-foreground font-medium py-2.5 px-4 rounded-sm text-sm border border-border hover:bg-muted transition-colors">
          Kopiuj jako Markdown
        </button>
      </div>
    </div>
  );
}
