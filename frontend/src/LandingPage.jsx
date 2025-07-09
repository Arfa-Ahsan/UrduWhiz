import React from "react";
import logo from "./assets/file.svg";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="flex items-center gap-3">
          <img src={logo} alt="UrduWhiz Logo" className="h-12 w-12 object-contain" />
          <span className="text-2xl font-extrabold text-navy-800 tracking-tight font-serif">UrduWhiz</span>
        </div>
        <div className="space-x-4">
                      <button
              className="px-6 py-2.5 rounded-lg font-semibold text-navy-600 border-2 border-navy-600 hover:bg-navy-600 hover:text-white transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate("/register")}
            >
              Sign Up
            </button>
            <button
              className="px-6 py-2.5 rounded-lg font-semibold text-white bg-navy-600 hover:bg-navy-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        {/* Main Hero */}
        <section className="px-8 py-16 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
              AI-Powered <span className="text-navy-600">Urdu Story</span> Learning
            </h1>
            <p className="text-xl text-gray-700 mb-6 max-w-3xl mx-auto leading-relaxed">
              Transform children's stories into interactive learning experiences. Upload scanned PDFs and chat with AI that understands Urdu, extracts meaning, and answers questions intelligently.
            </p>
          </div>

          {/* Process Timeline */}
          <div className="relative flex flex-col items-center md:flex-row md:justify-between w-full max-w-4xl mx-auto mt-16 mb-8">
            {/* Timeline line */}
            <div className="absolute md:top-1/2 md:-translate-y-1/2 top-8 left-0 right-0 h-3 rounded-full bg-gradient-to-r from-navy-600 via-blue-500 to-purple-500 z-0"></div>

            {/* Step 1 */}
            <div className="relative flex flex-col items-center z-10 w-full md:w-1/4 mb-12 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-navy-600 to-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white z-10">1</div>
              <div className="mt-8 text-center">
                <h3 className="text-lg font-bold text-navy-700">Upload PDF</h3>
                <p className="text-gray-600 text-base">Upload your scanned Urdu story PDF</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center z-10 w-full md:w-1/4 mb-12 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white z-10">2</div>
              <div className="mt-8 text-center">
                <h3 className="text-lg font-bold text-blue-700">AI Processing</h3>
                <p className="text-gray-600 text-base">OCR extracts text and AI creates summaries</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center z-10 w-full md:w-1/4 mb-12 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white z-10">3</div>
              <div className="mt-8 text-center">
                <h3 className="text-lg font-bold text-indigo-700">Vector Storage</h3>
                <p className="text-gray-600 text-base">Content is stored in intelligent vector database</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col items-center z-10 w-full md:w-1/4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-navy-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white z-10">4</div>
              <div className="mt-8 text-center">
                <h3 className="text-lg font-bold text-purple-700">Start Chatting</h3>
                <p className="text-gray-600 text-base">Ask questions and get intelligent responses</p>
              </div>
            </div>
          </div>

          {/* Get Started Button */}
          <div className="text-center mt-12 mb-12">
            <button 
              className="px-10 py-5 rounded-xl font-semibold text-white bg-navy-600 hover:bg-navy-700 transition-all duration-300 transform hover:scale-105 shadow-xl text-xl"
              onClick={() => navigate("/login")}
            >
              Get Started
            </button>
          </div>
            
            {/* Detailed Technical Process */}
            <div className="mt-16 bg-gradient-to-r from-navy-50 to-blue-50 rounded-2xl p-8 border border-navy-200">
              <h3 className="text-2xl font-bold text-navy-700 mb-6 text-center">Advanced RAG Pipeline</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/70 rounded-xl p-6 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-navy-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-navy-700">OCR Extraction</h4>
                  </div>
                  <p className="text-sm text-gray-600">Advanced OCR technology extracts Urdu text from scanned PDFs</p>
                </div>
                
                <div className="bg-white/70 rounded-xl p-6 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-purple-700">Gemini Summarization</h4>
                  </div>
                  <p className="text-sm text-gray-600">Google's Gemini 2.0 Flash creates intelligent summaries and extracts keywords</p>
                </div>
                
                <div className="bg-white/70 rounded-xl p-6 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-green-700">Smart Chunking</h4>
                  </div>
                  <p className="text-sm text-gray-600">Text is intelligently chunked and stored in high-performance vector database</p>
                </div>
                
                <div className="bg-white/70 rounded-xl p-6 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-orange-700">Hybrid Retrieval</h4>
                  </div>
                  <p className="text-sm text-gray-600">Combines vector similarity and keyword matching for relevant document retrieval</p>
                </div>
                
                <div className="bg-white/70 rounded-xl p-6 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-red-700">Re-ranking</h4>
                  </div>
                  <p className="text-sm text-gray-600">Advanced re-ranking algorithm selects the most relevant documents for context</p>
                </div>
                
                <div className="bg-white/70 rounded-xl p-6 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-indigo-700">AI Response</h4>
                  </div>
                  <p className="text-sm text-gray-600">Generates contextual, accurate answers in Urdu using Langgraph Persistence</p>
                </div>
              </div>
            </div>
          </section>

          {/* Use Cases - Changed from cards to a different layout */}
          <section className="px-8 py-16 max-w-7xl mx-auto">
            <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Who Can Benefit?</h2>
            
            {/* Parents & Educators Section */}
            <div className="mb-16">
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-navy-500 to-blue-500 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-3xl font-bold text-navy-700">Parents & Educators</h3>
              </div>
              <div className="bg-gradient-to-r from-navy-50 to-blue-50 rounded-2xl p-8 border-l-4 border-navy-500">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-navy-600 mb-3">Learning Enhancement</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-navy-500 mt-1">•</span>
                        <span>Create interactive learning experiences from traditional storybooks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-navy-500 mt-1">•</span>
                        <span>Help children understand complex Urdu vocabulary and concepts</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-navy-600 mb-3">Progress Tracking</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-navy-500 mt-1">•</span>
                        <span>Track learning progress through conversation history</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-navy-500 mt-1">•</span>
                        <span>Build a digital library of processed Urdu stories</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Children Section */}
            <div>
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-3xl font-bold text-purple-800">Children</h3>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border-l-4 border-purple-500">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-purple-700 mb-3">Interactive Learning</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Ask questions about characters, plot, and vocabulary</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Get explanations in simple, child-friendly Urdu</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-purple-700 mb-3">Skill Development</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Explore stories interactively with AI assistance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Develop reading comprehension and critical thinking</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

                    
           <div className="bg-gradient-to-r from-navy-600 to-blue-700 rounded-3xl p-12 text-white mb-16">
             <h2 className="text-3xl font-bold text-center mb-12"> AI Technology</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Gemini 2.0 Flash</h3>
                <p className="text-blue-100 text-sm">Latest Google AI for superior text extraction</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Hybrid RAG</h3>
                <p className="text-blue-100 text-sm">Vector + keyword retrieval for accuracy</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Session Memory</h3>
                <p className="text-blue-100 text-sm">Conversation history and context</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                <p className="text-blue-100 text-sm">User authentication and data protection</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="UrduWhiz Logo" className="h-8 w-8 object-contain" />
                <span className="text-xl font-bold">UrduWhiz</span>
              </div>
              <p className="text-gray-300 text-sm">
                AI-powered Urdu story learning platform for children, parents, and educators.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Smart OCR Processing</li>
                <li>Intelligent Chat</li>
                <li>Vector Database</li>
                <li>Session Management</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Use Cases</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>For Parents</li>
                <li>For Educators</li>
                <li>For Children</li>
                <li>For Schools</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} UrduWhiz. All rights reserved. Powered by advanced AI technology.
          </div>
        </div>
      </footer>
    </div>
  );
} 