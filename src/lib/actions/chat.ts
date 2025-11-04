/**
 * Chat Server Actions
 * 
 * Handles chat message creation, retrieval, and LLM response updates.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createMessageSchema, updateMessageResponseSchema } from '@/lib/validations/chat';
import type { CreateMessageInput, UpdateMessageResponseInput } from '@/lib/validations/chat';
import type { Json } from '@/types/database';

/**
 * Creates a new chat message
 * 
 * @param input - The message data
 * @returns Success/error result
 */
export async function createMessage(input: CreateMessageInput) {
  try {
    // Validate input
    const validated = createMessageSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify user has access to the chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, subject_id, subjects!inner(user_id)')
      .eq('id', validated.chapter_id)
      .single();

    if (chapterError || !chapter) {
      return {
        success: false,
        error: 'Chapter not found',
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((chapter.subjects as any).user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized access to chapter',
      };
    }

    // Create the chat message with response = NULL
    const { data: chatMessage, error: insertError } = await supabase
      .from('chats')
      .insert({
        chapter_id: validated.chapter_id,
        user_id: user.id,
        message: validated.message,
        response: null,
        meta: {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating chat message:', insertError);
      return {
        success: false,
        error: 'Failed to create message',
      };
    }

    // Get all files for this chapter to provide context
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, file_name, file_url')
      .eq('chapter_id', validated.chapter_id);

    if (filesError) {
      console.error('Error fetching files:', filesError);
    }

    // Get previous chat messages for conversation history (last 10 messages)
    const { data: previousMessages, error: historyError } = await supabase
      .from('chats')
      .select('message, response, created_at')
      .eq('chapter_id', validated.chapter_id)
      .not('response', 'is', null) // Only include messages with responses
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('Error fetching chat history:', historyError);
    }

    // Get user's session token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    // Trigger the chat webhook Edge Function (fire and forget)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat-webhook`;
    
    if (session?.access_token) {
      fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          chat_id: chatMessage.id,
          user_id: user.id,
          chapter_id: validated.chapter_id,
          message: validated.message,
          files: files || [],
          history: previousMessages || [],
        }),
      }).catch((err) => {
        console.error('Error calling chat webhook:', err);
      });
    } else {
      console.warn('No session token available for edge function call');
    }

    return {
      success: true,
      data: chatMessage,
    };

  } catch (error) {
    console.error('Error in createMessage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Gets all chat messages for a chapter
 * 
 * @param chapterId - The chapter ID
 * @returns Success/error result with messages
 */
export async function getMessages(chapterId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify user has access to the chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, subject_id, subjects!inner(user_id)')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      return {
        success: false,
        error: 'Chapter not found',
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((chapter.subjects as any).user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized access to chapter',
      };
    }

    // Fetch all messages for this chapter
    const { data: messages, error: messagesError } = await supabase
      .from('chats')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return {
        success: false,
        error: 'Failed to fetch messages',
      };
    }

    return {
      success: true,
      data: messages || [],
    };

  } catch (error) {
    console.error('Error in getMessages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Updates a chat message with the LLM response
 * (Called by the Edge Function after receiving response from n8n)
 * 
 * @param input - The response data
 * @returns Success/error result
 */
export async function updateMessageResponse(input: UpdateMessageResponseInput) {
  try {
    // Validate input
    const validated = updateMessageResponseSchema.parse(input);

    const supabase = await createClient();

    // Update the chat message with the response
    const { data, error } = await supabase
      .from('chats')
      .update({
        response: validated.response,
        meta: (validated.meta || {}) as Json,
      })
      .eq('id', validated.chat_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating message response:', error);
      return {
        success: false,
        error: 'Failed to update message response',
      };
    }

    return {
      success: true,
      data,
    };

  } catch (error) {
    console.error('Error in updateMessageResponse:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Deletes all chat messages for a chapter
 * 
 * @param chapterId - The chapter ID
 * @returns Success/error result
 */
export async function deleteChapterMessages(chapterId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify user has access to the chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, subject_id, subjects!inner(user_id)')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      return {
        success: false,
        error: 'Chapter not found',
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((chapter.subjects as any).user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized access to chapter',
      };
    }

    // Delete all messages for this chapter
    const { error: deleteError } = await supabase
      .from('chats')
      .delete()
      .eq('chapter_id', chapterId);

    if (deleteError) {
      console.error('Error deleting messages:', deleteError);
      return {
        success: false,
        error: 'Failed to delete messages',
      };
    }

    return {
      success: true,
      message: 'Conversation deleted successfully',
    };

  } catch (error) {
    console.error('Error in deleteChapterMessages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

