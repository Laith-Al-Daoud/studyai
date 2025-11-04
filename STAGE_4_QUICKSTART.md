# Stage 4 Quickstart - Chat Interface Testing Guide

**Estimated Time:** 15-20 minutes  
**Prerequisites:** Stage 3 complete, development server running

---

## 🎯 What You'll Test

In this quickstart, you'll test the complete chat interface functionality:

1. Chat message sending
2. Realtime updates
3. LLM responses (mock or n8n)
4. Auto-scroll behavior
5. Loading states
6. Empty states
7. Keyboard shortcuts

---

## 🚀 Quick Start

### Step 1: Start the Development Server

```bash
cd studai
npm run dev
```

Navigate to: `http://localhost:3000`

### Step 2: Log In and Navigate

1. Log in to your account
2. Click on any subject
3. Click on any chapter
4. You should see the chapter page with **Files** (left) and **Chat** (right)

---

## 📝 Test Scenarios

### Test 1: Empty State

**Goal:** Verify the empty state displays correctly

1. Open a chapter with no chat messages
2. Look at the Chat section on the right

**Expected:**
- ✅ See a message bubble icon
- ✅ See "Start a Conversation" heading
- ✅ See helpful description text
- ✅ Message input is visible at the bottom

**Screenshot Opportunity:** Empty state with centered message

---

### Test 2: Send First Message

**Goal:** Send a message and verify it appears

1. Click in the message input area
2. Type: "What is this chapter about?"
3. Press Enter (or click Send button)

**Expected:**
- ✅ Message appears immediately on the right side (blue bubble)
- ✅ User icon appears next to message
- ✅ Timestamp shows below message
- ✅ Empty state disappears
- ✅ Loading indicator appears ("Thinking...")
- ✅ After 1-2 seconds, mock response appears on the left

**Mock Response Should Say:**
```
I've received your question: "What is this chapter about?..."

Based on your uploaded materials (X files), I can help you 
understand this topic better.

Note: This is a mock response. Configure N8N_CHAT_WEBHOOK_URL 
environment variable to enable real LLM integration.
```

---

### Test 3: Send Multiple Messages

**Goal:** Test conversation flow

1. Send another message: "Can you summarize the key points?"
2. Wait for response
3. Send a third message: "Thanks!"

**Expected:**
- ✅ Each message appears immediately
- ✅ Messages stack vertically
- ✅ Auto-scroll to bottom on new messages
- ✅ Each message has a response
- ✅ Timestamps are accurate

---

### Test 4: Auto-Scroll Behavior

**Goal:** Verify auto-scroll works correctly

1. Send 5-6 messages to fill the chat area
2. Scroll up to view earlier messages
3. Send a new message

**Expected:**
- ✅ Chat scrolls smoothly to the bottom
- ✅ New message is visible
- ✅ Scroll animation is smooth (not instant)

---

### Test 5: Keyboard Shortcuts

**Goal:** Test keyboard interactions

1. Click in the message input
2. Type a message
3. Press `Enter` → **Should send**
4. Type another message
5. Press `Shift + Enter` → **Should create new line**
6. Press `Enter` again → **Should send**

**Expected:**
- ✅ Enter sends the message
- ✅ Shift+Enter creates new line
- ✅ Message clears after sending

---

### Test 6: Input Validation

**Goal:** Test input constraints

1. Try to click Send with empty input

**Expected:**
- ✅ Send button is disabled (grayed out)

2. Type a single space and try to send

**Expected:**
- ✅ Send button is still disabled

3. Type a very long message (copy-paste 5000 characters)

**Expected:**
- ✅ Validation error appears
- ✅ Message cannot be sent

---

### Test 7: Auto-Resize Textarea

**Goal:** Verify textarea grows with content

1. Click in the message input
2. Type a short message (1 line)
3. Press `Shift + Enter` multiple times to add lines
4. Keep typing

**Expected:**
- ✅ Textarea height increases as you type
- ✅ Maximum height is ~200px (then scrollbar appears)
- ✅ Textarea shrinks back after sending

---

### Test 8: Loading States

**Goal:** Test loading indicators

1. Send a message
2. Observe the UI immediately after sending

**Expected:**
- ✅ Send button shows spinner while sending
- ✅ Input is disabled during send
- ✅ "Thinking..." indicator appears below user message
- ✅ When response arrives, "Thinking..." is replaced with actual response

---

### Test 9: Realtime Updates (Two Browser Tabs)

**Goal:** Verify realtime synchronization

1. Open the same chapter in **two browser tabs**
2. In Tab 1, send a message
3. Look at Tab 2

**Expected:**
- ✅ Message appears in Tab 2 instantly
- ✅ Response appears in both tabs
- ✅ No page refresh needed

