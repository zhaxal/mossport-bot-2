import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function AdminPage() {
  const { logout } = useAuth();

  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-gray-900 space-y-2 px-4 sm:px-0">
      <h1 className="mb-4 text-3xl sm:text-5xl font-bold">Админка</h1>
      <button
        onClick={() => navigate("/admin/events")}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Список ивентов
      </button>
      <button
        onClick={() => navigate("/activity")}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Прочее
      </button>

      <button
        onClick={() => navigate("/token")}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Токен для операторов
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

export default AdminPage;
