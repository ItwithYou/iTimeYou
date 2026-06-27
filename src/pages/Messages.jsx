import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../lib/AppContext';
import { useNavigate } from 'react-router-dom';
import { firebaseClient } from '@/api/firebaseClient';
import { Send, MessageCircle, MapPin, ChevronLeft, Package, Clock, Navigation } from 'lucide-react';
import { formatTimestampDMY } from '../utils/dateUtils';

export default function Messages() {
  const { currentUser, t, lang } = useAppContext();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [profiles, setProfiles] = useState({});
  const [bookingCtx, setBookingCtx] = useState(null);
  const [sharingLoc, setSharingLoc] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    firebaseClient.entities.Conversation.list('-updated_date', 30).then(async convs => {
      const myConvs = convs.filter(c => c.participants?.includes(currentUser.email));
      const allProfiles = await firebaseClient.entities.UserProfile.list('-created_date', 100);
      const map = {};
      allProfiles.forEach(p => { map[p.user_email] = p; });
      setProfiles(map);

      // Only show user-to-user chats in the sidebar list (hide support chats with admin)
      const sidebarConvs = currentUser.role === 'admin' 
        ? myConvs 
        : myConvs.filter(c => {
            const otherEmail = (c.participants || []).find(e => e !== currentUser.email);
            return map[otherEmail]?.role !== 'admin';
          });
      setConversations(sidebarConvs);

      // Auto-open conversation from URL param
      const params = new URLSearchParams(window.location.search);
      const convId = params.get('conv');
      if (convId) {
        const target = myConvs.find(c => c.id === convId);
        if (target) openConversation(target);
      }
    });
  }, [currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (conv) => {
    setActiveConv(conv);
    // Parse booking context
    if (conv.booking_context) {
      try { setBookingCtx(JSON.parse(conv.booking_context)); } catch { setBookingCtx(null); }
    } else {
      setBookingCtx(null);
    }
    const msgs = await firebaseClient.entities.Message.filter({ conversation_id: conv.id }, 'created_date', 50);
    setMessages(msgs);
  };

  // Real-time message subscription
  const activeConvRef = useRef(null);
  activeConvRef.current = activeConv;
  useEffect(() => {
    const unsub = firebaseClient.entities.Message.subscribe((event) => {
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
    const unsub = firebaseClient.entities.Conversation.subscribe((event) => {
      if (event.type === 'update') {
        setConversations(prev => {
          const updated = prev.map(c => c.id === event.id ? { ...c, ...event.data } : c);
          return updated.sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
        });
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
    const text = newMessage;
    setNewMessage('');
    await firebaseClient.entities.Message.create({
      conversation_id: activeConv.id,
      sender_email: currentUser.email,
      text,
    });
    await firebaseClient.entities.Conversation.update(activeConv.id, {
      last_message: text,
      last_message_time: new Date().toISOString(),
    });
  };

  const shareLocation = async () => {
    if (!navigator.geolocation) {
      alert(lang === 'lo' ? 'ໂທລະສັບຂອງທ່ານບໍ່ຮອງຮັບ GPS' : 'Geolocation not supported');
      return;
    }
    setSharingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        const text = `📍 ${lang === 'lo' ? 'ສະຖານທີ່ຂອງຂ້ອຍ' : 'My location'}: ${mapsUrl}`;
        await firebaseClient.entities.Message.create({
          conversation_id: activeConv.id,
          sender_email: currentUser.email,
          text,
          msg_type: 'location',
        });
        await firebaseClient.entities.Conversation.update(activeConv.id, {
          last_message: lang === 'lo' ? '📍 ສ່ງສະຖານທີ່' : '📍 Location shared',
          last_message_time: new Date().toISOString(),
        });
        setSharingLoc(false);
      },
      () => {
        setSharingLoc(false);
        alert(lang === 'lo' ? 'ບໍ່ສາມາດຮັບ GPS ໄດ້' : 'Could not get location. Please allow GPS access.');
      },
      { timeout: 8000 }
    );
  };

  const getOtherParticipant = (conv) => {
    const otherEmail = (conv.participants || []).find(e => e !== currentUser?.email);
    return profiles[otherEmail] || { first_name: 'User', last_name: '', user_email: otherEmail };
  };

  const isLocationMsg = (text) => text?.includes('maps.google.com') || text?.includes('📍');

  return (
    <div className="flex h-[calc(100vh-64px)] relative">
      {/* ── Conversation list ── */}
      <div className={`${activeConv ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-border bg-card overflow-y-auto flex-shrink-0`}>
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">{t.messages}</h2>
        </div>
        {conversations.length > 0 ? (
          conversations.map(conv => {
            const other = getOtherParticipant(conv);
            const hasBooking = !!conv.booking_id;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => openConversation(conv)}
                className={`flex items-center gap-3 px-4 py-3.5 w-full text-left border-b border-border/50 transition-colors ${
                  activeConv?.id === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={other.photo_url || other.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other.user_email || 'user'}`}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  {hasBooking && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Package size={9} className="text-white" />
                    </span>
                  )}
                </div>
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

      {/* ── Chat area ── */}
      <div className={`${activeConv ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-muted/20`}>
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
              <button
                onClick={() => setActiveConv(null)}
                className="md:hidden p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              {(() => {
                const other = getOtherParticipant(activeConv);
                return (
                  <>
                    <img
                      src={other.photo_url || other.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other.user_email}`}
                      alt=""
                      onClick={() => goToProfile(other.user_email)}
                      className="w-9 h-9 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <button onClick={() => goToProfile(other.user_email)} className="font-semibold text-sm hover:text-primary transition-colors block">
                        {other.first_name} {other.last_name}
                      </button>
                      {bookingCtx && (
                        <p className="text-xs text-primary font-medium flex items-center gap-1">
                          <Package size={10} /> {lang === 'lo' ? 'ມີການຈອງ' : 'Has booking'}
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* ── Booking info card banner ── */}
            {bookingCtx && (
              <div className="mx-3 mt-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-deep-green/5 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border-b border-primary/10">
                  <Package size={13} className="text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">
                    {lang === 'lo' ? 'ລາຍການຈອງ' : 'Booking Details'}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{bookingCtx.service_emoji}</span>
                    <span className="font-bold text-sm">{bookingCtx.service_type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-primary">₭</span>
                      </span>
                      <span className="font-semibold text-foreground">{bookingCtx.price} {bookingCtx.currency}</span>
                    </div>
                    {bookingCtx.service_when && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-primary flex-shrink-0" />
                        <span className="truncate">{bookingCtx.service_when}</span>
                      </div>
                    )}
                    {bookingCtx.service_location && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin size={11} className="text-primary flex-shrink-0" />
                        {bookingCtx.service_location_map_url ? (
                          <a
                            href={bookingCtx.service_location_map_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline underline-offset-2 truncate"
                          >
                            {bookingCtx.service_location}
                          </a>
                        ) : (
                          <span className="truncate">{bookingCtx.service_location}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Customer info for provider */}
                  {bookingCtx.booker_email !== currentUser?.email && (
                    <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      👤 {lang === 'lo' ? 'ລູກຄ້າ' : 'Customer'}: <span className="font-semibold text-foreground">{bookingCtx.booker_name}</span>
                    </div>
                  )}
                </div>
                {/* Share location CTA for customer */}
                {bookingCtx.booker_email === currentUser?.email && (
                  <div className="px-4 pb-3">
                    <button
                      onClick={shareLocation}
                      disabled={sharingLoc}
                      className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-2 rounded-xl hover:bg-primary/15 transition-colors disabled:opacity-50 w-full justify-center"
                    >
                      <Navigation size={12} className={sharingLoc ? 'animate-pulse' : ''} />
                      {sharingLoc
                        ? (lang === 'lo' ? 'ກຳລັງຮັບ GPS...' : 'Getting GPS...')
                        : (lang === 'lo' ? '📍 ສົ່ງທີ່ຢູ່ຂອງຂ້ອຍໃຫ້ຜູ້ໃຫ້ບໍລິການ' : '📍 Share my location with provider')}
                    </button>
                  </div>
                )}
                {/* Request location CTA for provider */}
                {bookingCtx.booker_email !== currentUser?.email && (
                  <div className="px-4 pb-3">
                    <button
                      onClick={async () => {
                        await firebaseClient.entities.Message.create({
                          conversation_id: activeConv.id,
                          sender_email: currentUser.email,
                          text: lang === 'lo'
                            ? '📍 ກະລຸນາສົ່ງທີ່ຢູ່ຂອງທ່ານ ເພື່ອໃຫ້ຂ້ອຍສາມາດຮູ້ສະຖານທີ່ຂອງທ່ານ'
                            : '📍 Could you please share your location so I can find you?',
                        });
                        await firebaseClient.entities.Conversation.update(activeConv.id, {
                          last_message: lang === 'lo' ? '📍 ຂໍທີ່ຢູ່' : '📍 Location requested',
                          last_message_time: new Date().toISOString(),
                        });
                      }}
                      className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted border border-border px-3 py-2 rounded-xl hover:bg-muted/80 transition-colors w-full justify-center"
                    >
                      <MapPin size={12} />
                      {lang === 'lo' ? 'ຂໍທີ່ຢູ່ຈາກລູກຄ້າ' : 'Request location from customer'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {messages.map(msg => {
                const isMine = msg.sender_email === currentUser.email;
                const isLoc = isLocationMsg(msg.text);
                const mapsMatch = isLoc && msg.text.match(/https:\/\/maps\.google\.[^\s]+/);
                const mapsUrl = mapsMatch?.[0];

                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl text-sm overflow-hidden ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-card border border-border rounded-bl-sm'
                    }`}>
                      {isLoc && mapsUrl ? (
                        // Location message
                        <div className="p-3">
                          <div className="flex items-center gap-1.5 font-semibold text-xs mb-2">
                            <MapPin size={12} /> {lang === 'lo' ? 'ທີ່ຢູ່' : 'Location'}
                          </div>
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-1.5 text-xs underline underline-offset-2 ${isMine ? 'text-primary-foreground/80' : 'text-primary'}`}
                          >
                            <Navigation size={11} />
                            {lang === 'lo' ? 'ເປີດໃນ Google Maps' : 'Open in Google Maps'}
                          </a>
                        </div>
                      ) : msg.msg_type === 'booking_card' ? (
                        // Booking confirmation message card
                        <div className="p-3">
                          <p className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</p>
                        </div>
                      ) : (
                        <div className="px-4 py-2.5">
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                      )}
                      <div className={`px-4 pb-2 text-[10px] opacity-50 ${isLoc || msg.msg_type === 'booking_card' ? 'px-3' : ''}`}>
                        {formatTimestampDMY(msg.created_date)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Message input */}
            <div className="flex gap-2 px-3 py-3 bg-card border-t border-border">
              <button
                onClick={shareLocation}
                disabled={sharingLoc}
                title={lang === 'lo' ? 'ສົ່ງທີ່ຢູ່' : 'Share location'}
                className="w-10 h-10 flex-shrink-0 rounded-full bg-muted border border-border flex items-center justify-center hover:border-primary/50 transition-colors disabled:opacity-40"
              >
                <Navigation size={16} className={`text-muted-foreground ${sharingLoc ? 'animate-pulse text-primary' : ''}`} />
              </button>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={t.typeMessage}
                className="flex-1 border border-border rounded-full px-4 py-2.5 outline-none focus:border-primary bg-background"
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={sendMessage}
                className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center active:opacity-80 flex-shrink-0 hover:opacity-90 transition-opacity"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
            <MessageCircle size={40} className="mb-3 opacity-30" />
            <h3 className="font-semibold mb-2">{lang === 'lo' ? 'ເລືອກການສົນທະນາ' : 'Select a conversation'}</h3>
            <p className="text-sm text-center">{lang === 'lo' ? 'ເລືອກຈາກລາຍການດ້ານຊ້າຍ' : 'Choose from the list on the left'}</p>
          </div>
        )}
      </div>
    </div>
  );
}