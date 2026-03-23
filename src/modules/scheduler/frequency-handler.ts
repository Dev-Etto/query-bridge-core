import { DateTime } from 'luxon';
import { logger } from '../../config/logger';

export enum FrequencyType {
  MINUTES = 'M',
  HOURS = 'H',
  DAYS = 'D',
  MONTHS = 'MM',
}

export const FrequencyHandler = {
  shouldRun(frequency: string, now: DateTime = DateTime.now()): boolean {
    const rawFreq = (frequency || 'M1').toUpperCase();
    const match = rawFreq.match(/^([MHD]|MM)(\d+)$/);

    if (!match) {
      logger.warn(
        `[FrequencyHandler] Ungovernable interval: "${frequency}". Falling back to once per call.`
      );
      return true;
    }

    const [, type, valueStr] = match;
    if (valueStr === undefined) return true;
    const value = Number.parseInt(valueStr, 10);

    switch (type as FrequencyType) {
      case FrequencyType.MINUTES:
        return now.minute % value === 0;
      case FrequencyType.HOURS:
        return now.hour % value === 0 && now.minute === 0;
      case FrequencyType.DAYS:
        return now.day % value === 0 && now.hour === 0 && now.minute === 0;
      case FrequencyType.MONTHS:
        return now.month % value === 0 && now.day === 1 && now.hour === 0 && now.minute === 0;
      default:
        return true;
    }
  },
};
