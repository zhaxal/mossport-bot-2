import * as fs from "fs";
import dotenv from "dotenv";
import json2csv from "json2csv";

import { Router } from "express";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { IncomingForm } from "formidable";

import bot from "../bot";
import { eventInfoCol, userCol, bucket, tokenCol } from "../database";

dotenv.config();

const operatorRouter = Router();

operatorRouter.post("/token", async (req, res) => {
  const tokenDoc = await tokenCol.findOne({
    role: "operator",
  });

  if (!tokenDoc) {
    return res.status(503).send("Server unavailable");
  }

  if (req.body.token !== tokenDoc.token) {
    return res.status(401).send("Unauthorized");
  }

  res.send("Token verified");
});

export default operatorRouter;
