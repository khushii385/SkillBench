import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Login / Register: logged-in users go straight to the dashboard
export default function GuestRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}
