type BotType = {
  status: "stopped" | "running";
  settings: {
    CFRV: number;
    NFRV: number;
    updateInterval: number;
  };
};

export type BotsType = {
  first: BotType;
  second: BotType;
};
