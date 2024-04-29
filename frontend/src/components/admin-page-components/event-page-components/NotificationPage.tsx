import { useState } from "react";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import backendInstance from "../../../utils/backendInstance";

function NotificationPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [message, setMessage] = useState("");

  const notificationMutation = useMutation({
    mutationFn: async () => {
      try {
        await backendInstance.post(
          `/admin/event/${eventId}/notification`,
          {
            message,
          },
          {
            headers: {
              Authorization: localStorage.getItem("adminToken"),
            },
          }
        );

        alert("Сообщение отправлено");
      } catch (error) {
        error instanceof AxiosError && console.error(error.response?.data);
        if (error instanceof AxiosError) {
          alert(error.response?.data);
        } else {
          alert("Произошла ошибка");
        }
      }
    },
  });
  return (
    <div className="flex flex-col items-center justify-center text-gray-900 space-y-2 px-4 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold">Отправка рассылки</h1>

      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full sm:w-auto"
        onClick={() => {
          navigate(-1);
        }}
      >
        Назад
      </button>

      <textarea
        className="w-full sm:w-6/12 h-32 p-2 my-4"
        placeholder="Введите сообщение"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      ></textarea>

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
        onClick={() => {
          notificationMutation.mutate();
        }}
      >
        Отправить
      </button>
    </div>
  );
}

export default NotificationPage;
