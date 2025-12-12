import type { FC } from 'react';
import GoogleSignInButton from './GoogleSignInButton';
import { Sparkles, X } from 'lucide-react';

interface LoginScreenProps {
  onClose?: () => void;
}

const LoginScreen: FC<LoginScreenProps> = ({ onClose }) => {
  return (
    <>
      {/* Backdrop with blur effect - KEEP THIS */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 backdrop-blur-xl">
        {/* Ambient background - darker theme */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Glowing orbs - more vibrant */}
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-500/30 animate-glow-pulse" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-500/30 animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/20 animate-glow-pulse" style={{ animationDelay: '3s' }} />

          {/* Noise texture overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-40" />
        </div>

        {/* Compact dark modal - MUCH SMALLER */}
        <div className="relative z-10 w-full max-w-md animate-scale-up p-4">
          <div className="prism-border dark-glass-morphism rounded-2xl p-6 shadow-2xl shadow-black/50">
            {/* Close button - only show if onClose is provided */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            {/* Minimal header with prismatic icon */}
            <div className="mb-6 text-center">
              {/* Prismatic icon with glow */}
              <div className="mb-4 inline-flex">
                <div className="relative">
                  {/* Glow effect behind icon */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 blur-xl opacity-60" />

                  {/* Icon container */}
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-[2px] shadow-lg shadow-indigo-500/50">
                    <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-900">
                      <Sparkles className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact title */}
              <h1 className="font-geometric text-2xl font-bold text-white">
                My Tasks
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-400">
                Sign in to continue
              </p>
            </div>

            {/* Sign-in button */}
            <div className="mb-4">
              <GoogleSignInButton />
            </div>

            {/* Compact security badges */}
            <div className="flex items-center justify-center gap-4 border-t border-white/5 pt-4">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="h-1 w-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                Secure
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="h-1 w-1 rounded-full bg-violet-400 shadow-sm shadow-violet-400" />
                Private
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="h-1 w-1 rounded-full bg-fuchsia-400 shadow-sm shadow-fuchsia-400" />
                Fast
              </span>
            </div>

            {/* Minimal version */}
            <p className="mt-4 text-center text-xs font-medium tracking-wider text-slate-600">
              v{import.meta.env.VITE_APP_VERSION || '9.0.0'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginScreen;