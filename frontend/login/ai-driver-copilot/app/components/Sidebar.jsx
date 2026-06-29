'use client';

import React, { useState } from 'react';

export default function Sidebar({ isOpen, onToggle, onLogout }) {
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'Route Optimization Guide', timestamp: '2 hours ago' },
    { id: 2, title: 'Fleet Performance Report', timestamp: '5 hours ago' },
    { id: 3, title: 'Driver Safety Analysis', timestamp: 'Yesterday' },
  ]);

  const handleNewChat = () => {
    // Clear chat history in parent component
    window.location.reload();
  };

  const handleDeleteChat = (id) => {
    setChatHistory(chatHistory.filter(chat => chat.id !== id));
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'w-64' : 'w-0'
        } bg-gradient-to-b from-slate-900/80 to-purple-900/80 backdrop-blur-xl border-r border-purple-500/30 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16">
              <img 
                src="/truck/truck_logo.png" 
                alt="Truck Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Copilot</h2>
              <p className="text-xs text-gray-400">Fleet AI</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-3">
            Chat History
          </h3>
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className="group p-3 hover:bg-purple-500/20 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {chat.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {chat.timestamp}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteChat(chat.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-purple-500/20 mx-4"></div>

        {/* Settings and Logout */}
        <div className="p-4 space-y-2">
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors text-gray-300 hover:text-white flex items-center gap-3 text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>

          <button
            onClick={onLogout}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-300 hover:text-red-400 flex items-center gap-3 text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Overlay when sidebar is open on mobile */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/50 lg:hidden"
        />
      )}
    </>
  );
}