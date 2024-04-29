import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { Markup, Scenes } from "telegraf";
import randomNumber from "random-number-csprng";

import { MyContext } from "../types/bot";
import { eventInfoCol, subscribersCol, userCol } from "../database";

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
      ctx.scene.enter("mainMenuWizard");
      return;
    }

    ctx.reply(
      "Если ты хочешь участвовать в то давай познакомимся. Напиши свою Фамилию"
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message && "text" in ctx.message) {
      ctx.wizard.state.lastName = ctx.message.text;
      ctx.reply("А теперь Имя");
      return ctx.wizard.next();
    } else {
      ctx.reply("Пожалуйста, отправь текстовое сообщение.");
    }
  },
  async (ctx) => {
    if (ctx.message && "text" in ctx.message) {
      ctx.wizard.state.firstName = ctx.message.text;
      ctx.reply(
        "Отлично!\nДля участия в розыгрыше призов, необходимо поделиться с ботом номером телефона",
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
      ctx.reply("Прочти условия участия и Политику конфиденциальности");

      const eventId = ctx.wizard.state.eventId;

      const event = await eventInfoCol.findOne({
        _id: new ObjectId(eventId),
      });

      if (event?.rulesLink) {
        ctx.replyWithDocument(`${hostname}${event.rulesLink}`);
      } else {
        ctx.reply("Правил участия пока нет.");
      }

      if (event?.policyLink) {
        ctx.replyWithDocument(`${hostname}${event.policyLink}`);
      } else {
        ctx.reply("Политики конфиденциальности пока нет.");
      }

      ctx.reply(
        "Нажатие на Кнопку Регистрации будет означать, что ты прочел их и согласен",
        Markup.inlineKeyboard([
          Markup.button.callback("Регистрация", "confirm"),
          Markup.button.callback("Отменить", "cancel"),
        ])
      );

      return ctx.scene.leave();
    } else {
      ctx.reply("Пожалуйста, отправь контакт.");
    }
  }
);

eventRegistrationWizard.action("confirm", async (ctx) => {
  const { firstName, lastName, phoneNumber, eventId } = ctx.wizard.state;

  const userId = ctx.from?.id;

  const subscriber = await subscribersCol.findOne({
    telegramId: userId,
  });

  if (!subscriber) {
    ctx.reply("Произошла ошибка. Пожалуйста, начните с команды /start.");
    return ctx.scene.leave();
  }

  const shortId = await randomNumber(100000, 999999);

  if (!firstName || !lastName || !phoneNumber || !eventId) {
    ctx.reply("Произошла ошибка. Пожалуйста, начните с команды /start.");
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

  ctx.reply(`Расписание мероприятия:\n\n${event?.schedule}`);

  if (event?.mapLink) {
    ctx.reply(`И не забудь карту!`);
    ctx.replyWithDocument(`${hostname}${event.mapLink}`);
  }

  ctx.reply(
    "Карту, расписание, свой прогресс, условия участия и политику конфиденциальности ты всегда сможешь найти в меню."
  );

  ctx.scene.enter("mainMenuWizard");
});

eventRegistrationWizard.action("cancel", async (ctx) => {
  ctx.reply("Регистрация отменена.");
  return ctx.scene.leave();
});
