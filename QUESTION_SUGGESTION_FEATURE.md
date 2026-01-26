# Question Suggestion Box Feature

## Overview
Added a community-driven question suggestion box where visitors can submit questions and vote on their favorites.

## Features

### ✅ Question Submission
- Users can submit questions via a text input form
- Character limit: 200 characters
- Real-time character count display

### ✅ Validation Rules
1. **Question Mark Requirement**: All submissions must end with a `?`
2. **Duplicate Prevention**: 
   - Checks against all existing questions from `data.json`
   - Checks against previously submitted suggestions
   - Case-insensitive comparison

### ✅ Voting System
- Users can vote once per question
- Questions are sorted by vote count (highest first)
- Votes are tracked in localStorage to prevent multiple votes
- Clear visual indication when user has already voted

### ✅ Data Persistence
- All suggested questions stored in browser localStorage
- Vote tracking stored separately in localStorage
- Data persists across page reloads
- No backend required (perfect for GitHub Pages)

## Components

### QuestionSuggestionBox.tsx
Location: `/components/QuestionSuggestionBox.tsx`

**Props:**
- `existingQuestions`: Array of strings containing all questions from `data.json`

**Features:**
- Submit new questions
- View all submitted questions ranked by votes
- Vote on questions (one vote per question per user)
- Error and success message handling
- Responsive design matching the vintage retro theme

## Integration

The component is integrated into the main page (`app/page.tsx`) and appears after the video grid and episode list, before the footer.

**Data Flow:**
1. Page loads existing questions from `/data.json`
2. Questions are extracted and passed to `QuestionSuggestionBox`
3. Component validates new submissions against existing questions
4. All suggested questions and votes stored in localStorage

## localStorage Keys

- `suggestedQuestions`: Array of `SuggestedQuestion` objects
- `votedQuestions`: Array of question IDs that the user has voted on

## Data Structure

```typescript
interface SuggestedQuestion {
  id: string;           // Unique identifier (timestamp + random)
  text: string;         // The question text
  votes: number;        // Vote count
  timestamp: number;    // Submission timestamp
}
```

## Styling

The component follows the existing vintage/retro design system:
- Black background
- Yellow borders and accents
- Green for success states
- Red for error states
- White text
- Bold typography
- Sharp borders (no rounded corners)

## Future Enhancements (Optional)

1. **Backend Integration**: Move from localStorage to a proper database
2. **Moderation**: Add admin approval workflow for questions
3. **Export**: Allow admin to export top questions
4. **Analytics**: Track which questions get the most votes
5. **Comments**: Allow users to comment on questions
6. **Sharing**: Let users share specific questions
7. **Filtering**: Add categories or tags for questions
8. **Search**: Add search functionality for suggested questions

## Testing Checklist

- [ ] Submit a question ending with `?` - Should succeed
- [ ] Submit a question without `?` - Should show error
- [ ] Submit an existing question - Should show duplicate error
- [ ] Submit the same suggestion twice - Should show duplicate error
- [ ] Vote on a question - Vote count should increase
- [ ] Try to vote twice on same question - Button should be disabled
- [ ] Refresh page - Questions and votes should persist
- [ ] Submit empty question - Should show error
- [ ] Check character counter - Should update in real-time
- [ ] Check responsive design on mobile - Should look good

## Usage

Simply visit the homepage and scroll down past the video grid to find the "SUGGEST A QUESTION" section.

1. Type your question in the input box
2. Make sure it ends with a `?`
3. Click "SUBMIT QUESTION"
4. View your question in the "COMMUNITY SUGGESTIONS" section below
5. Vote on questions you like!

---

**Note**: This feature uses localStorage for simplicity and to work with GitHub Pages static hosting. For a production site with many users, consider implementing a backend solution.
