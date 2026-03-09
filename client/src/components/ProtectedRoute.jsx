import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
     console.log("Required role:", role);
  console.log("User role:", user.role);
    // FIX: was redirecting to /dashboard which no longer exists
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;