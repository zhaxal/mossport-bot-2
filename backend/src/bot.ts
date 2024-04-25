import dotenv from "dotenv";
import { Scenes, Telegraf, session, Markup } from "telegraf";

import { MyContext } from "./types/bot";
import { subscribersCol } from "./database";

dotenv.config();

const botToken = process.env.BOT_TOKEN || "";

const bot = new Telegraf<MyContext>(botToken);

const stage = new Scenes.Stage<MyContext>([]);
bot.use(session());
bot.use(stage.middleware());

bot.command("start", async (ctx) => {
  const existingUser = await subscribersCol.findOne({
    telegramId: ctx.from.id,
  });

  if (!existingUser) {
    await subscribersCol.insertOne({
      telegramId: ctx.from.id,
    });
  }

  ctx.reply(
    `Привет, ${ctx.from.first_name}!\nАктивных событий на данный момент нет, но как только будет что-то известно, мы напишем тебе здесь!`
  );
});

bot.on("message", async (ctx) => {
  ctx.reply(
    "Похоже, бот перезапускался. Пожалуйста, воспользуйтесь командой /start.",
    Markup.removeKeyboard()
  );
});
// bot.launch();

export default bot;
