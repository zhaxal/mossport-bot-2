import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

interface SecuredRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

function SecuredRoute(props: SecuredRouteProps) {
  const { isLoggedIn, role, loading } = useAuth();

  console.log({ isLoggedIn, role, loading });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-2xl font-bold text-blue-500">
        Загрузка...
      </div>
    );
  }

  if (!isLoggedIn && role) {
    return <Navigate to="/login" />;
  }

  if (props.allowedRoles && (!role || !props.allowedRoles.includes(role))) {
    return <Navigate to="/login" />;
  }

  return <>{props.children}</>;
}

export default SecuredRoute;
