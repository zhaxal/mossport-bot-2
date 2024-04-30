import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

function OperatorPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-900 space-y-2 px-4 sm:px-0">
      <h1 className="mb-4 text-3xl sm:text-5xl font-bold">Админка оператора</h1>

      <button
        onClick={() => navigate("/operator/find")}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Найти пользователя
      </button>

      <button
        onClick={logout}
        className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700 w-full sm:w-auto"
      >
        Выйти
      </button>
    </div>
  );
}

export default OperatorPage;
