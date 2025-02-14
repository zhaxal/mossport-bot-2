import { ObjectId } from "mongodb";
import { Markup, Scenes } from "telegraf";
import randomNumber from "random-number-csprng";

import { MyContext } from "../types/bot";
import { eventInfoCol, subscribersCol, userCol } from "../database";
import delay from "../utils/delay";
import { backendLink } from "../config";
import { isValidURL } from "../utils/url";

export interface RegistrationResult {
  success: boolean;
  eventId?: string;
  error?: unknown;
}

export interface RegistrationState {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  eventId: string;
}

export const eventRegistrationWizard = new Scenes.WizardScene<MyContext>(
  "eventRegistrationWizard",
  async (ctx) => {
    try {
      const userId = ctx.from?.id;
      const eventId = ctx.wizard.state.eventId;

      const subscriber = await subscribersCol.findOne({ telegramId: userId });
      const user = await userCol.findOne({
        subscriberId: subscriber?._id,
        eventId: new ObjectId(eventId),
      });

      if (user) {
        return ctx.scene.enter("mainMenuWizard", { eventId });
      }

      await ctx.reply(
        "Если ты хочешь участвовать в розыгрыше призов, то давай познакомимся. 😃 Напиши свою Фамилию.🖊"
      );
      return ctx.wizard.next();
    } catch (error) {
      console.error("Error in step 1:", error);
      return ctx.reply("Произошла ошибка. Пожалуйста, попробуйте позже.");
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && "text" in ctx.message) {
        ctx.wizard.state.lastName = ctx.message.text;
        await ctx.reply("А теперь Имя.🖊");
        return ctx.wizard.next();
      } else {
        return ctx.reply("Пожалуйста, отправь текстовое сообщение.");
      }
    } catch (error) {
      console.error("Error in step 2:", error);
      return ctx.reply("Произошла ошибка. Пожалуйста, попробуйте позже.");
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && "text" in ctx.message) {
        ctx.wizard.state.firstName = ctx.message.text;
        await ctx.reply(
          "Отлично!👍🏼\nЕще необходимо поделиться с ботом номером телефона. 📱",
          Markup.keyboard([
            Markup.button.contactRequest("📱 Отправить номер телефона"),
          ]).resize()
        );
        return ctx.wizard.next();
      } else {
        return ctx.reply("Пожалуйста, отправь текстовое сообщение.");
      }
    } catch (error) {
      console.error("Error in step 3:", error);
      return ctx.reply("Произошла ошибка. Пожалуйста, попробуйте позже.");
    }
  },
  async (ctx) => {
    try {
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

        if (event?.rulesLink && isValidURL(`${backendLink}${event.rulesLink}`)) {
          await ctx.replyWithDocument(`${backendLink}${event.rulesLink}`);
        } else {
          await ctx.reply("Правил участия пока нет.");
        }

        if (event?.policyLink && isValidURL(`${backendLink}${event.policyLink}`)) {
          await ctx.replyWithDocument(`${backendLink}${event.policyLink}`);
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
        return ctx.reply(
          "Пожалуйста, отправь контакт.",
          Markup.keyboard([
            Markup.button.contactRequest("📱 Отправить номер телефона"),
          ]).resize()
        );
      }
    } catch (error) {
      console.error("Error in step 4:", error);
      return ctx.reply("Произошла ошибка. Пожалуйста, попробуйте позже.");
    }
  },
  async (ctx) => {
    // This step is intentionally left empty since action handlers manage confirmation.
  }
);

eventRegistrationWizard.action("confirm", async (ctx) => {
  try {
    await ctx.answerCbQuery("Регистрация завершена.");

    const result: RegistrationResult = await processRegistration(ctx);

    if (result?.success && result.eventId) {
      // Clean up UI first
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      // Then transition scene with proper session handling
      await ctx.scene.enter("mainMenuWizard", { eventId: result.eventId });
    } else {
      await ctx.reply(
        "Произошла ошибка во время регистрации. Пожалуйста, попробуйте позже."
      );
      await ctx.scene.leave();
    }
  } catch (error) {
    console.error("Error in confirm action:", error);
    await ctx.answerCbQuery("Произошла ошибка. Пожалуйста, попробуйте позже.");
    await ctx.scene.leave();
  }
});

async function processRegistration(
  ctx: MyContext
): Promise<RegistrationResult> {
  try {
    const state = ctx.wizard.state as RegistrationState;
    const { firstName, lastName, phoneNumber, eventId } = state;
    const userId = ctx.from?.id;

    if (!firstName || !lastName || !phoneNumber || !eventId || !userId) {
      await ctx.reply(
        "Произошла ошибка. Пожалуйста, начните с команды /start."
      );
      return {
        success: false,
        error: "Missing required registration data",
      };
    }

    const subscriber = await subscribersCol.findOne({ telegramId: userId });
    if (!subscriber) {
      await ctx.reply(
        "Произошла ошибка. Пожалуйста, начните с команды /start."
      );
      return {
        success: false,
        error: "Subscriber not found",
      };
    }

    const shortId = await randomNumber(100000, 999999);

    await userCol.insertOne({
      subscriberId: subscriber._id,
      firstName,
      lastName,
      phoneNumber,
      shortId,
      eventId: new ObjectId(eventId),
    });

    const event = await eventInfoCol.findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      await ctx.reply(
        "Произошла ошибка. Пожалуйста, начните с команды /start."
      );
      return {
        success: false,
        error: "Event not found",
      };
    }

    await ctx.reply(
      `Теперь у тебя есть уникальный код, который участвует в розыгрыше призов. Если ты станешь победителем, ты получишь сообщение. Удачи! 🫶🏼`
    );

    await delay(5000);
    await ctx.reply(`Расписание мероприятия.📜\n\n${event.schedule}`);

    if (event.mapLink) {
      const mapUrl = `${backendLink}${event.mapLink}`;
      if (isValidURL(mapUrl)) {
        await delay(5000);
        await ctx.reply("И не забудь карту!📍");
        await ctx.replyWithDocument(mapUrl);
      }
    }

    await delay(5000);
    await ctx.reply(
      "Карту, расписание, условия участия и политику конфиденциальности ты всегда сможешь найти в меню.⬇"
    );

    if (event.partnerMessage) {
      await delay(5000);
      await ctx.reply(event.partnerMessage);
    }
    if (event.partnerMessage2) {
      await delay(5000);
      await ctx.reply(event.partnerMessage2);
    }

    // Instead of directly entering scene, return to the action handler
    return {
      success: true,
      eventId: event._id.toString(),
    };
  } catch (error) {
    console.error("Error in processRegistration:", error);
    return {
      success: false,
      error,
    };
  }
}

eventRegistrationWizard.action("cancel", async (ctx) => {
  try {
    await ctx.answerCbQuery("Регистрация отменена.");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    // Clear wizard state
    ctx.wizard.state = {};
    await ctx.scene.leave();
  } catch (error) {
    console.error("Error in cancel action:", error);
    await ctx.answerCbQuery("Произошла ошибка. Пожалуйста, попробуйте позже.");
  }
});
