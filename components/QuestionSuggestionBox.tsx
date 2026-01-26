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
          'Content-Type': 'application/json',
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
          'Content-Type': 'application/json',
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
    
    // Update local state regardless (optimistic update)
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

  return (
    <div className="max-w-4xl mx-auto my-12 px-4">
      {/* Submit Question Section */}
      <div className="bg-black border-4 border-vintage-yellow p-6 mb-8">
        <h2 className="text-2xl font-bold text-vintage-yellow-styled mb-4">
          SUGGEST A QUESTION
        </h2>
        <p className="text-white mb-4 font-bold">
          &gt;&gt; What question should we ask next?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setError("");
              }}
              placeholder="Type your question here..."
              className="w-full px-4 py-3 bg-black text-white border-2 border-white focus:border-vintage-yellow outline-none font-bold"
              maxLength={200}
            />
            <p className="text-xs text-white mt-1 font-bold">
              {question.length}/200 characters
            </p>
          </div>

          {error && (
            <div className="p-3 border-2 border-vintage-red bg-black">
              <p className="text-vintage-red font-bold">❌ {error}</p>
              {matchedEpisode && (
                <a
                  href={matchedEpisode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block px-4 py-2 bg-vintage-yellow text-black font-bold border-2 border-white hover:bg-white transition-colors"
                >
                  [WATCH EPISODE #{matchedEpisode.episode}]
                </a>
              )}
            </div>
          )}

          {success && (
            <div className="p-3 border-2 border-vintage-green bg-black">
              <p className="text-vintage-green font-bold">✓ {success}</p>
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-3 bg-vintage-yellow text-black font-bold border-2 border-white hover:bg-vintage-green transition-colors"
          >
            [SUBMIT QUESTION]
          </button>
        </form>
      </div>

      {/* Suggested Questions List */}
      {sortedQuestions.length > 0 && (
        <div className="bg-black border-4 border-white p-6">
          <h2 className="text-2xl font-bold text-vintage-yellow-styled mb-4">
            COMMUNITY SUGGESTIONS
          </h2>
          <p className="text-white mb-6 font-bold">
            &gt;&gt; Vote for your favorite questions!
          </p>

          <div className="space-y-3">
            {sortedQuestions.map((q, index) => (
              <div
                key={q.id}
                className="border-2 border-white p-4 flex items-center justify-between gap-4 hover:border-vintage-yellow transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <span className="text-vintage-yellow font-bold text-lg">
                      #{index + 1}
                    </span>
                    <p className="text-white font-bold flex-1">{q.text}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 min-w-[80px]">
                  <button
                    onClick={() => handleVote(q.id)}
                    disabled={votedQuestions.has(q.id)}
                    className={`px-4 py-2 font-bold border-2 transition-colors ${
                      votedQuestions.has(q.id)
                        ? "bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed"
                        : "bg-vintage-green text-black border-white hover:bg-vintage-yellow"
                    }`}
                  >
                    {votedQuestions.has(q.id) ? "✓ VOTED" : "VOTE"}
                  </button>
                  <div className="text-center">
                    <p className="text-vintage-yellow font-bold text-2xl">{q.votes}</p>
                    <p className="text-xs text-white font-bold">
                      {q.votes === 1 ? "VOTE" : "VOTES"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
