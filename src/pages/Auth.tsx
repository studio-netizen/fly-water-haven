import { useState } from 'react';
import SEOHead from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, MapPin, AtSign } from 'lucide-react';
import logoDark from '@/assets/flywaters-logo-dark.png';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { italianProvinces } from '@/lib/italian-provinces';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [provincia, setProvincia] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const passwordsMatch = password === confirmPassword;
  const canRegister = firstName && lastName && username && email && password && confirmPassword && passwordsMatch && privacyAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t('auth.welcome'));
        navigate('/');
      } else {
        if (!passwordsMatch) {
          toast.error(t('auth.passwordsDontMatch'));
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: `${firstName} ${lastName}`, username, provincia },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success(t('auth.checkEmail'));
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
    'pl-10 bg-white border border-[#242242]/10 rounded-xl focus-visible:ring-[#242242]/30 focus-visible:ring-2 h-12 text-base md:text-sm';

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center p-4 pt-8 md:pt-4 overflow-y-auto" style={{ backgroundColor: '#f5f0e8' }}>
      <SEOHead
        title={`${t('auth.login')} | Flywaters`}
        description={t('seo.defaultDescription')}
      />

      <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-lg p-6 md:p-8 animate-fade-in mb-[120px]" style={{ marginBottom: 'max(120px, env(safe-area-inset-bottom, 120px))' }}>
        {/* Logo + Language */}
        <div className="flex justify-center items-center gap-3 mb-6 md:mb-8">
          <img src={logoDark} alt="Flywaters" className="h-9" />
          <LanguageSwitcher />
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#f5f0e8] rounded-full p-1 mb-6 md:mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
              activeTab === 'login'
                ? 'bg-[#242242] text-white shadow-sm'
                : 'text-[#8c8c7a] hover:text-[#242242]'
            }`}
          >
            {t('auth.login')}
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
            {t('auth.register')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'login' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  {t('auth.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="login-email" type="email" placeholder="tu@esempio.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  {t('auth.password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="button" className="text-xs text-[#8c8c7a] hover:text-[#242242] transition-colors">
                {t('auth.forgotPassword')}
              </button>
            </>
          )}

          {activeTab === 'register' && (
            <>
              {/* Nome + Cognome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-first" className="text-xs uppercase tracking-wider text-[#8c8c7a]">{t('auth.firstName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input id="reg-first" placeholder="Mario" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-last" className="text-xs uppercase tracking-wider text-[#8c8c7a]">{t('auth.lastName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input id="reg-last" placeholder="Rossi" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} required />
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-username" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="reg-username" placeholder="mario_rossi" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className={inputClass} required maxLength={30} />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-xs uppercase tracking-wider text-[#8c8c7a]">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="reg-email" type="email" placeholder="tu@esempio.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Conferma Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm" className="text-xs uppercase tracking-wider text-[#8c8c7a]">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="reg-confirm" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} pr-10 ${confirmPassword && !passwordsMatch ? 'border-red-400 focus-visible:ring-red-300' : ''}`} required minLength={6} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1">{t('auth.passwordsDontMatch')}</p>
                )}
              </div>

              {/* Provincia */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-provincia" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Provincia <span className="normal-case tracking-normal">(opzionale)</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a] z-10" />
                  <select
                    id="reg-provincia"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-[#242242]/10 bg-white pl-10 pr-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#242242]/30 transition-colors appearance-none"
                  >
                    <option value="">Seleziona provincia...</option>
                    {italianProvinces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Privacy checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 text-[#242242] focus:ring-[#242242]/30 accent-[#242242]" />
                <span className="text-xs text-[#8c8c7a] leading-relaxed">
                  Ho letto e accetto i{' '}
                  <a href="/terms" className="text-[#242242] underline hover:no-underline">Termini di utilizzo</a>
                  {' '}e la{' '}
                  <a href="/privacy" className="text-[#242242] underline hover:no-underline">{t('auth.privacyPolicy')}</a>
                </span>
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (activeTab === 'register' && !canRegister)}
            className="w-full py-3.5 rounded-full text-sm tracking-widest uppercase font-medium bg-[#242242] text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {loading ? t('auth.loading') : activeTab === 'login' ? t('auth.login') : t('auth.createAccount')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#242242]/10" /></div>
          <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-[#8c8c7a]">{t('auth.or')}</span></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 rounded-full text-sm font-medium border-[1.5px] border-[#242242]/15 bg-white text-[#242242] hover:bg-[#f5f0e8]/50 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {activeTab === 'login' ? t('auth.continueWithGoogle') : t('auth.registerWithGoogle')}
        </button>
      </div>
    </div>
  );
};

export default Auth;
