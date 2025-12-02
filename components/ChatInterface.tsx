import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, Loader2 } from 'lucide-react';
import { CardAnalysis, AIAnalysisReport } from '../types';
import { createChatSession } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ChatInterfaceProps {
    card: CardAnalysis;
    report: AIAnalysisReport;
    onClose: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ card, report, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: 'init', 
            role: 'model', 
            text: `你好！我是你的 AI 助教。关于这张卡片 ("${card.chinese}"), 你有什么疑问吗？` 
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSessionRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize chat session when component mounts
        chatSessionRef.current = createChatSession(report, card);
    }, [report, card]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chatSessionRef.current) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
            const responseText = result.text;
            
            const aiMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                text: responseText 
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "抱歉，我现在无法回答。请稍后再试。"
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end sm:items-end pointer-events-none">
            <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={onClose} />
            
            <div className="bg-white w-full h-[80vh] sm:w-[400px] sm:h-[600px] sm:m-6 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-slide-up transform transition-all">
                {/* Header */}
                <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">AI Assistant</h3>
                            <p className="text-indigo-200 text-xs truncate max-w-[200px]">Context: {card.chinese}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                                msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                            </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask a question..."
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            disabled={isLoading}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};