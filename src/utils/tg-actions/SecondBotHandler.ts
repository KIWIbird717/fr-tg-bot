import { KEYBOARD } from "@/src/keyboard";
import { BOTS, bot } from "@/src";
import { FRBot } from "@/src/utils/bots";
import { closeKeyboard } from "./closeKeyboard";

/** --------------------------------------------------- *
 *                   Second bot handlers                *
 * ---------------------------------------------------- */
export let frbot2: FRBot | undefined;
export default function SecondBotHandlers() {
  // Запуск второго бота
  bot.onText(new RegExp(KEYBOARD.startSecondBot), async (msg) => {
    const frbotStatus = BOTS.second.status;
    if (frbotStatus === "running") {
      bot.sendMessage(msg.chat.id, "❌ Ошибка: Второй бот уже запущен");
      return;
    }
    frbot2 = new FRBot({
      id: 2,
      CFRV: 0,
      NFRV: 0,
      updateInterval: 60 * 3,
      tgBot: bot,
      msg,
    });
    frbot2.start();
    BOTS.second.status = "running";
    closeKeyboard(msg, "🚀");
  });

  // Остановка второго бота
  bot.onText(new RegExp(KEYBOARD.stopSecondBot), async (msg) => {
    const frbotStatus = BOTS.second.status;
    if (frbotStatus === "stopped") {
      bot.sendMessage(msg.chat.id, "❌ Ошибка: Второй бот уже остановлен");
      return;
    }
    frbot2?.stop();
    BOTS.second.status = "stopped";
    closeKeyboard(msg, "🛑");
  });

  // панель настроект
  bot.onText(new RegExp(KEYBOARD.settingsSecondBot), async (msg) => {
    const settings = BOTS.second.settings;
    let settingsInfo = "Текущие настройки второго бота:\n\n";
    for (const key in settings) {
      settingsInfo += `• ${key}: ${settings[key as keyof typeof settings]}\n`;
    }
    settingsInfo +=
      "\n Если у вас есть запущенные боты, изменения вступят в силу только после их перезапуска";

    await bot.sendMessage(msg.chat.id, settingsInfo, {
      reply_markup: {
        force_reply: true,
        keyboard: [
          [
            {
              text: `2b NFRV: ${settings.NFRV}`,
            },
            {
              text: `2b CFRV: ${settings.CFRV}`,
            },
          ],
          [
            {
              text: `2b Update interval sec: ${settings.updateInterval}`,
            },
          ],
          [
            {
              text: KEYBOARD.closeMenu,
            },
          ],
        ],
      },
    });
  });

  // Настрока NFRV
  bot.onText(/2b NFRV: (.+)/, async (msg, match) => {
    if (!match) return;
    const prompt = await bot.sendMessage(
      msg.chat.id,
      "Перешлите на это сообщение 2b NFRV в числовом формате",
      {
        reply_markup: {
          remove_keyboard: true,
        },
      },
    );

    bot.onReplyToMessage(msg.chat.id, prompt.message_id, async (reply) => {
      if (!reply.text) return;
      const nfrv = parseFloat(reply.text);
      if (isNaN(nfrv)) {
        bot.sendMessage(msg.chat.id, "❌ Ошибка: Неверный формат числа");
        return;
      }
      BOTS.second.settings.NFRV = nfrv;

      bot.sendMessage(msg.chat.id, `✅ Значение <b>2b NFRV</b> успешно обновлено: <b>${nfrv}</b>`, {
        parse_mode: "HTML",
      });
    });
  });

  // Настрока CFRV
  bot.onText(/2b CFRV: (.+)/, async (msg, match) => {
    if (!match) return;
    const prompt = await bot.sendMessage(
      msg.chat.id,
      "Перешлите на это сообщение 2b CFRV в числовом формате",
      {
        reply_markup: {
          remove_keyboard: true,
        },
      },
    );

    bot.onReplyToMessage(msg.chat.id, prompt.message_id, async (reply) => {
      if (!reply.text) return;
      const cfrv = parseFloat(reply.text);
      if (isNaN(cfrv)) {
        bot.sendMessage(msg.chat.id, "❌ Ошибка: Неверный формат числа");
        return;
      }
      BOTS.second.settings.CFRV = cfrv;

      bot.sendMessage(msg.chat.id, `✅ Значение <b>2b CFRV</b> успешно обновлено: <b>${cfrv}</b>`, {
        parse_mode: "HTML",
      });
    });
  });

  // Настрока Update interval
  bot.onText(/2b Update interval sec: (.+)/, async (msg, match) => {
    if (!match) return;
    const prompt = await bot.sendMessage(
      msg.chat.id,
      "Перешлите на это сообщение 2b Update interval в числовом формате. Время в секундах",
      {
        reply_markup: {
          remove_keyboard: true,
        },
      },
    );

    bot.onReplyToMessage(msg.chat.id, prompt.message_id, async (reply) => {
      if (!reply.text) return;
      const updateInterval = parseInt(reply.text);
      if (isNaN(updateInterval)) {
        bot.sendMessage(msg.chat.id, "❌ Ошибка: Неверный формат числа");
        return;
      }
      BOTS.second.settings.updateInterval = updateInterval;

      bot.sendMessage(
        msg.chat.id,
        `✅ Значение <b>2b Update interval</b> успешно обновлено: <b>${updateInterval}</b>`,
        {
          parse_mode: "HTML",
        },
      );
    });
  });
}
