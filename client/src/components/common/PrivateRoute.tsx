import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/auth";
import { LoadingSpinner } from "./LoadingSpinner";
import { ServerUnavailable } from "./ServerUnavailable";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { user, loading, sessionError, logout, retrySessionCheck } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Checking access..." />;
  }

  if (sessionError) {
    return (
      <ServerUnavailable
        message={sessionError}
        onRetry={retrySessionCheck}
        onLogout={logout}
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
