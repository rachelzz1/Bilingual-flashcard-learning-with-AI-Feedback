import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { FlashcardMode } from './components/FlashcardMode';
import { SummaryReport } from './components/SummaryReport';
import { AppStep, FlashcardData, UserResult, AIAnalysisReport } from './types';
import { generateStudySummary } from './services/geminiService';
import { BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('upload');
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [results, setResults] = useState<UserResult[]>([]);
  const [report, setReport] = useState<AIAnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleDataLoaded = (data: FlashcardData[]) => {
    setCards(data);
    setStep('study');
  };

  const handleSessionComplete = async (sessionResults: UserResult[]) => {
    setResults(sessionResults);
    setIsAnalyzing(true);
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const aiReport = await generateStudySummary(sessionResults);
      setReport(aiReport);
      setStep('summary');
    } catch (error) {
      alert("Failed to generate AI report. Please check your API key and try again.");
      // In a real app, handle error state better
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRestart = () => {
    setStep('upload');
    setCards([]);
    setResults([]);
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-8 h-8 text-indigo-600" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                LingoFlash AI
              </span>
            </div>
            <div className="flex items-center gap-4">
              {step === 'study' && (
                <span className="text-sm text-slate-500 font-medium">Session in progress</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {step === 'upload' && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl mb-4">
                Master English with AI Feedback
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Upload your Chinese-English vocabulary list, practice with interactive flashcards, and get instant, detailed analysis from Gemini AI on your translation accuracy.
              </p>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        )}

        {step === 'study' && (
          <>
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <BrainCircuit className="w-10 h-10 text-indigo-600 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Analyzing Your Performance</h2>
                <p className="text-slate-500">Gemini is reviewing your answers and generating feedback...</p>
              </div>
            ) : (
              <FlashcardMode cards={cards} onComplete={handleSessionComplete} />
            )}
          </>
        )}

        {step === 'summary' && report && (
          <SummaryReport report={report} onRestart={handleRestart} />
        )}

      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} LingoFlash AI. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;