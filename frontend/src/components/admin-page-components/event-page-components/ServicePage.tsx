import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import backendInstance from "../../../utils/backendInstance";

function ServicePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const downloadMutation = useMutation({
    mutationKey: ["downloadCsv"],
    mutationFn: async () => {
      const res = await backendInstance.get(`/admin/event/${eventId}/csv`, {
        headers: {
          Authorization: localStorage.getItem("adminToken"),
        },
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users.csv");
      document.body.appendChild(link);
      link.click();
    },
  });

  return (
    <div className="flex flex-col items-center justify-center text-gray-900 space-y-2 px-4 sm:px-0">
      <h1 className="mb-4 text-3xl sm:text-5xl font-bold">Сервис</h1>
      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full sm:w-auto"
        onClick={() => {
          navigate(-1);
        }}
      >
        Назад
      </button>

      <button
        onClick={() => downloadMutation.mutate()}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
      >
        Выгрузить список участников
      </button>
    </div>
  );
}

export default ServicePage;
