import { FundingRateAnalisator } from "./utils/funding-rate.ts/index.ts";
import { Logger } from "./utils/logger.js";

const fundingRateAnalisator = new FundingRateAnalisator({
  CFRV: 0.02,
  NFRV: 0.01,
});

setInterval(() => {
  fundingRateAnalisator.analise();
  Logger.debug(fundingRateAnalisator.getSymbolsAvaliableToEnter);
}, 3000);
