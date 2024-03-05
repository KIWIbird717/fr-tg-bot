import { Logger } from "../logger.js";
import { BinanceManagment } from "../binance/binance-managment.js";
import type { IMarkPriceResult, ISFRelement } from "./types.js";

/**
 * `Symbols Funding Rate Array`
 * Functional class which create array with special
 * extra properties of regular `Array`
 */
export class SymbolsFRArray extends Array<ISFRelement> {
  private array: ISFRelement[];
  constructor() {
    super();
    this.array = [];
  }

  get getArray() {
    return [...this.array];
  }

  /** if index was not provided it will push new element to the array */
  public pushOrUpdateSymbol = (symbolArr: ISFRelement, index?: number): void => {
    if (!index) index = this.array.findIndex((item) => item.symbol === symbolArr.symbol);

    if (index !== -1) {
      // Symbol already exists, replace the item
      this.array[index] = { ...symbolArr, latestUpdate: this.array[index].latestUpdate };
    } else {
      // Symbol doesn't exist, push the new item
      this.array.push({ ...symbolArr });
    }
  };

  public sortArrayByFundingRate = (): void => {
    this.array.sort(
      (a: ISFRelement, b: ISFRelement) => Number(a.lastFundingRate) - Number(b.lastFundingRate),
    );
  };

  public removeBySymbolName = (symbol: string): void => {
    this.array = this.array.filter((item) => item.symbol !== symbol);
  };
}

/**
 * Indicator (algoritm)
 *
 * An indicator that finds coins with a FundingRage lower
 * than `CFRV` (Critical funding rate value) and starts
 * tracking them and adds to `symbolsAvaliableToEnter` list.
 *
 * When the FundingRage of these coins becomes higher than
 * `CFRV`, it adds them to list `symbolsAbovCFRV`,
 * according to which he enters the transaction.
 *
 * @extends BinanceManagment
 */
export class FundingRateAnalisator extends BinanceManagment {
  private readonly NFRV: Readonly<number>; // Neutral funding rate value
  private readonly CFRV: Readonly<number>; // Critical funding rate value
  private symbolsAvaliableToEnter: SymbolsFRArray; // Symbols that are higher than the CFRV (Critical funding rate value)
  /**
   * Values are put in this array if the are higher than `NFRV`
   * and then algoritm check them and wait until valus becomes
   * lower than `CFRV`
   */
  private newCoinSearchAria: SymbolsFRArray;

  constructor({ CFRV, NFRV }: { CFRV: number; NFRV: number }) {
    super();
    this.symbolsAvaliableToEnter = new SymbolsFRArray();
    this.newCoinSearchAria = new SymbolsFRArray();
    this.CFRV = CFRV / 100;
    this.NFRV = NFRV / 100;
  }

  /** Check if symbol ends with USDT pair */
  private isUSDTpairCheck = (symbol: string): boolean => {
    if (symbol.slice(-4) === "USDT") return true;
    else return false;
  };

  /** Symbols abov NFRV (Neutral Funding Rate Value) */
  public get getNewCoinSearchAria(): ISFRelement[] {
    return this.newCoinSearchAria.getArray;
  }
  /**
   * Symbols that are higher than the CFRV (Critical funding rate value)
   * Here will be values only from `newCoinSearchAria` array, after they become
   * lower than `CFRV`
   */
  public get getSymbolsAvaliableToEnter(): ISFRelement[] {
    return this.symbolsAvaliableToEnter.getArray;
  }

  /**
   * Проверка на нахождение монеты в зоне парсинга новых монет,
   * в зависимости от CFRV и NFRV.
   *
   * Если NFRV > CFRV,то зона парсинга новых монет будет выше NFRV
   * Если CFRV > NFRV,то зона парсинга новых монет будет ниже NFRV
   */
  private isSymbolInNewCoinsFoundAria(fr: number) {
    if (this.NFRV > this.CFRV) return fr >= this.NFRV;
    return fr < this.NFRV;
  }

  /**
   * Проверка на прохождение монеты критической зоне,
   * в зависимости от CFRV и NFRV.
   *
   * Если NFRV > CFRV,то критическая зона будет ниже CFRV
   * Если CFRV > NFRV,то критическая зона будет выше CFRV
   */
  private isSymbolInCriticalAria(fr: number) {
    if (this.NFRV > this.CFRV) return fr <= this.CFRV;
    return fr > this.CFRV;
  }

