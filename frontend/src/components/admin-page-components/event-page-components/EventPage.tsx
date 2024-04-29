import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import backendInstance from "../../../utils/backendInstance";

interface Event {
  title: string;
}

function EventPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data } = await backendInstance.get<Event>(`/event/${eventId}`);

      return data;
    },
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-2xl font-bold text-blue-500">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-gray-900 space-y-2 px-4 sm:px-0">
      <h1 className="mb-4 text-3xl sm:text-5xl font-bold">
        Ивент: {data?.title}
      </h1>

      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
        onClick={() => {
          navigate(-1);
        }}
      >
        Назад
      </button>

      <button
        onClick={() => navigate(`/admin/events/${eventId}/file`)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Загрузка файлов
      </button>
      <button
        onClick={() => navigate(`/admin/events/${eventId}/info`)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Информация
      </button>

      <button
        onClick={() => navigate(`/admin/events/${eventId}/notification`)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Рассылка
      </button>

      <button
        onClick={() => navigate(`/admin/events/${eventId}/draw`)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Розыгрыш
      </button>

      <button
        onClick={() => navigate("/token")}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Сервис
      </button>
      <button
        onClick={() => navigate(`/admin/events/${eventId}/status`)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Статус
      </button>
    </div>
  );
}

export default EventPage;
