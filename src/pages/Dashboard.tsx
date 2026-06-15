import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";
import { ThemeToggle } from "../components/ThemeToggle";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Layers, FileText, Settings, LogOut, AlertTriangle, Plus, ChevronRight, Lock, RefreshCw, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { AUTH_URL, API_URL } from '../config';

interface UserProfile { email: string; name?: string; role?: string; }
interface LatexFile {
  id: string; user_id: string; name: string;
  engine: string; created_at: number; updated_at: number;
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function EngineTag({ engine }: { engine: string }) {
  return (
    <span className="badge-pill" style={{ fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, letterSpacing: '.02em' }}>
      {engine}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useLocalStorage<string | null>("access_token", null);
  const [user, setUser]               = useState<UserProfile | null>(null);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(true);

  const [files, setFiles]             = useState<LatexFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError]   = useState("");
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LatexFile | null>(null);
  const [renamingId, setRenamingId]   = useState<string | null>(null);
  const [renamingVal, setRenamingVal] = useState("");

  const handleLogout = useCallback(() => {
    setAccessToken(null);
    navigate("/", { replace: true });
  }, [setAccessToken, navigate]);

  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${AUTH_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { if (res.status === 401) handleLogout(); throw new Error(); }
      setUser(await res.json());
    } catch { setError("Failed to load profile."); }
    finally { setLoading(false); }
  }, [handleLogout]);

  useEffect(() => {
    if (!accessToken) { navigate("/", { replace: true }); return; }
    fetchUserProfile(accessToken);
  }, [accessToken, navigate, fetchUserProfile]);

  const fetchLatexFiles = useCallback(async () => {
    if (!accessToken) return;
    setFilesLoading(true); setFilesError("");
    try {
      const res = await fetch(`${API_URL}/api/latex-files`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch { setFilesError("Failed to load files."); }
    finally { setFilesLoading(false); }
  }, [accessToken]);

  useEffect(() => { if (accessToken) fetchLatexFiles(); }, [accessToken, fetchLatexFiles]);

  const startRename = (file: LatexFile) => { setRenamingId(file.id); setRenamingVal(file.name); };

  const commitRename = async (file: LatexFile) => {
    const name = renamingVal.trim();
    setRenamingId(null);
    if (!name || name === file.name || !accessToken) return;
    try {
      const res = await fetch(`${API_URL}/api/latex-files/${file.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, name } : f));
    } catch { setFilesError("Failed to rename file."); }
  };

  const handleDeleteFile = async (file: LatexFile) => {
    if (!accessToken) return;
    setDeletingId(file.id); setPendingDelete(null);
    try {
      const res = await fetch(`${API_URL}/api/latex-files/${file.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error();
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch { setFilesError("Failed to delete file."); }
    finally { setDeletingId(null); }
  };

  if (loading) {
    return (
      <div className="neo-root min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p style={{ color: 'var(--ink-4)', fontSize: '0.875rem' }}>Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  return (
    <div className="neo-root min-h-screen">

      {/* ── Top Navigation ──────────────────────── */}
      <header className="nav-surface sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight" style={{ color: 'var(--ink-1)' }}>
              Sir. Platform
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => navigate('/pdf-editor')}
              className="neo-btn neo-btn-soft flex items-center gap-2 h-9 px-4 rounded-xl text-sm">
              <FileText className="w-4 h-4" />
              PDF Editor
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')}
                className="neo-btn neo-btn-soft flex items-center gap-2 h-9 px-4 rounded-xl text-sm">
                <Settings className="w-4 h-4" />
                Administration
              </button>
            )}
            <button onClick={handleLogout}
              className="neo-btn neo-btn-soft flex items-center gap-2 h-9 px-4 rounded-xl text-sm">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 fade-up">

        {/* Global error */}
        {error && (
          <div className="neo-alert-error flex items-center gap-3 p-4 mb-8 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── User hero ─────────────────────────── */}
        <div className="mb-10">
          <p className="mb-1" style={{ color: 'var(--ink-4)', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Workspace
          </p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 style={{
              fontFamily: 'Inter, -apple-system, sans-serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400,
              letterSpacing: '-1px',
              color: 'var(--ink-1)',
              lineHeight: 1.1,
            }}>
              {displayName}
            </h1>
            <div className="flex items-center gap-2 mb-1">
              {user?.role && (
                <span className="badge-pill">
                  <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-primary' : 'bg-slate-400'}`} />
                  {user.role}
                </span>
              )}
              <span className="badge-pill">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active session
              </span>
            </div>
          </div>
          <p className="mt-2" style={{ color: 'var(--ink-4)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
            {user?.email}
          </p>
        </div>

        {/* ── Quick stats row ───────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">

          {/* New document — coral accent card */}
          <button onClick={() => navigate("/editor")}
            className="text-left rounded-xl p-5 group transition-all duration-150 hover:-translate-y-0.5"
            style={{ background: '#0052ff', border: 'none', cursor: 'pointer' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,.2)' }}>
                <Plus className="w-4 h-4 text-white" />
              </div>
              <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
            </div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">New document</p>
            <p className="text-white font-semibold text-[15px]">Open editor</p>
          </button>

          {/* Library count */}
          <div className="glass-panel rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center mb-4">
              <FileText className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
            </div>
            <p style={{ color: 'var(--ink-4)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }} className="mb-1">Library</p>
            <p className="font-semibold text-[15px]" style={{ color: 'var(--ink-1)' }}>
              {filesLoading ? "—" : `${files.length} file${files.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Session */}
          <div className="glass-panel rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center mb-4">
              <Lock className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
            </div>
            <p style={{ color: 'var(--ink-4)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }} className="mb-1">Session</p>
            <p className="font-semibold text-[15px]" style={{ color: 'var(--ink-1)' }}>Encrypted</p>
          </div>
        </div>

        {/* ── Documents section ─────────────────── */}
        <div>
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-[15px]" style={{ color: 'var(--ink-1)' }}>Documents</h2>
              <p style={{ color: 'var(--ink-4)', fontSize: '0.8125rem' }} className="mt-0.5">
                {filesLoading ? "Loading..." : `${files.length} document${files.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchLatexFiles} disabled={filesLoading} title="Refresh"
                className="neo-btn neo-btn-soft w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40">
                  <RefreshCw className={`w-4 h-4 ${filesLoading ? "animate-spin" : ""}`} />
                </button>
                <button onClick={() => navigate("/editor")}
                  className="neo-btn neo-btn-primary flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold">
                  <Plus className="w-3.5 h-3.5" />
                New document
              </button>
            </div>
          </div>

          {/* Files error */}
          {filesError && (
            <div className="neo-alert-error flex items-center gap-3 p-3 mb-4 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{filesError}</span>
            </div>
          )}

          {/* Skeleton */}
          {filesLoading && files.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="neo-inset rounded-xl p-4 animate-pulse">
                  <div className="h-4 rounded mb-3 w-3/4" style={{ background: 'var(--hairline)' }} />
                  <div className="h-3 rounded mb-2 w-1/3" style={{ background: 'var(--hairline-soft)' }} />
                  <div className="h-3 rounded w-1/2" style={{ background: 'var(--hairline-soft)' }} />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!filesLoading && files.length === 0 && !filesError && (
            <div className="glass-panel rounded-xl flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="neo-inset w-12 h-12 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5" style={{ color: 'var(--ink-4)' }} />
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>No documents yet</p>
                <p style={{ color: 'var(--ink-4)', fontSize: '0.875rem' }}>
                  Create a LaTeX document and compile it from the editor.
                </p>
              </div>
              <button onClick={() => navigate("/editor")}
                className="neo-btn neo-btn-primary mt-1 h-10 px-5 rounded-xl text-sm font-semibold">
                Create document
              </button>
            </div>
          )}

          {/* File grid */}
          {files.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {files.map(file => (
                <div key={file.id}
                  className="glass-panel rounded-xl p-4 flex flex-col gap-3 transition-shadow duration-150 hover:shadow-md">

                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      {renamingId === file.id ? (
                        <input
                          autoFocus
                          value={renamingVal}
                          onChange={e => setRenamingVal(e.target.value)}
                          onBlur={() => commitRename(file)}
                          onKeyDown={e => {
                            if (e.key === "Enter") commitRename(file);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-full text-sm font-semibold neo-input rounded px-1.5 py-0.5"
                          style={{ color: 'var(--ink-1)' }}
                        />
                      ) : (
                        <p className="text-sm font-semibold truncate leading-snug" style={{ color: 'var(--ink-1)' }} title={file.name}>
                          {file.name}
                        </p>
                      )}
                      <p className="text-[11px] mt-0.5 truncate font-mono" style={{ color: 'var(--ink-4)' }}>
                        #{file.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <EngineTag engine={file.engine} />
                    <span className="text-[10px] font-mono" style={{ color: 'var(--ink-4)' }}>
                      {formatDate(file.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--hairline)' }}>
                    <button onClick={() => navigate(`/editor?id=${file.id}`)}
                      className="neo-btn neo-btn-primary flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold">
                      <FolderOpen className="w-3.5 h-3.5" />
                      Open
                    </button>
                    <button onClick={() => startRename(file)} title="Rename"
                      className="neo-btn neo-btn-soft w-8 h-8 rounded-lg flex items-center justify-center">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setPendingDelete(file)} disabled={deletingId === file.id}
                      title="Delete"
                      className="neo-btn neo-btn-soft w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50"
                      style={{ color: 'var(--accent)' }}>
                      {deletingId === file.id
                        ? <span className="loading loading-spinner loading-xs" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete document"
        description={`"${pendingDelete?.name}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => pendingDelete && handleDeleteFile(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
