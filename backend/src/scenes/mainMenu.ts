import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { Markup, Scenes } from "telegraf";

import { MyContext } from "../types/bot";
import { eventInfoCol, subscribersCol, userCol } from "../database";

dotenv.config();

const hostname = process.env.HOSTNAME || `https://mossport.info`;

export const mainMenuWizard = new Scenes.WizardScene<MyContext>(
  "mainMenuWizard",
  async (ctx) => {
    const userId = ctx.from?.id;
    const eventId = ctx.wizard.state.eventId;

    const user = await userCol.findOne({
      userId: userId,
      eventId: new ObjectId(eventId),
    });

    if (!user) {
      ctx.scene.enter("registrationWizard");
      return;
    }

    await ctx.reply(
      "Кнопки в меню:",
      Markup.keyboard([
        ["🔢 Мой код", "📈 Прогресс"],
        ["🗺️ Карта", "📅 Расписание"],
        ["📜 Условия", "🔒 Политика конфиденциальности"],
      ])
        .oneTime(false)
        .resize()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message && "text" in ctx.message) {
      const userId = ctx.from?.id;
      const eventId = ctx.wizard.state.eventId;

      const event = await eventInfoCol.findOne({
        _id: new ObjectId(eventId),
      });

      const subscriber = await subscribersCol.findOne({
        telegramId: userId,
      });

      const user = await userCol.findOne({
        subscriberId: subscriber?._id,
        eventId: new ObjectId(eventId),
      });

      if (!user) {
        ctx.scene.enter("registrationWizard");
        return;
      }

      switch (ctx.message.text) {
        case "🔢 Мой код":
          ctx.reply(
            `Твой секретный код - покажи его Инструктору на площадке после прохождения, чтобы получить балл: ${user.shortId}`
          );
          break;
        case "🗺️ Карта":
          if (event?.mapLink) {
            ctx.replyWithDocument(`${hostname}${event.mapLink}`);
          } else {
            ctx.reply("Карты пока нет.");
          }
          break;
        case "📅 Расписание":
          if (event?.schedule) {
            ctx.reply(`${event.schedule}`);
          } else {
            ctx.reply("Расписания пока нет.");
          }
          break;
        case "📜 Условия":
          if (event?.rulesLink) {
            ctx.replyWithDocument(`${hostname}${event.rulesLink}`);
          } else {
            ctx.reply("Условий пока нет.");
          }
          break;
        case "🔒 Политика конфиденциальности":
          if (event?.policyLink) {
            ctx.replyWithDocument(`${hostname}${event.policyLink}`);
          } else {
            ctx.reply("Политики конфиденциальности пока нет.");
          }
          break;
        default:
          ctx.reply("Пожалуйста, используйте предоставленные кнопки.");
          break;
      }
    } else {
      ctx.reply("Пожалуйста, используйте предоставленные кнопки.");
    }
  }
);
