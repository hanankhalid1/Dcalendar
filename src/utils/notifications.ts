import { Duration } from 'luxon';

// 1️⃣ Extract unit and value from ISO duration
export function convertionISOToTime(value: string) {
    const duration = Duration.fromISO(value);
    let Label: string | null = null;

    for (let key in duration.values) {
        if (duration[key as keyof typeof duration.values] !== 0) {
            Label = capitalizeFirstLetter(key); // "Minutes", "Hours", etc.
            return { Label };
        }
    }
    return { Label: 'Minutes' }; // fallback
}

// Helper to capitalize first letter
function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// 2️⃣ Convert seconds to the given unit
export function convertSecondsToUnit(seconds: number, unit: string): number {
    switch (unit) {
        case 'Minutes':
            return Math.floor(seconds / 60);
        case 'Hours':
            return Math.floor(seconds / 3600);
        case 'Days':
            return Math.floor(seconds / (3600 * 24));
        case 'Weeks':
            return Math.floor(seconds / (3600 * 24 * 7));
        default:
            return seconds; // fallback: just return seconds
    }
}
