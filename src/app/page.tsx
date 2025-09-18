"use client";
import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import SignInForm from '@/components/auth/SignInForm';
import GridShape from '@/components/common/GridShape';

import Image from 'next/image';
import Link from 'next/link';

export default function Root() {
  const router = useRouter();
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const hasSession = document.cookie.includes('auth_session=');
        if (hasSession) {
          router.replace('/dashboard');
        }
      }
    } catch {}
  }, [router]);
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm />
        </Suspense>
        <div className="lg:w-1/2 w-full h-full bg-gray-900 dark:bg-gray-800 lg:grid items-center hidden">
          <div className="relative items-center justify-center  flex z-1">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link href="/" className="block mb-4">
                <Image
                  width={231}
                  height={48}
                  src="./images/logo/defence-cart-logo.svg"
                  alt="Defence Cart Logo"
                />
              </Link>
              <p className="text-center text-gray-300 dark:text-gray-200">
                India's Premier Defence Marketplace - Strategic • Secure • Seamless
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


