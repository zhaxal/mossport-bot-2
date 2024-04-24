import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import backendInstance from "../../utils/backendInstance";

function TokenPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["token"],
    queryFn: async () => {
      const { data } = await backendInstance.get("/admin/operator", {
        headers: {
          Authorization: localStorage.getItem("adminToken"),
        },
      });

      return data;
    },

    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await backendInstance.patch(
        "/admin/operator",
        {},
        {
          headers: {
            Authorization: localStorage.getItem("adminToken"),
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["token"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-2xl font-bold text-blue-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Токен для операторов</h1>

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full sm:w-auto"
        onClick={() => {
          updateMutation.mutate();
        }}
      >
        Обновить токен
      </button>

      <p className="text-lg my-2 w-full sm:w-auto text-center">
        Токен: <span className="font-bold">{data?.token}</span>
      </p>

      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full sm:w-auto"
        onClick={() => {
          navigate(-1);
        }}
      >
        Назад
      </button>
    </div>
  );
}

export default TokenPage;
