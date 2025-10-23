import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import CreateContest from './components/CreateContest';
import JoinContest from './components/JoinContest';
import WaitingRoom from './components/WaitingRoom';
import ContestPlay from './components/ContestPlay';
import Standings from './components/Standings';
import ContestSummary from './components/ContestSummary';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import Practice from './components/Practice';
import PrivateRoute from './components/PrivateRoute';

import { ToastContainer } from 'react-toastify';

export default function App() {
	return (
		<Router>
			<Navbar />
			<ToastContainer 
				position="top-right" 
				autoClose={2000} 
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss={false}
				draggable={false}
				pauseOnHover={false}
				limit={1}
				theme="dark"
			/>
			<Routes>
				<Route path="/" element={<LandingPage />} />
				<Route element={<PrivateRoute />}>
					<Route path="/profile" element={<Profile />} />
					<Route path="/practice" element={<Practice />} />
					<Route path="/create-contest" element={<CreateContest />} />
					<Route path="/join-contest" element={<JoinContest />} />
					<Route path="/analytics" element={<AnalyticsDashboard />} />
					<Route path="/contest/:contestId/waiting" element={<WaitingRoom />} />
					<Route path="/contest/:contestId/play" element={<ContestPlay />} />
					<Route path="/contest/:contestId/standings" element={<Standings />} />
				</Route >
				<Route path="/profile" element={<Profile />} />
				<Route path="/practice" element={<Practice />} />
				<Route path="/create-contest" element={<CreateContest />} />
				<Route path="/join-contest" element={<JoinContest />} />
				<Route path="/contest/:contestId/waiting" element={<WaitingRoom />} />
				<Route path="/contest/:contestId/play" element={<ContestPlay />} />
				<Route path="/contest/:contestId/standings" element={<Standings />} />
				<Route path="/contest/:contestId/summary" element={<ContestSummary />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</Router>
	);
}