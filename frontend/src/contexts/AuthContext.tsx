import React, { createContext, useContext, useState, useEffect } from "react";
import backendInstance from "../utils/backendInstance";

interface AuthContextValue {
  isLoggedIn: boolean;
  role: "operator" | "admin" | null;
  loading: boolean;
  logout: () => void;
  login: (role: "operator" | "admin", token: string) => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  role: null,
  loading: true,
  logout: () => {},
  login: () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<"operator" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  const verifyAdminToken = async (token: string) => {
    try {
      await backendInstance.post("/admin/token", { token });
      login("admin", token);
    } catch (error) {
      logout();
    }
  };

  const verifyOperatorToken = async (token: string) => {
    try {
      await backendInstance.post("/operator/token", { token });
      login("operator", token);
    } catch (error) {
      logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const operatorToken = localStorage.getItem("operatorToken");

    if (token) {
      verifyAdminToken(token).then(() => setLoading(false));
    }

    if (operatorToken) {
      verifyOperatorToken(operatorToken).then(() => setLoading(false));
    }

    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("operatorToken");
    setIsLoggedIn(false);
    setRole(null);
  };

  const login = (role: "admin" | "operator", token: string) => {
    localStorage.setItem(`${role}Token`, token);
    setIsLoggedIn(true);
    setRole(role);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, logout, login, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
