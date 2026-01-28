'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Login redirect page
 * 
 * This page handles redirects from AuthGuard to the actual login page.
 * It preserves the `next` parameter so users can be redirected back to their
 * intended destination after authentication.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the `next` parameter if it exists
    const nextParam = searchParams.get('next');
    
    // Redirect to the actual auth page
    // If there's a `next` parameter, pass it along so the auth page can handle it
    if (nextParam) {
      router.replace(`/authPage?next=${encodeURIComponent(nextParam)}`);
    } else {
      router.replace('/authPage');
    }
  }, [router, searchParams]);

  // Show a brief loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="mt-4 text-white text-lg">Redirecting to login...</p>
      </div>
    </div>
  );
}

