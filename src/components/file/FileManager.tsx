/**
 * File Manager Component
 * 
 * Client component that manages file upload and list with automatic refresh
 */

'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { getChapterFiles } from '@/lib/actions/files';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/types/database';

type FileRow = Database['public']['Tables']['files']['Row'];

interface FileManagerProps {
  chapterId: string;
  onFileView?: (file: FileRow) => void;
}

export function FileManager({ chapterId, onFileView }: FileManagerProps) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFiles = async () => {
    setIsLoading(true);
    const result = await getChapterFiles(chapterId);
    if (result.success && result.data) {
      setFiles(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      setIsLoading(true);
      const result = await getChapterFiles(chapterId);
      if (mounted && result.success && result.data) {
        setFiles(result.data);
      }
      if (mounted) {
        setIsLoading(false);
      }
    };
    
    load();
    
    return () => {
      mounted = false;
    };
  }, [chapterId]);

  const handleFileUploaded = () => {
    // Refresh file list after upload
    loadFiles();
  };

  const handleFileDeleted = () => {
    // Refresh file list after deletion
    loadFiles();
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        // Show loading skeletons
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : files.length > 0 ? (
        // Show file list (hide upload area)
        <FileList files={files} onFileDeleted={handleFileDeleted} onFileView={onFileView} />
      ) : (
        // Show upload area when no files
        <FileUpload chapterId={chapterId} onUploadSuccess={handleFileUploaded} />
      )}
    </div>
  );
}

