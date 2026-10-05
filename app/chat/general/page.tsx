'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatGeneralRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat?tab=general');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
      Redirecting to General Multi-Agent Research Chatbot...
    </div>
  );
}
