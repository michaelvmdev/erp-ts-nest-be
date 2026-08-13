import { Money } from './money.value-object';
import { InvalidMoneyError } from './money.value-object';

describe('Money value object', () => {
  describe('fromCentimos', () => {
    it('creates a valid Money from centimos', () => {
      const m = Money.fromCentimos(1050);
      expect(m.centimos).toBe(1050);
      expect(m.toNumber()).toBe(10.5);
      expect(m.toDecimalString()).toBe('10.50');
    });

    it('accepts zero', () => {
      expect(Money.fromCentimos(0).centimos).toBe(0);
    });

    it('throws on negative centimos', () => {
      expect(() => Money.fromCentimos(-1)).toThrow(InvalidMoneyError);
    });

    it('throws on non-integer centimos', () => {
      expect(() => Money.fromCentimos(1.5)).toThrow(InvalidMoneyError);
    });

    it('throws when exceeding max value', () => {
      expect(() => Money.fromCentimos(999_999_999_999 + 1)).toThrow(InvalidMoneyError);
    });
  });

  describe('fromNumber', () => {
    it('converts decimal amount to centimos', () => {
      expect(Money.fromNumber(10.5).centimos).toBe(1050);
      expect(Money.fromNumber(0).centimos).toBe(0);
      expect(Money.fromNumber(100).centimos).toBe(10_000);
    });

    it('throws on more than two decimal places', () => {
      expect(() => Money.fromNumber(1.005)).toThrow(InvalidMoneyError);
    });

    it('throws on non-finite values', () => {
      expect(() => Money.fromNumber(Infinity)).toThrow(InvalidMoneyError);
      expect(() => Money.fromNumber(NaN)).toThrow(InvalidMoneyError);
    });
  });

  describe('fromDecimalString', () => {
    it('parses postgres numeric string', () => {
      expect(Money.fromDecimalString('10.50').centimos).toBe(1050);
      expect(Money.fromDecimalString('0.00').centimos).toBe(0);
      expect(Money.fromDecimalString('1234.5').centimos).toBe(123450);
    });

    it('throws on invalid format', () => {
      expect(() => Money.fromDecimalString('abc')).toThrow(InvalidMoneyError);
      expect(() => Money.fromDecimalString('1.005')).toThrow(InvalidMoneyError);
      expect(() => Money.fromDecimalString('')).toThrow(InvalidMoneyError);
    });
  });

  describe('equals', () => {
    it('returns true for same centimos', () => {
      expect(Money.fromCentimos(500).equals(Money.fromCentimos(500))).toBe(true);
    });

    it('returns false for different centimos', () => {
      expect(Money.fromCentimos(500).equals(Money.fromCentimos(501))).toBe(false);
    });
  });
});
