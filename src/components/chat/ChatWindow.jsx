/**
 * VIBRA - Chat Window Component
 * Module: Chat
 * 
 * Individual chat window with messages.
 * Real-time WebSocket support with polling fallback.
 * Professional design - no emojis.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as chatService from '../../services/chatService';

const ChatWindow = ({ conversationId, otherUser, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isFirstLoad = useRef(true);
  const isUserScrolling = useRef(false);
  const prevMessagesLength = useRef(0);
  const scrollTimeout = useRef(null);
  const pollIntervalRef = useRef(null);

  // Merge messages without causing re-render flicker
  const mergeMessages = useCallback((newMessages) => {
    if (newMessages.length === messages.length) {
      const hasChanged = newMessages.some((msg, i) => {
        const existing = messages[i];
        return !existing || 
               msg.text !== existing.text || 
               msg.senderId !== existing.senderId ||
               msg.read !== existing.read;
      });
      if (!hasChanged) return false;
    }

    setMessages(newMessages);
    return true;
  }, [messages]);

  const loadMessages = useCallback(async (silent = false) => {
    if (!conversationId) return;
    
    try {
      const data = await chatService.getMessages(conversationId);
      const formatted = data.map(msg => ({
        ...msg,
        senderId: String(msg.senderId || msg.sender_id || '')
      }));
      
      const changed = mergeMessages(formatted);
      
      if (changed && formatted.length > prevMessagesLength.current && !isUserScrolling.current) {
        scrollToBottom();
      }
      if (changed) {
        prevMessagesLength.current = formatted.length;
      }
      
      await chatService.markAsRead(conversationId, user.id);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (isFirstLoad.current) {
        setIsInitialLoading(false);
        isFirstLoad.current = false;
      }
    }
  }, [conversationId, user.id, mergeMessages]);

  useEffect(() => {
    if (conversationId) {
      isFirstLoad.current = true;
      prevMessagesLength.current = 0;
      setIsInitialLoading(true);
      loadMessages(true);
    }
  }, [conversationId, loadMessages]);

  // Handle scroll detection for user scrolling up
  useEffect(() => {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      isUserScrolling.current = distanceFromBottom > 50;
      
      if (distanceFromBottom < 10) {
        isUserScrolling.current = false;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    const handleWebSocketMessage = (data) => {
      if (data.type === 'new_message' && data.conversationId === conversationId) {
        const newMsg = {
          ...data.message,
          senderId: String(data.message.senderId || data.message.sender_id || '')
        };
        setMessages(prev => [...prev, newMsg]);
        chatService.markAsRead(conversationId, user.id);
        if (!isUserScrolling.current) {
          setTimeout(scrollToBottom, 50);
        }
        prevMessagesLength.current = prevMessagesLength.current + 1;
      }
      
      if (data.type === 'typing' && data.conversationId === conversationId) {
        setTyping(true);
        clearTimeout(typingTimeout);
        const timeout = setTimeout(() => setTyping(false), 2000);
        setTypingTimeout(timeout);
      }
      
      if (data.type === 'read' && data.conversationId === conversationId) {
        setMessages(prev => 
          prev.map(msg => 
            String(msg.senderId) !== String(user.id) ? { ...msg, read: true } : msg
          )
        );
      }
    };

    const unsubscribe = chatService.subscribeToMessages(handleWebSocketMessage);

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      loadMessages(true);
    }, 1500);

    return () => {
      unsubscribe();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (typingTimeout) clearTimeout(typingTimeout);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [conversationId, user.id, typingTimeout, loadMessages]);

  const scrollToBottom = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (!conversationId) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      const message = await chatService.sendMessage(conversationId, user.id, newMessage.trim());
      const formattedMsg = {
        ...message,
        senderId: String(message.senderId || message.sender_id || user.id)
      };
      setNewMessage('');
      
      if (formattedMsg) {
        setMessages(prev => [...prev, formattedMsg]);
        prevMessagesLength.current = prevMessagesLength.current + 1;
        setTimeout(scrollToBottom, 50);
      }
      
      setTimeout(() => loadMessages(true), 500);
      
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (value.length > 0) {
      chatService.sendTyping(conversationId, user.id);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '';
      }
      
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

  if (!conversationId || !otherUser) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Select a conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {onBack && (
            <button onClick={onBack} style={styles.backButton}>
              Back
            </button>
          )}
          <div style={styles.userInfo} onClick={() => onBack?.()}>
            <div style={styles.avatarSmall}>
              {otherUser.photos && otherUser.photos.length > 0 ? (
                <img 
                  src={otherUser.photos[0]} 
                  alt={otherUser.name}
                  style={styles.avatarImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div style={styles.avatarPlaceholderSmall}>
                  {otherUser.name?.[0] || '?'}
                </div>
              )}
            </div>
            <div style={styles.userTextInfo}>
              <span style={styles.headerName}>
                {otherUser.name}
                {otherUser.isVerified && (
                  <span style={styles.verifiedText}> ✓</span>
                )}
              </span>
              <span style={styles.headerLevel}>
                Level: {otherUser.level || 'Bronze'} • {otherUser.location || 'No location'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div 
        id="chat-messages-container"
        style={styles.messagesContainer}
      >
        {isInitialLoading ? (
          <div style={styles.loadingState}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyMessages}>
            <p style={styles.emptyMessagesText}>No messages yet</p>
            <p style={styles.emptyMessagesSub}>Say hello to start chatting</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const msgSenderId = String(msg.senderId || msg.sender_id || '');
              const currentUserId = String(user.id);
              const isOwn = msgSenderId === currentUserId;
              
              return (
                <div
                  key={msg.id || msg.timestamp + Math.random()}
                  style={{
                    ...styles.messageRow,
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      ...styles.messageBubble,
                      ...(isOwn ? styles.messageOwn : styles.messageOther),
                    }}
                  >
                    <p style={styles.messageText}>{msg.text}</p>
                    <div style={styles.messageFooter}>
                      <span style={styles.messageSender}>
                        {isOwn ? 'You' : (otherUser.name || 'User')}
                      </span>
                      <span style={styles.messageTime}>
                        {formatTime(msg.timestamp)}
                        {isOwn && msg.read && (
                          <span style={styles.readStatus}> ✓</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div style={styles.typingIndicator}>
                <span>{otherUser.name} is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

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
          disabled={isSending || isInitialLoading}
          maxLength={1000}
        />
        <button
          type="submit"
          style={{
            ...styles.sendButton,
            ...(isSending || !newMessage.trim() ? styles.sendButtonDisabled : {}),
          }}
          disabled={isSending || !newMessage.trim() || isInitialLoading}
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
    color: '#6C3CE1',
    fontSize: '14px',
    fontWeight: '500',
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
    backgroundColor: '#6C3CE1',
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
    color: '#00B894',
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
  messageRow: {
    display: 'flex',
    marginBottom: '10px',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: '16px',
    wordWrap: 'break-word',
  },
  messageOwn: {
    backgroundColor: '#6C3CE1',
    color: 'white',
    borderBottomRightRadius: '4px',
  },
  messageOther: {
    backgroundColor: '#f0f0f0',
    color: '#1a1a1a',
    borderBottomLeftRadius: '4px',
  },
  messageText: {
    fontSize: '15px',
    lineHeight: '1.5',
    margin: '0 0 4px 0',
  },
  messageFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '10px',
    opacity: 0.7,
    gap: '8px',
  },
  messageSender: {
    fontWeight: '500',
    opacity: 0.6,
    fontSize: '10px',
  },
  messageTime: {
    fontSize: '10px',
    opacity: 0.6,
  },
  readStatus: {
    fontSize: '10px',
    color: '#00B894',
    marginLeft: '2px',
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
    backgroundColor: '#6C3CE1',
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