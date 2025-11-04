/**
 * ChatPanel Component
 * 
 * A toggleable chat panel that slides in/out from the right side.
 * Fills the screen from top to bottom with slide animations.
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from './ChatInterface';

interface ChatPanelProps {
  chapterId: string;
}

export function ChatPanel({ chapterId }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Toggle Button - Fixed position */}
      <motion.div
        className="fixed top-1/2 -translate-y-1/2 z-50"
        animate={{
          right: isOpen ? '600px' : '0px',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-20 rounded-l-2xl rounded-r-none shadow-lg bg-accent hover:bg-accent/90 text-white border-r-0"
        >
          {isOpen ? (
            <ChevronRight className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 mr-2" />
              <span className="font-semibold">Chat</span>
            </>
          )}
        </Button>
      </motion.div>

      {/* Chat Panel - Slides in/out from the right */}
      <motion.div
        className="fixed top-0 right-0 h-screen w-[600px] bg-panel border-l border-border shadow-2xl z-40"
        initial={{ x: '100%' }}
        animate={{
          x: isOpen ? 0 : '100%',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-panel/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <MessageSquare className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  Chat
                </h2>
                <p className="text-xs text-text-secondary">
                  Ask questions about your materials
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Chat Interface - Takes up remaining space */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface chapterId={chapterId} fullHeight />
          </div>
        </div>
      </motion.div>
    </>
  );
}


