import { base44 } from '@/api/base44Client';

export async function startOrGetConversation(currentUserEmail, targetUserEmail) {
  if (!currentUserEmail || !targetUserEmail || currentUserEmail === targetUserEmail) {
    return null;
  }

  // Find existing conversation
  const convs = await base44.entities.Conversation.list('-updated_date', 100);
  const existing = convs.find(c =>
    c.participants?.includes(currentUserEmail) && c.participants?.includes(targetUserEmail)
  );

  if (existing) {
    return existing.id;
  }

  // Create new conversation if none exists
  const newConv = await base44.entities.Conversation.create({
    participants: [currentUserEmail, targetUserEmail],
    last_message: 'Started a conversation',
    last_message_time: new Date().toISOString(),
  });

  return newConv.id;
}
