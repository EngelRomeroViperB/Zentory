declare module 'dinero.js' {
  interface DineroOptions {
    amount: number;
    currency: string;
    precision?: number;
  }

  interface Dinero {
    getAmount(): number;
    getCurrency(): string;
    getPrecision(): number;
    add(dinero: Dinero): Dinero;
    subtract(dinero: Dinero): Dinero;
    multiply(multiplier: number): Dinero;
    divide(divisor: number): Dinero;
    percentage(percentage: number): Dinero;
    toFormat(format?: string): string;
    toUnit(): number;
    toObject(): DineroOptions;
    equalsTo(dinero: Dinero): boolean;
    lessThan(dinero: Dinero): boolean;
    lessThanOrEqual(dinero: Dinero): boolean;
    greaterThan(dinero: Dinero): boolean;
    greaterThanOrEqual(dinero: Dinero): boolean;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    hasSubUnits(): boolean;
    toRoundedUnit(digits: number, roundingMode?: string): number;
  }

  // Dinero as callable function with properties
  interface DineroStatic {
    (options: DineroOptions): Dinero;
    globalLocale: string;
    globalCurrency: string;
  }

  const dinero: DineroStatic;
  export = dinero;
}
