import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import backendInstance from "../../utils/backendInstance";

interface UserInfo {
  prizeWinner: boolean;
  claimed: boolean;
  firstName: string;
  lastName: string;
}

function FindUserPage() {
  const [shortId, setShortId] = useState<string>("");

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<UserInfo>({
    queryKey: ["findUser", shortId],
    queryFn: async () => {
      const { data } = await backendInstance.get<UserInfo>(
        `/operator/user/${shortId}`,
        {
          headers: {
            Authorization: localStorage.getItem("operatorToken") || "",
          },
        }
      );

      return data;
    },

    enabled: shortId.length === 6,
  });

  const prizeMutation = useMutation({
    mutationKey: ["claimPrize", shortId],
    mutationFn: async () => {
      await backendInstance.patch(`/operator/prize/${shortId}`, null, {
        headers: {
          Authorization: localStorage.getItem("operatorToken") || "",
        },
      });

      await queryClient.invalidateQueries({
        queryKey: ["findUser", shortId],
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

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Найти пользователя</h1>

      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full sm:w-auto"
        onClick={() => {
          navigate(-1);
        }}
      >
        Назад
      </button>

      <input
        type="number"
        maxLength={6}
        placeholder="Введите идентефикатор"
        className="border p-2 rounded mt-4 w-full sm:w-1/2"
        value={shortId}
        onChange={(e) => setShortId(e.target.value)}
      />

      {data?.prizeWinner && !data?.claimed && (
        <button
          onClick={() => {
            prizeMutation.mutate();
          }}
          disabled={shortId.length !== 6 || isLoading || data?.claimed}
          className="bg-blue-500 text-white p-2 rounded mt-4 w-full sm:w-auto"
        >
          Выдать приз
        </button>
      )}

      {data && (
        <div className="mt-4 w-full sm:w-3/4">
          <p className="text-lg sm:text-xl font-bold">Имя: {data?.firstName}</p>
          <p className="text-lg sm:text-xl font-bold">
            Фамилия: {data?.lastName}
          </p>
          <p className="text-lg sm:text-xl font-bold">
            Победитель: {data?.prizeWinner ? "Да" : "Нет"}
          </p>
          <p className="text-lg sm:text-xl font-bold">
            Статус приза: {data?.claimed ? "Выдан" : "Не выдан"}
          </p>
        </div>
      )}
    </div>
  );
}

export default FindUserPage;
