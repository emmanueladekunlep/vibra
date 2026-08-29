/**
 * VIBRA - Chat List Component
 * Module: Chat
 * 
 * Displays list of conversations for the current user.
 * Blocks: Blocked users are hidden from chat list.
 * Professional design - no emojis.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as chatService from '../../services/chatService';
import * as profileService from '../../services/profileService';

const ChatList = ({ onSelectChat, selectedChatId }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const previousUnreadRef = useRef(0);
  const notificationPermissionRef = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          notificationPermissionRef.current = permission === 'granted';
        });
      } else {
        notificationPermissionRef.current = Notification.permission === 'granted';
      }
    }
  }, []);

  const sendBrowserNotification = (senderName, message, senderId) => {
    if (!notificationPermissionRef.current) return;
    if (!('Notification' in window)) return;
    if (document.hasFocus()) return;

    try {
      const notification = new Notification('VIBRA - New Message', {
        body: `${senderName}: ${message}`,
        icon: '/logo.png',
        tag: `msg_${senderId}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 10000);
    } catch (err) {
      console.warn('Notification error:', err);
    }
  };

  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await chatService.getConversations(user.id);
      
      // Filter out conversations with blocked users
      const blockedUsers = profileService.getBlockedUsers();
      const filteredData = data.filter(conv => 
        !blockedUsers.includes(conv.otherUser?.id)
      );
      
      setConversations(filteredData);
      
      const total = filteredData.reduce((sum, conv) => sum + conv.unreadCount, 0);
      
      if (total > previousUnreadRef.current && total > 0) {
        const newConv = filteredData.find(conv => conv.unreadCount > 0);
        if (newConv && newConv.lastMessage) {
          const senderName = newConv.otherUser?.name || 'Someone';
          const message = newConv.lastMessage.text || 'sent you a message';
          sendBrowserNotification(senderName, message, newConv.otherUser?.id);
        }
      }
      
      previousUnreadRef.current = total;
      setUnreadTotal(total);
    } catch (err) {
      setError('Failed to load conversations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadConversations]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading conversations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={loadConversations} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Messages</h2>
        {unreadTotal > 0 && (
          <span style={styles.unreadBadge}>{unreadTotal}</span>
        )}
      </div>

      {conversations.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No conversations yet</p>
          <p style={styles.emptySubtext}>Start connecting with people</p>
        </div>
      ) : (
        <div style={styles.list}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              style={{
                ...styles.chatItem,
                ...(selectedChatId === conv.id ? styles.chatItemActive : {}),
              }}
              onClick={() => onSelectChat?.(conv.id, conv.otherUser)}
            >
              <div style={styles.avatarContainer}>
                {conv.otherUser.photos && conv.otherUser.photos.length > 0 ? (
                  <img 
                    src={conv.otherUser.photos[0]} 
                    alt={conv.otherUser.name}
                    style={styles.avatar}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = 
                        `<span style="${styles.avatarPlaceholder}">${conv.otherUser.name?.[0] || '?'}</span>`;
                    }}
                  />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {conv.otherUser.name?.[0] || '?'}
                  </div>
                )}
                {conv.otherUser.isVerified && (
                  <span style={styles.verifiedDot}></span>
                )}
              </div>

              <div style={styles.chatInfo}>
                <div style={styles.chatHeader}>
                  <span style={styles.chatName}>
                    {conv.otherUser.name}
                  </span>
                  <span style={styles.chatTime}>
                    {formatTime(conv.lastMessage?.timestamp || conv.createdAt)}
                  </span>
                </div>
                <div style={styles.chatPreview}>
                  <span style={styles.chatMessage}>
                    {conv.lastMessage?.text || 'No messages yet'}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span style={styles.unreadCount}>{conv.unreadCount}</span>
                  )}
                </div>
                <span style={styles.chatLevel}>
                  Level: {conv.otherUser.level || 'Bronze'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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
    maxWidth: '400px',
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
    padding: '20px 24px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: 'white',
    flexShrink: 0,
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
  },
  unreadBadge: {
    backgroundColor: '#6C3CE1',
    color: 'white',
    padding: '2px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    borderBottom: '1px solid #f8f8f8',
  },
  chatItemActive: {
    backgroundColor: '#f5f0ff',
    borderLeft: '4px solid #6C3CE1',
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
    marginRight: '14px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #f0f0f0',
  },
  avatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#6C3CE1',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '600',
    border: '2px solid #f0f0f0',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '14px',
    height: '14px',
    backgroundColor: '#00B894',
    borderRadius: '50%',
    border: '2px solid white',
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  chatName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  chatTime: {
    fontSize: '12px',
    color: '#999',
    flexShrink: 0,
    marginLeft: '8px',
  },
  chatPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  chatMessage: {
    fontSize: '14px',
    color: '#666',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  },
  unreadCount: {
    backgroundColor: '#6C3CE1',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  chatLevel: {
    fontSize: '11px',
    color: '#999',
    marginTop: '2px',
    display: 'block',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '40px',
    color: '#999',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#666',
    margin: 0,
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#999',
    margin: '4px 0 0 0',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#888',
    fontSize: '14px',
  },
  errorCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '40px',
    textAlign: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: '16px',
    margin: '0 0 16px 0',
  },
  retryButton: {
    padding: '10px 24px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  credit: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#bbb',
    padding: '12px',
    borderTop: '1px solid #f0f0f0',
    flexShrink: 0,
    margin: 0,
  },
};

export default ChatList;