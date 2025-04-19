import React from 'react';
import { useWebSocketStatus, WebSocketConnectionState } from '../integrations/websocket';

/**
 * Component props
 */
interface WebSocketStatusProps {
  showDetails?: boolean;
  className?: string;
}

/**
 * WebSocket Status Indicator
 * Displays the current WebSocket connection status
 */
export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ 
  showDetails = false,
  className = ''
}) => {
  const { isConnected, connectionState, reconnect } = useWebSocketStatus();
  
  // Define status icon and color based on connection state
  let statusIcon = '⚪';
  let statusColor = 'text-gray-400';
  let statusText = 'Disconnected';
  
  switch (connectionState) {
    case WebSocketConnectionState.CONNECTED:
      statusIcon = '🟢';
      statusColor = 'text-green-500';
      statusText = 'Connected';
      break;
    case WebSocketConnectionState.CONNECTING:
      statusIcon = '🟡';
      statusColor = 'text-yellow-500';
      statusText = 'Connecting';
      break;
    case WebSocketConnectionState.RECONNECTING:
      statusIcon = '🟠';
      statusColor = 'text-orange-500';
      statusText = 'Reconnecting';
      break;
    case WebSocketConnectionState.FAILED:
      statusIcon = '🔴';
      statusColor = 'text-red-500';
      statusText = 'Connection Failed';
      break;
    case WebSocketConnectionState.DISCONNECTED:
    default:
      // Use defaults
      break;
  }
  
  return (
    <div className={`flex items-center ${className}`}>
      <span className="mr-2" title={statusText}>
        {statusIcon}
      </span>
      
      {showDetails && (
        <>
          <span className={`text-sm ${statusColor}`}>{statusText}</span>
          
          {(connectionState === WebSocketConnectionState.DISCONNECTED || 
            connectionState === WebSocketConnectionState.FAILED) && (
            <button 
              onClick={reconnect}
              className="ml-2 text-xs text-blue-500 hover:text-blue-700 underline"
              title="Reconnect WebSocket"
            >
              Reconnect
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default WebSocketStatus; 