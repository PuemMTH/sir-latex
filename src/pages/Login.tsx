import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';
import { ThemeToggle } from '../components/ThemeToggle';
import { Layers, AlertTriangle, Check, LogIn } from 'lucide-react';
import { AUTH_URL, CLIENT_ID, CLIENT_SECRET } from '../config';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accessToken, setAccessToken] = useLocalStorage<string | null>('access_token', null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accessToken) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam === 'access_denied'
        ? 'Incorrect email or password. Please try again.'
        : `Authentication error: ${errorParam}`);
      setSearchParams({});
      return;
    }

    const code = searchParams.get('code');
    if (code) {
      setLoading(true);
      exchangeToken(code)
        .then(() => navigate('/dashboard', { replace: true }))
        .catch((err) => {
          setError(err.message);
          setSearchParams({});
        })
        .finally(() => setLoading(false));
    }
  }, [accessToken, searchParams, navigate, setSearchParams]);

  const exchangeToken = async (code: string) => {
    const redirectUri = window.location.origin + '/';
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append('client_id', CLIENT_ID);
    formData.append('client_secret', CLIENT_SECRET);
    formData.append('redirect_uri', redirectUri);

    const res = await fetch(`${AUTH_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    if (!res.ok) throw new Error('Authentication failed. Please try again.');
    const data = await res.json();
    if (data.access_token) setAccessToken(data.access_token);
  };

  const handleLogin = () => {
    const redirectUri = window.location.origin + '/';
    window.location.href = `${AUTH_URL}/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--canvas)' }}>
      
      {/* Header bar */}
      <header className="w-full h-16 border-b border-[#dee1e6] flex items-center justify-between px-6 md:px-12 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0052ff] flex items-center justify-center text-white shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0a0b0d]">SIR</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      {/* Main card panel */}
      <main className="flex-grow flex items-center justify-center px-6 py-12 bg-[#f7f7f7]">
        <div className="w-full max-w-[460px] bg-white border border-[#dee1e6] rounded-[24px] p-8 md:p-10 shadow-[0_4px_12px_rgba(0,0,0,0.02)] fade-up">
          
          {/* Logo & Headline */}
          <div className="text-center md:text-left mb-8">
            <div className="w-12 h-12 rounded-full bg-[#0052ff] flex items-center justify-center text-white mb-6 mx-auto md:mx-0 shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0a0b0d] mb-2 font-sans" style={{ letterSpacing: '-0.8px' }}>
              Sign in to Sir
            </h1>
            <p className="text-[#5b616e] text-sm leading-relaxed">
              Open your LaTeX workspace and manage serious documents in a clean editorial environment.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="w-full p-4 mb-6 rounded-[12px] bg-[#cf202f]/5 border border-[#cf202f]/20 text-[#cf202f] text-sm flex items-start gap-3 text-left">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Feature List (Institutional-grade Card) */}
          <div className="bg-[#f7f7f7] rounded-[16px] p-5 mb-8 flex flex-col gap-4 border border-[#eef0f3]">
            {[
              'LuaLaTeX compilation from the browser',
              'Document, asset, and PDF management',
              'Secure OAuth access for every session',
            ].map(f => (
              <div key={f} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#0052ff]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-[#0052ff]" strokeWidth={3} />
                </div>
                <span className="text-xs font-medium text-[#5b616e]">{f}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-8 h-8 rounded-full border-2 border-[#0052ff] border-t-transparent animate-spin" />
              <p className="text-[#7c828a] text-sm">Establishing connection...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button onClick={handleLogin}
                className="w-full h-12 bg-[#0052ff] hover:bg-[#003ecc] text-white font-semibold rounded-full transition-all text-sm shadow-sm flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                Continue to Sir
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#dee1e6]" />
                <span className="text-[#a8acb3] text-xs font-medium uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-[#dee1e6]" />
              </div>

              <button onClick={() => navigate('/register')}
                className="w-full h-12 border border-[#dee1e6] hover:bg-[#f7f7f7] text-[#0a0b0d] font-semibold rounded-full transition-all text-sm flex items-center justify-center bg-white">
                Create a new account
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer bar */}
      <footer className="w-full py-6 border-t border-[#dee1e6] flex flex-col md:flex-row items-center justify-between px-6 md:px-12 bg-white text-xs text-[#7c828a] gap-4">
        <div className="flex items-center gap-4">
          <span>© 2026 SIR Labs</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#dee1e6]"></span>
          <span>Regulated and Secured</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#0052ff] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#0052ff] transition-colors">Terms of Service</a>
        </div>
      </footer>

    </div>
  );
}
