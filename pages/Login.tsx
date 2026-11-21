import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { User as UserType } from '../types';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { BrandMark, Button, Field, Input } from '../components/ui';
import { useOrgDocs } from '../components/org/orgDocs';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

/** The organisation using this InfraHub (from Tetapan Organisasi), shown under the product brand. */
const OrgLine: React.FC = () => {
  const { docs } = useOrgDocs();
  const { profile, logo } = docs;
  return (
    <div className="flex items-center gap-3 rounded-ih-md border border-line bg-paper px-3 py-2.5" data-testid="login-org">
      {logo && <img src={logo.src} alt="" className="w-9 h-9 object-contain shrink-0" />}
      <div className="min-w-0">
        <p className="ih-eyebrow text-muted">Digunakan oleh</p>
        <p className="font-bold text-ink leading-tight break-words">{profile.name}</p>
      </div>
    </div>
  );
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await apiService.login(username, password);
      onLogin(user);
    } catch (err) {
      setError('Nama pengguna atau kata laluan salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-start justify-center px-4 py-8 md:items-center font-sans">
      <div className="w-full max-w-md bg-surface border border-line rounded-ih-xl p-6 md:p-10 animate-fade-in space-y-6">
        <div className="flex items-center gap-4">
          <BrandMark size={56} />
          <div className="min-w-0">
            <h1 className="font-display text-display-l text-ink">InfraHub</h1>
            <p className="text-sm text-muted">Projek infrastruktur, dari tapak ke bayaran.</p>
          </div>
        </div>

        <OrgLine />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="ID pengguna" htmlFor="login-username">
            <Input
              id="login-username"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Field>

          <Field label="Kata laluan" htmlFor="login-password">
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-14"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Sembunyikan kata laluan' : 'Tunjuk kata laluan'}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-ih-sm text-muted hover:text-ink active:bg-paper-deep"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </Field>

          {error && (
            <p role="alert" className="p-3 rounded-ih-md bg-danger-tint border border-danger-line text-danger text-sm font-bold">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" block disabled={loading}>
            {loading ? 'Sila tunggu…' : 'Log masuk'} {!loading && <ArrowRight className="w-5 h-5" aria-hidden />}
          </Button>
        </form>

        <p className="text-center text-[12px] font-bold uppercase tracking-[0.2em] text-muted">by Syafiq Daniel</p>
      </div>
    </div>
  );
};

export default Login;
