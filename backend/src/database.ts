import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URL || "mongodb://0.0.0.0:27017";
const client = new MongoClient(uri);
client.connect();
const db = client.db(process.env.DB_NAME || "mossport-database-2");

