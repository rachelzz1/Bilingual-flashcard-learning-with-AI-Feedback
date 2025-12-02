import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, ChevronRight, ArrowRight, ArrowLeft, SkipForward, Star } from 'lucide-react';
import { Button } from './Button';
import { FlashcardData, UserResult } from '../types';

interface FlashcardModeProps {
  cards: FlashcardData[];
  onComplete: (results: UserResult[]) => void;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({ cards, onComplete }) => {
  // Queue of card INDICES to process. 
  // Initially [0, 1, ... n]. Can be replaced by skipped indices on retry.
  const [queue, setQueue] = useState<number[]>(cards.map((_, i) => i));
  const [queueIndex, setQueueIndex] = useState(0);

  // Store results keyed by Card ID so we can revisit/overwrite them
  const [results, setResults] = useState<Record<string, UserResult>>({});

  const [isFlipped, setIsFlipped] = useState(false);
  const [input, setInput] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Derived state
  const currentCardIndex = queue[queueIndex];
  const currentCard = cards[currentCardIndex];
  const progress = ((queueIndex) / queue.length) * 100;

  // Calculate skipped count dynamically from results
  const skippedCount = cards.filter(c => results[c.id]?.isSkipped).length;

  useEffect(() => {
    // When changing cards, load existing input if we visited this card before
    if (currentCard) {
      const existingResult = results[currentCard.id];
      setInput(existingResult ? existingResult.userInput : '');
      setIsBookmarked(existingResult ? existingResult.isBookmarked : false);
      
      // Auto-focus input if not flipped
      if (!isFlipped) {
        // Small timeout to allow render to complete
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [currentCard, results, isFlipped]);

  // Check if we should auto-finish (if prompt is shown but no skipped cards exist)
  useEffect(() => {
    if (showRetryPrompt && skippedCount === 0) {
      handleFinish();
    }
  }, [showRetryPrompt, skippedCount]);

  const saveCurrentResult = (skipped: boolean, currentInput: string = input, currentBookmark: boolean = isBookmarked) => {
    const result: UserResult = {
      cardId: currentCard.id,
      chinese: currentCard.chinese,
      correctEnglish: currentCard.english,
      userInput: currentInput,
      isSkipped: skipped,
      isBookmarked: currentBookmark
    };
    
    setResults(prev => ({
      ...prev,
      [currentCard.id]: result
    }));
  };

  const toggleBookmark = () => {
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    // Update result immediately so it persists even if we don't submit/skip yet
    saveCurrentResult(false, input, newState);
  };

  const handlePrevious = () => {
    if (queueIndex > 0) {
      setIsFlipped(false);
      setQueueIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    saveCurrentResult(true);
    goToNextCard();
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    saveCurrentResult(false);
    setIsFlipped(true);
  };

  const goToNextCard = () => {
    if (queueIndex < queue.length - 1) {
      setIsFlipped(false);
      setQueueIndex(prev => prev + 1);
    } else {
      // End of current queue
      setIsFlipped(false);
      setShowRetryPrompt(true);
    }
  };

  const handleRetry = () => {
    // Find all indices of cards that are marked as skipped
    const skippedIndices = cards
      .map((_, idx) => idx)
      .filter(idx => {
         const cardId = cards[idx].id;
         // It is skipped if explicitly marked skipped OR if no result exists yet (shouldn't happen in linear flow but safe to check)
         return results[cardId]?.isSkipped;
      });

    if (skippedIndices.length > 0) {
      setQueue(skippedIndices);
      setQueueIndex(0);
      setShowRetryPrompt(false);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    // Flatten results to array, ensuring order matches original cards
    // Fill in any gaps (unlikely) with skipped
    const finalResults = cards.map(card => {
      return results[card.id] || {
        cardId: card.id,
        chinese: card.chinese,
        correctEnglish: card.english,
        userInput: "",
        isSkipped: true,
        isBookmarked: false
      };
    });
    onComplete(finalResults);
  };

  if (showRetryPrompt && skippedCount > 0) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-slate-100 text-center animate-fade-in-up">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <RotateCw className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Review Skipped Cards?</h2>
        <p className="text-slate-500 mb-8">
          You skipped <span className="font-bold text-slate-800">{skippedCount}</span> cards. 
          Would you like to try them again before generating your report?
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={handleRetry} className="w-full justify-center">
            Yes, Practice Skipped Cards
          </Button>
          <button 
            onClick={handleFinish}
            className="text-slate-500 hover:text-slate-800 font-medium py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors"
          >
            No, Generate Summary Report
          </button>
        </div>
      </div>
    );
  }

  // Guard against out of bounds (should not happen due to effects)
  if (!currentCard) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
          <span>Card {queueIndex + 1} of {queue.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${((queueIndex + 1) / queue.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Card Container */}
      <div className="relative h-[450px] w-full perspective-1000 mb-8">
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front of Card (Question) */}
          <div className="absolute w-full h-full backface-hidden bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex flex-col">
            
            {/* Top Navigation Row */}
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={handlePrevious}
                disabled={queueIndex === 0}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  queueIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-indigo-600'
                }`}
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleBookmark}
                  title="Bookmark this card"
                  className={`transition-colors p-1 rounded-full ${isBookmarked ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
                >
                  <Star className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={handleSkip}
                  className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  Skip <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Translate to English</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-800 text-center leading-tight mb-8">
                {currentCard.chinese}
              </h2>
              
              <div className="w-full max-w-md">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Type your English translation here..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors resize-none text-lg text-center text-slate-800 placeholder:text-slate-400"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <Button onClick={handleSubmit} disabled={!input.trim()} className="w-full sm:w-auto min-w-[200px]">
                Submit Answer
              </Button>
            </div>
          </div>

          {/* Back of Card (Answer) */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex flex-col overflow-y-auto">
             <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                 <div className="w-8"></div> {/* Spacer */}
                <h3 className="text-slate-500 font-medium uppercase tracking-wider text-sm">Results Comparison</h3>
                <button
                  onClick={toggleBookmark}
                  title="Bookmark this card"
                  className={`transition-colors p-1 rounded-full ${isBookmarked ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
                >
                  <Star className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
             </div>

            <div className="flex-1 flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <div className="flex items-center gap-2 mb-2 text-slate-500 font-medium text-xs uppercase tracking-wide">
                     <span className="w-2 h-2 rounded-full bg-slate-400"></span> Original Chinese
                   </div>
                   <p className="text-xl text-slate-800 font-bold">{currentCard.chinese}</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                   <div className="flex items-center gap-2 mb-2 text-indigo-700 font-medium text-xs uppercase tracking-wide">
                     <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Your Answer
                   </div>
                   <p className="text-lg text-slate-800 font-medium break-words">
                     {input}
                   </p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                   <div className="flex items-center gap-2 mb-2 text-emerald-700 font-medium text-xs uppercase tracking-wide">
                     <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Correct Answer
                   </div>
                   <p className="text-lg text-emerald-900 font-medium break-words">
                     {currentCard.english}
                   </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={goToNextCard} variant="secondary" className="w-full sm:w-auto">
                Next Card <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};