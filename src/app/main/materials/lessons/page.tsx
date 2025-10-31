'use client';

import dynamic from 'next/dynamic';

const LessonsLayout = dynamic(() => import('@/components/Materials/Lesson'), { ssr: false });

export default function LessonsPage() {
  return <LessonsLayout />;
}
