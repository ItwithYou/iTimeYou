import { firebaseClient } from '@/api/firebaseClient';

export async function startOrGetConversation(currentUserEmail, targetUserEmail) {
  if (!currentUserEmail || !targetUserEmail || currentUserEmail === targetUserEmail) {
    return null;
  }

  // Find existing conversation
  const convs = await firebaseClient.entities.Conversation.list('-updated_date', 100);
  const existing = convs.find(c =>
    c.participants?.includes(currentUserEmail) && c.participants?.includes(targetUserEmail)
  );

  if (existing) {
    return existing.id;
  }

  // Create new conversation if none exists
  const newConv = await firebaseClient.entities.Conversation.create({
    participants: [currentUserEmail, targetUserEmail],
    last_message: 'Started a conversation',
    last_message_time: new Date().toISOString(),
  });

  return newConv.id;
}
