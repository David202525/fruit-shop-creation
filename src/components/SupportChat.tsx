import { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chat, FAQ, Message, SUPPORT_CHAT_URL } from './support-chat/types';
import { fetchWithRetry, isWorkingHours } from './support-chat/api';
import ChatWindow from './support-chat/ChatWindow';

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(() => {
    const chatClosed = sessionStorage.getItem('supportChatClosed');
    return chatClosed !== 'true';
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [showFaqs, setShowFaqs] = useState(true);
  const [waitingStartTime, setWaitingStartTime] = useState<number | null>(null);
  const [hasShownDelayMessage, setHasShownDelayMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const userId = localStorage.getItem('userId') || null;

  useEffect(() => {
    if (!userId) {
      let storedGuestId = localStorage.getItem('guestChatId');
      if (!storedGuestId) {
        storedGuestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('guestChatId', storedGuestId);
      }
      setGuestId(storedGuestId);
    }
  }, [userId]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('supportChatClosed', 'true');
  };

  const handleOpen = () => {
    setIsOpen(true);
    sessionStorage.removeItem('supportChatClosed');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && (userId || guestId) && !chat) {
      loadChat();
      loadFaqs();
    }
  }, [isOpen, userId, guestId]);

  useEffect(() => {
    if (isOpen && chat) {
      pollingIntervalRef.current = setInterval(() => {
        loadChatSilent();
      }, 5000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [isOpen, chat]);

  useEffect(() => {
    if (chat?.status === 'waiting') {
      if (!waitingStartTime) {
        setWaitingStartTime(Date.now());
        setHasShownDelayMessage(false);
      }
    } else {
      setWaitingStartTime(null);
      setHasShownDelayMessage(false);
    }
  }, [chat?.status, waitingStartTime]);

  useEffect(() => {
    if (waitingStartTime && chat?.status === 'waiting' && !hasShownDelayMessage) {
      const timer = setTimeout(() => {
        const delayMessage: Message = {
          id: Date.now(),
          sender_type: 'bot',
          sender_name: 'Анфиса',
          message: 'К сожалению, все администраторы заняты. Потребуется дополнительное время для ожидания. Пожалуйста, оставьте ваш вопрос, и мы обязательно ответим в ближайшее время!',
          created_at: new Date().toISOString(),
          is_read: true,
        };
        setMessages((prev) => [...prev, delayMessage]);
        setHasShownDelayMessage(true);
      }, 3 * 60 * 1000);

      return () => clearTimeout(timer);
    }
  }, [waitingStartTime, chat?.status, hasShownDelayMessage]);

  const loadFaqs = async () => {
    try {
      const response = await fetchWithRetry(`${SUPPORT_CHAT_URL}?faq=true`);
      const data = await response.json();
      const activeFaqs = Array.isArray(data) ? data.filter((f: any) => f.is_active) : [];
      setFaqs(activeFaqs);
    } catch (error) {
      console.error('Ошибка загрузки FAQ:', error);
    }
  };

  const loadChat = async () => {
    const chatUserId = userId || guestId;
    if (!chatUserId) return;

    try {
      const isGuest = !userId;
      const response = await fetchWithRetry(`${SUPPORT_CHAT_URL}?user_id=${chatUserId}&is_guest=${isGuest}`);
      const data = await response.json();
      setChat(data.chat);
      setMessages(data.messages || []);
      
      if (data.chat?.status === 'bot') {
        const hasUserMessages = (data.messages || []).some((m: Message) => m.sender_type === 'user');
        setShowFaqs(!hasUserMessages);
      } else {
        setShowFaqs(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки чата:', error);
    }
  };

  const loadChatSilent = async () => {
    const chatUserId = userId || guestId;
    if (!chatUserId) return;

    try {
      const isGuest = !userId;
      const response = await fetchWithRetry(`${SUPPORT_CHAT_URL}?user_id=${chatUserId}&is_guest=${isGuest}`);
      const data = await response.json();
      
      if (data.chat) {
        setChat(prevChat => {
          // Обновляем если изменился статус, админ или аватар
          if (prevChat && (
            prevChat.status !== data.chat.status ||
            prevChat.admin_name !== data.chat.admin_name ||
            prevChat.admin_id !== data.chat.admin_id
          )) {
            if (data.chat.status === 'active' || data.chat.status === 'waiting') {
              setShowFaqs(false);
            }
            return data.chat;
          }
          return prevChat || data.chat;
        });
      }
      
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = (data.messages || []).filter((m: Message) => !existingIds.has(m.id));
        if (newMessages.length > 0) {
          return [...prev, ...newMessages];
        }
        return prev;
      });
    } catch (error) {
      console.error('Ошибка обновления чата:', error);
    }
  };

  const sendMessage = async () => {
    const chatUserId = userId || guestId;
    if (!inputMessage.trim() || !chat || !chatUserId) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    const tempId = Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      sender_type: 'user',
      sender_name: 'Вы',
      message: messageText,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetchWithRetry(SUPPORT_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          user_id: chatUserId,
          chat_id: chat.id,
          message: messageText,
          is_guest: !userId,
        }),
      });

      const data = await response.json();

      if (data.status_changed === 'waiting') {
        setShowFaqs(false);
      }

      setMessages((prev) => 
        prev.map(msg => msg.id === tempId ? { ...msg, id: data.message_id } : msg)
      );

      if (data.status_changed === 'waiting') {
          if (data.bot_response) {
            const botMessageId = data.bot_message_id || Date.now();
            const botMessage: Message = {
              id: botMessageId,
              sender_type: 'bot',
              sender_name: 'Анфиса',
              message: data.bot_response,
              created_at: new Date().toISOString(),
              is_read: true,
            };
            setMessages((prev) => {
              if (prev.some(m => m.id === botMessageId)) {
                return prev;
              }
              return [...prev, botMessage];
            });
          }
          setChat((prev) => (prev ? { ...prev, status: 'waiting' } : null));
          setShowFaqs(false);
      } else if (data.bot_response) {
        const botMessageId = data.bot_message_id || Date.now();
        const botMessage: Message = {
          id: botMessageId,
          sender_type: 'bot',
          sender_name: 'Анфиса',
          message: data.bot_response,
          created_at: new Date().toISOString(),
          is_read: true,
        };
        setMessages((prev) => {
          if (prev.some(m => m.id === botMessageId)) {
            return prev;
          }
          return [...prev, botMessage];
        });
        
        setTimeout(() => {
          setShowFaqs(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {isOpen && (
        <ChatWindow
          chat={chat}
          messages={messages}
          faqs={faqs}
          showFaqs={showFaqs}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          onClose={handleClose}
          onSendMessage={sendMessage}
          onKeyPress={handleKeyPress}
        />
      )}

      {!isOpen && (
        <>
          <Button
            onClick={handleOpen}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          
          <a
            href="https://vk.com/sad_mehti"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-[#0077FF] hover:bg-[#0066DD] shadow-lg hover:scale-110 transition-all flex items-center justify-center z-50"
            aria-label="ВКонтакте"
          >
            <svg className="h-7 w-7 text-white" viewBox="0 0 48 48" fill="currentColor">
              <path d="M25.2,32.9h2.4c0,0,0.7-0.1,1.1-0.5c0.3-0.4,0.3-1.1,0.3-1.1s0-3.3,1.5-3.8c1.5-0.5,3.4,3.2,5.4,4.6c1.5,1.1,2.7,0.8,2.7,0.8l5.4-0.1c0,0,2.8-0.2,1.5-2.4c-0.1-0.2-0.8-1.7-4.2-4.8c-3.5-3.2-3-2.7,1.2-8.3c2.5-3.4,3.6-5.5,3.2-6.4c-0.3-0.8-2.4-0.6-2.4-0.6l-6.1,0c0,0-0.5-0.1-0.8,0.1c-0.3,0.2-0.5,0.7-0.5,0.7s-0.9,2.4-2.1,4.5c-2.5,4.3-3.5,4.5-3.9,4.2c-0.9-0.6-0.7-2.3-0.7-3.5c0-3.8,0.6-5.4-1.1-5.8c-0.6-0.1-1-0.2-2.4-0.2c-1.8,0-3.4,0-4.2,0.4c-0.6,0.3-1,0.9-0.7,0.9c0.3,0,1.1,0.2,1.5,0.8c0.5,0.7,0.5,2.4,0.5,2.4s0.3,4.5-0.7,5.1c-0.7,0.4-1.6-0.4-3.6-4.4c-1-2-1.8-4.3-1.8-4.3s-0.1-0.5-0.4-0.7c-0.4-0.3-0.9-0.4-0.9-0.4l-5.8,0c0,0-0.9,0-1.2,0.4c-0.3,0.3-0.0,1,0,1s4.3,10.1,9.2,15.2C19.7,32.7,25.2,32.9,25.2,32.9z"/>
            </svg>
          </a>
        </>
      )}
    </>
  );
}