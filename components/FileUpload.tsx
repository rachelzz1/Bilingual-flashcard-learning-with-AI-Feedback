import React, { useState } from 'react';
import { Upload, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { FlashcardData } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: FlashcardData[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mapItemToCard = (item: any, index: number): FlashcardData | null => {
    if (!item) return null;

    // Helper to find content regardless of casing
    const getVal = (obj: any, keys: string[]) => {
      for (const k of keys) {
        if (obj[k] !== undefined) return obj[k];
        // simple case insensitive check
        const match = Object.keys(obj).find(key => key.toLowerCase() === k.toLowerCase());
        if (match) return obj[match];
      }
      return undefined;
    };

    const chinese = getVal(item, ['chinese', 'front', 'term', 'question', 'zh', 'cn']);
    const english = getVal(item, ['english', 'back', 'definition', 'answer', 'en']);

    if (chinese && english) {
      return { id: `card-${index}`, chinese: String(chinese), english: String(english) };
    }

    // Fallback: Array-like or just use first 2 keys
    if (Array.isArray(item) && item.length >= 2) {
      return { id: `card-${index}`, chinese: String(item[0]), english: String(item[1]) };
    }

    const keys = Object.keys(item);
    if (keys.length >= 2) {
      // Heuristic: First key is Chinese/Question, Second is English/Answer
      return { id: `card-${index}`, chinese: String(item[keys[0]]), english: String(item[keys[1]]) };
    }

    return null;
  };

  const parseInput = () => {
    setError(null);
    const trimmedInput = textInput.trim();
    
    if (!trimmedInput) {
      setError("Please enter some data.");
      return;
    }

    let parsedData: FlashcardData[] = [];

    try {
      // 1. Try Full JSON Array
      if (trimmedInput.startsWith('[')) {
        try {
          const json = JSON.parse(trimmedInput);
          if (Array.isArray(json)) {
            parsedData = json.map((item, i) => mapItemToCard(item, i)).filter(x => x !== null) as FlashcardData[];
          }
        } catch (e) {
          console.debug("Failed to parse as JSON Array, trying line-by-line", e);
        }
      }

      // 2. Line-by-line parsing (NDJSON or CSV)
      if (parsedData.length === 0) {
        const lines = trimmedInput.split('\n').filter(line => line.trim() !== '');
        
        parsedData = lines.map((line, index) => {
          const trimmedLine = line.trim();
          
          // 2a. Try JSON Object per line
          if (trimmedLine.startsWith('{')) {
            try {
              // Remove trailing comma if present (common when copying from code)
              const cleanLine = trimmedLine.replace(/,$/, '');
              const item = JSON.parse(cleanLine);
              return mapItemToCard(item, index);
            } catch (e) {
              // Fallthrough to CSV
            }
          }

          // 2b. CSV Fallback
          // Split by tab or comma (handling quotes)
          const parts = trimmedLine.includes('\t') 
            ? trimmedLine.split('\t') 
            : trimmedLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
          if (parts.length < 2) return null;
          
          return {
            id: `card-${index}`,
            chinese: parts[0].replace(/^"|"$/g, '').trim(),
            english: parts[1].replace(/^"|"$/g, '').trim()
          };
        }).filter(item => item !== null) as FlashcardData[];
      }

      if (parsedData.length === 0) {
        setError("Could not parse valid flashcards. Please check format.");
        return;
      }

      onDataLoaded(parsedData);
    } catch (e) {
      console.error(e);
      setError("Parsing error. Please ensure valid JSON or CSV format.");
    }
  };

  const loadDemoData = () => {
    const demo = [
      { id: '1', chinese: '你好', english: 'Hello' },
      { id: '2', chinese: '这也是一个测试', english: 'This is also a test' },
      { id: '3', chinese: '人工智能改变世界', english: 'Artificial intelligence changes the world' },
      { id: '4', chinese: '保持饥渴，保持愚蠢', english: 'Stay hungry, stay foolish' },
      { id: '5', chinese: '千里之行始于足下', english: 'A journey of a thousand miles begins with a single step' }
    ];
    onDataLoaded(demo);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-slate-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Import Flashcards</h2>
        <p className="text-slate-500 mt-2">Paste your bilingual list below (CSV, JSON Array, or JSON Lines)</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Data Format Examples:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs font-mono text-slate-600">
                <p className="font-bold text-slate-800 mb-1">CSV:</p>
                你好, Hello<br/>
                世界, World
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs font-mono text-slate-600">
                <p className="font-bold text-slate-800 mb-1">JSON:</p>
                &#123;"chinese": "你好", "english": "Hello"&#125;<br/>
                &#123;"front": "Cat", "back": "猫"&#125;
            </div>
        </div>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste your content here..."
          className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none font-mono text-sm"
        />
        {error && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><span className="font-bold">Error:</span> {error}</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <button 
          onClick={loadDemoData}
          className="text-sm text-slate-500 hover:text-indigo-600 underline"
        >
          Load Demo Data
        </button>
        <Button onClick={parseInput} className="w-full sm:w-auto">
          Start Learning <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
