import dotenv from "dotenv";
import { Scenes, Telegraf, session, Markup } from "telegraf";

import { MyContext } from "./types/bot";
import { eventInfoCol, subscribersCol } from "./database";
import { ObjectId } from "mongodb";

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
      name: ctx.from.first_name,
    });
  }

  const events = await eventInfoCol
    .find({
      status: "active",
    })
    .toArray();

  if (events.length === 0) {
    ctx.reply(
      `Привет, ${ctx.from.first_name}!\nАктивных событий на данный момент нет, но как только будет что-то известно, мы напишем тебе здесь!`
    );
    return;
  }
  // use inline keyboard to show all active events

  const keyboard = Markup.inlineKeyboard(
    events.map((event) => [
      Markup.button.callback(event.title, `event_${event._id}`),
    ])
  );

  ctx.reply(
    `Привет, ${ctx.from.first_name}!\nОткрыты регистраций на:`,
    keyboard
  );
});

bot.on("message", async (ctx) => {
  ctx.reply(
    "Похоже, бот перезапускался. Пожалуйста, воспользуйтесь командой /start.",
    Markup.removeKeyboard()
  );
});

bot.action(/event_(.+)/, async (ctx) => {
  // Extract the event ID from the callback data
  const eventId = ctx.match[1];

  const event = await eventInfoCol.findOne({
    _id: new ObjectId(eventId),
  });
  if (event) {
    await ctx.reply(`You selected the event: ${event.title}`);
    await ctx.answerCbQuery("Event selected successfully");
  } else {
    await ctx.reply("The selected event does not exist.");
    await ctx.answerCbQuery("Failed to select event");
  }
});

bot.launch();

export default bot;
