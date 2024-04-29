import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import backendInstance from "../../../utils/backendInstance";

interface Event {
  _id: string;
  title: string;
  description?: string;
  schedule?: string;
  partnerMessage?: string;
}

interface EventEditFormProps {
  event: Event;
  exitForm: () => void;
}

function EventEditForm(props: EventEditFormProps) {
  const { event, exitForm } = props;
  const queryClient = useQueryClient();

  const eventForm = useForm<Event>({
    defaultValues: {
      title: event.title || "",
      description: event?.description || "",
      schedule: event?.schedule || "",
      partnerMessage: event?.partnerMessage || "",
    },
  });

  const onSubmit = async (data: Event) => {
    try {
      const adminToken = localStorage.getItem("adminToken");

      await backendInstance.patch(`/admin/event/${event._id}`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: adminToken,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["event", event._id] });
      exitForm();
    } catch (error) {
      alert("Произошла ошибка при обновлении ивента");
    }
  };

  return (
    <form
      className="w-full sm:max-w-md"
      onSubmit={eventForm.handleSubmit(onSubmit)}
    >
      <div className="mb-4">
        <label
          htmlFor="title"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Название ивента:
        </label>
        <input
          id="title"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          placeholder="Название ивента"
          {...eventForm.register("title")}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="description"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Описание:
        </label>
        <textarea
          id="description"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Описание"
          {...eventForm.register("description")}
        ></textarea>
      </div>

      <div className="mb-4">
        <label
          htmlFor="schedule"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Расписание:
        </label>
        <textarea
          id="schedule"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Расписание"
          {...eventForm.register("schedule")}
        ></textarea>
      </div>

      <div className="mb-4">
        <label
          htmlFor="partnerMessage"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Спонсорское сообщение:
        </label>
        <textarea
          id="partnerMessage"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Спонсорское сообщение"
          {...eventForm.register("partnerMessage")}
        ></textarea>
      </div>

      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Сохранить
      </button>
    </form>
  );
}

function EventInfoPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [mode, setMode] = useState<"view" | "edit">("view");

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

  if (mode === "edit") {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Редактирование ивента
        </h1>

        <button
          onClick={() => {
            setMode("view");
          }}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline my-4"
        >
          Отмена
        </button>
        {data && (
          <EventEditForm
            exitForm={() => {
              setMode("view");
            }}
            event={data}
          />
        )}
        {!data && <div>Ивент не найден</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-gray-900 space-y-2 px-4 sm:px-0">
      <h1 className="mb-4 text-3xl sm:text-5xl font-bold">
        Информация об ивенте: {data?.title}
      </h1>

      <button
        onClick={() => {
          navigate(-1);
        }}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Назад
      </button>

      <button
        onClick={() => setMode("edit")}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Редактировать
      </button>

      <div className="flex flex-col space-y-2 text-gray-700">
        {data?.description && (
          <div className="bg-gray-200 p-2 rounded overflow-auto">
            <span className="font-bold text-lg">Описание:</span>{" "}
            {data?.description}
          </div>
        )}
        {data?.schedule && (
          <div className="bg-gray-200 p-2 rounded overflow-auto">
            <span className="font-bold text-lg">Расписание:</span>{" "}
            {data?.schedule}
          </div>
        )}
        {data?.partnerMessage && (
          <div className="bg-gray-200 p-2 rounded overflow-auto">
            <span className="font-bold text-lg">Спонсорское сообщение:</span>{" "}
            {data?.partnerMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventInfoPage;
