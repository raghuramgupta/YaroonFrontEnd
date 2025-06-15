import React, { useEffect, useState, useRef } from 'react';
import Header from '../Header/Header';
import './MessagesInbox.css';
import config from '../../config';
import { formatDistanceToNow, format } from 'date-fns';

const MessagesInbox = () => {
  const [messages, setMessages] = useState([]);
  const [groupedMessages, setGroupedMessages] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [hasPostedProperty, setHasPostedProperty] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState({});
  const [onlineStatus, setOnlineStatus] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);

  const messageRefs = useRef({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  
  const tenantSuggestedMessages = [
    "Can you arrange a viewing?",
    "Is the rent negotiable?",
    "Is the property still available?",
    "How far is the nearest metro/bus stop?",
    "Can I schedule a call to discuss?",
    "Can you share more photos or a video tour?"
  ];
  
  const landlordSuggestedMessages = [
    "Would you like to view the property?",
    "Can you send me your profile?",
    "What's your profession?",
    "Where are you from?",
    "When do you want to move in?",
    "Do you have any references?"
  ];

  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('currentUser');
    if (userId) {
      setCurrentUser(userId);
      setIsLoggedIn(true);
      fetchMessages(userId);
      checkIfUserHasProperties(userId);
      // Simulate online status updates
      const interval = setInterval(() => {
        setOnlineStatus(prev => ({
          ...prev,
          [selectedPartner]: Math.random() > 0.3 // 70% chance to be online
        }));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (selectedPartner && groupedMessages[selectedPartner]) {
      // Mark messages as read when opening conversation
      groupedMessages[selectedPartner].forEach(msg => {
        if (msg.receiverId === currentUser && !msg.isRead) {
          handleMarkAsRead(msg._id);
        }
      });
      
      // Fetch partner info if not already available
      if (!partnerInfo[selectedPartner]) {
        fetchUserInfo(selectedPartner);
      }
    }
  }, [groupedMessages, selectedPartner]);

  const fetchUserInfo = async (userId) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/users/${userId}`);
      if (response.ok) {
        const user = await response.json();
        setPartnerInfo(prev => ({
          ...prev,
          [userId]: user
        }));
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const checkIfUserHasProperties = async (userId) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/properties/user/${userId}`);
      if (response.ok) {
        const properties = await response.json();
        setHasPostedProperty(properties.length > 0);
      }
    } catch (err) {
      console.error('Error checking user properties:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (userId) => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        fetch(`${config.apiBaseUrl}/api/messages/received/${userId}`),
        fetch(`${config.apiBaseUrl}/api/messages/sent/${userId}`)
      ]);

      if (receivedRes.ok && sentRes.ok) {
        const received = await receivedRes.json();
        const sent = await sentRes.json();
        
        setMessages(prevMessages => {
          const combined = [...received, ...sent];
          return combined.map(newMsg => {
            const existingMsg = prevMessages.find(m => m._id === newMsg._id);
            return existingMsg ? { ...newMsg, isRead: existingMsg.isRead } : newMsg;
          });
        });
        
        const grouped = groupByPartner([...received, ...sent], userId);
        setGroupedMessages(grouped);
        if (!selectedPartner && Object.keys(grouped).length > 0) {
          setSelectedPartner(Object.keys(grouped)[0]);
        }
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const groupByPartner = (msgs, currentUserId) => {
    const groups = {};
    msgs.forEach((msg) => {
      const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      if (!groups[partnerId]) groups[partnerId] = [];
      groups[partnerId].push(msg);
    });
    
    // Sort each conversation by timestamp
    Object.keys(groups).forEach(partnerId => {
      groups[partnerId].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    });
    
    return groups;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    setIsTyping(false);

    try {
      let messageData = {
        senderId: currentUser,
        receiverId: selectedPartner,
        content: newMessage,
        isRead: false,
        timestamp: new Date(),
        replyToMessageId: replyToMessageId || null,
      };

      // If we have attachments, we'd normally upload them first
      // For this example, we'll just simulate it
      if (attachments.length > 0) {
        messageData.attachments = attachments.map(file => ({
          type: file.type.startsWith('image') ? 'image' : 'file',
          name: file.name,
          url: URL.createObjectURL(file), // In real app, this would be the uploaded URL
          size: file.size
        }));
      }

      const response = await fetch(`${config.apiBaseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        setNewMessage('');
        setReplyToMessageId(null);
        setAttachments([]);
        fetchMessages(currentUser);
      } else {
        console.error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
      return () => clearTimeout(typingTimeout);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/messages/read/${messageId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg._id === messageId ? { ...msg, isRead: true } : msg
          )
        );
        
        setGroupedMessages(prevGrouped => {
          const updated = { ...prevGrouped };
          for (const partnerId in updated) {
            updated[partnerId] = updated[partnerId].map(msg =>
              msg._id === messageId ? { ...msg, isRead: true } : msg
            );
          }
          return updated;
        });
      } else {
        console.error('Failed to mark as read');
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const scrollToMessage = (msgId) => {
    const element = messageRefs.current[msgId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight');
      setTimeout(() => {
        element.classList.remove('highlight');
      }, 2000);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
    setShowAttachmentOptions(false);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatMessageTime = (date) => {
    return format(new Date(date), 'h:mm a');
  };

  const formatConversationTime = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const filteredGroupedMessages = Object.entries(groupedMessages)
    .map(([partnerId, msgs]) => [partnerId, msgs.filter(m => 
      m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.attachments && m.attachments.some(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())))
    )])
    .filter(([_, msgs]) => msgs.length > 0);

  return (<div className="messages-inbox-container">
    <div className="messenger-app">
      <Header isLoggedIn={isLoggedIn} />
      <div className="messenger-container">
        {/* Sidebar */}
        <div className="conversation-sidebar">
          <div className="sidebar-header">
            <div className="user-profile">
              <div className="profile-avatar">
                {currentUser?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-status"></div>
            </div>
            <div className="search-container">
              <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="conversation-list">
            {filteredGroupedMessages.length === 0 ? (
              <div className="empty-conversations">
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path fill="#aebac1" d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3.4-3.777H7.041V7.323h9.375v1.944z"/>
                </svg>
                <p>No conversations yet</p>
                <button className="start-chat-button">Start a new chat</button>
              </div>
            ) : (
              filteredGroupedMessages.map(([partnerId, msgs]) => {
                const latestMessage = msgs[msgs.length - 1];
                const unreadCount = msgs.reduce((count, msg) => 
                  (!msg.isRead && msg.receiverId === currentUser) ? count + 1 : count, 0);
                const partner = partnerInfo[partnerId] || { name: partnerId };
                
                return (
                  <div
                    key={partnerId}
                    className={`conversation-item ${selectedPartner === partnerId ? 'active' : ''}`}
                    onClick={() => setSelectedPartner(partnerId)}
                  >
                    <div className="conversation-avatar">
                      <div className="avatar">
                        {partner.name.charAt(0).toUpperCase()}
                      </div>
                      {onlineStatus[partnerId] && <div className="online-badge"></div>}
                    </div>
                    <div className="conversation-details">
                      <div className="conversation-header">
                        <span className="partner-name">{partner.name}</span>
                        <span className="message-time">
                          {formatConversationTime(latestMessage.timestamp)}
                        </span>
                      </div>
                      <div className="conversation-preview">
                        <p className="message-preview">
                          {latestMessage.senderId === currentUser && 'You: '}
                          {latestMessage.attachments?.length > 0 
                            ? `📎 ${latestMessage.attachments[0].name}`
                            : latestMessage.content.slice(0, 30)}
                          {latestMessage.content.length > 30 && !latestMessage.attachments?.length && '...'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="unread-badge">{unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-area">
          {selectedPartner && groupedMessages[selectedPartner] ? (
            <>
              <div className="chat-header">
                <div className="header-content">
                  <div className="partner-info">
                    <div className="partner-avatar">
                      <div className="avatar">
                        {partnerInfo[selectedPartner]?.name?.charAt(0).toUpperCase() || selectedPartner.charAt(0).toUpperCase()}
                      </div>
                      {onlineStatus[selectedPartner] && <div className="online-badge"></div>}
                    </div>
                    <div className="partner-details">
                      <h3>{partnerInfo[selectedPartner]?.name || selectedPartner}</h3>
                      <p className="status">
                        {onlineStatus[selectedPartner] ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="header-actions">
                    <button className="action-button">
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 1.381-1.381 7.269 7.269 0 0 0 10.024.244.977.977 0 0 1 1.313 1.445A9.192 9.192 0 0 1 12 20.664zm7.965-6.112a.977.977 0 0 1-.944-1.229 7.26 7.26 0 0 0-4.8-8.804.977.977 0 0 1 .594-1.86 9.212 9.212 0 0 1 6.092 11.169.976.976 0 0 1-.942.724zm-16.025-.39a.977.977 0 0 1-.953-.769 9.21 9.21 0 0 1 6.626-10.86.975.975 0 1 1 .52 1.882l-.015.004a7.259 7.259 0 0 0-5.223 8.558.978.978 0 0 1-.955 1.185z"/>
                      </svg>
                    </button>
                    <button className="action-button">
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"/>
                      </svg>
                    </button>
                    <button className="action-button">
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="message-container">
                <div className="messages">
                  {groupedMessages[selectedPartner].map((msg) => {
                    const repliedMsg = msg.replyToMessageId
                      ? messages.find(m => m._id === msg.replyToMessageId)
                      : null;
                    const isCurrentUser = msg.senderId === currentUser;
                    const showDateSeparator = false; // Would implement date grouping in a real app

                    return (
                      <React.Fragment key={msg._id}>
                        {showDateSeparator && (
                          <div className="date-separator">
                            <span>{format(new Date(msg.timestamp), 'MMMM d, yyyy')}</span>
                          </div>
                        )}
                        <div
                          ref={(el) => (messageRefs.current[msg._id] = el)}
                          className={`message ${isCurrentUser ? 'sent' : 'received'}`}
                          onClick={() => !msg.isRead && handleMarkAsRead(msg._id)}
                        >
                          <div className="message-content">
                            {repliedMsg && (
                              <div 
                                className="reply-preview"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  scrollToMessage(repliedMsg._id);
                                }}
                              >
                                <div className="reply-indicator">
                                  {isCurrentUser ? 'Replying to yourself' : 'Replying to you'}
                                </div>
                                <div className="quoted-message">
                                  {repliedMsg.content.slice(0, 60)}
                                  {repliedMsg.content.length > 60 && '...'}
                                </div>
                              </div>
                            )}
                            
                            {msg.attachments?.length > 0 && (
                              <div className="message-attachments">
                                {msg.attachments.map((file, index) => (
                                  <div key={index} className="attachment">
                                    {file.type === 'image' ? (
                                      <img 
                                        src={file.url} 
                                        alt={file.name} 
                                        className="attachment-image"
                                      />
                                    ) : (
                                      <div className="file-attachment">
                                        <svg viewBox="0 0 24 24" width="24" height="24">
                                          <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                                        </svg>
                                        <div className="file-info">
                                          <div className="file-name">{file.name}</div>
                                          <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {msg.content && (
                              <div className="message-bubble">
                                <div className="bubble-content">
                                  <p>{msg.content}</p>
                                  <div className="message-meta">
                                    <span className="timestamp">
                                      {formatMessageTime(msg.timestamp)}
                                    </span>
                                    {isCurrentUser && (
                                      <span className={`read-status ${msg.isRead ? 'read' : 'delivered'}`}>
                                        {msg.isRead ? '✓✓' : '✓'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="message-actions">
                                  <button 
                                    className="action-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMenuOpenFor(prev => prev === msg._id ? null : msg._id);
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                      <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                    </svg>
                                  </button>
                                  
                                  {menuOpenFor === msg._id && (
                                    <div className="message-menu">
                                      <button 
                                        className="menu-item"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReplyToMessageId(msg._id);
                                          setMenuOpenFor(null);
                                        }}
                                      >
                                        <svg viewBox="0 0 24 24" width="16" height="16" style={{marginRight: '8px'}}>
                                          <path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                                        </svg>
                                        Reply
                                      </button>
                                      <button className="menu-item">
                                        <svg viewBox="0 0 24 24" width="16" height="16" style={{marginRight: '8px'}}>
                                          <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                                        </svg>
                                        Forward
                                      </button>
                                      <button className="menu-item">
                                        <svg viewBox="0 0 24 24" width="16" height="16" style={{marginRight: '8px'}}>
                                          <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                        </svg>
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              <div className="message-input-container">
                {replyToMessageId && (
                  <div className="reply-indicator">
                    <div className="indicator-content">
                      Replying to: {messages.find(m => m._id === replyToMessageId)?.content.slice(0, 60)}
                      {messages.find(m => m._id === replyToMessageId)?.content.length > 60 && '...'}
                    </div>
                    <button 
                      className="cancel-reply"
                      onClick={() => setReplyToMessageId(null)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>
                )}
                
                {attachments.length > 0 && (
                  <div className="attachments-preview">
                    {attachments.map((file, index) => (
                      <div key={index} className="attachment-preview">
                        {file.type.startsWith('image') ? (
                          <>
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={file.name} 
                              className="preview-image"
                            />
                            <button 
                              className="remove-attachment"
                              onClick={() => removeAttachment(index)}
                            >
                              <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="file-preview">
                              <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                              </svg>
                              <span className="file-name">{file.name}</span>
                            </div>
                            <button 
                              className="remove-attachment"
                              onClick={() => removeAttachment(index)}
                            >
                              <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="input-wrapper">
                  <button 
                    className="attachment-button"
                    onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                    </svg>
                  </button>
                  
                  {showAttachmentOptions && (
                    <div className="attachment-options">
                      <button 
                        className="attachment-option"
                        onClick={() => {
                          fileInputRef.current.click();
                          setShowAttachmentOptions(false);
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="24" height="24">
                          <path fill="currentColor" d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/>
                        </svg>
                        <span>Photo or Video</span>
                      </button>
                      <button className="attachment-option">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                          <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        </svg>
                        <span>Document</span>
                      </button>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    multiple
                  />
                  
                  <div className="text-input-container">
                    <textarea
                      ref={inputRef}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyPress={handleKeyPress}
                      rows="1"
                    />
                    <div className="suggested-messages">
                      {(showAllSuggestions 
                        ? (hasPostedProperty ? landlordSuggestedMessages : tenantSuggestedMessages)
                        : (hasPostedProperty ? landlordSuggestedMessages : tenantSuggestedMessages).slice(0, 3)
                      ).map((msg, index) => (
                        <button
                          key={index}
                          className="suggestion"
                          onClick={() => {
                            setNewMessage(msg);
                            inputRef.current.focus();
                          }}
                        >
                          {msg}
                        </button>
                      ))}
                      {(hasPostedProperty ? landlordSuggestedMessages : tenantSuggestedMessages).length > 3 && (
                        <button
                          className="show-more"
                          onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                        >
                          {showAllSuggestions ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    className="send-button"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && attachments.length === 0}
                  >
                    {newMessage.trim() || attachments.length > 0 ? (
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-chat">
              <div className="empty-content">
                <div className="empty-illustration">
                  <svg viewBox="0 0 24 24" width="96" height="96">
                    <path fill="#aebac1" d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3.4-3.777H7.041V7.323h9.375v1.944z"/>
                  </svg>
                </div>
                <h2>WhatsApp Web</h2>
                <p className="description">
                  Send and receive messages without keeping your phone online.
                  <br />
                  Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                </p>
                <p className="subtext">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div></div>
  );
};

export default MessagesInbox;