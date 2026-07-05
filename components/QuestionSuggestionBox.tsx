"use client";

import { useState, useEffect } from "react";

interface SuggestedQuestion {
  id: string;
  text: string;
  votes: number;
  timestamp: number;
}

interface AskedQuestion {
  episode: number;
  question: string;
  date: string;
  url: string;
}

interface QuestionSuggestionBoxProps {
  existingQuestions: string[]; // List of already used questions from data.json
}

export default function QuestionSuggestionBox({ existingQuestions }: QuestionSuggestionBoxProps) {
  const [question, setQuestion] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<AskedQuestion[]>([]);
  const [matchedEpisode, setMatchedEpisode] = useState<AskedQuestion | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set());

  // Load suggested questions from Google Sheets on mount
  useEffect(() => {
    fetchQuestionsFromSheet();
    fetchAskedQuestionsFromSheet();

    const voted = localStorage.getItem("votedQuestions");
    if (voted) {
      setVotedQuestions(new Set(JSON.parse(voted)));
    }
  }, []);

  // Fetch suggested questions from Google Sheets
  const fetchQuestionsFromSheet = async () => {
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
      if (!scriptUrl) {
        console.error("Google Sheets URL not configured");
        return;
      }

      const response = await fetch(`${scriptUrl}?action=get`);
      const data = await response.json();
      
      if (data.questions) {
        setSuggestedQuestions(data.questions);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  };

  // Fetch previously asked questions from Google Sheets
  const fetchAskedQuestionsFromSheet = async () => {
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
      if (!scriptUrl) return;

      const response = await fetch(`${scriptUrl}?action=getAskedQuestions`);
      const data = await response.json();
      
      if (data.questions) {
        setAskedQuestions(data.questions);
      }
    } catch (error) {
      console.error("Failed to fetch asked questions:", error);
    }
  };

  // Save question to Google Sheets
  const saveQuestionToSheet = async (newQuestion: SuggestedQuestion) => {
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
      if (!scriptUrl) {
        console.error("Google Sheets URL not configured");
        return false;
      }

      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
          // no-cors only allows "simple" content types — application/json gets
          // blocked by the browser, so the request never reached the sheet
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'add',
          question: newQuestion,
        }),
      });

      // Note: no-cors mode doesn't allow reading response, so we assume success
      return true;
    } catch (error) {
      console.error("Failed to save question:", error);
      return false;
    }
  };

  // Update vote in Google Sheets
  const updateVoteInSheet = async (id: string, newVotes: number) => {
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
      if (!scriptUrl) return;

      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'vote',
          id: id,
          votes: newVotes,
        }),
      });
    } catch (error) {
      console.error("Failed to update vote:", error);
    }
  };

  const validateQuestion = (text: string): string | null => {
    const trimmed = text.trim();
    setMatchedEpisode(null);

    // Check if empty
    if (!trimmed) {
      return "Question cannot be empty";
    }

    // Check if ends with question mark
    if (!trimmed.endsWith("?")) {
      return "Question must end with a question mark (?)";
    }

    // Check for duplicates in Google Sheets asked questions (from database)
    const normalizedText = trimmed.toLowerCase();
    const matchedAskedQuestion = askedQuestions.find(
      (q) => {
        const qLower = q.question.toLowerCase();
        return qLower.includes(normalizedText) || normalizedText.includes(qLower) || qLower === normalizedText;
      }
    );

    if (matchedAskedQuestion) {
      setMatchedEpisode(matchedAskedQuestion);
      return `This question was already asked in Episode #${matchedAskedQuestion.episode}!`;
    }

    // Check for duplicates in existing questions (case-insensitive)
    const isDuplicateExisting = existingQuestions.some(
      (q) => q.toLowerCase().includes(normalizedText) || normalizedText.includes(q.toLowerCase())
    );

    if (isDuplicateExisting) {
      return "This question has already been asked!";
    }

    // Check for duplicates in suggested questions
    const isDuplicateSuggested = suggestedQuestions.some(
      (q) => q.text.toLowerCase() === normalizedText
    );

    if (isDuplicateSuggested) {
      return "This question has already been suggested!";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateQuestion(question);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newQuestion: SuggestedQuestion = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: question.trim(),
      votes: 0,
      timestamp: Date.now(),
    };

    // Save to Google Sheets
    const saved = await saveQuestionToSheet(newQuestion);
    if (!saved) {
      setError("Couldn't submit right now — please try again in a moment.");
      return;
    }

    // Update local state (optimistic update)
    setSuggestedQuestions([...suggestedQuestions, newQuestion]);
    setSuccess("Question submitted successfully!");
    setQuestion("");

    // Refresh from Google Sheets after a delay to get latest data
    setTimeout(() => {
      fetchQuestionsFromSheet();
      setSuccess("");
    }, 2000);
  };

  const handleVote = async (id: string) => {
    if (votedQuestions.has(id)) {
      return; // Already voted
    }

    // Find the question and update vote count
    const questionToUpdate = suggestedQuestions.find(q => q.id === id);
    if (!questionToUpdate) return;

    const newVotes = questionToUpdate.votes + 1;

    // Optimistic update
    setSuggestedQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, votes: newVotes } : q))
    );

    const newVotedQuestions = new Set(votedQuestions);
    newVotedQuestions.add(id);
    setVotedQuestions(newVotedQuestions);
    localStorage.setItem("votedQuestions", JSON.stringify([...newVotedQuestions]));

    // Update in Google Sheets
    await updateVoteInSheet(id, newVotes);
  };

  const sortedQuestions = [...suggestedQuestions].sort((a, b) => b.votes - a.votes);
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="border-b-2 border-white bg-black">
      <div className="container mx-auto px-4 py-3">
        {/* Compact Submit Question Section */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <h2 className="text-lg font-bold text-vintage-yellow whitespace-nowrap">
            SUGGEST A QUESTION:
          </h2>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row items-stretch gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setError("");
              }}
              placeholder="Type your question here..."
              className="flex-1 px-3 py-2 bg-black text-white border-2 border-white focus:border-vintage-yellow outline-none text-base"
              maxLength={200}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-vintage-yellow text-black font-bold border-2 border-white glossy-btn hover:bg-vintage-green transition-colors text-sm whitespace-nowrap"
            >
              SUBMIT
            </button>
          </form>
          
          {sortedQuestions.length > 0 && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="px-4 py-2 bg-white text-black font-bold border-2 border-white glossy-btn hover:bg-vintage-yellow transition-colors text-sm whitespace-nowrap"
            >
              {showSuggestions ? '▲ HIDE' : '▼ VIEW'} ({sortedQuestions.length})
            </button>
          )}
        </div>

        {/* Compact status messages */}
        {error && (
          <div className="mt-2 p-2 border-2 border-vintage-red bg-black">
            <p className="text-vintage-red font-bold text-sm">❌ {error}</p>
            {matchedEpisode && (
              <a
                href={matchedEpisode.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block px-3 py-1 bg-vintage-yellow text-black font-bold border-2 border-white glossy-btn hover:bg-white transition-colors text-xs"
              >
                [WATCH EPISODE #{matchedEpisode.episode}]
              </a>
            )}
          </div>
        )}

        {success && (
          <div className="mt-2 p-2 border-2 border-vintage-green bg-black">
            <p className="text-vintage-green font-bold text-sm">✓ {success}</p>
          </div>
        )}

        {/* Dropdown Suggested Questions List */}
        {showSuggestions && sortedQuestions.length > 0 && (
          <div className="mt-3 border-2 border-white bg-black p-3 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {sortedQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className="border border-white p-2 flex items-center justify-between gap-2 hover:border-vintage-yellow transition-colors"
                >
                  <div className="flex-1 flex items-start gap-2">
                    <span className="text-vintage-yellow font-bold text-sm">
                      #{index + 1}
                    </span>
                    <p className="text-white font-bold flex-1 text-sm">{q.text}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <p className="text-vintage-yellow font-bold text-lg">{q.votes}</p>
                      <p className="text-xs text-white font-bold">
                        {q.votes === 1 ? "VOTE" : "VOTES"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleVote(q.id)}
                      disabled={votedQuestions.has(q.id)}
                      className={`px-3 py-1 font-bold border-2 transition-colors text-xs ${
                        votedQuestions.has(q.id)
                          ? "bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed"
                          : "bg-vintage-green text-black border-white hover:bg-vintage-yellow"
                      }`}
                    >
                      {votedQuestions.has(q.id) ? "✓" : "VOTE"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
