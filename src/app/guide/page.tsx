import { redirect } from 'next/navigation';

// /guide → first tab. Server component, no DB.
export default function GuideIndex() {
  redirect('/guide/introduction');
}
