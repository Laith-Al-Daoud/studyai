/**
 * Chapter Detail Page
 * 
 * Shows files and chat interface for a chapter.
 */

import { ChapterPageClient } from '@/components/chapter/ChapterPageClient';
import { notFound } from 'next/navigation';
import { getChapterById } from '@/lib/actions/chapters';

interface ChapterPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { id } = await params;
  
  // Fetch chapter details
  const result = await getChapterById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const chapter = result.data;

  return <ChapterPageClient chapter={chapter} />;
}

