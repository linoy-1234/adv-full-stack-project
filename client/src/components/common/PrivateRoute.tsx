import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/api";
import LoadingSpinner from "./LoadingSpinner";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Checking access..." />;
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