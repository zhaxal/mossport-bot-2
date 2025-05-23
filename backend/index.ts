import cors from "cors";

import express from "express";

import { ObjectId } from "mongodb";

import adminRouter from "./src/routes/admin";
import operatorRouter from "./src/routes/operator";

import { bucket, drawInfoCol, eventInfoCol } from "./src/database";

import "./src/bot";
import "./src/agenda";

import { port } from "./src/config";

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

apiRouter.get("/event/:eventId/draw", async (req, res) => {
  const eventId = req.params.eventId;

  const drawInfo = await drawInfoCol.findOne({
    eventId: new ObjectId(eventId),
  });

  res.send(drawInfo);
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
