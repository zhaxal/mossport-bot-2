import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import backendInstance from "../../../utils/backendInstance";

interface FileUploadButtonProps {
  type: "map" | "rules" | "policy";
  uploaded: boolean;
}

function FileUploadButton(props: FileUploadButtonProps) {
  const { type, uploaded } = props;

  const fileInput = useRef<HTMLInputElement>(null);
  // const queryClient = useQueryClient();

  const typeRus =
    type === "map" ? "карту" : type === "rules" ? "условия" : "политику";

  const handleFileUpload = async () => {};

  return (
    <>
      <label className="bg-blue-500 hover:bg-blue-700 text-white font-bold my-1 py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer w-full sm:w-auto">
        {uploaded ? "Обновить" : "Загрузить"} {typeRus}
        <input
          type="file"
          ref={fileInput}
          className="hidden"
          onChange={handleFileUpload}
        />
      </label>
    </>
  );
}

interface Event {
  title: string;
  description?: string;
  schedule?: string;
  partnerMessage?: string;
  mapLink?: string;
  rulesLink?: string;
  policyLink?: string;
  prizeTableLink?: string;
}

function EventFileUploadPage() {
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
      <h1 className="text-2xl sm:text-3xl font-bold text-center">
        Загрузка файлов
      </h1>

      <button
        onClick={() => {
          navigate(-1);
        }}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Назад
      </button>

      <FileUploadButton type="map" uploaded={!!data?.mapLink} />
      <FileUploadButton type="rules" uploaded={!!data?.rulesLink} />
      <FileUploadButton type="policy" uploaded={!!data?.policyLink} />
    </div>
  );
}

export default EventFileUploadPage;
