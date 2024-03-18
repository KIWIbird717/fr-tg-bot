import TelegramBot from "node-telegram-bot-api";
import { FundingRateAnalisator } from "../funding-rate.ts/index.ts";
import { Logger } from "../logger.js";
import { ISFRelement } from "../funding-rate.ts/types.js";

type Props = {
  id: number;
  CFRV: number;
  NFRV: number;
  updateInterval: number;
  tgBot: TelegramBot;
  msg: TelegramBot.Message;
};

export class FRBot {
  private runningFlag: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private funding: FundingRateAnalisator | null = null;

  private readonly id: number;
  private readonly CFRV: number;
  private readonly NFRV: number;
  private readonly updateInterval: number;
  private readonly tgBot: TelegramBot;
  private readonly msg: TelegramBot.Message;

  constructor({ id, CFRV, NFRV, updateInterval, tgBot, msg }: Props) {
    this.id = id;
    this.CFRV = CFRV;
    this.NFRV = NFRV;
    this.updateInterval = updateInterval;
    this.tgBot = tgBot;
    this.msg = msg;
  }

  private analise() {
    this.funding = new FundingRateAnalisator({
      CFRV: this.CFRV,
      NFRV: this.NFRV,
    });

    this.interval = setInterval(async () => {
      if (!this.funding) throw new Error("FundingRateAnalisator is not initialized");

      if (!this.runningFlag && this.interval) {
        clearInterval(this.interval);
        return;
      }
      const { replacedSymbForEnterence: updatedSymbols, addedSymbolsForEnterence: newSymbols } =
        await this.funding.analise();
      Logger.debug("updatedSymbols", updatedSymbols);
      Logger.debug("newSymbols", newSymbols);
      if (!updatedSymbols.length && !newSymbols.length) return;
      this.symbolsOutput({ updatedSymbols, newSymbols });
    }, 1000 * this.updateInterval);
  }

  private symbolsOutput({
    updatedSymbols,
    newSymbols,
  }: {
    updatedSymbols: ISFRelement[];
    newSymbols: ISFRelement[];
  }) {
    let updated_symbols_message = "";
    for (const symbol of updatedSymbols) {
      const symbolFR = (Number(symbol.lastFundingRate) * 100).toFixed(4);
      updated_symbols_message += `• <b>${symbol.symbol}</b>   FR: ${symbolFR}\n`;
    }
    let new_symbols_message = "";
    for (const symbol of newSymbols) {
      const symbolFR = (Number(symbol.lastFundingRate) * 100).toFixed(4);
      new_symbols_message += `• <b>${symbol.symbol}</b>   FR: ${symbolFR}\n`;
    }
    this.tgBot.sendMessage(
      this.msg.chat.id,
      `
        ⭐️ Бот № ${this.id} \n
        📈 <b>Обновлен список монет доступных для входа</b> \n\n
        <b>Новые:</b>\n
        ${new_symbols_message} \n\n
        <b>Обновленные:</b>\n
        ${updated_symbols_message} \n\n
        task timestamp: ${new Date().getTime()}
      `,
      { parse_mode: "HTML" },
    );
  }

  public start(): void {
    this.runningFlag = true;
    const chatId = this.msg.chat.id;
    this.tgBot.sendMessage(chatId, `🟢 <b>Бот ${this.id} запущен</b> 🟢`, { parse_mode: "HTML" });
    this.analise();
  }

  public stop(): void {
    this.runningFlag = false;
    const chatId = this.msg.chat.id;
    this.tgBot.sendMessage(chatId, `🔴 <b>Бот ${this.id} остановлен</b> 🔴`, {
      parse_mode: "HTML",
    });
  }
}
