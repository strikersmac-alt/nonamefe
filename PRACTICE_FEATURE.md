# NPTEL Practice Feature Documentation

## Overview
A comprehensive practice system for NPTEL courses with test functionality, timer, and detailed analysis.

## Features Implemented

### 1. Backend API Endpoints
**File**: `MindMuseServer/api/controllers/nptel.controller.js`
- **New Endpoint**: `GET /api/nptel/questions/:courseCode?weeks=1,2,3`
  - Fetches questions by course code
  - Supports filtering by multiple weeks (comma-separated)
  - Returns all questions if no weeks specified

**File**: `MindMuseServer/api/routes/nptel.route.js`
- Added route for the new endpoint

### 2. Frontend Practice Page
**File**: `MindMuse/src/components/Practice.tsx`

#### Main Features:
1. **Course Listing**
   - Displays all NPTEL courses from database
   - Shows course name, code, and duration
   - Click to configure test

2. **Test Configuration Modal**
   - Select specific weeks (1-12)
   - Choose test duration (15, 30, 45, 60, 90 minutes)
   - Visual week selection with toggle

3. **Test Interface**
   - Timer with countdown
   - Question navigation (previous/next)
   - Visual progress indicators
   - Multi-select answer support
   - Question number dots showing answered status
   - Auto-submit when time expires

4. **Analysis Dashboard**
   - Overall score percentage
   - Correct/Wrong/Unanswered breakdown
   - Total time taken
   - Question-wise detailed analysis
   - Shows correct answers vs selected answers
   - Time spent per question
   - Color-coded feedback (green=correct, red=wrong, orange=skipped)

### 3. Local Storage Integration
All test results are automatically saved to localStorage under key `practiceTestResults` with:
- Course details
- Selected weeks
- All questions and answers
- Timing data
- Score and statistics
- Timestamp

### 4. Navigation
- Added `/practice` route to `App.tsx`
- Added "NPTEL Practice" button to Landing Page (visible for authenticated users)

## How to Use

### For Users:
1. Navigate to the Practice page from the landing page
2. Click on any course card
3. Select weeks you want to practice
4. Set test duration
5. Click "Start Test"
6. Answer questions (supports multiple correct answers)
7. Navigate between questions or submit early
8. View detailed analysis after completion

### API Usage:
```javascript
// Get all questions for a course
GET http://localhost:10000/api/nptel/questions/CS101

// Get questions for specific weeks
GET http://localhost:10000/api/nptel/questions/CS101?weeks=1,2,3
```

## Data Models

### Question Schema (nptel.model.js)
```javascript
{
  courseName: String,
  courseCode: String,
  ps: String,              // Problem statement
  options: [String],       // Answer options
  correct: [String],       // Correct answers (supports multiple)
  week: Number (0-12)
}
```

### Course Schema (courses.model.js)
```javascript
{
  name: String,
  code: String,
  durationInWeeks: Number
}
```

### Test Result (localStorage)
```javascript
{
  courseCode: String,
  courseName: String,
  weeks: [Number],
  duration: Number,
  questions: [Question],
  answers: [TestAnswer],
  totalQuestions: Number,
  correctAnswers: Number,
  wrongAnswers: Number,
  unanswered: Number,
  totalTimeTaken: Number,
  score: Number,
  timestamp: Number
}
```

## Technical Details

### State Management
- Uses React hooks (useState, useEffect)
- Real-time timer with setInterval
- Question timing tracking
- Answer state management with Map

### Styling
- Radix UI components for consistent design
- Gradient backgrounds matching app theme
- Responsive grid layouts
- Color-coded feedback system

### Error Handling
- Validates week selection
- Checks for available questions
- Handles API errors gracefully
- Auto-saves progress to localStorage

## Future Enhancements
- View past test history
- Compare performance across tests
- Export results as PDF
- Practice mode (no timer)
- Bookmark difficult questions
- Spaced repetition system
