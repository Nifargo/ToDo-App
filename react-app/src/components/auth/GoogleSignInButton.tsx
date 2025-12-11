import { useState } from 'react';
import type { FC } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  className?: string;
}

const GoogleSignInButton: FC<GoogleSignInButtonProps> = ({ className }) => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign in failed:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Prismatic button with flowing gradient border */}
      <div className="group relative">
        {/* Flowing gradient border wrapper with glow */}
        <div className="flowing-border relative overflow-visible rounded-xl">
          {/* Glow effect behind the button - enhanced for 3D */}
          <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-40 blur-2xl transition-all duration-500 group-hover:opacity-70 group-hover:blur-3xl group-hover:-inset-6" />

          {/* The flowing border is handled by the CSS class */}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className={cn(
              'btn-3d',
              'relative w-full overflow-hidden rounded-[10px] px-6 py-3.5',
              'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
              'font-geometric font-semibold text-base text-white',
              'transition-all duration-300 ease-out',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900'
            )}
          >
            {/* Animated gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-violet-600/20 to-fuchsia-600/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

            {/* Particle effect lines */}
            <div className="absolute left-0 top-1/2 h-[1px] w-0 -translate-y-1/2 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 transition-all duration-700 group-hover:w-full group-hover:opacity-100" />
            <div className="absolute left-0 top-1/3 h-[1px] w-0 -translate-y-1/2 bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-0 transition-all delay-100 duration-700 group-hover:w-full group-hover:opacity-70" />
            <div className="absolute left-0 top-2/3 h-[1px] w-0 -translate-y-1/2 bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent opacity-0 transition-all delay-200 duration-700 group-hover:w-full group-hover:opacity-70" />

            {/* Button content */}
            <div className="relative flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  <span className="bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                    Signing in...
                  </span>
                </>
              ) : (
                <>
                  {/* Google logo with enhanced animation */}
                  <div className="relative">
                    {/* Glow behind logo on hover */}
                    <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />

                    <svg
                      className="relative h-5 w-5 transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-110"
                      viewBox="0 0 48 48"
                    >
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  </div>

                  <span className="bg-gradient-to-r from-white via-slate-100 to-white bg-clip-text text-transparent transition-all duration-300 group-hover:from-indigo-200 group-hover:via-violet-200 group-hover:to-fuchsia-200">
                    Continue with Google
                  </span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Error message - dark theme */}
      {error && (
        <div className="animate-slide-down rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 backdrop-blur-sm" role="alert">
          <p className="text-xs font-medium text-red-300">
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;