"use client"

import { useState, useEffect, useRef } from "react"

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current && 
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const fetchCount = async () => {
    try {
      const res = await fetch("/api/notifications?count=true")
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unread_count)
      }
    } catch (e) { console.error(e) }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications?limit=10")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleToggle = () => {
    if (!isOpen) fetchNotifications()
    setIsOpen(!isOpen)
  }

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (isRead) return
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (e) { console.error(e) }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (e) { console.error(e) }
  }

  const getNotifIcon = (type: string) => {
    if (type?.includes('ROLE')) return '👤'
    if (type?.includes('LOAN')) return '💰'
    if (type?.includes('KYC')) return '📋'
    if (type?.includes('PAYMENT')) return '💳'
    if (type?.includes('MEETING')) return '📅'
    return '🔔'
  }

  return (
    <div className="relative flex-shrink-0">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-[#E85D26]/10 
                   transition-colors duration-150 focus:outline-none"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-current" fill="none" 
             viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 
                   14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 
                   10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 
                   .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 
                   0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 
                           text-white text-[9px] font-bold 
                           min-w-[16px] h-4 px-0.5
                           flex items-center justify-center 
                           rounded-full leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="
            fixed md:absolute
            inset-x-2 md:inset-x-auto
            top-16 md:top-auto
            md:right-0 md:mt-2
            w-auto md:w-96
            bg-white rounded-2xl shadow-2xl
            border border-gray-100
            z-[100]
            overflow-hidden
            flex flex-col
            max-h-[80vh] md:max-h-[500px]
          "
        >
          {/* Header */}
          <div className="flex justify-between items-center 
                          px-4 py-3 border-b border-gray-100 
                          bg-gray-50/80 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <h3 className="font-bold text-gray-900 text-sm">
                सूचना / Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-[#E85D26]/10 text-[#E85D26] 
                                 text-xs font-bold px-2 py-0.5 
                                 rounded-full">
                  {unreadCount} नवीन
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#E85D26] 
                             hover:text-[#D04E1A] font-semibold
                             hover:underline transition"
                >
                  सर्व वाचले / Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 
                           text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center 
                              justify-center py-12 gap-2">
                <div className="w-6 h-6 border-2 border-[#E85D26] 
                                border-t-transparent rounded-full 
                                animate-spin" />
                <p className="text-xs text-gray-400">लोड होत आहे...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center 
                              justify-center py-12 gap-2">
                <span className="text-3xl">🔕</span>
                <p className="text-sm text-gray-500 font-medium">
                  कोणत्याही सूचना नाहीत
                </p>
                <p className="text-xs text-gray-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id, n.is_read)}
                    className={`
                      flex gap-3 px-4 py-3.5 cursor-pointer 
                      transition-colors duration-150
                      ${n.is_read
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-[#E85D26]/5 hover:bg-[#E85D26]/10'
                      }
                    `}
                  >
                    {/* Icon */}
                    <div className={`
                      w-9 h-9 rounded-xl flex items-center 
                      justify-center flex-shrink-0 text-base
                      ${n.is_read ? 'bg-gray-100' : 'bg-[#E85D26]/10'}
                    `}>
                      {getNotifIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${
                          n.is_read
                            ? 'font-medium text-gray-700'
                            : 'font-bold text-gray-900'
                        }`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full 
                                           bg-[#E85D26] mt-1.5 
                                           flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 
                                    leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1.5 
                                    font-medium">
                        {new Date(n.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 
                            bg-gray-50/50 flex-shrink-0">
              <p className="text-[10px] text-gray-400 text-center">
                शेवटच्या {notifications.length} सूचना दाखवत आहे
                {" "}· Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
