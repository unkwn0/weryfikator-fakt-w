import { useState, useMemo } from 'react';
import { Verification, getVerdictBadgeClass, getConfidenceLabel } from '@/types/verification';
import { loadVerifications, deleteVerification } from '@/utils/storage';
import { toast } from '@/hooks/use-toast';
import { Search, Trash2, ChevronRight } from 'lucide-react';

interface Props {
  onEdit: (v: Verification) => void;
  refreshKey: number;
}

export default function VerificationHistory({ onEdit, refreshKey }: Props) {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const verifications = useMemo(() => {
    const all = loadVerifications();
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(v => v.claim.toLowerCase().includes(q));
  }, [search, refreshKey]);

  const handleDelete = (id: string) => {
    deleteVerification(id);
    setDeleteId(null);
    toast({ title: 'Usunięto weryfikację', duration: 3000 });
  };

  const truncate = (s: string, len = 80) => s.length > len ? s.slice(0, len) + '…' : s;

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

      {verifications.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {search ? 'Brak wyników wyszukiwania' : 'Brak zapisanych weryfikacji'}
        </div>
      )}

      {/* Cards */}
      <div className="space-y-2">
        {verifications.map(v => (
          <div key={v.id} className="step-box hover:border-primary/30 transition-colors group">
            {/* Delete confirmation */}
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
              <>
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
                    {/* Confidence bar */}
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
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
