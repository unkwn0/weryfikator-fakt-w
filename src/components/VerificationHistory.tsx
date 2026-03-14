import { useState, useMemo, useRef } from 'react';
import { Verification, getVerdictBadgeClass, getConfidenceLabel } from '@/types/verification';
import { loadVerifications, deleteVerification, saveAllVerifications } from '@/utils/storage';
import { toast } from '@/hooks/use-toast';
import { Search, Trash2, ChevronRight, Download, Upload } from 'lucide-react';

interface Props {
  onEdit: (v: Verification) => void;
  refreshKey: number;
}

export default function VerificationHistory({ onEdit, refreshKey }: Props) {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importDialog, setImportDialog] = useState<{ data: Verification[]; count: number } | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const verifications = useMemo(() => {
    const all = loadVerifications();
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(v => v.claim.toLowerCase().includes(q));
  }, [search, refreshKey, localRefresh]);

  const handleDelete = (id: string) => {
    deleteVerification(id);
    setDeleteId(null);
    setLocalRefresh(k => k + 1);
    toast({ title: 'Usunięto weryfikację', duration: 3000 });
  };

  const truncate = (s: string, len = 80) => s.length > len ? s.slice(0, len) + '…' : s;

  // JSON Export
  const handleExportJSON = () => {
    const all = loadVerifications();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weryfikacje-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!Array.isArray(parsed)) throw new Error('Not an array');
        // Ensure each item has an id
        const items: Verification[] = parsed.map((item: any) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
        }));
        setImportDialog({ data: items, count: items.length });
      } catch {
        toast({ title: 'Nieprawidłowy plik JSON', variant: 'destructive', duration: 3000 });
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleImportMerge = () => {
    if (!importDialog) return;
    const existing = loadVerifications();
    const existingIds = new Set(existing.map(v => v.id));
    const newItems = importDialog.data.filter(v => !existingIds.has(v.id));
    saveAllVerifications([...existing, ...newItems]);
    setImportDialog(null);
    setLocalRefresh(k => k + 1);
    toast({ title: `Zaimportowano ${newItems.length} nowych weryfikacji`, duration: 3000 });
  };

  const handleImportOverwrite = () => {
    if (!importDialog) return;
    saveAllVerifications(importDialog.data);
    setImportDialog(null);
    setLocalRefresh(k => k + 1);
    toast({ title: `Nadpisano — ${importDialog.count} weryfikacji`, duration: 3000 });
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Szukaj weryfikacji..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Import/Export buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleExportJSON}
          className="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-2 rounded-sm border border-border hover:bg-muted transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Eksportuj JSON
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-2 rounded-sm border border-border hover:bg-muted transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Importuj JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Import dialog */}
      {importDialog && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <p className="text-sm text-foreground">
            Znaleziono <strong>{importDialog.count}</strong> weryfikacji. Co chcesz zrobić?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleImportMerge}
              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-sm font-medium"
            >
              Dołącz do istniejących
            </button>
            <button
              onClick={handleImportOverwrite}
              className="text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-sm font-medium"
            >
              Nadpisz wszystko
            </button>
            <button
              onClick={() => setImportDialog(null)}
              className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-sm border border-border"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {verifications.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {search ? 'Brak wyników wyszukiwania' : 'Brak zapisanych weryfikacji'}
        </div>
      )}

      {/* Cards */}
      <div className="space-y-2">
        {verifications.map(v => (
          <div key={v.id} className="step-box hover:border-primary/30 transition-colors group">
            {deleteId === v.id ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Czy na pewno chcesz usunąć?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-sm font-medium"
                  >
                    Usuń
                  </button>
                  <button
                    onClick={() => setDeleteId(null)}
                    className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-sm border border-border"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => onEdit(v)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{truncate(v.claim)}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{new Date(v.createdAt).toLocaleDateString('pl-PL')}</span>
                    {v.updatedAt !== v.createdAt && (
                      <span className="italic">edyt. {new Date(v.updatedAt).toLocaleDateString('pl-PL')}</span>
                    )}
                    <span className="bg-muted px-1.5 py-0.5 rounded-sm">{v.category}</span>
                    <span className={`px-2 py-0.5 rounded-sm text-xs font-medium ${getVerdictBadgeClass(v.verdict)}`}>
                      {v.verdict}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-sm overflow-hidden">
                      <div
                        className={`h-full rounded-sm transition-all ${
                          v.confidence <= 33 ? 'bg-destructive' : v.confidence <= 66 ? 'bg-status-partial' : 'bg-primary'
                        }`}
                        style={{ width: `${v.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{v.confidence}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteId(v.id); }}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
