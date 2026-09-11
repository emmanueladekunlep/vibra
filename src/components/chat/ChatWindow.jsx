/**
 * VIBRA - Chat Window Component
 * Module: Chat
 * 
 * Silent polling - no flicker, no pulse.
 * New messages only appear when they actually arrive.
 * Auto-scroll only when user is at bottom.
 * Click on user header to view their profile.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as chatService from '../../services/chatService';
import * as profileService from '../../services/profileService';

const ChatWindow = ({ conversationId: propConversationId, otherUser: propOtherUser, onBack: propOnBack }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { chatId: paramChatId } = useParams();
  
  const rawConversationId = propConversationId || paramChatId;
  const conversationId = typeof rawConversationId === 'string' ? rawConversationId : String(rawConversationId || '');
  
  const [otherUser, setOtherUser] = useState(propOtherUser || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const scrollTimeout = useRef(null);
  const pollIntervalRef = useRef(null);
  const loadedRef = useRef(false);
  const isUserScrolling = useRef(false);
  const lastMessageCountRef = useRef(0);
  const lastMessageIdRef = useRef(null);

  // Load other user info
  useEffect(() => {
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null' || propOtherUser) return;
    
    const loadOtherUser = async () => {
      try {
        const conversation = await chatService.getConversation(conversationId);
        if (conversation) {
          const participants = conversation.participants || [];
          const otherId = participants.find(id => id != user?.userId);
          if (otherId && otherId !== 'undefined' && otherId !== 'null') {
            const userInfo = await profileService.getProfile(otherId);
            if (userInfo) {
              setOtherUser(userInfo);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load other user:', err);
      }
    };
    loadOtherUser();
  }, [conversationId, user?.userId, propOtherUser]);

  const scrollToBottom = (smooth = true) => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: smooth ? 'smooth' : 'auto',
          block: 'end'
        });
      }
      setHasNewMessages(false);
    }, 50);
  };

  const loadMessages = useCallback(async (isInitial = false) => {
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') return;
    if (!user) return;
    
    try {
      const data = await chatService.getMessages(conversationId);
      const formatted = data.map(msg => ({
        ...msg,
        senderId: String(msg.senderId || msg.sender_id || '')
      }));
      
      const newCount = formatted.length;
      const oldCount = lastMessageCountRef.current;
      const lastMsgId = formatted[formatted.length - 1]?.id || null;
      const hasActualNewMessages = newCount > oldCount || (lastMsgId && lastMsgId !== lastMessageIdRef.current);
      
      if (hasActualNewMessages || isInitial) {
        setMessages(formatted);
        lastMessageCountRef.current = newCount;
        lastMessageIdRef.current = lastMsgId;
        
        if (isInitial) {
          setTimeout(() => scrollToBottom(false), 200);
          loadedRef.current = true;
        } else if (!isUserScrolling.current && hasActualNewMessages) {
          setTimeout(() => scrollToBottom(true), 100);
        } else if (isUserScrolling.current && hasActualNewMessages) {
          setHasNewMessages(true);
        }
      }
      
      setIsLoading(false);
      
      if (user && user.userId) {
        await chatService.markAsRead(conversationId, user.userId);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setIsLoading(false);
    }
  }, [conversationId, user]);

  // Initial load
  useEffect(() => {
    if (conversationId && conversationId !== 'undefined' && conversationId !== 'null' && user) {
      loadedRef.current = false;
      lastMessageCountRef.current = 0;
      lastMessageIdRef.current = null;
      setIsLoading(true);
      loadMessages(true);
    }
  }, [conversationId, user, loadMessages]);

  // Scroll handler
  useEffect(() => {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    containerRef.current = container;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const wasScrolling = isUserScrolling.current;
      isUserScrolling.current = distanceFromBottom > 100;
      
      if (wasScrolling && !isUserScrolling.current) {
        setHasNewMessages(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Silent polling
  useEffect(() => {
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') return;
    if (!user) return;

    const handleNewMessage = (data) => {
      if (data.type === 'new_message' && data.conversationId === conversationId) {
        loadMessages(false);
      }
      
      if (data.type === 'typing' && data.conversationId === conversationId) {
        setTyping(true);
        clearTimeout(typingTimeout);
        const timeout = setTimeout(() => setTyping(false), 2000);
        setTypingTimeout(timeout);
      }
    };

    const unsubscribe = chatService.subscribeToMessages(handleNewMessage);

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      loadMessages(false);
    }, 5000);

    return () => {
      unsubscribe();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (typingTimeout) clearTimeout(typingTimeout);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [conversationId, user, typingTimeout, loadMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') return;
    if (!user) return;
    
    setIsSending(true);
    setError(null);
    
    const messageText = newMessage.trim();
    setNewMessage('');
    
    try {
      await chatService.sendMessage(conversationId, user.userId, messageText);
      isUserScrolling.current = false;
      await loadMessages(false);
      setTimeout(() => scrollToBottom(true), 100);
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to send message');
      console.error('Send error:', err);
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (value.length > 0 && user && user.userId) {
      chatService.sendTyping(conversationId, user.userId);
    }
  };

  const handleScrollToNew = () => {
    isUserScrolling.current = false;
    scrollToBottom(true);
    setHasNewMessages(false);
  };

  const handleProfileClick = () => {
    if (!otherUser) return;
    const targetUserId = otherUser.userId || otherUser.id;
    if (targetUserId) {
      navigate(`/profile/${targetUserId}`);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (msgDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (msgDate.getTime() === yesterday.getTime()) {
        return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
    } else {
      navigate('/chat');
    }
  };

  if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Select a conversation</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={handleBack} style={styles.backButton}>
              ← Back
            </button>
            <div style={styles.userInfo}>
              <div style={styles.avatarPlaceholderSmall}>?</div>
              <div style={styles.userTextInfo}>
                <span style={styles.headerName}>Loading...</span>
              </div>
            </div>
          </div>
        </div>
        <div style={styles.messagesContainer}>
          <div style={styles.loadingState}>Loading messages...</div>
        </div>
        <form onSubmit={handleSend} style={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            style={styles.input}
            disabled={true}
            maxLength={1000}
          />
          <button
            type="submit"
            style={{ ...styles.sendButton, ...styles.sendButtonDisabled }}
            disabled={true}
          >
            Send
          </button>
        </form>
        <p style={styles.credit}>Powered by LabelReach</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={handleBack} style={styles.backButton}>
            ← Back
          </button>
          <div 
            style={styles.userInfo} 
            onClick={handleProfileClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') handleProfileClick(); }}
          >
            <div style={styles.avatarSmall}>
              {otherUser?.photos && otherUser.photos.length > 0 ? (
                <img 
                  src={otherUser.photos[0].url || otherUser.photos[0]} 
                  alt={otherUser?.name || 'User'}
                  style={styles.avatarImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div style={styles.avatarPlaceholderSmall}>
                  {otherUser?.name?.[0] || '?'}
                </div>
              )}
            </div>
            <div style={styles.userTextInfo}>
              <span style={styles.headerName}>
                {otherUser?.name || 'User'}
                {otherUser?.isVerified && (
                  <span style={styles.verifiedText}> ✓</span>
                )}
              </span>
              <span style={styles.headerLevel}>
                Level: {otherUser?.level || 'Bronze'} • {otherUser?.location || 'No location'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div id="chat-messages-container" style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyMessages}>
            <p style={styles.emptyMessagesText}>No messages yet</p>
            <p style={styles.emptyMessagesSub}>Say hello to start chatting</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const msgSenderId = String(msg.senderId || msg.sender_id || '');
              const isMe = msgSenderId === String(user?.id) || msgSenderId === String(user?.userId);
              const senderName = isMe ? 'You' : (otherUser?.name || 'User');
              
              return (
                <div
                  key={msg.id || index}
                  style={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    marginBottom: '10px',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '10px 14px',
                      borderRadius: '16px',
                      wordWrap: 'break-word',
                      backgroundColor: isMe ? '#721CBB' : '#f0f0f0',
                      color: isMe ? 'white' : '#1a1a1a',
                      borderBottomRightRadius: isMe ? '4px' : '16px',
                      borderBottomLeftRadius: isMe ? '16px' : '4px',
                    }}
                  >
                    <p style={{ fontSize: '15px', lineHeight: '1.5', margin: '0 0 4px 0' }}>
                      {msg.text}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', opacity: 0.7, gap: '8px' }}>
                      <span style={{ fontWeight: '500', opacity: 0.6, fontSize: '10px' }}>
                        {senderName}
                      </span>
                      <span style={{ fontSize: '10px', opacity: 0.6 }}>
                        {formatTime(msg.timestamp)}
                        {isMe && msg.read && (
                          <span style={{ fontSize: '10px', color: '#10964D', marginLeft: '2px' }}> ✓</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div style={styles.typingIndicator}>
                <span>{otherUser?.name || 'User'} is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {hasNewMessages && (
        <button onClick={handleScrollToNew} style={styles.newMessagesButton}>
          ↓ New messages
        </button>
      )}

      {error && (
        <div style={styles.errorBar}>
          <p style={styles.errorBarText}>{error}</p>
          <button onClick={() => setError(null)} style={styles.errorBarClose}>
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSend} style={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          style={styles.input}
          disabled={isSending || isLoading}
          maxLength={1000}
        />
        <button
          type="submit"
          style={{
            ...styles.sendButton,
            ...(isSending || !newMessage.trim() ? styles.sendButtonDisabled : {}),
          }}
          disabled={isSending || !newMessage.trim() || isLoading}
        >
          Send
        </button>
      </form>

      <p style={styles.credit}>
        Powered by LabelReach
      </p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: '20px',
    maxWidth: '500px',
    width: '100%',
    height: '600px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: 'white',
    flexShrink: 0,
    minHeight: '56px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: 0,
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#721CBB',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '6px 8px',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '8px',
    transition: 'background-color 0.15s',
    outline: 'none',
  },
  userTextInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  avatarSmall: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    border: '2px solid #f0f0f0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholderSmall: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#721CBB',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
  },
  headerName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '160px',
  },
  verifiedText: {
    color: '#10964D',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: '2px',
  },
  headerLevel: {
    fontSize: '11px',
    color: '#999',
    display: 'block',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    backgroundColor: '#fafafa',
  },
  typingIndicator: {
    padding: '4px 8px',
    fontSize: '12px',
    color: '#999',
    fontStyle: 'italic',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
    fontSize: '14px',
  },
  emptyMessages: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
  },
  emptyMessagesText: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#666',
    margin: 0,
  },
  emptyMessagesSub: {
    fontSize: '14px',
    color: '#999',
    margin: '4px 0 0 0',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
  },
  emptyText: {
    fontSize: '16px',
    color: '#999',
  },
  newMessagesButton: {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#721CBB',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(114, 28, 187, 0.3)',
    zIndex: 10,
    fontFamily: 'inherit',
  },
  inputContainer: {
    display: 'flex',
    padding: '10px 14px',
    borderTop: '1px solid #f0f0f0',
    backgroundColor: 'white',
    gap: '8px',
    flexShrink: 0,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '24px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    minWidth: '60px',
  },
  sendButton: {
    padding: '10px 18px',
    backgroundColor: '#721CBB',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minWidth: '60px',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  errorBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    backgroundColor: '#ffebee',
    borderTop: '1px solid #ffcdd2',
    flexShrink: 0,
  },
  errorBarText: {
    color: '#c62828',
    fontSize: '14px',
    margin: 0,
  },
  errorBarClose: {
    background: 'none',
    border: 'none',
    color: '#c62828',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  credit: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#bbb',
    padding: '8px',
    borderTop: '1px solid #f0f0f0',
    flexShrink: 0,
    margin: 0,
  },
};

export default ChatWindow;