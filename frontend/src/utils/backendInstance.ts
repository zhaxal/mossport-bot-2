import axios from "axios";
import { baseURL } from "./config";

const backendInstance = axios.create({
  baseURL,
  timeout: 5000,
});

export default backendInstance;
