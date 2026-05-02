import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import FaqManager from './FaqManager';
import ArchiveView from './support-chat/ArchiveView';
import ResponseTimerSettings from './support-chat/ResponseTimerSettings';
import { useChatActions } from './support-chat/useChatActions';
import { useFaqActions } from './support-chat/useFaqActions';
import { useArchiveActions } from './support-chat/useArchiveActions';
import { 
  FAQ, 
  ChatItem, 
  ChatMessage, 
  ArchivedChat, 
  SUPPORT_CHAT_URL 
} from './support-chat/types';

interface SupportChatTabProps {
  userId: number;
  userName: string;
  isSuperAdmin?: boolean;
}

export default function SupportChatTab({ userId, userName, isSuperAdmin = false }: SupportChatTabProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'chats' | 'faq' | 'archive'>('chats');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [prevWaitingCount, setPrevWaitingCount] = useState(0);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [archivedChats, setArchivedChats] = useState<ArchivedChat[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<ArchivedChat | null>(null);
  const [responseWarningSeconds, setResponseWarningSeconds] = useState<number>(60);
  const [responseDangerSeconds, setResponseDangerSeconds] = useState<number>(180);

  useEffect(() => {
    const API_SETTINGS = 'https://functions.poehali.dev/9b1ac59e-93b6-41de-8974-a7f58d4ffaf9';
    fetch(`${API_SETTINGS}?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        const warn = Number(data?.chat_response_warning_seconds);
        const danger = Number(data?.chat_response_danger_seconds);
        if (warn > 0) setResponseWarningSeconds(warn);
        if (danger > 0) setResponseDangerSeconds(danger);
      })
      .catch(() => {});
  }, []);

  const loadChats = async () => {
    try {
      const response = await fetch(`${SUPPORT_CHAT_URL}?admin_view=true`);
      const data = await response.json();
      
      const waitingChats = data.filter((c: ChatItem) => c.status === 'waiting');
      const waitingCount = waitingChats.length;
      
      if (waitingCount > prevWaitingCount && prevWaitingCount > 0) {
        toast({
          title: '🔔 Новый запрос в поддержку!',
          description: `Ожидает ${waitingCount} чат(ов)`,
          duration: 5000,
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Новый запрос в поддержку', {
            body: `Ожидает ${waitingCount} чат(ов)`,
            icon: '/icon-192.png',
          });
        }
      }
      
      setPrevWaitingCount(waitingCount);
      setChats(data);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    }
  };

  const loadFaqs = async () => {
    try {
      const response = await fetch(`${SUPPORT_CHAT_URL}?faq=true`);
      const data = await response.json();
      setFaqs(data);
    } catch (error) {
      console.error('Ошибка загрузки FAQ:', error);
    }
  };

  const chatActions = useChatActions({
    userId,
    userName,
    chats,
    setMessages,
    setSelectedChat,
    loadChats,
  });

  const faqActions = useFaqActions(loadFaqs);
  const archiveActions = useArchiveActions();

  useEffect(() => {
    loadChats();
    loadFaqs();
    const interval = setInterval(() => {
      if (activeTab === 'chats') loadChats();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (selectedChat) {
      const interval = setInterval(() => {
        chatActions.loadChatMessagesSilent(selectedChat.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (activeTab === 'archive') {
      archiveActions.loadArchive().then(setArchivedChats);
    }
  }, [activeTab]);

  const handleSendMessage = () => {
    chatActions.sendMessage(messageInput, selectedChat, () => setMessageInput(''));
  };

  const handleCloseChat = () => {
    if (selectedChat) {
      chatActions.closeChat(selectedChat.id);
    }
  };

  const handleDeleteArchive = (archiveId: number) => {
    archiveActions.deleteArchivedChat(archiveId, async () => {
      const data = await archiveActions.loadArchive();
      setArchivedChats(data);
      setSelectedArchive(null);
    });
  };

  const waitingCount = chats.filter((c) => c.status === 'waiting').length;
  const activeCount = chats.filter((c) => c.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'chats' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('chats');
            setSelectedArchive(null);
          }}
          className="flex items-center gap-2"
        >
          <Icon name="MessageSquare" size={16} />
          Чаты
          {waitingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
              {waitingCount}
            </span>
          )}
        </Button>
        <Button
          variant={activeTab === 'faq' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('faq');
            setSelectedArchive(null);
          }}
          className="flex items-center gap-2"
        >
          <Icon name="HelpCircle" size={16} />
          FAQ ({faqs.length})
        </Button>
        <Button
          variant={activeTab === 'archive' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('archive');
            setSelectedChat(null);
            setShowMobileChat(false);
          }}
          className="flex items-center gap-2"
        >
          <Icon name="Archive" size={16} />
          Архив
        </Button>
      </div>

      {activeTab === 'chats' && (
        <>
          <div className="hidden md:grid md:grid-cols-2 gap-4">
            <ChatList
              chats={chats}
              selectedChatId={selectedChat?.id}
              waitingCount={waitingCount}
              activeCount={activeCount}
              onSelectChat={chatActions.loadChatMessages}
            />

            <ChatWindow
              selectedChat={selectedChat}
              messages={messages}
              messageInput={messageInput}
              onMessageInputChange={setMessageInput}
              onSendMessage={handleSendMessage}
              onTakeChat={chatActions.takeChat}
              onCloseChat={handleCloseChat}
              currentUserId={userId}
              responseWarningSeconds={responseWarningSeconds}
              responseDangerSeconds={responseDangerSeconds}
            />
          </div>

          <div className="md:hidden">
            {!showMobileChat ? (
              <ChatList
                chats={chats}
                selectedChatId={selectedChat?.id}
                waitingCount={waitingCount}
                activeCount={activeCount}
                onSelectChat={(chatId) => {
                  chatActions.loadChatMessages(chatId);
                  setShowMobileChat(true);
                }}
              />
            ) : (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowMobileChat(false);
                    setSelectedChat(null);
                  }}
                >
                  <Icon name="ArrowLeft" size={20} className="mr-2" />
                  Назад к списку
                </Button>
                <ChatWindow
                  selectedChat={selectedChat}
                  messages={messages}
                  messageInput={messageInput}
                  onMessageInputChange={setMessageInput}
                  onSendMessage={handleSendMessage}
                  onTakeChat={chatActions.takeChat}
                  onCloseChat={handleCloseChat}
                  currentUserId={userId}
                  responseWarningSeconds={responseWarningSeconds}
                  responseDangerSeconds={responseDangerSeconds}
                />
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'faq' && (
        <>
          {isSuperAdmin && (
            <ResponseTimerSettings
              warningSeconds={responseWarningSeconds}
              dangerSeconds={responseDangerSeconds}
              onSaved={(w, d) => {
                setResponseWarningSeconds(w);
                setResponseDangerSeconds(d);
              }}
            />
          )}
          <FaqManager
            faqs={faqs}
            onSaveFaq={faqActions.saveFaq}
            onUpdateFaq={faqActions.updateFaq}
            onDeleteFaq={faqActions.deleteFaq}
          />
        </>
      )}

      {activeTab === 'archive' && (
        <ArchiveView
          archivedChats={archivedChats}
          selectedArchive={selectedArchive}
          onSelectArchive={setSelectedArchive}
          onDeleteArchive={handleDeleteArchive}
          onBack={() => setSelectedArchive(null)}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}