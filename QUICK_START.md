# Quick Start Guide - MindMuse Contest System

## Prerequisites
- Node.js installed
- MongoDB running
- Backend server running on port 10000

## Installation

### 1. Install TypeScript Types (Optional but Recommended)
```bash
npm install --save-dev @types/js-cookie
```

This will resolve TypeScript warnings for the `js-cookie` library.

## Running the Application

### 1. Start Backend Server
```bash
cd ../MindMuseServer
npm start
```
Backend should be running on `http://localhost:10000`

### 2. Start Frontend Development Server
```bash
cd MindMuse
npm run dev
```
Frontend should be running on `http://localhost:5173`

## Testing the Contest Flow

### As Contest Creator (Admin):
1. Go to `http://localhost:5173`
2. Click "Create Contest"
3. Fill in contest details:
   - Topic (e.g., "Science")
   - Difficulty (Easy/Medium/Hard)
   - Number of Questions (1-50)
   - Mode (Duel/Practice/Multiplayer)
   - Duration (minutes)
4. Click "Create Contest"
5. Copy the 6-digit contest code
6. Share code with participants
7. Wait in the waiting room for participants to join
8. Click "Start Contest" when ready (duel requires 2 players)
9. Answer questions
10. View final standings

### As Participant:
1. Go to `http://localhost:5173`
2. Click "Join Contest"
3. Enter the 6-digit contest code
4. Wait in waiting room for admin to start
5. Contest starts automatically when admin clicks start
6. Answer questions
7. View final standings

## Contest Modes

### Duel (2 Players)
- Exactly 2 players required
- Head-to-head competition
- Admin can start when 2 players join

### Multiplayer (Unlimited)
- Any number of players
- Admin can start when ready
- No minimum player requirement

### Practice (Solo)
- Single player mode
- Start immediately
- No waiting room needed

## Features to Test

### Real-Time Updates
- [ ] Join waiting room and see participants appear
- [ ] Have another user join and see them appear instantly
- [ ] Admin starts contest and all users redirect simultaneously
- [ ] Submit answers and see standings update in real-time

### Timer
- [ ] Contest timer counts down correctly
- [ ] Timer shows in red when < 10% time remaining
- [ ] Contest ends automatically when time expires

### Scoring
- [ ] Correct answers increase score
- [ ] Incorrect answers don't change score
- [ ] Final score matches number of correct answers

### Standings
- [ ] Top 3 shown on podium with medals
- [ ] Full leaderboard shows all participants
- [ ] Ranks are correct (sorted by score)
- [ ] Your entry is highlighted

## Troubleshooting

### "Please sign in to join the contest"
- Make sure you're signed in with Google OAuth
- Check that `authToken` cookie exists

### "Connection error"
- Ensure backend server is running on port 10000
- Check CORS settings in backend
- Verify Socket.IO is initialized correctly

### "Contest not found"
- Verify contest code is correct (6 characters)
- Check that contest exists in database
- Ensure contest hasn't already started

### Questions not loading
- Check backend API endpoint `/api/contest/:id/questions`
- Verify MongoDB connection
- Check browser console for errors

### Timer not working
- Ensure `startTime` is set when contest starts
- Check that duration is in minutes
- Verify browser time is synchronized

## API Endpoints Reference

### REST API
```
POST /api/quiz/createContest
GET  /api/contest/code/:code/questions
GET  /api/contest/:id/questions
POST /api/contest/:id/validate
```

### Socket.IO Events
```
Client → Server:
- joinContest(contestId, callback)
- startContest(contestId, callback)
- submitAnswer({contestId, questionId, answer}, callback)

Server → Client:
- updateParticipants(participants[])
- contestStarted({startTime, duration, timeZone})
- updateStandings(standings[])
- contestEnded({message})
```

## Environment Variables

### Backend (.env in MindMuseServer)
```
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env in MindMuse)
```
VITE_API_URL=http://localhost:10000
```

## Known Issues & TODOs

### Minor TypeScript Warnings
- `setIsAdmin` in WaitingRoom - needs auth context integration
- `socket`, `setCurrentUserId` in Standings - can be removed if not needed
- These don't affect functionality

### Future Enhancements
1. Implement proper admin detection using auth context
2. Add user authentication context
3. Add loading skeletons for better UX
4. Add sound effects and animations
5. Add chat in waiting room
6. Add contest history page
7. Add leaderboard persistence
8. Add rematch functionality

## File Structure
```
MindMuse/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx      # Home page
│   │   ├── CreateContest.tsx    # Contest creation form
│   │   ├── JoinContest.tsx      # Enter contest code
│   │   ├── WaitingRoom.tsx      # Pre-contest lobby
│   │   ├── ContestPlay.tsx      # Quiz gameplay
│   │   ├── Standings.tsx        # Final results
│   │   ├── OAuth.tsx            # Google sign-in
│   │   └── Logout.tsx           # Sign out
│   ├── App.tsx                  # Routes
│   ├── App.css                  # Styles
│   └── main.tsx                 # Entry point
├── CONTEST_IMPLEMENTATION.md    # Detailed docs
└── QUICK_START.md              # This file
```

## Support
If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify all environment variables are set
4. Ensure MongoDB is running
5. Clear browser cache and cookies
6. Try in incognito mode

Happy quizzing! 🚀
