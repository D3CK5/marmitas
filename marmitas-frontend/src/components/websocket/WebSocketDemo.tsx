import React, { useState, useCallback } from 'react';
import { useWebSocket } from '../../integrations/websocket/hooks/use-websocket';
import { 
  useWebSocketMessage, 
  useWebSocketConnect, 
  useWebSocketDisconnect, 
  useWebSocketError 
} from '../../integrations/websocket/hooks/use-websocket-event';
import styles from './WebSocketDemo.module.css';

interface WebSocketDemoProps {
  url: string;
  className?: string;
}

const WebSocketDemo: React.FC<WebSocketDemoProps> = ({ url, className }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState<string | null>(null);
  
  // Initialize WebSocket connection
  const websocket = useWebSocket({
    url,
    autoConnect: false,
    reconnect: true,
    maxReconnectAttempts: 5,
    reconnectInterval: 2000,
  });

  // Handle incoming messages
  useWebSocketMessage(websocket, (data) => {
    const message = typeof data === 'string' ? data : '[Binary data received]';
    setMessages((prev) => [...prev, `Received: ${message}`]);
  });

  // Handle connection events
  useWebSocketConnect(websocket, () => {
    setConnectionStatus('Connected');
    setError(null);
    setMessages((prev) => [...prev, 'Connected to server']);
  });

  // Handle disconnection events
  useWebSocketDisconnect(websocket, (event) => {
    setConnectionStatus(`Disconnected (Code: ${event.code}, Reason: ${event.reason || 'None'})`);
    setMessages((prev) => [...prev, `Disconnected: ${event.reason || 'No reason provided'}`]);
  });

  // Handle errors
  useWebSocketError(websocket, (event) => {
    setError(event.error.message);
    setMessages((prev) => [...prev, `Error: ${event.error.message}`]);
  });

  // Connect to WebSocket server
  const handleConnect = useCallback(() => {
    websocket.connect();
  }, [websocket]);

  // Disconnect from WebSocket server
  const handleDisconnect = useCallback(() => {
    websocket.disconnect();
  }, [websocket]);

  // Send message to WebSocket server
  const handleSendMessage = useCallback(() => {
    if (messageInput.trim() && websocket.isConnected) {
      websocket.send(messageInput);
      setMessages((prev) => [...prev, `Sent: ${messageInput}`]);
      setMessageInput('');
    }
  }, [messageInput, websocket]);

  // Handle keyboard event for sending messages
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Get status class based on connection state
  const getStatusClass = () => {
    if (websocket.isConnected) return styles.statusConnected;
    if (websocket.isConnecting) return styles.statusConnecting;
    return styles.statusDisconnected;
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <h2 className={styles.title}>WebSocket Demo</h2>
      
      <div className={styles.statusSection}>
        <span className={styles.statusLabel}>Status:</span> 
        <span className={getStatusClass()}>{connectionStatus}</span>
        {error && <div className={styles.error}>Error: {error}</div>}
      </div>
      
      <div className={styles.controls}>
        <button 
          className={styles.connectButton}
          onClick={handleConnect} 
          disabled={websocket.isConnected || websocket.isConnecting}
        >
          Connect
        </button>
        <button 
          className={styles.disconnectButton}
          onClick={handleDisconnect} 
          disabled={!websocket.isConnected}
        >
          Disconnect
        </button>
      </div>
      
      <div className={styles.messageInput}>
        <input
          className={styles.input}
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={!websocket.isConnected}
        />
        <button 
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!websocket.isConnected || !messageInput.trim()}
        >
          Send
        </button>
      </div>
      
      <div className={styles.messageLog}>
        <h3 className={styles.messageLogTitle}>Message Log</h3>
        <div className={styles.messages}>
          {messages.length === 0 ? (
            <div className={styles.noMessages}>No messages yet</div>
          ) : (
            messages.map((message, index) => {
              let messageClass = styles.message;
              if (message.startsWith('Sent:')) {
                messageClass += ' ' + styles.sent;
              } else if (message.startsWith('Received:')) {
                messageClass += ' ' + styles.received;
              } else if (message.startsWith('Error:')) {
                messageClass += ' ' + styles.error;
              } else {
                messageClass += ' ' + styles.system;
              }
              
              return (
                <div key={index} className={messageClass}>
                  {message}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketDemo; 