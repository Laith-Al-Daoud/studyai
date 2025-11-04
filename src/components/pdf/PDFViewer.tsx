/**
 * PDFViewer Component
 * 
 * Full-screen PDF viewer with zoom controls and page navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Configure PDF.js worker - use local worker from public directory
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
}

export function PDFViewer({ fileUrl, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure component only renders on client
  useEffect(() => {
    setIsMounted(true);
    
    return () => {
      // Clean up when component unmounts
      setIsMounted(false);
    };
  }, []);

  // Reset state when fileUrl changes
  useEffect(() => {
    setNumPages(0);
    setPageNumber(1);
    setIsLoading(true);
    setError(null);
  }, [fileUrl]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
    setIsLoading(false);
    setError('Failed to load PDF. Please try refreshing the page.');
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-text-secondary">Loading PDF viewer...</p>
        </div>
      </div>
    );
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* PDF Controls Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary truncate max-w-md">
              {fileName}
            </h3>
            <p className="text-xs text-text-secondary">
              {isLoading ? 'Loading...' : `Page ${pageNumber} of ${numPages}`}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-text-secondary px-2 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 2.0}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Document Area */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-6">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="shadow-2xl"
          >
            {isLoading && (
              <div className="flex items-center justify-center h-[600px] bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <p className="text-text-secondary">Loading PDF...</p>
                </div>
              </div>
            )}
            {error ? (
              <div className="flex items-center justify-center h-[600px] bg-white dark:bg-gray-800 rounded-lg p-8">
                <div className="text-center">
                  <p className="text-destructive font-semibold mb-2">Failed to load PDF</p>
                  <p className="text-text-secondary text-sm">{error}</p>
                </div>
              </div>
            ) : (
              <Document
                key={fileUrl}
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
                error={
                  <div className="flex items-center justify-center h-[600px] bg-white dark:bg-gray-800 rounded-lg p-8">
                    <div className="text-center">
                      <p className="text-destructive font-semibold mb-2">Failed to load PDF</p>
                      <p className="text-text-secondary text-sm">Please try refreshing the page</p>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading={null}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

