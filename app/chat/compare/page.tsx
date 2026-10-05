'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatCompareRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat?tab=compare');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
      Redirecting to Report Evolution & Audit Chatbot...
    </div>
  );
}
