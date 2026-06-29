'use client';

import React, { useEffect, useState } from 'react';

interface ChatMessage {
    timestamp: string;
    role: 'user' | 'assistant';
    content: string;
    action?: string | null;
}

interface ChatHistoryProps {
    driverId: string;
    currentMessages?: ChatMessage[];
    onLoadHistory?: (messages: ChatMessage[]) => void;
}

export default function ChatHistory({ driverId, currentMessages = [], onLoadHistory }: ChatHistoryProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Combine persisted history with current session messages
    const allMessages = React.useMemo(() => {
        const historyMap = new Map<string, ChatMessage>();
        
        // Add persisted messages first
        messages.forEach(msg => {
            const key = `${msg.timestamp}-${msg.role}-${msg.content}`;
            historyMap.set(key, msg);
        });
        
        // Add current session messages (convert format)
        currentMessages.forEach((msg: any) => {
            const chatMsg: ChatMessage = {
                timestamp: msg.timestamp?.toISOString?.() || new Date().toISOString(),
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text || msg.content || '',
                action: msg.action || null
            };
            const key = `${chatMsg.timestamp}-${chatMsg.role}-${chatMsg.content}`;
            historyMap.set(key, chatMsg);
        });
        
        // Sort by timestamp
        return Array.from(historyMap.values()).sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    }, [messages, currentMessages]);

    useEffect(() => {
        if (driverId) {
            fetchHistory();
        }
        
        // Listen for refresh events from New Chat button
        const handleRefresh = () => {
            fetchHistory();
        };
        
        // Listen for toggle events from History button
        const handleToggle = () => {
            setIsExpanded(prev => !prev);
        };
        
        window.addEventListener('chatHistoryRefresh', handleRefresh);
        window.addEventListener('toggleChatHistory', handleToggle);
        
        return () => {
            window.removeEventListener('chatHistoryRefresh', handleRefresh);
            window.removeEventListener('toggleChatHistory', handleToggle);
        };
    }, [driverId]);

    const fetchHistory = async () => {
        if (!driverId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await fetch(
                `http://localhost:8001/voice/chat-history/${driverId}?limit=50`
            );
            const data = await response.json();
            
            if (data.status === 'success') {
                setMessages(data.messages || []);
                if (onLoadHistory) {
                    onLoadHistory(data.messages || []);
                }
            } else {
                setError(data.message || 'Failed to load history');
            }
        } catch (err) {
            console.error('Failed to load chat history:', err);
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return '';
        }
    };

    const formatDate = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            } else {
                return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                });
            }
        } catch {
            return '';
        }
    };

    if (!isExpanded) {
        return null;
    }

    return (
        <div className="fixed bottom-8 right-8 w-96 h-[600px] bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-4 py-3 border-b border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-semibold text-white">Chat History</h3>
                    {allMessages.length > 0 && (
                        <span className="text-xs text-gray-400">
                            ({allMessages.length} messages)
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchHistory}
                        className="p-1.5 hover:bg-purple-500/20 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="p-1.5 hover:bg-purple-500/20 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-400">Loading history...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-2">
                            <svg className="w-12 h-12 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-gray-400">{error}</p>
                            <button
                                onClick={fetchHistory}
                                className="text-xs text-purple-400 hover:text-purple-300"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                ) : allMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-2">
                            <svg className="w-12 h-12 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm text-gray-400">No chat history yet</p>
                            <p className="text-xs text-gray-500">Start a conversation to see history</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {allMessages.map((msg, index) => {
                            const showDate = index === 0 || 
                                formatDate(allMessages[index - 1].timestamp) !== formatDate(msg.timestamp);

                            return (
                                <div key={index}>
                                    {showDate && (
                                        <div className="flex items-center justify-center my-4">
                                            <span className="px-3 py-1 bg-slate-800/50 border border-purple-500/20 rounded-full text-xs text-gray-400">
                                                {formatDate(msg.timestamp)}
                                            </span>
                                        </div>
                                    )}
                                    <div 
                                        className={`flex gap-2 ${
                                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                        )}
                                        
                                        <div className={`flex flex-col gap-1 max-w-[75%] ${
                                            msg.role === 'user' ? 'items-end' : 'items-start'
                                        }`}>
                                            <div
                                                className={`px-3 py-2 rounded-lg text-sm ${
                                                    msg.role === 'assistant'
                                                        ? 'bg-purple-900/40 border border-purple-500/30 text-gray-100'
                                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                                }`}
                                            >
                                                <p className="text-xs leading-relaxed">{msg.content}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">
                                                    {formatTime(msg.timestamp)}
                                                </span>
                                                {msg.action && (
                                                    <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                                                        {msg.action.replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {msg.role === 'user' && (
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex-shrink-0 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-purple-500/30 bg-slate-900/50">
                <p className="text-xs text-gray-500 text-center">
                    Session history • Updated in real-time
                </p>
            </div>
        </div>
    );
}
