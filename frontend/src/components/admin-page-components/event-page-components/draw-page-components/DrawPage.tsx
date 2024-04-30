import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useState } from "react";
import { useForm } from "react-hook-form";

import backendInstance from "../../../../utils/backendInstance";

interface Draw {
  introMessage: string;
  winnerNumber: number;
  drawInterval: number;
  drawDuration: number;
  winnersMessage: string;
  completed?: boolean;
}

interface DrawEditFormProps {
  draw?: Draw;
  exitForm: () => void;
}

function DrawEditForm(props: DrawEditFormProps) {
  const { eventId } = useParams();
  const { draw, exitForm } = props;

  const drawForm = useForm<Draw>({
    defaultValues: {
      introMessage: draw?.introMessage || "",
      winnerNumber: draw?.winnerNumber || 1,
      drawInterval: draw?.drawInterval || 1,
      drawDuration: draw?.drawDuration || 1,
      winnersMessage: draw?.winnersMessage || "",
    },
  });

  const onSubmit = async (data: Draw) => {
    try {
      const adminToken = localStorage.getItem("adminToken");

      await backendInstance.patch(`/admin/event/${eventId}/draw`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: adminToken,
        },
      });
      exitForm();
    } catch (error) {
      alert("Произошла ошибка при обновлении настроек розыгрыша");
    }
  };

  return (
    <form
      className="w-full sm:max-w-md"
      onSubmit={drawForm.handleSubmit(onSubmit)}
    >
      <div className="mb-4">
        <label
          htmlFor="introMessage"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Сообщение перед розыгрышем:
        </label>
        <input
          id="introMessage"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          placeholder="Сообщение перед розыгрышем"
          {...drawForm.register("introMessage")}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="winnerNumber"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Количество победителей:
        </label>
        <input
          id="winnerNumber"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="number"
          placeholder="Количество победителей"
          {...drawForm.register("winnerNumber")}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="drawInterval"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Интервал между розыгрышами:
        </label>
        <input
          id="drawInterval"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="number"
          placeholder="Интервал между розыгрышами"
          {...drawForm.register("drawInterval")}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="drawDuration"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Длительность розыгрыша:
        </label>
        <input
          id="drawDuration"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="number"
          placeholder="Длительность розыгрыша"
          {...drawForm.register("drawDuration")}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="winnersMessage"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Сообщение победителям:
        </label>
        <textarea
          id="winnersMessage"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Сообщение победителям"
          {...drawForm.register("winnersMessage")}
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

function DrawPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"view" | "edit">("view");

  const { data, isLoading } = useQuery({
    queryKey: ["draw", eventId],
    queryFn: async () => {
      const { data } = await backendInstance.get<Draw>(
        `/event/${eventId}/draw`
      );
      return data;
    },
    enabled: !!eventId,
  });

  const queryClinet = useQueryClient();

  const drawStartMutation = useMutation({
    mutationKey: ["draw-activate", eventId],
    mutationFn: async () => {
      const adminToken = localStorage.getItem("adminToken");

      await backendInstance.get(`/admin/event/${eventId}/draw/start`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: adminToken,
        },
      });

      queryClinet.invalidateQueries({
        queryKey: ["draw", eventId],
      });
    },
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
          Редактирование настроек розыгрыша
        </h1>

        <button
          onClick={() => {
            setMode("view");
          }}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline my-4"
        >
          Отмена
        </button>

        <DrawEditForm
          exitForm={() => {
            setMode("view");
          }}
          draw={data}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-gray-900 space-y-2 px-4 sm:px-0">
      <h1 className="mb-4 text-3xl sm:text-5xl font-bold">
        Настройки розыгрыша
      </h1>

      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
        onClick={() => {
          navigate(-1);
        }}
      >
        Назад
      </button>

      {!data && (
        <button
          onClick={() => setMode("edit")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Добавить настройки
        </button>
      )}

      {data && (
        <>
          <button
            onClick={() => setMode("edit")}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Редактировать
          </button>

          <div className="flex flex-col space-y-2 text-gray-700">
            {data.introMessage && (
              <div className="bg-gray-200 p-2 rounded overflow-auto">
                <span className="font-bold text-lg">
                  Сообщение перед розыгрышем:
                </span>{" "}
                {data.introMessage}
              </div>
            )}
            {data.winnerNumber && (
              <div className="bg-gray-200 p-2 rounded overflow-auto">
                <span className="font-bold text-lg">
                  Количество победителей:
                </span>{" "}
                {data.winnerNumber}
              </div>
            )}
            {data.drawInterval && (
              <div className="bg-gray-200 p-2 rounded overflow-auto">
                <span className="font-bold text-lg">
                  Интервал между розыгрышами:
                </span>{" "}
                {data.drawInterval}
              </div>
            )}

            {data.drawDuration && (
              <div className="bg-gray-200 p-2 rounded overflow-auto">
                <span className="font-bold text-lg">
                  Длительность розыгрыша:
                </span>{" "}
                {data.drawDuration}
              </div>
            )}

            {data.winnersMessage && (
              <div className="bg-gray-200 p-2 rounded overflow-auto">
                <span className="font-bold text-lg">
                  Сообщение победителям:
                </span>{" "}
                {data.winnersMessage}
              </div>
            )}
          </div>
        </>
      )}

      {!data?.completed && data && (
        <button
          onClick={() => drawStartMutation.mutate()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Начать розыгрыш
        </button>
      )}
    </div>
  );
}

export default DrawPage;
