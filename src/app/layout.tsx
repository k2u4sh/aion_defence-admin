import { Outfit } from 'next/font/google';
import './globals.css';
import BodyWrapper from '@/components/BodyWrapper';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings for browser extensions
              if (typeof window !== 'undefined') {
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  const message = args[0];
                  if (typeof message === 'string' && 
                      (message.includes('Hydration failed') || 
                       message.includes('Text content does not match') ||
                       message.includes('data-new-gr-c-s-check-loaded') ||
                       message.includes('data-gr-ext-installed'))) {
                    return;
                  }
                  originalConsoleError.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body 
        className={`${outfit.className} dark:bg-gray-900`}
        suppressHydrationWarning={true}
      >
        <BodyWrapper>
          {children}
        </BodyWrapper>
      </body>
    </html>
  );
}
