import dotenv from "dotenv";

import { ObjectId } from "mongodb";
import { Scenes, Telegraf, session, Markup } from "telegraf";

import { MyContext } from "./types/bot";
import { eventInfoCol, subscribersCol } from "./database";

import { mainMenuWizard } from "./scenes/mainMenu";
import { eventRegistrationWizard } from "./scenes/eventRegistration";

dotenv.config();

const botToken = process.env.BOT_TOKEN || "";

const bot = new Telegraf<MyContext>(botToken);

const stage = new Scenes.Stage<MyContext>([
  eventRegistrationWizard,
  mainMenuWizard,
]);

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

  const keyboard = Markup.inlineKeyboard(
    events.map((event) => [
      Markup.button.callback(event.title, `event_${event._id}`),
    ])
  );

  ctx.reply(
    `Привет, ${ctx.from.first_name}!\nОткрыты регистрации на:`,
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
  try {
    // Respond to the callback query immediately
    await ctx.answerCbQuery("Выбран ивент.");

    const eventId = ctx.match[1];

    // Fetch event from the database
    const event = await eventInfoCol.findOne({
      _id: new ObjectId(eventId),
    });

    if (event) {
      // Enter the registration wizard scene
      await ctx.scene.enter("eventRegistrationWizard", {
        eventId: event._id.toString(),
      });

      // Attempt to delete the original message
      try {
        await ctx.deleteMessage();
      } catch (deleteError) {
        console.error("Error deleting message:", deleteError);
      }
    } else {
      await ctx.reply("Ивент не найден. Попробуйте другой ивент.");
    }
  } catch (error) {
    console.error("Error handling event selection:", error);
    await ctx.answerCbQuery("Произошла ошибка. Пожалуйста, попробуйте позже.");
  }
});

bot.launch();

export default bot;
