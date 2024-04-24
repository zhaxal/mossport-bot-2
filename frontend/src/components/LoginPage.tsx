import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import backendInstance from "../utils/backendInstance";

interface LoginFormProps {
  token: string;
}

function LoginPage() {
  const { isLoggedIn, loading, role, login } = useAuth();
  const loginForm = useForm<LoginFormProps>({
    defaultValues: {
      token: "",
    },
  });

  const [mode, setMode] = useState<"operator" | "admin">("admin");

  const onSubmit = async (data: LoginFormProps) => {
    try {
      switch (mode) {
        case "admin":
          await backendInstance.post("/admin/token", { token: data.token });
          login("admin", data.token);
          break;
        case "operator":
          await backendInstance.post("/operator/token", { token: data.token });
          login("operator", data.token);
          break;
        default:
          throw new Error("Неверный режим");
          break;
      }
    } catch (error) {
      alert("Неверный токен");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center text-2xl font-bold text-blue-500">
        Loading...
      </div>
    );
  }

  if (isLoggedIn && role === "admin") {
    return <Navigate to="/admin" />;
  }

  if (isLoggedIn && role === "operator") {
    return <Navigate to="/operator" />;
  }

  return (
    <div className="flex items-center justify-center px-4 sm:px-0">
      <div className="p-8 space-y-4 bg-white rounded shadow-lg w-full sm:w-80">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Вход в админку
        </h1>

        <div className="flex items-center justify-between">
          <label>
            <input
              type="radio"
              value="admin"
              checked={mode === "admin"}
              onChange={() => setMode("admin")}
            />
            Админ
          </label>
          <label>
            <input
              type="radio"
              value="operator"
              checked={mode === "operator"}
              onChange={() => setMode("operator")}
            />
            Оператор
          </label>
        </div>

        <form className="space-y-4" onSubmit={loginForm.handleSubmit(onSubmit)}>
          <label className="block">
            <span className="text-gray-700">Токен:</span>
            <input
              {...loginForm.register("token")}
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </label>
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
