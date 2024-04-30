import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import backendInstance from "../../utils/backendInstance";

function AnnouncePage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string>("");

  const announceMutation = useMutation({
    mutationKey: ["announce"],
    mutationFn: async () => {
      await backendInstance.post(
        `/admin/announce`,
        {
          message,
          image,
        },
        {
          headers: {
            Authorization: localStorage.getItem("adminToken"),
          },
        }
      );

      alert("Анонс отправлен");
    },
  });

  return (
    <div className="flex flex-col items-center justify-center text-gray-900 space-y-2 px-4 sm:px-0 w-full sm:w-6/12 mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold">Отправка рассылки</h1>

      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full sm:w-auto"
        onClick={() => {
          navigate(-1);
        }}
      >
        Назад
      </button>

      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="message" className="text-left">
          Сообщение
        </label>
        <textarea
          id="message"
          className="h-32 p-2 my-4"
          placeholder="Введите сообщение"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
      </div>

      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="image" className="text-left">
          Ссылка на изображение
        </label>
        <input
          id="image"
          className="p-2 my-4"
          placeholder="Введите ссылку на изображение"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        ></input>
      </div>

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
        onClick={() => {
          announceMutation.mutate();
        }}
      >
        Отправить
      </button>
    </div>
  );
}

export default AnnouncePage;
