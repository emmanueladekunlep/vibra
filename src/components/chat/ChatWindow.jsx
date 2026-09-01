/**
 * VIBRA - Chat Window Component
 * Module: Chat
 * 
 * Individual chat window with messages.
 * Professional design - no emojis.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as chatService from '../../services/chatService';

const ChatWindow = ({ conversationId, otherUser, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data);
      
      await chatService.markAsRead(conversationId, user.id);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user.id]);

  useEffect(() => {
    if (conversationId) {
      setIsLoading(true);
      loadMessages();
    }
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = chatService.subscribeToMessages(
      conversationId,
      (updatedMessages) => {
        setMessages(updatedMessages);
        chatService.markAsRead(conversationId, user.id);
        scrollToBottom();
      },
      3000
    );

    return () => unsubscribe();
  }, [conversationId, user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (!conversationId) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      await chatService.sendMessage(conversationId, user.id, newMessage.trim());
      setNewMessage('');
      
      await loadMessages();
      
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
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
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <div style={styles.userInfo}>
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
            <div>
              <span style={styles.headerName}>
                {otherUser.name}
                {otherUser.isVerified && (
                  <span style={styles.verifiedText}> Verified</span>
                )}
              </span>
              <span style={styles.headerLevel}>
                Level: {otherUser.level || 'Bronze'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.messagesContainer}>
        {isLoading ? (
          <div style={styles.loadingState}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyMessages}>
            <p style={styles.emptyMessagesText}>No messages yet</p>
            <p style={styles.emptyMessagesSub}>Say hello to start chatting</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.senderId === user.id;
              return (
                <div
                  key={msg.id}
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
                        {isOwn ? 'You' : otherUser.name}
                      </span>
                      <span style={styles.messageTime}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
          onChange={(e) => setNewMessage(e.target.value)}
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: 'white',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
    padding: '4px 8px',
    fontFamily: 'inherit',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  avatarSmall: {
    width: '36px',
    height: '36px',
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
    width: '100%',
    height: '100%',
    backgroundColor: '#6C3CE1',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
  headerName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    display: 'block',
  },
  verifiedText: {
    color: '#00B894',
    fontSize: '13px',
    fontWeight: '500',
    marginLeft: '4px',
  },
  headerLevel: {
    fontSize: '12px',
    color: '#999',
    display: 'block',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    backgroundColor: '#fafafa',
  },
  messageRow: {
    display: 'flex',
    marginBottom: '8px',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '8px 14px',
    borderRadius: '12px',
    wordWrap: 'break-word',
  },
  messageOwn: {
    backgroundColor: '#6C3CE1',
    color: 'white',
    borderBottomRightRadius: '4px',
  },
  messageOther: {
    backgroundColor: '#e8e8e8',
    color: '#1a1a1a',
    borderBottomLeftRadius: '4px',
  },
  messageText: {
    fontSize: '15px',
    lineHeight: '1.4',
    margin: '0 0 2px 0',
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
    padding: '12px 16px',
    borderTop: '1px solid #f0f0f0',
    backgroundColor: 'white',
    gap: '10px',
    flexShrink: 0,
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
  },
  sendButton: {
    padding: '10px 20px',
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