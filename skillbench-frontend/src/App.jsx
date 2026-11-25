import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import GuestRoute from './components/GuestRoute';
import ProtectedRoute from './components/ProtectedRoute';
import Analytics from './pages/Analytics';
import ApiTester from './pages/ApiTester';
import AssignedTasks from './pages/AssignedTasks';
import Dashboard from './pages/Dashboard';
import FindWork from './pages/FindWork';
import Landing from './pages/Landing';
import Login from './pages/Login';
import MyProjects from './pages/MyProjects';
import Register from './pages/Register';
import Settings from './pages/Settings';
import SkillProfiles from './pages/SkillProfiles';
import Submissions from './pages/Submissions';
import Wallet from './pages/Wallet';

const CLIENT = ['CLIENT_ADMIN'];
const DEVELOPER = ['VENDOR_DEVELOPER'];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProtectedRoute roles={CLIENT}><MyProjects /></ProtectedRoute>} />
          <Route path="find-work" element={<ProtectedRoute roles={DEVELOPER}><FindWork /></ProtectedRoute>} />
          <Route path="tasks" element={<ProtectedRoute roles={DEVELOPER}><AssignedTasks /></ProtectedRoute>} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="skills" element={<SkillProfiles />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="api-tester" element={<ApiTester />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