---

### Test 10: Message Persistence

**Goal:** Verify messages are saved

1. Send a few messages in the chat
2. Navigate away to the dashboard
3. Navigate back to the same chapter

**Expected:**
- ✅ All previous messages are still there
- ✅ Chat history loads quickly (< 500ms)
- ✅ No messages are lost

---

## 🎨 Visual Verification

### Message Appearance

**User Messages (Right Side):**
- Blue accent background
- White text
- Rounded corners (with small notch on bottom-right)
- User icon on the right
- Timestamp below

**Assistant Messages (Left Side):**
- Panel background (dark gray in dark mode)
- Border outline
- Rounded corners (with small notch on bottom-left)
- Bot icon on the left
- Timestamp below

### Animations

**Expected Animations:**
- ✅ Messages fade in when appearing
- ✅ Smooth slide-up animation
- ✅ Smooth auto-scroll
- ✅ Button hover effects
- ✅ Loading spinner rotation

---

## 🔧 Optional: n8n Integration Testing

If you want to test with a real LLM:

### Setup n8n Workflow

1. Create a new n8n workflow
2. Add a **Webhook** trigger node:
   - Method: POST
   - Path: `/chat`
3. Add an **OpenAI** node (or any LLM):
   - Model: gpt-3.5-turbo or gpt-4
   - Message: `{{ $json.message }}`
   - System prompt: "You are a helpful study assistant."
4. Add **Respond to Webhook** node:
   - Response body:
     ```json
     {
       "response": "{{ $json.choices[0].message.content }}",
       "meta": {
         "model": "{{ $json.model }}",
         "tokens": {{ $json.usage.total_tokens }}
       }
     }
     ```
5. Activate the workflow
6. Copy the webhook URL

### Configure Environment

1. Deploy the chat-webhook Edge Function:
   ```bash
   supabase functions deploy chat-webhook
   ```

2. Set the n8n webhook URL:
   ```bash
   supabase secrets set N8N_CHAT_WEBHOOK_URL=https://your-n8n.com/webhook/chat
   ```

3. Test again - you should now get real LLM responses!

---

## 🐛 Troubleshooting

### Issue: Messages not appearing

**Check:**
- Browser console for errors
- Network tab for failed requests
- Database: `SELECT * FROM chats WHERE chapter_id = 'your-chapter-id'`

**Solution:**
- Verify RLS policies are enabled
- Check user authentication status
- Ensure chapter exists

---

### Issue: No response received

**Check:**
- Edge Function logs in Supabase Dashboard
- n8n workflow execution logs

**Solution:**
- If N8N_CHAT_WEBHOOK_URL is not set, you should get mock response
- Check Edge Function deployment: `supabase functions list`
- Verify webhook URL is correct

---

### Issue: Realtime not working

**Check:**
- Browser console for WebSocket errors
- Supabase Realtime is enabled in project settings

**Solution:**
- Verify Realtime is enabled in Supabase Dashboard
- Check for CORS issues
- Try refreshing the page

---

### Issue: Input not auto-resizing

**Check:**
- Browser console for errors
- Try different browsers (Chrome, Firefox, Safari)

**Solution:**
- Clear browser cache
- Verify CSS is loading correctly

---

## ✅ Success Criteria

You've successfully tested Stage 4 if:

- [x] Empty state displays correctly
- [x] Messages send and appear immediately
- [x] Responses appear (mock or real LLM)
- [x] Auto-scroll works smoothly
- [x] Keyboard shortcuts function
- [x] Input validation prevents invalid messages
- [x] Textarea auto-resizes
- [x] Loading states show during operations
- [x] Realtime updates work across tabs
- [x] Messages persist on page reload

---

## 🎉 Stage 4 Testing Complete!

If all tests passed, congratulations! Your chat interface is fully functional and ready for production use.

### Next Steps:

1. **Deploy to production:**
   ```bash
   supabase functions deploy chat-webhook
   npm run build
   ```

2. **Set up real n8n workflow** (optional)

3. **Move to Stage 5:** Security hardening and final polish

---

## 📞 Need Help?

**Common Questions:**

**Q: How do I enable real LLM responses?**  
A: Follow the "Optional: n8n Integration Testing" section above.

**Q: Can I use a different LLM provider?**  
A: Yes! Configure your n8n workflow to use Anthropic, Hugging Face, or any other provider.

**Q: How many messages can I send?**  
A: No hard limit, but very long conversations may impact performance.

**Q: Can I delete messages?**  
A: Not in the current version. This could be added in a future update.

---

**Guide Version:** 1.0  
**Last Updated:** October 30, 2025  
**Stage:** 4 - Chat Interface & LLM Integration

