import type { FC } from 'react';
import GoogleSignInButton from './GoogleSignInButton';
import { CheckSquare } from 'lucide-react';

const LoginScreen: FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md">
        {/* Glass card container */}
        <div className="rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
          {/* App logo/icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
              <CheckSquare className="h-16 w-16 text-white" strokeWidth={2} />
            </div>
          </div>

          {/* App name */}
          <h1 className="mb-2 text-center text-4xl font-bold text-white">
            My Tasks
          </h1>

          {/* Welcome message */}
          <p className="mb-8 text-center text-lg text-white/80">
            Organize your life, one task at a time
          </p>

          {/* Sign in button */}
          <GoogleSignInButton />

          {/* Footer text */}
          <p className="mt-6 text-center text-sm text-white/60">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Version info */}
        <p className="mt-4 text-center text-sm text-white/50">
          Version {import.meta.env.VITE_APP_VERSION || '9.0.0'}
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;