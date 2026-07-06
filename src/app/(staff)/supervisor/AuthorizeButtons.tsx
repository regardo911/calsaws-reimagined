'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authorizeAction } from '@/app/actions/case-actions';

export default function AuthorizeButtons({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(approve: boolean) {
    setBusy(true);
    await authorizeAction(caseId, approve);
    router.refresh();
  }
  return (
    <>
      <button className="btn" disabled={busy} onClick={() => act(true)} data-testid="authorize-approve">
        Authorize — issue NOA & benefits
      </button>
      <button className="btn ghost" disabled={busy} onClick={() => act(false)} data-testid="authorize-return">
        Return to worker
      </button>
    </>
  );
}
