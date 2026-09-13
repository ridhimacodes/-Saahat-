import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  Compass, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  Bot,
  Minimize2,
  Maximize2,
  RefreshCw,
  Info
} from 'lucide-react';
import { RouteOption, TimeOfDay } from '../types';
import { getAssistantResponse, AssistantMessage } from '../services/assistantService';

interface SaahatAssistantProps {
  activePage: string;
  selectedRoute?: RouteOption | null;
  origin?: string;
  destination?: string;
  timeOfDay: TimeOfDay;
  isLowSignalGlobal: boolean;
  onTriggerSOS: () => void;
}

const INITIAL_MESSAGES: AssistantMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: "Hi, I'm your Saahat Assistant — ask me anything about your journey, lighting, or safety features!",
    timestamp: 'Just now',
    quickReplies: [
      "Why is this route rated high?",
      "What does Low Signal Mode do?",
      "How does Share ETA work?",
      "Is this route well-lit?"
    ]
  }
];

export const SaahatAssistant: React.FC<SaahatAssistantProps> = ({
  activePage,
  selectedRoute,
  origin,
  destination,
  timeOfDay,
  isLowSignalGlobal,
  onTriggerSOS
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      // Small timeout to focus input after opening
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Realistic typing indicator delay (500ms - 900ms)
    setTimeout(async () => {
      try {
        const response = await getAssistantResponse(query, {
          activePage,
          selectedRoute,
          origin,
          destination,
          timeOfDay,
          isLowSignalGlobal
        });

        const assistantMsg: AssistantMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: response.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSOSPrompt: response.isSOSPrompt,
          quickReplies: response.quickReplies
        };

        setMessages(prev => [...prev, assistantMsg]);
      } catch (err) {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            sender: 'assistant',
            text: "I'm having a little trouble connecting, but I'm right here. For immediate safety concerns, please tap the SOS button!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSOSPrompt: true
          }
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmergencySOSClick = () => {
    onTriggerSOS();
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* Floating Chat Bubble - Bottom-Left corner (opposite side from SOS button on bottom-right) */}
      <div className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all border-2 ${
            isLowSignalGlobal
              ? 'bg-slate-900 border-amber-400 text-amber-400 shadow-amber-500/20'
              : 'bg-gradient-to-tr from-[#6C2BD9] via-[#8B5CF6] to-[#FF4D8D] border-white/90 text-white shadow-purple-600/40'
          }`}
          aria-label="Open Saahat Assistant"
          title="Saahat Assistant"
        >
          {/* Subtle Glow Ring */}
          <span className="absolute inset-0 rounded-full bg-pink-500 animate-ping opacity-20 pointer-events-none" />

          {/* Compass / Saahat Logo mark Avatar */}
          <div className="relative z-10 flex items-center justify-center">
            {isOpen ? (
              <X className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <div className="relative">
                <Compass className="w-7 h-7 stroke-[2.2] animate-spin-slow" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
            )}
          </div>

          {/* Unread badge if any */}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full border border-white">
              {unreadCount}
            </span>
          )}

          {/* Mobile tooltip pill */}
          {!isOpen && (
            <div className="hidden lg:block absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold whitespace-nowrap backdrop-blur-sm pointer-events-none shadow-lg border border-slate-700/50">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Saahat Assistant
              </span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Floating Clean Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`fixed bottom-24 left-4 sm:bottom-24 sm:left-6 z-50 w-[calc(100vw-2rem)] sm:w-[390px] h-[540px] max-h-[75vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
              isLowSignalGlobal
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-white border-purple-100/80 text-slate-900'
            }`}
          >
            {/* Header: Purple-to-Pink Branding */}
            <div className={`p-4 flex items-center justify-between text-white relative ${
              isLowSignalGlobal
                ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800'
                : 'bg-gradient-to-r from-[#6C2BD9] via-[#8B5CF6] to-[#FF4D8D]'
            }`}>
              <div className="flex items-center gap-3">
                {/* Assistant Avatar Icon */}
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-base tracking-tight leading-tight">Saahat Assistant</h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-purple-100/90 font-medium">
                    AI Journey & Safety Companion
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-white/80">
                <button
                  onClick={handleResetChat}
                  title="Reset conversation"
                  className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Active Context Banner */}
            <div className={`px-4 py-1.5 text-[11px] flex items-center justify-between border-b ${
              isLowSignalGlobal
                ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                : 'bg-purple-50/70 border-purple-100 text-slate-600'
            }`}>
              <div className="flex items-center gap-1.5 truncate">
                <Info className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <span className="truncate">
                  {selectedRoute 
                    ? `Context: ${selectedRoute.name.split('—')[0].trim()} (${selectedRoute.comfortScore.toFixed(1)}/10)`
                    : `Active Screen: ${activePage.toUpperCase()}`
                  }
                </span>
              </div>
              <span className="font-semibold text-purple-700 capitalize flex-shrink-0 text-[10px] ml-2">
                {timeOfDay}
              </span>
            </div>

            {/* Chat Messages Log */}
            <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 text-sm ${
              isLowSignalGlobal ? 'bg-slate-950' : 'bg-gradient-to-b from-purple-50/30 via-white to-white'
            }`}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {/* Bot avatar next to assistant messages */}
                    {msg.sender === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center flex-shrink-0 mb-1 shadow-sm">
                        <Compass className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`px-3.5 py-2.5 rounded-2xl leading-relaxed text-[13px] ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm shadow-md'
                          : isLowSignalGlobal
                          ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm shadow-sm'
                          : 'bg-white border border-purple-100 text-slate-800 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.text}

                      {/* Distress / SOS Prompt Button */}
                      {msg.isSOSPrompt && (
                        <div className="mt-3 pt-2.5 border-t border-rose-200/60 dark:border-rose-900/60 flex flex-col gap-2">
                          <button
                            onClick={handleEmergencySOSClick}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/40 hover:from-rose-500 hover:to-red-500 transition-all active:scale-98 animate-pulse"
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-200" />
                            <span>OPEN SOS EMERGENCY CONSOLE</span>
                          </button>
                          <span className="text-[10px] text-rose-500 font-bold text-center">
                            Tap to trigger one-tap police dispatch & alert contacts
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>

                  {/* Quick replies for fast mobile tapping */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                      {msg.quickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (reply === "Open SOS Emergency" || reply === "Show SOS console") {
                              handleEmergencySOSClick();
                            } else {
                              handleSendMessage(reply);
                            }
                          }}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all text-left ${
                            reply.toLowerCase().includes("sos")
                              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                              : isLowSignalGlobal
                              ? 'bg-slate-900 border-slate-700 text-purple-300 hover:bg-slate-800'
                              : 'bg-purple-50/80 border-purple-200 text-purple-800 hover:bg-purple-100 hover:border-purple-300'
                          }`}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator Animation */}
              {isTyping && (
                <div className="flex items-center gap-2 max-w-[85%]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                  </div>
                  <div className={`px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5 ${
                    isLowSignalGlobal ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-purple-100'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" />
                    <span className="text-[11px] text-slate-400 font-medium ml-1">Saahat is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input & Send Area */}
            <div className={`p-3 border-t flex items-center gap-2 ${
              isLowSignalGlobal
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-purple-100'
            }`}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this route, lighting, or features..."
                className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition-all ${
                  isLowSignalGlobal
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400'
                    : 'bg-purple-50/50 border-purple-200 text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:bg-white'
                }`}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                  inputValue.trim() && !isTyping
                    ? 'bg-gradient-to-r from-[#6C2BD9] to-[#FF4D8D] text-white shadow-md hover:scale-105 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
