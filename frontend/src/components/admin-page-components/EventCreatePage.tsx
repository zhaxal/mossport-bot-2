import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import backendInstance from "../../utils/backendInstance";

interface EventFormProps {
  title: string;
}

function EventCreatePage() {
  const navigate = useNavigate();

  const eventForm = useForm<EventFormProps>({
    defaultValues: {
      title: "",
    },
  });

  const onSubmit = async (data: EventFormProps) => {
    try {
      const adminToken = localStorage.getItem("adminToken");

      await backendInstance.post("/admin/event", data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: adminToken,
        },
      });
      navigate("/admin/events");
    } catch (error) {
      alert("Произошла ошибка при создании ивента");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-center">
        Создание ивента
      </h1>

      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline my-4"
        onClick={() => {
          navigate(-1);
        }}
      >
        Назад
      </button>

      <form
        onSubmit={eventForm.handleSubmit(onSubmit)}
        className="w-full sm:max-w-md"
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

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Создать
        </button>
      </form>
    </div>
  );
}

export default EventCreatePage;
