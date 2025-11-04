/**
 * ChatInterface Component
 * 
 * Main chat interface with message history, realtime updates, and input.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { createMessage, getMessages, deleteChapterMessages } from '@/lib/actions/chat';
import { getChapterFlashcards } from '@/lib/actions/flashcards';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { MessageSquare, Loader2, Layers, Trash2 } from 'lucide-react';
import type { Chat } from '@/types/models';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FlashcardModal } from '@/components/flashcard/FlashcardModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { FlashcardRow } from '@/lib/actions/flashcards';

interface ChatInterfaceProps {
  chapterId: string;
  fullHeight?: boolean;
}

type ChatMessage = Chat;

export function ChatInterface({ chapterId, fullHeight = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardRow[]>([]);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const flashcardRefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages and flashcards
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // Load messages
      const messagesResult = await getMessages(chapterId);
      if (messagesResult.success && messagesResult.data) {
        setMessages(messagesResult.data);
      } else {
        toast.error(messagesResult.error || 'Failed to load messages');
      }

      // Load flashcards
      const flashcardsResult = await getChapterFlashcards(chapterId);
      if (flashcardsResult.success && flashcardsResult.data) {
        console.log('Loaded flashcards:', flashcardsResult.data.length);
        setFlashcards(flashcardsResult.data);
      } else {
        console.log('No flashcards found or error:', flashcardsResult.error);
      }
      
      setIsLoading(false);
    }

    loadData();
  }, [chapterId]);

  // Helper function to refetch flashcards with debounce
  const refetchFlashcards = () => {
    // Clear any existing timeout
    if (flashcardRefetchTimeoutRef.current) {
      clearTimeout(flashcardRefetchTimeoutRef.current);
    }

    // Set a new timeout to debounce multiple rapid changes
    flashcardRefetchTimeoutRef.current = setTimeout(async () => {
      console.log('Refetching flashcards...');
      const flashcardsResult = await getChapterFlashcards(chapterId);
      if (flashcardsResult.success && flashcardsResult.data) {
        console.log('Refetched flashcards:', flashcardsResult.data.length);
        setFlashcards(flashcardsResult.data);
      } else {
        setFlashcards([]);
      }
    }, 500); // Wait 500ms after last change before refetching
  };

  // Set up realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chapterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `chapter_id=eq.${chapterId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New message inserted
            const newMessage = payload.new as ChatMessage;
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.find(m => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          } else if (payload.eventType === 'UPDATE') {
            // Message updated (response received)
            const updatedMessage = payload.new as ChatMessage;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
            // Clear pending state if this was the pending message
            if (pendingMessageId === updatedMessage.id && updatedMessage.response) {
              setPendingMessageId(null);
            }
          } else if (payload.eventType === 'DELETE') {
            // Message deleted - remove from UI
            const deletedMessage = payload.old as ChatMessage;
            setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id));
            console.log('Chat message deleted:', deletedMessage.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flashcards',
          filter: `chapter_id=eq.${chapterId}`,
        },
        (payload) => {
          console.log('Flashcard change detected:', payload.eventType);
          // Use debounced refetch to handle bulk inserts efficiently
          refetchFlashcards();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'files',
          filter: `chapter_id=eq.${chapterId}`,
        },
        () => {
          console.log('File deleted, clearing messages and refetching flashcards');
          // Clear all messages when file is deleted (they're deleted in the backend)
          setMessages([]);
          // Immediately refetch flashcards
          refetchFlashcards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Clear timeout on unmount
      if (flashcardRefetchTimeoutRef.current) {
        clearTimeout(flashcardRefetchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, supabase, pendingMessageId]);

  // Handle sending new messages
  const handleSendMessage = async (message: string) => {
    const result = await createMessage({
      chapter_id: chapterId,
      message,
    });

    if (result.success && result.data) {
      // Add message optimistically (don't wait for Realtime)
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find(m => m.id === result.data!.id)) {
          return prev;
        }
        return [...prev, result.data!];
      });
      
      // Set the pending message ID to show loading state
      setPendingMessageId(result.data.id);
      toast.success('Message sent');
    } else {
      toast.error(result.error || 'Failed to send message');
    }
  };

  // Handle deleting all chat messages
  const handleDeleteConversation = async () => {
    setIsDeleting(true);
    const result = await deleteChapterMessages(chapterId);
    
    if (result.success) {
      setMessages([]);
      toast.success('Conversation deleted successfully');
      setIsDeleteDialogOpen(false);
    } else {
      toast.error(result.error || 'Failed to delete conversation');
    }
    setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col bg-panel ${fullHeight ? 'h-full' : 'h-[650px] rounded-2xl border border-border shadow-sm'}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-text-secondary">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-panel overflow-hidden ${fullHeight ? 'h-full' : 'h-[650px] rounded-2xl border border-border shadow-sm'}`}>
      {/* Header with Flashcards and Delete Conversation Buttons */}
      <div className="flex items-center justify-end gap-2 px-5 py-3 border-b border-border bg-panel/50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={messages.length === 0}
          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <Trash2 className="w-4 h-4" />
          Delete Conversation
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('Flashcards button clicked. Count:', flashcards.length);
            setIsFlashcardModalOpen(true);
          }}
          disabled={flashcards.length === 0}
          className="gap-2"
        >
          <Layers className="w-4 h-4" />
          Flashcards {flashcards.length > 0 && `(${flashcards.length})`}
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-full text-center px-4"
          >
            <div className="p-4 rounded-full bg-accent/10 mb-4">
              <MessageSquare className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Start a Conversation
            </h3>
            <p className="text-text-secondary max-w-sm">
              Ask questions about your study materials. The AI assistant will help you understand the content.
            </p>
          </motion.div>
        ) : (
          // Message list
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg.message}
                response={msg.response}
                createdAt={msg.created_at}
                isLoading={msg.id === pendingMessageId && !msg.response}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <MessageInput onSend={handleSendMessage} />

      {/* Flashcard Modal */}
      <FlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        flashcards={flashcards}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConversation}
        title="Delete Conversation"
        description="Are you sure you want to delete this entire conversation? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}

