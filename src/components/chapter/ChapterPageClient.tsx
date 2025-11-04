/**
 * ChapterPageClient Component
 * 
 * Client-side chapter page that handles PDF viewing mode
 */

'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, BookOpen, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileManager } from '@/components/file/FileManager';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { PomodoroTimer } from '@/components/common/PomodoroTimer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { deleteFile, getChapterFiles, getSignedFileUrl } from '@/lib/actions/files';
import { toast } from 'sonner';
import type { Chapter } from '@/types/models';
import type { Database } from '@/types/database';

// Dynamically import PDFViewer to avoid SSR issues with DOMMatrix
const PDFViewer = dynamic(
  () => import('@/components/pdf/PDFViewer').then(mod => ({ default: mod.PDFViewer })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-text-secondary">Loading PDF viewer...</p>
        </div>
      </div>
    )
  }
);

type FileRow = Database['public']['Tables']['files']['Row'];

interface ChapterPageClientProps {
  chapter: Chapter;
}

export function ChapterPageClient({ chapter }: ChapterPageClientProps) {
  const [viewingFile, setViewingFile] = useState<FileRow | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load PDF URL when a file is selected for viewing
  useEffect(() => {
    async function loadPdfUrl() {
      if (viewingFile) {
        const result = await getSignedFileUrl(viewingFile.file_url);
        if (result.success && result.data) {
          setPdfUrl(result.data);
        } else {
          toast.error('Failed to load PDF');
          setViewingFile(null);
        }
      } else {
        setPdfUrl(null);
      }
    }

    loadPdfUrl();
  }, [viewingFile]);

  // Function to handle file viewing from FileManager
  const handleFileView = (file: FileRow) => {
    setViewingFile(file);
  };

  // Function to handle file deletion
  const handleDeleteFile = async () => {
    if (!viewingFile) return;

    setIsDeletingFile(true);
    try {
      const result = await deleteFile({
        fileId: viewingFile.id,
        storagePath: viewingFile.file_url,
      });

      if (result.success) {
        toast.success('File deleted successfully');
        setViewingFile(null);
        setPdfUrl(null);
        setShowDeleteConfirm(false);
        
        // Trigger a refresh of the file list by toggling state
        // This will be handled by FileManager's realtime subscription
      } else {
        toast.error(result.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    } finally {
      setIsDeletingFile(false);
    }
  };

  // Listen for file view requests from FileManager
  useEffect(() => {
    const handleFileViewEvent = (event: CustomEvent<FileRow>) => {
      handleFileView(event.detail);
    };

    window.addEventListener('viewFile' as any, handleFileViewEvent);
    
    return () => {
      window.removeEventListener('viewFile' as any, handleFileViewEvent);
    };
  }, []);

  // Check if there are files and auto-load the first one
  useEffect(() => {
    async function autoLoadFirstFile() {
      if (!viewingFile) {
        const filesResult = await getChapterFiles(chapter.id);
        if (filesResult.success && filesResult.data && filesResult.data.length > 0) {
          // Don't auto-load, let user click to view
          // setViewingFile(filesResult.data[0]);
        }
      }
    }
    
    autoLoadFirstFile();
  }, [chapter.id, viewingFile]);

  return (
    <div className="min-h-screen pb-24">
      {!viewingFile ? (
        // Normal view - show file management
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {/* Header with breadcrumb */}
          <div className="space-y-6">
            <Link href={`/subject/${chapter.subject_id}`}>
              <Button variant="outline" size="sm" className="gap-2 -ml-1">
                <ChevronLeft className="w-4 h-4" />
                Back to Subject
              </Button>
            </Link>

            <div className="flex items-start gap-5">
              <div className="p-4 rounded-2xl bg-accent/10 flex-shrink-0 shadow-sm">
                <BookOpen className="w-7 h-7 text-accent" />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2.5">
                  {chapter.title}
                </h1>
                <p className="text-base text-text-secondary leading-relaxed">
                  Manage files and chat with your study materials
                </p>
              </div>
            </div>
          </div>

          {/* Main content - Files Section */}
          <div className="space-y-6 max-w-5xl">
            <div className="pb-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2.5">
                Files
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Upload PDF lecture materials
              </p>
            </div>

            {/* File Upload and List */}
            <FileManager chapterId={chapter.id} onFileView={handleFileView} />
          </div>
        </div>
      ) : (
        // PDF Viewing mode - show PDF viewer
        <div className="h-screen flex flex-col">
          {pdfUrl && (
            <PDFViewer 
              fileUrl={pdfUrl} 
              fileName={viewingFile.file_name}
            />
          )}
        </div>
      )}

      {/* Pomodoro Timer - Fixed position in bottom left */}
      <div className="fixed left-6 z-30 flex items-center gap-3" style={{ bottom: viewingFile ? 'calc(1.5rem + 200px)' : '1.5rem' }}>
        <PomodoroTimer />
        
        {/* Delete File Button - Show when viewing PDF */}
        {viewingFile && (
          <Button
            variant="destructive"
            size="lg"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeletingFile}
            className="shadow-lg"
          >
            {isDeletingFile ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-5 h-5 mr-2" />
                Close & Delete PDF
              </>
            )}
          </Button>
        )}
      </div>

      {/* Chat Panel - Fixed position on the right with slide animation */}
      <ChatPanel chapterId={chapter.id} />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteFile}
        title="Delete File"
        description={`Are you sure you want to delete "${viewingFile?.file_name}"? This will close the PDF viewer and return to the file list.`}
        confirmText="Delete"
        isLoading={isDeletingFile}
      />
    </div>
  );
}

