import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../lib/AppContext';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle } from 'lucide-react';
import moment from 'moment';

export default function Messages() {
  const { currentUser, t, lang } = useAppContext();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    base44.entities.Conversation.list('-updated_date', 30).then(async convs => {
      const myConvs = convs.filter(c => c.participants?.includes(currentUser.email));
      setConversations(myConvs);
      const allEmails = [...new Set(myConvs.flatMap(c => c.participants || []))];
      const allProfiles = await base44.entities.UserProfile.list('-created_date', 100);
      const map = {};
      allProfiles.forEach(p => { map[p.user_email] = p; });
      setProfiles(map);

      // Auto-open conversation from URL param
      const params = new URLSearchParams(window.location.search);
      const convId = params.get('conv');
      if (convId) {
        const target = myConvs.find(c => c.id === convId);
        if (target) openConversation(target);
      }
    });
  }, [currentUser]);

  const openConversation = async (conv) => {
    setActiveConv(conv);
    const msgs = await base44.entities.Message.filter({ conversation_id: conv.id }, 'created_date', 50);
    setMessages(msgs);
  };

  // Real-time message subscription
  const activeConvRef = useRef(null);
  activeConvRef.current = activeConv;
  useEffect(() => {
    const unsub = base44.entities.Message.subscribe((event) => {
      if (!activeConvRef.current) return;
      if (event.data?.conversation_id !== activeConvRef.current.id) return;
      if (event.type === 'create') {
        setMessages(prev => [...prev, event.data]);
      }
    });
    return unsub;
  }, []);

  // Real-time conversation subscription
  useEffect(() => {
    const unsub = base44.entities.Conversation.subscribe((event) => {
      if (event.type === 'update') {
        setConversations(prev => prev.map(c => c.id === event.id ? { ...c, ...event.data } : c));
      }
    });
    return unsub;
  }, []);

  const goToProfile = (email) => {
    const p = profiles[email];
    if (p?.id) navigate(`/profile/${p.id}`);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv) return;
    await base44.entities.Message.create({
      conversation_id: activeConv.id,
      sender_email: currentUser.email,
      text: newMessage,
    });
    await base44.entities.Conversation.update(activeConv.id, {
      last_message: newMessage,
      last_message_time: new Date().toISOString(),
    });
    setNewMessage('');
  };

  const getOtherParticipant = (conv) => {
    const otherEmail = (conv.participants || []).find(e => e !== currentUser?.email);
    return profiles[otherEmail] || { first_name: 'User', last_name: '' };
  };

  return (
    <div className="flex h-[calc(100vh-64px)] relative">
      {/* Conversation list */}
      <div className={`${activeConv ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-border bg-card overflow-y-auto flex-shrink-0`}>
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">{t.messages}</h2>
        </div>
        {conversations.length > 0 ? (
          conversations.map(conv => {
            const other = getOtherParticipant(conv);
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => openConversation(conv)}
                className={`flex items-center gap-3 px-4 py-3.5 w-full text-left border-b border-border/50 transition-colors ${
                  activeConv?.id === conv.id ? 'bg-muted' : 'active:bg-muted/50'
                }`}
              >
                <img
                  src={other.photo_url || other.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other.user_email || 'user'}`}
                  alt=""
                  onClick={(e) => { e.stopPropagation(); goToProfile(other.user_email); }}
                  className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold">{other.first_name} {other.last_name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{conv.last_message || '...'}</p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            💬 {t.noMessages}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={`${activeConv ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-muted/30`}>
        {activeConv ? (
          <>
            <div className="flex items-center gap-3 px-5 py-3 bg-card border-b border-border">
              <button onClick={() => setActiveConv(null)} className="md:hidden mr-1 text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center">
                ←
              </button>
              {(() => {
                const other = getOtherParticipant(activeConv);
                return (
                  <>
                    <img
                      src={other.photo_url || other.avatar_url || ''}
                      alt=""
                      onClick={() => goToProfile(other.user_email)}
                      className="w-9 h-9 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
                    />
                    <button onClick={() => goToProfile(other.user_email)} className="font-semibold text-sm hover:text-primary transition-colors">{other.first_name} {other.last_name}</button>
                  </>
                );
              })()}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_email === currentUser.email ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                    msg.sender_email === currentUser.email
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-card rounded-bl-sm'
                  }`}>
                    <p>{msg.text}</p>
                    <span className="text-xs opacity-60 mt-1 block">{moment(msg.created_date).format('h:mm A')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-4 bg-card border-t border-border">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={t.typeMessage}
                className="flex-1 border border-border rounded-full px-4 py-2.5 text-base outline-none focus:border-primary"
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={sendMessage}
                className="w-11 h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center active:opacity-80 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
            <MessageCircle size={40} className="mb-3 opacity-30" />
            <h3 className="font-semibold mb-2">{lang === 'lo' ? 'ເລືອກການສົນທະນາ' : 'Select a conversation'}</h3>
            <p className="text-sm text-center mb-4">{lang === 'lo' ? 'ເລືອກຈາກລາຍການດ້ານຊ້າຍ ຫຼື ສົ່ງຂໍ້ຄວາມຫາ admin' : 'Choose from the list on the left or message an admin'}</p>
          </div>
        )}
      </div>
    </div>
  );
}