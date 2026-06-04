import en from '../../src/locales/en.json';
import uk from '../../src/locales/uk.json';

describe('locale parity', () => {
  it('uk.json has exactly the same keys as en.json', () => {
    const enKeys = Object.keys(en).sort();
    const ukKeys = Object.keys(uk).sort();
    expect(ukKeys).toEqual(enKeys);
  });

  it('no key in uk.json has an empty string value', () => {
    for (const [key, val] of Object.entries(uk as Record<string, string>)) {
      expect(val, `key "${key}" is empty`).not.toBe('');
    }
  });
});
