/**
 * AI Tutor Chat Page - Interactive chat interface with AI tutor
 * Students can ask questions and get personalized help
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { tutorApi } from '../api/services';
import type { ChatMessage } from '../types';

export const AITutorChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const subject: 'math' = 'math';

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Note: Chat history is automatically loaded from backend when first message is sent
  // The backend returns the full chat history including previous messages

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !user?.sevis_pass_id) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setError(null);

    try {
      // Note: Backend maintains chat history in the session, so we don't need to send it
      // The backend will automatically load previous messages from the chat session
      const response = await tutorApi.chat({
        sevis_pass_id: user.sevis_pass_id,
        message: userMessage.content,
        subject: subject,
      });

      if (response.status === 'success' && response.data) {
        // Update messages with the full chat history from backend
        // Backend returns 'chat_history' not 'messages'
        const chatHistory = response.data.chat_history || response.data.messages || [];
        setMessages(chatHistory);
        console.log('Chat response received:', {
          session_id: response.data.session_id,
          message_count: chatHistory.length,
          last_message: chatHistory[chatHistory.length - 1],
        });
      } else {
        throw new Error(response.message || 'Failed to get response from AI tutor');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send message';
      setError(errorMessage);
      // Remove the user message if sending failed
      setMessages((prev) => prev.slice(0, -1));
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Tutor Chat</h1>
                <p className="text-gray-600">
                  Ask me anything about {subject}! I'm here to help you learn.
                </p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear the chat history?')) {
                      setMessages([]);
                      setError(null);
                    }
                  }}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  title="Clear chat history"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-sm font-medium">Clear Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Chat Container */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col" style={{ height: '600px' }}>
            {/* Messages Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-4">🤖</div>
                  <p className="text-lg font-medium mb-2">Welcome to AI Tutor!</p>
                  <p className="text-sm">
                    Ask me any question about {subject} and I'll help you understand it better.
                  </p>
                  <p className="text-sm mt-2 text-gray-400">
                    Try asking: "How do I solve quadratic equations?" or "Explain algebra to me"
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <span className="text-xl mt-1">🤖</span>
                        )}
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🤖</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your question here..."
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

