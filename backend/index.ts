import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { ObjectId } from "mongodb";

import adminRouter from "./src/routes/admin";
import operatorRouter from "./src/routes/operator";

import { bucket, eventInfoCol } from "./src/database";

import "./src/bot";

dotenv.config();

const port = process.env.PORT || 3003;

const app = express();
const apiRouter = express.Router();

app.use(cors({ origin: "*" }));
app.use(express.json());

apiRouter.get("/", (req, res) => {
  res.send("Hello World!");
});

apiRouter.get("/files/:name", async (req, res) => {
  const fileName = req.params.name;

  const files = await bucket.find({ filename: fileName }).toArray();

  if (files.length === 0) {
    res.status(404).send("File not found");
    return;
  }

  bucket.openDownloadStreamByName(fileName).pipe(res);
});

apiRouter.get("/event/:eventId", async (req, res) => {
  const eventId = req.params.eventId;

  const event = await eventInfoCol.findOne({ _id: new ObjectId(eventId) });
  res.send(event);
});

apiRouter.get("/event", async (req, res) => {
  const events = await eventInfoCol.find().toArray();
  res.send(events);
});

apiRouter.use("/admin", adminRouter);
apiRouter.use("/operator", operatorRouter);

app.use("/api", apiRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/api`);
});
