/**
 * File List Component
 * 
 * Displays list of uploaded PDF files with download and delete actions
 */

'use client';

import { useState } from 'react';
import { FileText, Download, Trash2, Loader2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { deleteFile, getSignedFileUrl } from '@/lib/actions/files';
import type { Database } from '@/types/database';

type FileRow = Database['public']['Tables']['files']['Row'];

interface FileListProps {
  files: FileRow[];
  onFileDeleted?: () => void;
  onFileView?: (file: FileRow) => void;
}

export function FileList({ files, onFileDeleted, onFileView }: FileListProps) {
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileRow | null>(null);

  const handleDownload = async (file: FileRow) => {
    setDownloadingFileId(file.id);
    try {
      const result = await getSignedFileUrl(file.file_url);

      if (result.success && result.data) {
        // Open in new tab
        window.open(result.data, '_blank');
        toast.success('Opening file...');
      } else {
        toast.error(result.error || 'Failed to download file');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeletingFileId(fileToDelete.id);
    try {
      const result = await deleteFile({
        fileId: fileToDelete.id,
        storagePath: fileToDelete.file_url,
      });

      if (result.success) {
        toast.success('File deleted successfully');
        onFileDeleted?.();
        setFileToDelete(null);
      } else {
        toast.error(result.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeletingFileId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (files.length === 0) {
    return null; // EmptyState is handled by FileListWrapper
  }

  return (
    <>
      <div className="space-y-3">
        {files.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: 'easeOut',
            }}
            whileHover={{ scale: 1.01 }}
            className="bg-panel rounded-xl p-5 border border-border hover:border-accent/50 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-accent/10 flex-shrink-0 mt-0.5">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Uploaded {formatDate(file.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onFileView?.(file)}
                  disabled={deletingFileId === file.id}
                  title="View PDF"
                  aria-label={`View ${file.file_name}`}
                  className="gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingFileId === file.id || deletingFileId === file.id}
                  title="Download file"
                  aria-label={`Download ${file.file_name}`}
                >
                  {downloadingFileId === file.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFileToDelete(file)}
                  disabled={deletingFileId === file.id || downloadingFileId === file.id}
                  title="Delete file"
                  aria-label={`Delete ${file.file_name}`}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deletingFileId === file.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete File"
        description={`Are you sure you want to delete "${fileToDelete?.file_name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={!!deletingFileId}
      />
    </>
  );
}


