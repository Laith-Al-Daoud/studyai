/**
 * MessageBubble Component
 * 
 * Displays a single chat message (user or assistant).
 */

'use client';

import { User, Bot, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: string;
  response: string | null;
  createdAt: string;
  isLoading?: boolean;
}

export function MessageBubble({ message, response, createdAt, isLoading }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-3">
      {/* User Message - Always show on right */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex gap-3 justify-end"
      >
        <div className="max-w-[75%] space-y-1 flex flex-col items-end">
          <div className="rounded-2xl px-4 py-2.5 break-words bg-accent text-white rounded-br-sm">
            <p className="text-sm whitespace-pre-wrap text-white">
              {message}
            </p>
          </div>
          <span className="text-xs text-text-secondary px-1">
            {formatTime(createdAt)}
          </span>
        </div>

        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          <User className="w-4 h-4 text-accent" />
        </div>
      </motion.div>

      {/* Assistant Response - Always show on left if exists or loading */}
      {(isLoading || response) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex gap-3 justify-start"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          
          <div className="max-w-[75%] space-y-1">
            {isLoading && !response ? (
              // Loading state
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-panel border border-border">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            ) : response ? (
              // Response received
              <>
                <div className="rounded-2xl rounded-bl-sm px-4 py-2.5 bg-panel border border-border">
                  <p className="text-sm text-text-primary whitespace-pre-wrap">
                    {response}
                  </p>
                </div>
                <span className="text-xs text-text-secondary px-1">
                  {formatTime(createdAt)}
                </span>
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </div>
  );
}

