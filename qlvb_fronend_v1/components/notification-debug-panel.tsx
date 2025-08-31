'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useNotifications } from '@/lib/notifications-context'
import { useInternalDocumentNotifications } from '@/hooks/use-internal-document-notifications'
import { notificationsRealtime } from '@/lib/api/notifications'

interface DebugInfo {
  isConnected: boolean
  connectionAttempts: number
  lastMessage?: any
  subscriptionStatus: string
}

export function NotificationDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    isConnected: false,
    connectionAttempts: 0,
    subscriptionStatus: 'Not initialized'
  })
  
  const [token, setToken] = useState<string>('')

  // Use the hook to test notification handling
  useInternalDocumentNotifications({
    onReceived: (notification) => {
      console.log('🔔 Hook received RECEIVED notification:', notification)
      setDebugInfo(prev => ({ ...prev, lastMessage: notification }))
    },
    onRead: (notification) => {
      console.log('🔔 Hook received READ notification:', notification)
      setDebugInfo(prev => ({ ...prev, lastMessage: notification }))
    },
    onSent: (notification) => {
      console.log('🔔 Hook received SENT notification:', notification)
      setDebugInfo(prev => ({ ...prev, lastMessage: notification }))
    },
    onUpdated: (notification) => {
      console.log('🔔 Hook received UPDATED notification:', notification)
      setDebugInfo(prev => ({ ...prev, lastMessage: notification }))
    }
  })

  useEffect(() => {
    // Get token from localStorage or wherever it's stored
    const storedToken = localStorage.getItem('accessToken')
    if (storedToken) {
      setToken(storedToken)
    }

    // Update connection status every second
    const interval = setInterval(() => {
      setDebugInfo(prev => ({
        ...prev,
        isConnected: notificationsRealtime.isConnected,
        subscriptionStatus: notificationsRealtime.isConnected ? 'Connected' : 'Disconnected'
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleConnect = () => {
    if (token) {
      console.log('🚀 Manual connection attempt with token:', token.substring(0, 20) + '...')
      notificationsRealtime.connect(token)
      setDebugInfo(prev => ({ 
        ...prev, 
        connectionAttempts: prev.connectionAttempts + 1,
        subscriptionStatus: 'Connecting...'
      }))
    } else {
      console.error('❌ No token available for connection')
    }
  }

  const handleDisconnect = () => {
    console.log('🔌 Manual disconnect')
    notificationsRealtime.disconnect()
    setDebugInfo(prev => ({ 
      ...prev, 
      subscriptionStatus: 'Disconnected'
    }))
  }

  const handleTestNotification = () => {
    // Simulate a notification for testing
    const testNotification = {
      id: Date.now(),
      type: 'INTERNAL_DOCUMENT_RECEIVED',
      content: 'Test notification from debug panel',
      entityId: 123,
      entityType: 'internal_document',
      createdAt: new Date().toISOString(),
      read: false,
      user: {
        id: 1,
        name: 'testuser',
        fullName: 'Test User'
      }
    }
    
    console.log('🧪 Simulating test notification:', testNotification)
    setDebugInfo(prev => ({ ...prev, lastMessage: testNotification }))
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold text-lg mb-3">🔍 Notification Debug Panel</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={debugInfo.isConnected ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.subscriptionStatus}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Connection Attempts:</span>
          <span>{debugInfo.connectionAttempts}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Token Available:</span>
          <span className={token ? 'text-green-600' : 'text-red-600'}>
            {token ? 'Yes' : 'No'}
          </span>
        </div>

        {debugInfo.lastMessage && (
          <div className="mt-3">
            <strong>Last Message:</strong>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
              {JSON.stringify(debugInfo.lastMessage, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <Button 
          onClick={handleConnect} 
          disabled={!token || debugInfo.isConnected}
          size="sm"
        >
          Connect
        </Button>
        
        <Button 
          onClick={handleDisconnect} 
          disabled={!debugInfo.isConnected}
          variant="outline"
          size="sm"
        >
          Disconnect
        </Button>
        
        <Button 
          onClick={handleTestNotification}
          variant="secondary"
          size="sm"
        >
          Test
        </Button>
      </div>

      <div className="mt-2">
        <input
          type="text"
          placeholder="Token (auto-detected)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full text-xs border rounded px-2 py-1"
        />
      </div>
    </div>
  )
}

export default NotificationDebugPanel
