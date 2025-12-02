import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertCircle, CheckCircle2, TrendingUp, BookOpen, Lightbulb, XCircle, Star, Copy, MessageCircle, Filter } from 'lucide-react';
import { AIAnalysisReport, CardAnalysis } from '../types';
import { Button } from './Button';
import { ChatInterface } from './ChatInterface';

interface SummaryReportProps {
  report: AIAnalysisReport;
  onRestart: () => void;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#6366f1', '#ec4899', '#14b8a6'];

export const SummaryReport: React.FC<SummaryReportProps> = ({ report, onRestart }) => {
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [chatCard, setChatCard] = useState<CardAnalysis | null>(null);

  const chartData = report.errorDistribution.map(item => ({
    name: item.type,
    value: item.count
  }));

  const filteredCards = showBookmarksOnly 
    ? report.cardAnalyses.filter(c => c.isBookmarked) 
    : report.cardAnalyses;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium uppercase">Overall Score</p>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-bold text-indigo-600">{report.overallScore}</span>
            <span className="text-slate-400 mb-1">/ 100</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium uppercase">Accuracy Rate</p>
          <div className="flex items-end gap-2 mt-2">
            <span className={`text-4xl font-bold ${report.accuracyRate > 80 ? 'text-emerald-500' : 'text-orange-500'}`}>
              {report.accuracyRate}%
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium uppercase">Difficulty</p>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-700">{report.difficultyLevel}</span>
          </div>
        </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
           <Button onClick={onRestart} variant="outline" className="w-full">
             New Session
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> Performance Analysis
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" /> AI Insights
          </h3>
          
          <div className="space-y-4">
             <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h4 className="font-semibold text-indigo-900 mb-2">Excellent Work</h4>
                <p className="text-indigo-800 text-sm leading-relaxed">{report.positiveFeedback}</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase">Common Issues</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {report.commonIssues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-slate-600">{issue}</li>
                    ))}
                  </ul>
                </div>
                 <div>
                  <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase">Recommendations</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {report.suggestions.map((sug, idx) => (
                      <li key={idx} className="text-sm text-slate-600">{sug}</li>
                    ))}
                  </ul>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Detailed Card Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <BookOpen className="w-5 h-5 text-slate-500" />
             <h3 className="text-lg font-bold text-slate-800">Detailed Review</h3>
           </div>
           
           <button 
             onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showBookmarksOnly 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
             }`}
           >
             <Filter className="w-4 h-4" />
             {showBookmarksOnly ? 'Showing Bookmarks' : 'Show Bookmarks Only'}
           </button>
        </div>
        
        <div className="divide-y divide-slate-100">
          {filteredCards.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No cards found {showBookmarksOnly ? 'in bookmarks' : ''}.
            </div>
          ) : (
            filteredCards.map((card, index) => (
              <CardReviewItem 
                key={index} 
                card={card} 
                index={index} 
                onOpenChat={(c) => setChatCard(c)}
              />
            ))
          )}
        </div>
      </div>

      {chatCard && (
        <ChatInterface 
            card={chatCard} 
            report={report} 
            onClose={() => setChatCard(null)} 
        />
      )}
    </div>
  );
};

interface CardReviewItemProps {
    card: CardAnalysis;
    index: number;
    onOpenChat: (card: CardAnalysis) => void;
}

const CardReviewItem: React.FC<CardReviewItemProps> = ({ card, index, onOpenChat }) => {
  const isPassed = card.status === 'Passed';
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  
  const handleCopy = () => {
    const textToCopy = `中文原文：${card.chinese}\n\nDetailed Review:\nUser: ${card.userInput}\nBetter Way: ${card.improvedVersion}\n\nAI Feedback: ${card.feedback}`;
    navigator.clipboard.writeText(textToCopy);
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors group relative">
      <div className="flex flex-col gap-4">
        
        {/* Header: Chinese & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
           <div>
             <span className="font-mono text-xs text-slate-400 mb-1 block">Card {index + 1}</span>
             <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {card.chinese}
                {card.isBookmarked && <Star className="w-4 h-4 text-amber-400 fill-current" />}
             </h4>
           </div>
           
           <div className="flex items-center gap-2">
             <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${isPassed ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
               {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
               {card.status === 'Passed' ? '通过' : '未通过'}
             </span>
             <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
               {card.errorType}
             </span>
           </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* User Input */}
          <div className={`p-4 rounded-xl border ${isPassed ? 'bg-white border-slate-200' : 'bg-red-50 border-red-100'}`}>
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
               你的回答
             </span>
             <p className={`text-base font-medium ${isPassed ? 'text-slate-700' : 'text-red-700'}`}>
               {card.userInput || <span className="text-slate-400 italic">(Empty/Skipped)</span>}
             </p>
          </div>

          {/* Improved Version */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
             <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block mb-2">
               建议优化 (Better Way)
             </span>
             <p className="text-base font-medium text-emerald-900">
               {card.improvedVersion}
             </p>
          </div>
        </div>

        {/* AI Feedback */}
        <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex gap-2">
            <Lightbulb className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div className="w-full">
              <span className="font-semibold text-slate-700 text-sm block mb-1">AI 点评</span>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                {card.feedback}
              </p>
              
              <div className="flex items-center gap-3 mt-2 border-t border-slate-200 pt-3">
                  <button 
                    onClick={() => onOpenChat(card)}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm hover:shadow"
                  >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Ask AI about this
                  </button>

                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors ml-auto"
                  >
                      {showCopyFeedback ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Copied!
                          </span>
                      ) : (
                          <>
                              <Copy className="w-3.5 h-3.5" /> Copy Analysis
                          </>
                      )}
                  </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};