import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import { mongoUrl, dbName } from "./config";

export const client = new MongoClient(mongoUrl);
client.connect();
const db = client.db(dbName);

export const bucket = new GridFSBucket(db, { bucketName: "eventFiles" });

interface EventInfo {
  title: string;
  description?: string;
  schedule?: string;
  partnerMessage?: string;
  partnerMessage2?: string;
  mapLink?: string;
  rulesLink?: string;
  policyLink?: string;
  status: "created" | "active" | "finished";
}

export const eventInfoCol = db.collection<EventInfo>("event-info");

interface User {
  subscriberId: ObjectId;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  shortId: number;
  eventId: ObjectId;
}

export const userCol = db.collection<User>("users");

interface Token {
  token: string;
  role: "operator";
  updatedAt: Date;
}

export const tokenCol = db.collection<Token>("token");

interface UserPrizeStatus {
  shortId: number;
  eventId: ObjectId;
  claimed: boolean;
}

export const userPrizeStatusCol =
  db.collection<UserPrizeStatus>("user-prize-status");

interface DrawInfo {
  eventId: ObjectId;
  introMessage: string;
  winnerNumber: number;
  drawInterval: number;
  drawDuration: number;
  winnersMessage: string;
  completed?: boolean;
}

export const drawInfoCol = db.collection<DrawInfo>("draw-info");

interface Subscribers {
  telegramId: number;
  name: string;
}

export const subscribersCol = db.collection<Subscribers>("subscribers");

interface LogMessage {
  eventName: string;
  data: any;
  timestamp: Date;
}

export const logMessagesCol = db.collection<LogMessage>("log-messages");
