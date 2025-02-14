import dotenv from "dotenv";

dotenv.config();

export const port = process.env.PORT || 3000;
export const botToken = process.env.BOT_TOKEN || "";
export const mongoUrl =
  process.env.MONGO_URL || "mongodb://0.0.0.0:27017/mossport-database-2";
export const dbName = process.env.DB_NAME || "mossport-database-2";
export const adminToken = process.env.ADMIN_TOKEN;
export const backendLink = process.env.BACKEND_LINK || `https://admin.mossport.info/api`;
