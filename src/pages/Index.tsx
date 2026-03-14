import { useState, useCallback } from 'react';
import { Verification } from '@/types/verification';
import NewVerification from '@/components/NewVerification';
import VerificationHistory from '@/components/VerificationHistory';
import { Toaster } from '@/components/ui/toaster';
import { Shield } from 'lucide-react';

type View = 'new' | 'history';

const Index = () => {
  const [view, setView] = useState<View>('new');
  const [editingVerification, setEditingVerification] = useState<Verification | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = useCallback(() => {
    setEditingVerification(null);
    setView('history');
    setRefreshKey(k => k + 1);
  }, []);

  const handleEdit = useCallback((v: Verification) => {
    setEditingVerification(v);
    setView('new');
  }, []);

  const handleNewTab = () => {
    setEditingVerification(null);
    setView('new');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight text-foreground">FactCheck</span>
          </div>
          <nav className="flex gap-0">
            <button
              onClick={handleNewTab}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${view === 'new' ? 'tab-active' : 'tab-inactive'}`}
            >
              {editingVerification ? 'Edycja weryfikacji' : 'Nowa weryfikacja'}
            </button>
            <button
              onClick={() => { setView('history'); setRefreshKey(k => k + 1); }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${view === 'history' ? 'tab-active' : 'tab-inactive'}`}
            >
              Historia
            </button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {view === 'new' ? (
          <NewVerification
            key={editingVerification?.id ?? 'new'}
            editingVerification={editingVerification}
            onSaved={handleSaved}
          />
        ) : (
          <VerificationHistory onEdit={handleEdit} refreshKey={refreshKey} />
        )}
      </main>

      <Toaster />
    </div>
  );
};

export default Index;
