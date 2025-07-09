import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import authAxios from "../api/authAxios";
import { useNavigate } from "react-router-dom";

const SpotlightCard = ({ children, className = "", spotlightColor = "rgba(255, 255, 255, 0.25)", onClick }) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(0.6);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(0.6);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden p-8 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 hover:-translate-y-1 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
};

const ChatPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [showPdfUpload, setShowPdfUpload] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setIsSessionsLoading(true);
      const response = await authAxios.get("/api/sessions");
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await authAxios.post("/api/pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadedFile(response.data.collection_name);
      setUploadSuccess(true);
      setShowPdfUpload(false);
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      setIsSessionLoading(true);
      

      // Try to get session details first
      const sessionResponse = await authAxios.get(`/api/sessions/${sessionId}`);
      
      setCurrentSession({
        _id: sessionResponse.data.session_id,
        name: sessionResponse.data.title,
        created_at: sessionResponse.data.created_at
      });
      // Ensure uploadedFile is set so chat input is enabled
      setUploadedFile(sessionResponse.data.collection_name);
      
      // Try to get messages, but don't fail if they don't exist
      try {
        const messagesResponse = await authAxios.get(`/api/sessions/${sessionId}/messages`);
        setMessages(messagesResponse.data || []);
      } catch (messagesError) {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading session:", error);
      // If session not found, try to create a new one
      setCurrentSession({
        _id: sessionId,
        name: `Chat ${new Date().toLocaleString()}`,
        created_at: new Date().toISOString()
      });
      setMessages([]);
      setUploadedFile(null); // Also clear uploadedFile for new/invalid session
    } finally {
      setIsSessionLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await authAxios.delete(`/api/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.session_id !== sessionId));
      if (currentSession && currentSession._id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      // Even if delete fails, remove from local state
      setSessions(sessions.filter(s => s.session_id !== sessionId));
      if (currentSession && currentSession._id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await authAxios.post("/api/chat", {
        query: messageText,
        session_id: currentSession?._id,
      });

      const assistantMessage = {
        role: "assistant",
        content: response.data.answer,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update current session if it was created
      if (response.data.session_id && (!currentSession || !currentSession._id)) {
        setCurrentSession({ _id: response.data.session_id, name: uploadedFile ? "Untitled Chat" : "Unnamed Chat" });
        fetchSessions();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        role: "assistant",
        content: "معذرت، مجھے ایک خرابی کا سامنا کرنا پڑا۔ براہ کرم دوبارہ کوشش کریں۔",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleNewChat = () => {
    setCurrentSession({ _id: null, name: "New Chat" });
    setMessages([]);
    setUploadedFile(null);
    setShowPdfUpload(true);
  };

  const suggestionQuestions = [
    "اس کہانی کا خلاصہ کیا ہے؟",
    "اس کہانی میں اہم کردار کون کون سے ہیں؟",
    "اس کہانی سے ہمیں کیا سبق حاصل ہوتا ہے؟"
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-blue-300 flex flex-col">
        {/* Header with Logo */}
        <div className="p-4 border-b border-blue-300 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/src/assets/file.svg" alt="UrduWhiz Logo" className="w-12 h-12" />
              <h1 className="text-2xl font-bold text-blue-800">UrduWhiz</h1>
            </div>
          </div>
        </div>

        {/* Recent Chats Header */}
        <div className="p-4 border-b border-blue-300 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-blue-800">Recent Chats</h3>
            <button
              onClick={handleNewChat}
              className="px-5 py-2 bg-gradient-to-r from-navy-600 to-navy-700 text-white rounded-lg hover:from-navy-700 hover:to-navy-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-base font-medium"
              title="New Chat"
            >
              New Chat
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {isSessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-blue-600">Loading sessions...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                    currentSession?._id === session.session_id
                      ? "bg-navy-600 text-white"
                      : "bg-gray-50 hover:bg-navy-100 text-blue-800"
                  }`}
                  onClick={() => loadSession(session.session_id)}
                >
                  <span className="text-sm truncate flex-1">{session.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.session_id);
                    }}
                    className={`opacity-0 group-hover:opacity-100 ml-2 p-1 rounded transition-all ${
                      currentSession?._id === session.session_id
                        ? "text-white hover:bg-navy-700"
                        : "text-gray-600 hover:bg-navy-200"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No chats yet. Start a new conversation!
                </p>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-blue-300 bg-white">
          <div className="relative">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-navy-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-800 truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500">User</p>
              </div>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            
            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-blue-100">
        {/* Chat Header */}
        <div className="p-6 border-b border-blue-300 bg-white">
          <h2 className="text-xl font-semibold text-blue-800">
            {currentSession ? currentSession.name : "New Chat"}
          </h2>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isSessionLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-blue-600">Loading session...</span>
              </div>
            </div>
          ) : messages.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center max-w-2xl">
                {showPdfUpload ? (
                  <>
                    <p className="text-xl font-bold text-blue-700 mb-8" style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}>
                      سب سے پہلے اپنی کہانی کو پی ڈی ایف فارمیٹ میں اپ لوڈ کریں، اور پھر اس کہانی سے متعلق سوال کریں۔
                    </p>
                    {/* PDF Upload Card */}
                    <SpotlightCard
                      className="max-w-md mx-auto cursor-default"
                      spotlightColor="rgba(59, 130, 246, 0.3)"
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="hidden"
                          />
                          <div className="bg-gradient-to-r from-navy-600 to-navy-700 text-white px-8 py-4 rounded-xl hover:from-navy-700 hover:to-navy-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold">
                            {isUploading ? "...اپلوڈ ہو رہا ہے" : "پی ڈی ایف اپلوڈ کریں"}
                          </div>
                        </label>
                        {isUploading && (
                          <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <span className="text-sm"> </span>
                          </div>
                        )}
                      </div>
                    </SpotlightCard>
                  </>
                ) : (
                  <>
                    {/* Success message after PDF upload */}
                    {uploadSuccess && (
                      <div className="mb-6 text-green-700 text-lg font-bold" style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}>
                        پی ڈی ایف کامیابی سے اپلوڈ ہو گئی ہے!
                      </div>
                    )}
                    <p className="text-xl font-bold text-blue-700 mb-8" style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}>
                      کوئی تین کارڈز میں سے کوئی ایک چنیں، یا اپنا سوال خود درج کریں۔
                    </p>
                    {/* Suggestion Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {suggestionQuestions.map((question, index) => (
                        <SpotlightCard
                          key={index}
                          className="cursor-pointer"
                          onClick={() => sendMessage(question)}
                          spotlightColor="rgba(59, 130, 246, 0.3)"
                        >
                          <div className="text-center">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-blue-800 font-medium leading-relaxed text-lg" style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}>
                              {question}
                            </p>
                          </div>
                        </SpotlightCard>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="max-w-3xl p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 shadow-md">
                      <p className="whitespace-pre-wrap" style={{ fontFamily: 'Noto Nastaliq Urdu, serif', fontSize: '1.1rem' }}>
                        {message.content}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="max-w-3xl p-4 rounded-2xl bg-navy-600 text-white"
                    >
                      <p className="whitespace-pre-wrap" style={{ fontFamily: 'Noto Nastaliq Urdu, serif', fontSize: '1.1rem' }}>
                        {message.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-blue-50 text-blue-800 border border-blue-200 p-4 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>...سوچ رہا ہے</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-blue-300 bg-white">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={uploadedFile ? "...اپنا سوال یہاں لکھیں" : "...پہلے پی ڈی ایف اپ لوڈ کریں"}
              disabled={isLoading || !uploadedFile}
              className="flex-1 p-3 border border-blue-300 rounded-lg bg-blue-50 text-blue-800 placeholder-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Noto Nastaliq Urdu, serif', fontSize: '1.1rem' }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading || !uploadedFile}
              className="px-6 py-3 bg-gradient-to-r from-navy-600 to-navy-700 text-white rounded-lg hover:from-navy-700 hover:to-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;