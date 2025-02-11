import { ObjectId } from "mongodb";
import { Markup, Scenes } from "telegraf";

import { MyContext } from "../types/bot";
import { eventInfoCol, subscribersCol, userCol } from "../database";
import { hostname } from "../config";
import { isValidURL } from "../utils/url";

const mainMenuKeyboard = Markup.keyboard([
  ["🔢 Мой код", "🗺️ Карта"],
  ["📅 Расписание", "📜 Условия"],
  ["🔒 Политика конфиденциальности", "📋 Список мероприятий"],
]).oneTime(false).resize();

async function sendMainMenu(ctx: MyContext): Promise<void> {
  await ctx.reply("Кнопки в меню:", mainMenuKeyboard);
}

export const mainMenuWizard = new Scenes.WizardScene<MyContext>(
  "mainMenuWizard",
  async (ctx) => {
    try {
      const subscriberId = ctx.from?.id;
      const eventId = ctx.wizard.state.eventId;
      const subscriber = await subscribersCol.findOne({ telegramId: subscriberId });
      const user = await userCol.findOne({
        subscriberId: subscriber?._id,
        eventId: new ObjectId(eventId),
      });

      if (!user) {
        return ctx.scene.enter("eventRegistrationWizard");
      }

      await sendMainMenu(ctx);
      return ctx.wizard.next();
    } catch (error) {
      console.error("Error in mainMenuWizard step 1:", error);
      await ctx.reply("Произошла ошибка. Попробуйте позже.");
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && "text" in ctx.message) {
        const userId = ctx.from?.id;
        const eventId = ctx.wizard.state.eventId;
        const event = await eventInfoCol.findOne({ _id: new ObjectId(eventId) });
        const subscriber = await subscribersCol.findOne({ telegramId: userId });
        const user = await userCol.findOne({
          subscriberId: subscriber?._id,
          eventId: new ObjectId(eventId),
        });

        if (!user) {
          return ctx.scene.enter("eventRegistrationWizard");
        }

        switch (ctx.message.text) {
          case "🔢 Мой код":
            await ctx.reply(`Твой секретный код: ${user.shortId}`);
            break;
          case "🗺️ Карта":
            if (event?.mapLink && isValidURL(event.mapLink)) {
              await ctx.replyWithDocument(`${hostname}${event.mapLink}`);
            } else {
              await ctx.reply("Карты пока нет.");
            }
            break;
          case "📅 Расписание":
            if (event?.schedule) {
              await ctx.reply(`${event.schedule}`);
            } else {
              await ctx.reply("Расписания пока нет.");
            }
            break;
          case "📜 Условия":
            if (event?.rulesLink && isValidURL(event.rulesLink)) {
              await ctx.replyWithDocument(`${hostname}${event.rulesLink}`);
            } else {
              await ctx.reply("Условий пока нет.");
            }
            break;
          case "🔒 Политика конфиденциальности":
            if (event?.policyLink && isValidURL(event.policyLink)) {
              await ctx.replyWithDocument(`${hostname}${event.policyLink}`);
            } else {
              await ctx.reply("Политики конфиденциальности пока нет.");
            }
            break;
          case "📋 Список мероприятий": {
            const events = await eventInfoCol.find({ status: "active" }).toArray();

            if (events.length === 0) {
              await ctx.reply(
                `Привет, ${ctx.from?.first_name}!\nАктивных событий на данный момент нет, но как только будет что-то известно, мы напишем тебе здесь!`
              );
              return;
            }

            const keyboard = Markup.inlineKeyboard(
              events.map((event) => [
                Markup.button.callback(event.title, `event_${event._id}`),
              ])
            );
            await ctx.reply(
              `Привет, ${ctx.from?.first_name}!\nОткрыты регистрации на:`,
              keyboard
            );

            const message = await ctx.reply("Убираем клавиатуру...", Markup.removeKeyboard());
            if (message.message_id && ctx.chat?.id) {
              await ctx.telegram.deleteMessage(ctx.chat.id, message.message_id);
            }
            return ctx.scene.leave();
          }
          default:
            await ctx.reply("Пожалуйста, используйте предоставленные кнопки.");
            await sendMainMenu(ctx);
            break;
        }
      } else if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
        const action = ctx.callbackQuery.data;
        const match = /event_(.+)/.exec(action);

        if (match) {
          const eventId = match[1];
          const event = await eventInfoCol.findOne({
            _id: new ObjectId(eventId),
          });
          if (event) {
            await ctx.answerCbQuery("Выбран ивент.");
            await ctx.scene.enter("eventRegistrationWizard", {
              eventId: event._id.toString(),
            });
            await ctx.deleteMessage();
          } else {
            await ctx.answerCbQuery("Не удалось выбрать ивент.");
            await ctx.reply("Ивент не найден. Попробуйте другой ивент.");
          }
        }
      } else {
        await ctx.reply("Пожалуйста, используйте предоставленные кнопки.");
        await sendMainMenu(ctx);
      }
    } catch (error) {
      console.error("Error in mainMenuWizard step 2:", error);
      await ctx.reply("Произошла ошибка. Попробуйте позже.");
      return ctx.scene.leave();
    }
  }
);