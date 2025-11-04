/**
 * FlashcardModal Component
 * 
 * Modal displaying flashcards with navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Flashcard } from './Flashcard';
import type { FlashcardRow } from '@/lib/actions/flashcards';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: FlashcardRow[];
}

export function FlashcardModal({ isOpen, onClose, flashcards }: FlashcardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset when closing for fresh start
      setCurrentIndex(0);
    }
  }, [isOpen]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === flashcards.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev === flashcards.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, flashcards.length]);

  if (flashcards.length === 0) {
    return null;
  }

  const currentFlashcard = flashcards[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[500px] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">
            Flashcards ({currentIndex + 1} / {flashcards.length})
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex items-center justify-between gap-4">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="flex-shrink-0"
            disabled={flashcards.length <= 1}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          {/* Flashcard */}
          <div className="flex-1 h-full">
            {currentFlashcard && (
              <Flashcard
                key={currentFlashcard.id}
                question={currentFlashcard.question}
                answer={currentFlashcard.answer}
              />
            )}
          </div>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="flex-shrink-0"
            disabled={flashcards.length <= 1}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-1 justify-center mt-4">
          {flashcards.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-accent'
                  : 'w-1 bg-border'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

