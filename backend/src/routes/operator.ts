import * as fs from "fs";
import dotenv from "dotenv";
import json2csv from "json2csv";

import { Router } from "express";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { IncomingForm } from "formidable";

import bot from "../bot";
import {
  eventInfoCol,
  userCol,
  bucket,
  tokenCol,
  userPrizeStatusCol,
} from "../database";

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

operatorRouter.patch("/prize/:shortId", async (req, res) => {
  const tokenDoc = await tokenCol.findOne({
    role: "operator",
  });

  if (!tokenDoc) {
    return res.status(503).send("Server unavailable");
  }

  if (req.headers.authorization !== tokenDoc.token) {
    return res.status(401).send("Unauthorized");
  }

  const user = await userCol.findOne({
    shortId: parseInt(req.params.shortId),
  });

  if (!user) {
    return res.status(404).send("User not found");
  }

  const prizeStatus = await userPrizeStatusCol.findOne({
    shortId: user.shortId,
    eventId: user.eventId,
  });

  if (!prizeStatus) {
    return res.status(404).send("Prize status not found");
  }

  if (prizeStatus.claimed) {
    return res.status(400).send("Prize already claimed");
  }

  await userPrizeStatusCol.updateOne(
    {
      shortId: user.shortId,
      eventId: user.eventId,
    },
    { $set: { claimed: true } }
  );

  res.send("Prize claimed");
});

operatorRouter.get("/user/:shortId", async (req, res) => {
  const tokenDoc = await tokenCol.findOne({
    role: "operator",
  });

  if (!tokenDoc) {
    return res.status(503).send("Server unavailable");
  }

  if (req.headers.authorization !== tokenDoc.token) {
    return res.status(401).send("Unauthorized");
  }

  const user = await userCol.findOne({
    shortId: parseInt(req.params.shortId),
  });

  if (!user) {
    return res.status(404).send("User not found");
  }

  interface UserInfo {
    prizeWinner: boolean;
    claimed: boolean;
    firstName: string;
    lastName: string;
  }

  const userInfo: UserInfo = {
    prizeWinner: false,
    claimed: false,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const prizeStatus = await userPrizeStatusCol.findOne({
    shortId: user.shortId,
    eventId: user.eventId,
  });

  if (prizeStatus) {
    userInfo.prizeWinner = true;
    userInfo.claimed = prizeStatus.claimed;
  }

  res.send(userInfo);
});

export default operatorRouter;
