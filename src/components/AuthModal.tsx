import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import logoDark from '@/assets/flywaters-logo-dark.png';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'login' | 'register';
}

const AuthModal = ({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Sync mode when prop changes
  const handleOpenChange = (val: boolean) => {
    if (val) setIsLogin(defaultMode === 'login');
    onOpenChange(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Bentornato!');
        onOpenChange(false);
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Controlla la tua email per confermare l\'account!');
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-8 bg-[#f5f0e8] border-none">
        <div className="flex justify-center mb-6">
          <img src={logoDark} alt="Flywaters" className="h-8" />
        </div>

        <h2 className="text-xl font-bold text-[#242242] text-center mb-1">
          {isLogin ? 'Bentornato' : 'Crea il tuo account'}
        </h2>
        <p className="text-sm text-[#8c8c7a] text-center mb-6">
          {isLogin ? 'Accedi per continuare' : 'Unisciti alla community'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="modal-name" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                <Input id="modal-name" placeholder="Il tuo nome" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 bg-white border-[#242242]/10 focus-visible:ring-[#242242]/30" required />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="modal-email" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
              <Input id="modal-email" type="email" placeholder="tu@esempio.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-white border-[#242242]/10 focus-visible:ring-[#242242]/30" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modal-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
              <Input id="modal-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-white border-[#242242]/10 focus-visible:ring-[#242242]/30" required minLength={6} />
            </div>
          </div>

          {isLogin && (
            <button type="button" className="text-xs text-[#8c8c7a] hover:text-[#242242] transition-colors">
              Password dimenticata?
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm tracking-widest uppercase font-medium bg-[#242242] text-[#f5f0e8] hover:bg-[#242242]/85 transition-colors disabled:opacity-50"
          >
            {loading ? 'Caricamento...' : isLogin ? 'Accedi' : 'Crea account'}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#242242]/10" /></div>
          <div className="relative flex justify-center text-xs"><span className="px-3 bg-[#f5f0e8] text-[#8c8c7a]">oppure</span></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 text-sm font-medium border border-[#242242]/15 bg-white text-[#242242] hover:bg-[#242242]/5 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continua con Google
        </button>

        <p className="text-center mt-4 text-sm text-[#8c8c7a]">
          {isLogin ? 'Non hai ancora un account?' : 'Hai già un account?'}{' '}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[#242242] font-medium hover:underline">
            {isLogin ? 'Registrati' : 'Accedi'}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;