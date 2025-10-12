"use client";

import { useEffect } from 'react';

export default function BodyWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle browser extension attributes that cause hydration mismatches
    const handleExtensionAttributes = () => {
      const body = document.body;
      
      // Remove Grammarly attributes that cause hydration issues
      if (body.hasAttribute('data-new-gr-c-s-check-loaded')) {
        body.removeAttribute('data-new-gr-c-s-check-loaded');
      }
      if (body.hasAttribute('data-gr-ext-installed')) {
        body.removeAttribute('data-gr-ext-installed');
      }
      
      // Remove other common extension attributes
      const extensionAttributes = [
        'data-grammarly-shadow-root',
        'data-grammarly-ignore',
        'data-grammarly-disabled',
        'data-grammarly-original-styles',
        'data-grammarly-original-attributes'
      ];
      
      extensionAttributes.forEach(attr => {
        if (body.hasAttribute(attr)) {
          body.removeAttribute(attr);
        }
      });
    };

    // Run immediately and on DOM changes
    handleExtensionAttributes();
    
    // Set up a MutationObserver to handle dynamic changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.body) {
          handleExtensionAttributes();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'data-grammarly-shadow-root',
        'data-grammarly-ignore',
        'data-grammarly-disabled',
        'data-grammarly-original-styles',
        'data-grammarly-original-attributes'
      ]
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
