import { GridFSBucket, MongoClient, ObjectId, Db } from "mongodb";
import { mongoUrl, dbName } from "./config";

// Create MongoDB client
export const client = new MongoClient(mongoUrl);

// Connect to MongoDB with error handling
client.connect()
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch(error => {
    console.error("Failed to connect to MongoDB:", error);
  });

// Setup reconnection logic
client.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  setTimeout(() => client.connect(), 5000);
});

client.on('close', () => {
  console.warn('MongoDB connection closed. Attempting to reconnect...');
  setTimeout(() => client.connect(), 5000);
});

// Get database instance
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

/**
 * Creates necessary database indexes to improve query performance.
 * Wraps each index creation in try-catch to prevent single index failures from affecting others.
 */
async function createIndexes() {
  console.log("Creating database indexes...");

  const createIndexWithErrorHandling = async (
    collection: any,
    indexSpec: any,
    options: any = {},
    description: string
  ) => {
    try {
      await collection.createIndex(indexSpec, options);
      console.log(`✓ Created index on ${description}`);
    } catch (error) {
      console.error(`✗ Failed to create index on ${description}:`, error);
    }
  };

  // Indexes for eventInfoCol
  await createIndexWithErrorHandling(eventInfoCol, { status: 1 }, {}, "eventInfoCol.status");
  await createIndexWithErrorHandling(eventInfoCol, { _id: 1 }, {}, "eventInfoCol._id");

  // Indexes for userCol
  await createIndexWithErrorHandling(userCol, { eventId: 1 }, {}, "userCol.eventId");
  await createIndexWithErrorHandling(userCol, { subscriberId: 1 }, {}, "userCol.subscriberId");
  await createIndexWithErrorHandling(userCol, { shortId: 1 }, {}, "userCol.shortId");
  await createIndexWithErrorHandling(userCol, { eventId: 1, subscriberId: 1 }, { unique: true }, "userCol.eventId+subscriberId (unique)");
  await createIndexWithErrorHandling(userCol, { eventId: 1, shortId: 1 }, { unique: true }, "userCol.eventId+shortId (unique)");

  // Indexes for userPrizeStatusCol
  await createIndexWithErrorHandling(userPrizeStatusCol, { eventId: 1 }, {}, "userPrizeStatusCol.eventId");
  await createIndexWithErrorHandling(userPrizeStatusCol, { shortId: 1 }, {}, "userPrizeStatusCol.shortId");
  await createIndexWithErrorHandling(userPrizeStatusCol, { eventId: 1, shortId: 1 }, { unique: true }, "userPrizeStatusCol.eventId+shortId (unique)");

  // Indexes for drawInfoCol
  await createIndexWithErrorHandling(drawInfoCol, { eventId: 1 }, { unique: true }, "drawInfoCol.eventId");

  // Indexes for subscribersCol
  await createIndexWithErrorHandling(subscribersCol, { telegramId: 1 }, { unique: true }, "subscribersCol.telegramId");
  
  // We can't directly create an index on GridFSBucket, but files and chunks collections are indexed automatically
  
  // Index for tokenCol
  await createIndexWithErrorHandling(tokenCol, { token: 1 }, { unique: true }, "tokenCol.token");
  await createIndexWithErrorHandling(
    tokenCol, 
    { updatedAt: 1 }, 
    { expireAfterSeconds: 86400 * 30 }, // Expire after 30 days
    "tokenCol.updatedAt (TTL)"
  );

  // Index for logMessagesCol
  await createIndexWithErrorHandling(logMessagesCol, { timestamp: 1 }, {}, "logMessagesCol.timestamp");
  await createIndexWithErrorHandling(logMessagesCol, { eventName: 1 }, {}, "logMessagesCol.eventName");

  console.log("Database index creation completed");
}

// Call the function to create indexes after ensuring database connection is established
setTimeout(() => {
  createIndexes().catch(error => {
    console.error("Failed to create database indexes:", error);
  });
}, 3000); // Wait for 3 seconds to ensure the connection is established
