export const toMoneyNumber = (value: string | number): number => Number(value);

export const toMoneyString = (value: number): string => value.toFixed(2);

export const addMoney = (...values: Array<string | number>): string =>
  toMoneyString(values.reduce<number>((sum, value) => sum + toMoneyNumber(value), 0));
