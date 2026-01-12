/**
 * Timezone Implementation Tests
 * Tests for verifying timezone selection and conversion functionality
 */

import { convertToSelectedTimezone, formatDisplayValues, getCurrentTimeInTimezone } from '../utils/timezone';
import { getTimezoneArray, getTimezoneLabel, isValidTimezone } from '../constants/timezones';

describe('Timezone Configuration', () => {
  describe('getTimezoneArray', () => {
    it('should return array of timezones', () => {
      const timezones = getTimezoneArray();
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should have required properties for each timezone', () => {
      const timezones = getTimezoneArray();
      timezones.forEach(tz => {
        expect(tz).toHaveProperty('id');
        expect(tz).toHaveProperty('label');
        expect(tz).toHaveProperty('timezone');
      });
    });

    it('should be sorted alphabetically by label', () => {
      const timezones = getTimezoneArray();
      const labels = timezones.map(tz => tz.label);
      const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b));
      expect(labels).toEqual(sortedLabels);
    });
  });

  describe('getTimezoneLabel', () => {
    it('should return correct label for valid timezone', () => {
      const label = getTimezoneLabel('Asia/Kolkata');
      expect(label).toBe('Chennai, Kolkata, Mumbai, New Delhi');
    });

    it('should return timezone ID if not found', () => {
      const label = getTimezoneLabel('Invalid/Timezone');
      expect(label).toBe('Invalid/Timezone');
    });
  });

  describe('isValidTimezone', () => {
    it('should validate known timezones', () => {
      expect(isValidTimezone('Asia/Kolkata')).toBe(true);
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('GMT')).toBe(true);
    });

    it('should reject unknown timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('NotReal')).toBe(false);
    });
  });
});

describe('Timezone Conversion', () => {
  const testDateString = '20240115T143000'; // 2024-01-15 14:30:00

  describe('convertToSelectedTimezone', () => {
    it('should convert date to Asia/Kolkata timezone', () => {
      const result = convertToSelectedTimezone(testDateString, 'Asia/Kolkata');
      
      expect(result).not.toBeNull();
      expect(result?.date).toBeInstanceOf(Date);
      expect(result?.displayValues).toBeDefined();
    });

    it('should convert date to America/New_York timezone', () => {
      const result = convertToSelectedTimezone(testDateString, 'America/New_York');
      
      expect(result).not.toBeNull();
      expect(result?.displayValues.year).toBeDefined();
      expect(result?.displayValues.month).toBeDefined();
      expect(result?.displayValues.day).toBeDefined();
    });

    it('should return null for invalid date string', () => {
      const result = convertToSelectedTimezone('invalid', 'Asia/Kolkata');
      expect(result).toBeNull();
    });

    it('should return null for empty date string', () => {
      const result = convertToSelectedTimezone('', 'Asia/Kolkata');
      expect(result).toBeNull();
    });

    it('should handle legacy timezone codes', () => {
      const result = convertToSelectedTimezone(testDateString, 'ist');
      expect(result).not.toBeNull();
      expect(result?.displayValues).toBeDefined();
    });

    it('should include timezone in display values', () => {
      const result = convertToSelectedTimezone(testDateString, 'Asia/Kolkata');
      expect(result?.displayValues.timezone).toBe('Asia/Kolkata');
    });
  });

  describe('formatDisplayValues', () => {
    it('should format display values correctly', () => {
      const displayValues = {
        year: 2024,
        month: 1,
        day: 15,
        hour: 14,
        minute: 30,
        second: 0,
      };
      
      const formatted = formatDisplayValues(displayValues);
      expect(formatted).toBe('2024-01-15 14:30:00');
    });

    it('should pad single-digit values with zeros', () => {
      const displayValues = {
        year: 2024,
        month: 1,
        day: 5,
        hour: 9,
        minute: 5,
        second: 3,
      };
      
      const formatted = formatDisplayValues(displayValues);
      expect(formatted).toBe('2024-01-05 09:05:03');
    });
  });

  describe('getCurrentTimeInTimezone', () => {
    it('should return a Date object', () => {
      const result = getCurrentTimeInTimezone('Asia/Kolkata');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle legacy timezone codes', () => {
      const result = getCurrentTimeInTimezone('ist');
      expect(result).toBeInstanceOf(Date);
    });

    it('should not throw error for invalid timezone', () => {
      expect(() => {
        getCurrentTimeInTimezone('Invalid/Timezone');
      }).not.toThrow();
    });
  });
});

describe('Timezone Persistence', () => {
  it('should support all IANA timezones', () => {
    const timezones = getTimezoneArray();
    
    // Sample check for major timezones
    const majorTimezones = [
      'Asia/Kolkata',
      'GMT',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Australia/Sydney',
      'Asia/Tokyo',
      'Asia/Shanghai',
    ];

    majorTimezones.forEach(tz => {
      const found = timezones.find(tzItem => tzItem.id === tz);
      expect(found).toBeDefined();
    });
  });

  it('should handle timezone switching', () => {
    const timezone1 = convertToSelectedTimezone('20240115T143000', 'Asia/Kolkata');
    const timezone2 = convertToSelectedTimezone('20240115T143000', 'America/New_York');

    // Both should return valid results
    expect(timezone1).not.toBeNull();
    expect(timezone2).not.toBeNull();

    // But with different display values (different timezones)
    expect(timezone1?.displayValues.timezone).not.toBe(timezone2?.displayValues.timezone);
  });
});
