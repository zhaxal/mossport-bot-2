import dotenv from "dotenv";

import { ObjectId } from "mongodb";
import { Scenes, Telegraf, session, Markup } from "telegraf";

import { userCol } from "./database";
import { MyContext } from "./types/bot";

dotenv.config();

const botToken = process.env.BOT_TOKEN || "";

const bot = new Telegraf<MyContext>(botToken);

const stage = new Scenes.Stage<MyContext>([]);
bot.use(session());
bot.use(stage.middleware());

bot.command("start", async (ctx) => {
  // const user = await userCol.findOne({
  //   userId: ctx.from.id,
  //   eventId: new ObjectId(eventId),
  // });


});

bot.on("message", async (ctx) => {
  ctx.reply(
    "Похоже, бот перезапускался. Пожалуйста, воспользуйтесь командой /start.",
    Markup.removeKeyboard()
  );
});
// bot.launch();

export default bot;
