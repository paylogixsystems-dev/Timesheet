import React, { useState } from 'react';
import { Wand2, Loader2, Check } from 'lucide-react';
import { parseNaturalLanguageTimesheet } from '../services/geminiService';
import { AIParseResult } from '../types';

interface SmartEntryProps {
  onParsed: (result: AIParseResult) => void;
  referenceDate: string; // YYYY-MM-DD representing the start of the period
}

export const SmartEntry: React.FC<SmartEntryProps> = ({ onParsed, referenceDate }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSmartFill = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await parseNaturalLanguageTimesheet(input, referenceDate);
      onParsed(result);
      setInput('');
    } catch (err) {
      setError("Failed to parse. Please try again or fill manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 mb-8">
      <div className="flex items-center gap-2 mb-3 text-indigo-900">
        <Wand2 className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold">AI Smart Fill</h3>
      </div>
      <p className="text-sm text-indigo-600 mb-4">
        Describe your work naturally (e.g., "I worked 8 hours on Project Phoenix on the 5th doing UI design, and took sick leave on the 6th")
      </p>
      <div className="flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your work summary here..."
          className="flex-1 p-3 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-20 text-sm"
        />
        <button
          onClick={handleSmartFill}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex flex-col items-center justify-center min-w-[100px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span className="font-medium">Auto-Fill</span>
            </>
          )}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};