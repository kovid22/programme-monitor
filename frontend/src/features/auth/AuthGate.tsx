import { useAuth } from './AuthContext';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, authError, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-canvas">
        <div className="text-secondary animate-pulse text-sm font-medium">Verifying access...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-canvas p-4">
        <div className="max-w-md w-full bg-surface border border-subtle rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
          <div className="h-10 w-10 rounded bg-brand shadow-sm shadow-brand/20 mb-6 flex items-center justify-center">
            {/* Optional icon if needed, otherwise just the brand box */}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary mb-2">
            Programme Monitor
          </h1>
          <p className="text-sm text-secondary mb-8">
            Authorized users only. Please sign in to continue.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-brand hover:bg-brand/90 text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 bg-white rounded-full p-0.5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          {authError && (
            <p className="mt-4 text-sm text-danger font-medium">
              {authError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
