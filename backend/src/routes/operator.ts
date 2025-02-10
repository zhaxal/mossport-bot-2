import { Router, Request, Response, NextFunction } from "express";
import { userCol, tokenCol, userPrizeStatusCol } from "../database";

const operatorRouter = Router();

const getOperatorToken = async () => {
  return await tokenCol.findOne({ role: "operator" });
};

const verifyOperatorToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const operatorTokenDoc = await getOperatorToken();
    if (!operatorTokenDoc) {
      return res.status(503).send("Server unavailable");
    }
    if (req.headers.authorization !== operatorTokenDoc.token) {
      return res.status(401).send("Unauthorized");
    }
    next();
  } catch (err) {
    next(err);
  }
};

operatorRouter.post("/token", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const operatorTokenDoc = await getOperatorToken();
    if (!operatorTokenDoc) {
      return res.status(503).send("Server unavailable");
    }
    if (req.body.token !== operatorTokenDoc.token) {
      return res.status(401).send("Unauthorized");
    }
    res.send("Token verified");
  } catch (err) {
    next(err);
  }
});

operatorRouter.patch(
  "/prize/:shortId",
  verifyOperatorToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shortId = parseInt(req.params.shortId, 10);
      if (isNaN(shortId)) {
        return res.status(400).send("Invalid shortId");
      }

      const user = await userCol.findOne({ shortId });
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
        { shortId: user.shortId, eventId: user.eventId },
        { $set: { claimed: true } }
      );
      res.send("Prize claimed");
    } catch (err) {
      next(err);
    }
  }
);

operatorRouter.get(
  "/user/:shortId",
  verifyOperatorToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shortId = parseInt(req.params.shortId, 10);
      if (isNaN(shortId)) {
        return res.status(400).send("Invalid shortId");
      }

      const user = await userCol.findOne({ shortId });
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
      res.json(userInfo);
    } catch (err) {
      next(err);
    }
  }
);

export default operatorRouter;
