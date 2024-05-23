import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { Markup, Scenes } from "telegraf";
import randomNumber from "random-number-csprng";

import { MyContext } from "../types/bot";
import { eventInfoCol, subscribersCol, userCol } from "../database";
import delay from "../utils/delay";

dotenv.config();

const hostname = process.env.HOSTNAME;

export const eventRegistrationWizard = new Scenes.WizardScene<MyContext>(
  "eventRegistrationWizard",
  async (ctx) => {
    const userId = ctx.from?.id;
    const eventId = ctx.wizard.state.eventId;

    const subscriber = await subscribersCol.findOne({
      telegramId: userId,
    });

    const user = await userCol.findOne({
      subscriberId: subscriber?._id,
      eventId: new ObjectId(eventId),
    });

    if (user) {
      ctx.scene.enter("mainMenuWizard", {
        eventId,
      });
      return;
    }

    ctx.reply(
      "Если ты хочешь участвовать в розыгрыше призов, то давай познакомимся. 😃 Напиши свою Фамилию.🖊"
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message && "text" in ctx.message) {
      ctx.wizard.state.lastName = ctx.message.text;
      ctx.reply("А теперь Имя.🖊");
      return ctx.wizard.next();
    } else {
      ctx.reply("Пожалуйста, отправь текстовое сообщение.");
    }
  },
  async (ctx) => {
    if (ctx.message && "text" in ctx.message) {
      ctx.wizard.state.firstName = ctx.message.text;
      ctx.reply(
        "Отлично!👍🏼\nЕще необходимо поделиться с ботом номером телефона. 📱",
        Markup.keyboard([
          Markup.button.contactRequest("📱 Отправить номер телефона"),
        ]).resize()
      );
      return ctx.wizard.next();
    } else {
      ctx.reply("Пожалуйста, отправь текстовое сообщение.");
    }
  },
  async (ctx) => {
    if (ctx.message && "contact" in ctx.message) {
      ctx.wizard.state.phoneNumber = ctx.message.contact.phone_number;
      await ctx.reply(
        "Прочти условия участия и Политику конфиденциальности.📝",
        Markup.removeKeyboard()
      );

      const eventId = ctx.wizard.state.eventId;

      const event = await eventInfoCol.findOne({
        _id: new ObjectId(eventId),
      });

      if (event?.rulesLink) {
        await ctx.replyWithDocument(`${hostname}${event.rulesLink}`);
      } else {
        await ctx.reply("Правил участия пока нет.");
      }

      if (event?.policyLink) {
        await ctx.replyWithDocument(`${hostname}${event.policyLink}`);
      } else {
        await ctx.reply("Политики конфиденциальности пока нет.");
      }

      await ctx.reply(
        "Нажатие на Кнопку Регистрации будет означать, что ты прочел их и согласен.✅",
        Markup.inlineKeyboard([
          Markup.button.callback("Регистрация", "confirm"),
          Markup.button.callback("Отменить", "cancel"),
        ])
      );

      return ctx.wizard.next();
    } else {
      ctx.reply(
        "Пожалуйста, отправь контакт.",
        Markup.keyboard([
          Markup.button.contactRequest("📱 Отправить номер телефона"),
        ]).resize()
      );
    }
  },
  async (ctx) => {}
);

eventRegistrationWizard.action("confirm", async (ctx) => {
  try {
    const { firstName, lastName, phoneNumber, eventId } = ctx.wizard.state;
    const userId = ctx.from?.id;

    const subscriber = await subscribersCol.findOne({
      telegramId: userId,
    });

    if (!subscriber) {
      await ctx.reply(
        "Произошла ошибка. Пожалуйста, начните с команды /start."
      );
      return ctx.scene.leave();
    }

    const shortId = await randomNumber(100000, 999999);

    if (!firstName || !lastName || !phoneNumber || !eventId) {
      await ctx.reply(
        "Произошла ошибка. Пожалуйста, начните с команды /start."
      );
      return ctx.scene.leave();
    }

    await userCol.insertOne({
      subscriberId: subscriber._id,
      firstName,
      lastName,
      phoneNumber,
      shortId,
      eventId: new ObjectId(eventId),
    });

    const event = await eventInfoCol.findOne({
      _id: new ObjectId(eventId),
    });

    if (!event) {
      await ctx.reply(
        "Произошла ошибка. Пожалуйста, начните с команды /start."
      );
      await ctx.answerCbQuery("Ошибка при регистраций.");
      return ctx.scene.leave();
    }
    await ctx.reply(
      `Теперь у тебя есть уникальный код, который участвует в розыгрыше призов, если ты станешь победителем ты получишь сообщение. Удачи! 🫶🏼`
    );

    await delay(5000);

    await ctx.reply(`Расписание мероприятия.📜\n\n${event?.schedule}`);

    await delay(5000);

    if (event?.mapLink) {
      await ctx.reply(`И не забудь карту!📍`);
      await ctx.replyWithDocument(`${hostname}${event.mapLink}`);
      await delay(5000);
    }

    await ctx.reply(
      "Карту, расписание, условия участия и политику конфиденциальности ты всегда сможешь найти в меню.⬇"
    );
    await delay(5000);

    if (event.partnerMessage) {
      await ctx.reply(event.partnerMessage);
      await delay(5000);
    }
    if (event.partnerMessage2) await ctx.reply(event.partnerMessage2);

    await ctx.answerCbQuery("Регистрация завершена.");

    await ctx.editMessageReplyMarkup({
      inline_keyboard: [],
    });

    ctx.scene.enter("mainMenuWizard", {
      eventId: event._id.toString(),
    });
  } catch (error) {
    console.error(error);
    ctx.answerCbQuery("Произошла ошибка. Пожалуйста, попробуйте позже.");
  }
});

eventRegistrationWizard.action("cancel", async (ctx) => {
  ctx.answerCbQuery("Регистрация отменена.");

  await ctx.editMessageReplyMarkup({
    inline_keyboard: [],
  });

  return ctx.scene.leave();
});
