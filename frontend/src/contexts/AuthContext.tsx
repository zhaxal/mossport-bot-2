import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

  const login = useCallback((role: "admin" | "operator", token: string) => {
    localStorage.setItem(`${role}Token`, token);
    setIsLoggedIn(true);
    setRole(role);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("operatorToken");
    setIsLoggedIn(false);
    setRole(null);
  }, []);

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
    (async function checkToken() {
      const adminToken = localStorage.getItem("adminToken");
      const operatorToken = localStorage.getItem("operatorToken");

      if (adminToken) {
        await verifyAdminToken(adminToken);
      } else if (operatorToken) {
        await verifyOperatorToken(operatorToken);
      }
      setLoading(false);
    })();
  }, [login, logout]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
