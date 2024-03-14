import { KEYBOARD } from "@/src/keyboard";
import { BOTS, bot } from "@/src";
import { FRBot } from "@/src/utils/bots";
import { closeKeyboard } from "./closeKeyboard";

/** --------------------------------------------------- *
 *                   First bot handlers                 *
 * ---------------------------------------------------- */
export let frbot1: FRBot | undefined;
export default function FirstBotHandlers() {
  // Запуск первого бота
  bot.onText(new RegExp(KEYBOARD.startFirsBot), async (msg) => {
    const frbotStatus = BOTS.first.status;
    if (frbotStatus === "running") {
      bot.sendMessage(msg.chat.id, "❌ Ошибка: Первый бот уже запущен");
      return;
    }
    frbot1 = new FRBot({
      id: 1,
      CFRV: BOTS.first.settings.CFRV,
      NFRV: BOTS.first.settings.NFRV,
      updateInterval: BOTS.first.settings.updateInterval,
      tgBot: bot,
      msg,
    });
    frbot1.start();
    BOTS.first.status = "running";
    closeKeyboard(msg, "🚀");
  });

  // Остановка первого бота
  bot.onText(new RegExp(KEYBOARD.stopFirstBot), async (msg) => {
    const frbotStatus = BOTS.first.status;
    if (frbotStatus === "stopped") {
      bot.sendMessage(msg.chat.id, "❌ Ошибка: Первый бот уже остановлен");
      return;
    }
    frbot1?.stop();
    BOTS.first.status = "stopped";
    closeKeyboard(msg, "🛑");
  });

  // панель настроект
  bot.onText(new RegExp(KEYBOARD.settingsFirstBot), async (msg) => {
    const settings = BOTS.first.settings;
    let settingsInfo = "Текущие настройки первого бота:\n\n";
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
              text: `1b NFRV: ${settings.NFRV}`,
            },
            {
              text: `1b CFRV: ${settings.CFRV}`,
            },
          ],
          [
            {
              text: `1b Update interval sec: ${settings.updateInterval}`,
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
  bot.onText(/1b NFRV: (.+)/, async (msg, match) => {
    if (!match) return;
    const prompt = await bot.sendMessage(
      msg.chat.id,
      "Перешлите на это сообщение 1b NFRV в числовом формате",
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
      BOTS.first.settings.NFRV = nfrv;

      bot.sendMessage(msg.chat.id, `✅ Значение <b>1b NFRV</b> успешно обновлено: <b>${nfrv}</b>`, {
        parse_mode: "HTML",
      });
    });
  });

  // Настрока CFRV
  bot.onText(/1b CFRV: (.+)/, async (msg, match) => {
    if (!match) return;
    const prompt = await bot.sendMessage(
      msg.chat.id,
      "Перешлите на это сообщение 1b CFRV в числовом формате",
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
      BOTS.first.settings.CFRV = cfrv;

      bot.sendMessage(msg.chat.id, `✅ Значение <b>1b CFRV</b> успешно обновлено: <b>${cfrv}</b>`, {
        parse_mode: "HTML",
      });
    });
  });

  // Настрока Update interval
  bot.onText(/1b Update interval sec: (.+)/, async (msg, match) => {
    if (!match) return;
    const prompt = await bot.sendMessage(
      msg.chat.id,
      "Перешлите на это сообщение 1b Update interval в числовом формате. Время в секундах",
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
      BOTS.first.settings.updateInterval = updateInterval;

      bot.sendMessage(
        msg.chat.id,
        `✅ Значение <b>1b Update interval</b> успешно обновлено: <b>${updateInterval}</b>`,
        {
          parse_mode: "HTML",
        },
      );
    });
  });
}
