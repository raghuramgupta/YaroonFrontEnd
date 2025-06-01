import React, { useEffect, useState, useRef } from 'react';
import Header from '../Header/Header';
import './MessagesInbox.css';
import config from '../../config';
const MessagesInbox = () => {
  const [messages, setMessages] = useState([]);
  const [groupedMessages, setGroupedMessages] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);

  const messageRefs = useRef({});
    const suggestedMessages = [
  "Can you arrange a viewing?",
  "Is the rent negotiable?",
  "Is the property still available?",
  "How far is the nearest metro/bus stop?",
  "Can I schedule a call to discuss?",
  "Can you share more photos or a video tour?"
];
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('currentUser');
    if (userId) {
      setCurrentUser(userId);
      setIsLoggedIn(true);
      fetchMessages(userId);
    }
  }, []);

  const fetchMessages = async (userId) => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        fetch(`${config.apiBaseUrl}/api/messages/received/${userId}`),
        fetch(`${config.apiBaseUrl}/api/messages/sent/${userId}`)
      ]);

      if (receivedRes.ok && sentRes.ok) {
        const received = await receivedRes.json();
        const sent = await sentRes.json();
        const combined = [...received, ...sent];
        combined.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const grouped = groupByPartner(combined, userId);
        setMessages(combined);
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
    return groups;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setTyping(false);

    try {
      const response = await fetch('${config.apiBaseUrl}/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser,
          receiverId: selectedPartner,
          listingAddress: 'Some Listing',
          content: newMessage,
          isRead: false,
          timestamp: new Date(),
          replyToMessageId: replyToMessageId || null,
        })
      });

      if (response.ok) {
        setNewMessage('');
        setReplyToMessageId(null);
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
    if (!typing) {
      setTyping(true);
      setIsTyping(true);
      setTimeout(() => {
        setTyping(false);
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/messages/read/${messageId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId ? { ...msg, isRead: true } : msg
          )
        );
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

  const filteredGroupedMessages = Object.entries(groupedMessages)
    .map(([partnerId, msgs]) => [partnerId, msgs.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))])
    .filter(([_, msgs]) => msgs.length > 0);

  return (
    <div className="messages-inbox">
      <Header isLoggedIn={isLoggedIn} />
      <div className="inbox-two-pane">
        <div className="message-list-pane">
        <input
            className="search-input"
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredGroupedMessages.length === 0 ? (
            <p>No messages found.</p>
          ) : (
            <ul className="message-list">
              {filteredGroupedMessages.map(([partnerId, msgs]) => {
                const latestMessage = msgs[msgs.length - 1];
                return (
                  <li
                    key={partnerId}
                    className={`message-item ${selectedPartner === partnerId ? 'selected' : ''}`}
                    onClick={() => setSelectedPartner(partnerId)}
                  >
                    <div className="message-avatar">
                      <div className="avatar-circle">{partnerId.charAt(0).toUpperCase()}</div>
                    </div>
                    <div className="message-preview">
                      <p className="sender-name">{partnerId}</p>
                      <p className="preview-content">
                        {latestMessage.content.slice(0, 30)}...
                        {!latestMessage.isRead && latestMessage.receiverId === currentUser && <span className="unread-dot" />}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="message-detail-pane">
          {selectedPartner && groupedMessages[selectedPartner] ? (
            <div className="message-details">
              <h3>Conversation with {selectedPartner}</h3>

              {groupedMessages[selectedPartner].map((msg) => {
                const repliedMsg = msg.replyToMessageId
                  ? messages.find(m => m._id === msg.replyToMessageId)
                  : null;

                return (
                  <div
                    key={msg._id}
                    ref={(el) => (messageRefs.current[msg._id] = el)}
                    className={`message-bubble ${msg.senderId === currentUser ? 'sent' : 'received'}`}
                    onClick={() => !msg.isRead && handleMarkAsRead(msg._id)}
                  >
                    <div className="bubble-header">
                      <span
                        className="menu-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenFor(prev => prev === msg._id ? null : msg._id);
                        }}
                      >⋮</span>
                      {menuOpenFor === msg._id && (
                        <div className="message-menu">
                          <button onClick={() => {
                            setReplyToMessageId(msg._id);
                            setMenuOpenFor(null);
                          }}>Reply</button>
                        </div>
                      )}
                    </div>

                    {msg.listingAddress && msg.listingAddress !== 'Some Listing' && (
                      <p><strong>Listing:</strong> {msg.listingAddress}</p>
                    )}

                    {repliedMsg && (
                      <p
                        className="replied-preview"
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToMessage(repliedMsg._id);
                        }}
                      >
                        <i>Replying to: {repliedMsg.content.slice(0, 60)}</i>
                      </p>
                    )}

                    <p>{msg.content}</p>
                    <p className="timestamp">
                      {new Date(msg.timestamp).toLocaleString()}
                      {msg.senderId === currentUser && msg.isRead && <span className="read-status">✓✓</span>}
                      {msg.senderId === currentUser && !msg.isRead && <span className="read-status">✓</span>}
                    </p>
                  </div>
                );
              })}

              <div className="message-input-section">
                {isTyping && <p className="typing-indicator">Typing...</p>}
                {replyToMessageId && (
                  <p className="replying-indicator">
                    Replying to: {messages.find(m => m._id === replyToMessageId)?.content.slice(0, 60)}
                    <button onClick={() => setReplyToMessageId(null)}>Cancel</button>
                  </p>
                )}
                <textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={handleTyping}
                /><div className="suggested-messages">
                  {(showAllSuggestions ? suggestedMessages : suggestedMessages.slice(0, 3)).map((msg, index) => (
                    <button
                      key={index}
                      className="suggested-message-btn"
                      onClick={() => setNewMessage(msg)}
                    >
                      {msg}
                    </button>
                  ))}
                  {suggestedMessages.length > 3 && (
                    <button
                      className="suggested-message-btn"
                      onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                    >
                      {showAllSuggestions ? 'Less' : 'More'}
                    </button>
                  )}
                </div>
                <button onClick={handleSendMessage}>Send</button>
              </div>
            </div>
          ) : (
            <p className="no-selection">Select a conversation to view messages.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesInbox;