  /**
   * Parse all symbols from Binance
   * and return array of USDT pairs symbols that are higher `NFRV`
   */
  private parseSymbolsAbovNFRV = (
    frFromBinance: IMarkPriceResult[],
  ): Readonly<IMarkPriceResult[]> => {
    const symbolsAbowNFRV = frFromBinance
      .map((binanceSymbol) => {
        const symbolFR = Number(binanceSymbol.lastFundingRate);
        // check if symbol ends with USDT
        if (!this.isUSDTpairCheck(binanceSymbol.symbol)) return;
        // chek if new symbols from Binance already in the newCoinSearchAria array
        const repitedNFRV = this.newCoinSearchAria.getArray
          .map((abovSymbol) => {
            if (abovSymbol.symbol === binanceSymbol.symbol) {
              return abovSymbol;
            }
          })
          .filter((item) => item !== undefined);
        const repitedCFRV = this.symbolsAvaliableToEnter.getArray
          .map((underSymbol) => {
            if (underSymbol.symbol === binanceSymbol.symbol) {
              return underSymbol;
            }
          })
          .filter((item) => item !== undefined);
        if (repitedNFRV.length || repitedCFRV.length) return;
        // Chek if symbol`s FR is higher than NFRV
        if (this.isSymbolInNewCoinsFoundAria(symbolFR)) return binanceSymbol;
      })
      .filter((symbol) => symbol !== undefined);
    return symbolsAbowNFRV as IMarkPriceResult[];
  };

  /**
   * Handle symbols funding rate change.
   * - Parse current symbols funding rate from Binance
   *
   * - find NEW symbols with FR higher than _NFRV and push into `newCoinSearchAria`
   *   Update PREVIOUS symbol FR that are already in the the array & sort them
   *
   * - push symbols to `symbolsAvaliableToEnter` if symbols FR
   *   from `_newCoinSearchAria` is lower than `CFRV`
   *   and delete that symbol from `newCoinSearchAria`
   *
   * - Remove symbols from `newCoinSearchAria` if its FR value is below CFRV &
   *   keep symbols in `symbolUnderCFRV` array up to current data from Binance
   *
   * @todo Do not foget to remove symbols from `symbolsAvaliableToEnter` after bot
   * make trade on it
   */
  public analise = async () => {
    try {
      // parse current symbol`s FR from Binance
      const newBinanceFR = (await this.client.futuresMarkPrice()) as IMarkPriceResult[];
      // get symbols with FR abov NFRV
      const parseNewSymbolsAbovNFRV = this.parseSymbolsAbovNFRV(newBinanceFR);
      // if array contains NEW symbols
      if (parseNewSymbolsAbovNFRV?.length) {
        // push NEW values or update symbol in newCoinSearchAria array
        parseNewSymbolsAbovNFRV.forEach((symbol) => {
          const SFRElement: ISFRelement = { ...symbol, latestUpdate: new Date() };
          this.newCoinSearchAria.pushOrUpdateSymbol(SFRElement);
        });
      } else {
        // chek if FR on Binance was changed for PREVIOUS VALUES for symbol in symbolsAbowNFRV array
        newBinanceFR.forEach((market) => {
          this.newCoinSearchAria.getArray.forEach((symbol, index) => {
            // check if FR of the symbol in newCoinSearchAria array was changed
            if (
              market.symbol === symbol.symbol &&
              market.lastFundingRate !== symbol.lastFundingRate
            ) {
              if (!this.isSymbolInCriticalAria(Number(market.lastFundingRate))) {
                // if symbol`s FR was just changed
                this.newCoinSearchAria.pushOrUpdateSymbol(
                  { ...market, latestUpdate: symbol.latestUpdate },
                  index,
                );
              } else {
                // if symbol`s FR under CFRV, remove from newCoinSearchAria
                this.newCoinSearchAria.removeBySymbolName(symbol.symbol);
                // and push to symbolsAvaliableToEnter
                this.symbolsAvaliableToEnter.pushOrUpdateSymbol({
                  ...market,
                  latestUpdate: new Date(),
                });
              }
            }
          });
        });
      }

      // Sort symbolAbovNFRV
      this.newCoinSearchAria.sortArrayByFundingRate();

      // Sort symbolsAvaliableToEnter
      this.symbolsAvaliableToEnter.sortArrayByFundingRate();

      //Keep up to current data from Binance symbolsAvaliableToEnter array
      newBinanceFR.forEach((market) => {
        this.symbolsAvaliableToEnter.getArray.forEach((symbol) => {
          if (market.symbol === symbol.symbol) {
            this.symbolsAvaliableToEnter.pushOrUpdateSymbol({
              ...market,
              latestUpdate: symbol.latestUpdate,
            });
          }
        });
      });
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  };
}
