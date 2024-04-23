import { GridFSBucket, MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGO_URL || "mongodb://0.0.0.0:27017";
const client = new MongoClient(uri);
client.connect();
const db = client.db(process.env.DB_NAME || "mossport-database-2");

export const bucket = new GridFSBucket(db, { bucketName: "eventFiles" });

interface EventInfo {
  title: string;
  description?: string;
  schedule?: string;
  partnerMessage?: string;
  mapLink?: string;
  rulesLink?: string;
  policyLink?: string;
  prizeTableLink?: string;
}

export const eventInfoCol = db.collection<EventInfo>("event-info");

interface User {
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  shortId: number;
}

export const userCol = db.collection<User>("users");

interface Token {
  token: string;
  role: "operator";
  updatedAt: Date;
}

export const tokenCol = db.collection<Token>("token");

interface UserPrizeStatus {
  userId: number;
  eventId: ObjectId;
  claimed: boolean;
}

export const userPrizeStatusCol =
  db.collection<UserPrizeStatus>("user-prize-status");

interface DrawInfo {
  introMessage: string;
  winnerNumber: number;
  drawInterval: number;
  drawDuration: number;
  winnersMessage: string;
  
}
