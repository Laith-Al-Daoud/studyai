/**
 * File List Wrapper Component
 * 
 * Client component wrapper for file list with refresh capability
 */

'use client';

import { useEffect, useState } from 'react';
import { FileList } from './FileList';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/common/LoadingSkeleton';
import { getChapterFiles } from '@/lib/actions/files';
import { FileUp } from 'lucide-react';
import type { Database } from '@/types/database';

type FileRow = Database['public']['Tables']['files']['Row'];

interface FileListWrapperProps {
  chapterId: string;
}

export function FileListWrapper({ chapterId }: FileListWrapperProps) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFiles = async () => {
      setIsLoading(true);
      const result = await getChapterFiles(chapterId);
      if (isMounted && result.success && result.data) {
        setFiles(result.data);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadFiles();

    return () => {
      isMounted = false;
    };
  }, [chapterId]);

  const handleFileDeleted = () => {
    // Refetch files after deletion
    const refetch = async () => {
      const result = await getChapterFiles(chapterId);
      if (result.success && result.data) {
        setFiles(result.data);
      }
    };
    refetch();
  };

  if (isLoading) {
    return <ListSkeleton count={3} />;
  }

  if (files.length === 0) {
    return (
      <EmptyState
        icon={FileUp}
        title="No files uploaded"
        description="Upload PDF files to start analyzing and chatting with your study materials."
      />
    );
  }

  return <FileList files={files} onFileDeleted={handleFileDeleted} />;
}

