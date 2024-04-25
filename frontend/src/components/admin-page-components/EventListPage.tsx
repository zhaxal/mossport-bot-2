import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import backendInstance from "../../utils/backendInstance";

interface Event {
  _id: string;
  title: string;
}

function EventListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await backendInstance.get<Event[]>("/event");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-2xl font-bold text-blue-500">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Ивенты</h1>

      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
        onClick={() => {
          navigate(-1);
        }}
      >
        Назад
      </button>

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
        onClick={() => {
          navigate("/admin/events/create");
        }}
      >
        Создать ивент
      </button>

      <div className="flex flex-col items-center justify-center w-full mt-4">
        {data?.map((event, i) => (
          <div
            key={`event-${i}`}
            className="flex flex-col sm:flex-row items-center justify-between w-full p-2 bg-white rounded shadow-md mb-2"
          >
            <h2 className="text-lg font-bold">{i + 1}</h2>
            <h1 className="text-lg sm:text-xl font-bold">{event.title}</h1>
            <button
              onClick={() => {
                navigate(`/admin/events/${event._id}`);
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline mt-2"
            >
              Подробнее
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventListPage;
