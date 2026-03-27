import { useState } from 'react';
import SEOHead from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import logoDark from '@/assets/flywaters-logo-dark.png';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordsMatch = password === confirmPassword;
  const canRegister = firstName && lastName && email && password && confirmPassword && passwordsMatch && privacyAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Bentornato!');
        navigate('/');
      } else {
        if (!passwordsMatch) {
          toast.error('Le password non corrispondono');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: `${firstName} ${lastName}` },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Controlla la tua email per confermare l'account!");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error(result.error.message);
  };

  const inputClass =
    'pl-10 bg-white border border-[#242242]/10 rounded-xl focus-visible:ring-[#242242]/30 focus-visible:ring-2 h-12 text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f5f0e8' }}>
      <SEOHead
        title="Accedi | Flywaters"
        description="Accedi o registrati su Flywaters, la community italiana per la pesca a mosca."
      />

      <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-lg p-8 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoDark} alt="Flywaters" className="h-9" />
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#f5f0e8] rounded-full p-1 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
              activeTab === 'login'
                ? 'bg-[#242242] text-white shadow-sm'
                : 'text-[#8c8c7a] hover:text-[#242242]'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
              activeTab === 'register'
                ? 'bg-[#242242] text-white shadow-sm'
                : 'text-[#8c8c7a] hover:text-[#242242]'
            }`}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── LOGIN TAB ── */}
          {activeTab === 'login' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button type="button" className="text-xs text-[#8c8c7a] hover:text-[#242242] transition-colors">
                Password dimenticata?
              </button>
            </>
          )}

          {/* ── REGISTER TAB ── */}
          {activeTab === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-first" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                    Nome
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input
                      id="reg-first"
                      placeholder="Mario"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-last" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                    Cognome
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input
                      id="reg-last"
                      placeholder="Rossi"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="tu@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  Conferma password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClass} pr-10 ${
                      confirmPassword && !passwordsMatch ? 'border-red-400 focus-visible:ring-red-300' : ''
                    }`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1">Le password non corrispondono</p>
                )}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 text-[#242242] focus:ring-[#242242]/30 accent-[#242242]"
                />
                <span className="text-xs text-[#8c8c7a] leading-relaxed">
                  Ho letto e accetto la{' '}
                  <a href="/privacy" className="text-[#242242] underline hover:no-underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (activeTab === 'register' && !canRegister)}
            className="w-full py-3 rounded-full text-sm tracking-widest uppercase font-medium bg-[#242242] text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
          >
            {loading
              ? 'Caricamento...'
              : activeTab === 'login'
                ? 'Accedi'
                : 'Crea account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#242242]/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-[#8c8c7a]">oppure</span>
          </div>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 rounded-full text-sm font-medium border-[1.5px] border-[#242242]/15 bg-white text-[#242242] hover:bg-[#f5f0e8]/50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {activeTab === 'login' ? 'Continua con Google' : 'Registrati con Google'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
