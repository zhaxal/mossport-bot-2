import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import backendInstance from "../../../utils/backendInstance";
import { useState } from "react";

interface Event {
  _id: string;
  title: string;
  status: "created" | "active" | "finished";
}

interface StatusSelectProps {
  initialStatus: Event["status"];
}

function StatusSelect(props: StatusSelectProps) {
  const { initialStatus } = props;

  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Event["status"]>(initialStatus);

  const statusMutation = useMutation({
    mutationFn: async () => {
      try {
        await backendInstance.patch(
          `/admin/event/${eventId}/status`,
          { status },
          {
            headers: {
              Authorization: localStorage.getItem("adminToken"),
            },
          }
        );
        alert("Статус изменен");
      } catch (error) {
        alert("Произошла ошибка");
      } finally {
        queryClient.invalidateQueries({
          queryKey: ["event", eventId],
        });
      }
    },
  });

  return (
    <>
      <select
        className="w-full sm:w-6/12 p-2 border border-gray-300 rounded-md shadow-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={status}
        onChange={(e) => setStatus(e.target.value as Event["status"])}
      >
        <option value="created">Создан</option>
        <option value="active">Активен</option>
        <option value="finished">Завершен</option>
      </select>
      {initialStatus !== status && (
        <button
          onClick={() => {
            statusMutation.mutate();
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full sm:w-auto"
          type="submit"
        >
          Сохранить
        </button>
      )}
    </>
  );
}

function EventStatusPage() {
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
      <h1 className="text-2xl sm:text-3xl font-bold">Смена статуса ивента</h1>

      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full sm:w-auto"
        onClick={() => {
          navigate(-1);
        }}
      >
        Назад
      </button>

      {data && <StatusSelect initialStatus={data.status} />}
      {!data && <div>Ивент не найден</div>}
    </div>
  );
}

export default EventStatusPage;
