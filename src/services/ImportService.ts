import ICAL from 'ical.js';
import moment from 'moment-timezone';
export class ImportService {

    public parseIcal(icalData: any, active: any) {
        try {
            const calendarBlocks = icalData.split(/(?=BEGIN:VCALENDAR)/g);
            let eventsDetails: { uid: any; title: any; description: any; fromTime: any; toTime: any; done: boolean; list: { key: string; value: any; }[]; }[] = [];
            calendarBlocks.forEach((block: any) => {
                if (!block.trim()) return;
                
                // Clean up malformed RRULE frequencies before parsing
                block = this.cleanRRuleFrequency(block);
                
                const jcalData = ICAL.parse(block);
                const comp = new ICAL.Component(jcalData);
                comp.getAllSubcomponents("vevent").forEach((event: any) => {
                    let list = [];
                    let repeatEvent;
                    let customRepeatEvent;
                    const e = new ICAL.Event(event);
                    const guestPermission = event.getFirstPropertyValue("x-guest-permission") || null;
                    const guestValue = guestPermission && guestPermission === "MODIFY" ? `Modify event` : guestPermission === "INVITE" ? `View event` : "No access";
                    const classType = event.getFirstPropertyValue("class") || null;
                    const visibility = classType && classType === "PRIVATE" ? "Private" : classType === "PUBLIC" ? "Public" : "Default Visibility";
                    const location = event.getFirstPropertyValue("location") || null;
                    const urlProp = event.getFirstPropertyValue("url") || null;
                    const rruleProp = event.getFirstProperty("rrule");
                    // Use ical.js Recur object directly for reliable fields
                    const rruleValues = rruleProp?.getFirstValue?.() || null;
                    // Normalize frequency (ical.js Recur uses numeric enums)
                    const freqRaw = rruleValues ? rruleValues.freq : null;
                    const freqMap = ['SECONDLY','MINUTELY','HOURLY','DAILY','WEEKLY','MONTHLY','YEARLY'];
                    const rrule = typeof freqRaw === 'number'
                        ? freqMap[freqRaw] || null
                        : (typeof freqRaw === 'string' ? freqRaw.toUpperCase() : null);
                    // Normalize BYDAY to plain strings (e.g., ["MO","WE"])
                    const byday = Array.isArray(rruleValues?.byDay)
                        ? rruleValues.byDay.map((d: any) => (d?.toString?.() || d || '').toString().toUpperCase())
                        : (Array.isArray(rruleValues?.byday) ? rruleValues.byday : rruleValues?.byday ? [rruleValues.byday] : null);
                    // Normalize BYMONTHDAY
                    const bymonthday = Array.isArray(rruleValues?.byMonthDay)
                        ? rruleValues.byMonthDay
                        : Array.isArray(rruleValues?.bymonthday)
                            ? rruleValues.bymonthday
                            : rruleValues?.bymonthday
                                ? [rruleValues.bymonthday]
                                : null;
                    const until = rruleValues?.until || null;
                    const wkst = rruleValues ? rruleValues.wkst : null;
                    const repeatEvery = rruleValues ? rruleValues.interval : null;
                    const count = rruleValues ? rruleValues.count : null;
                    const dtstartProp = event.getFirstProperty("dtstart");
                    const tzid = dtstartProp ? dtstartProp.getParameter("tzid") : null;
                    let selectedDays: any;
                    let endOption: any;
                    let occurrences: any;
                    let endDate: any;
                    let customSelectedMonth: any;
                    let response: any;
                    if (byday && (byday.length > 0 || byday?.trim() !== "")) {
                        if (Array.isArray(byday) && byday.length > 0) {
                            selectedDays = byday;
                            customSelectedMonth = byday;
                        } else {
                            const dayOfWeek = this.convertToDayFormat(byday);
                            customSelectedMonth = dayOfWeek;
                        }
                    }
                    else {
                        customSelectedMonth = bymonthday
                    }

                    if (count) {
                        endOption = 'after';
                        occurrences = count;
                    }
                    else {
                        if (until) {
                            // UNTIL is inclusive; format to date string without shifting
                            const untilDate = until.toJSDate ? until.toJSDate() : new Date(until);
                            const day = moment(untilDate).format('YYYY-MM-DD');
                            endOption = 'on';
                            endDate = day
                        }
                    }
                    if (rrule === "WEEKLY") {
                        const repeatUnit = "weekly"
                        response = this.formatEvents(repeatEvery, repeatUnit, selectedDays, endOption, endDate, occurrences, null)


                    }
                    else if (rrule === "DAILY") {
                        const repeatUnit = "daily";
                        response = this.formatEvents(repeatEvery, repeatUnit, selectedDays, endOption, endDate, occurrences, null)
                    }
                    else if (rrule === "MONTHLY") {
                        const repeatUnit = "monthly";
                        response = this.formatEvents(repeatEvery, repeatUnit, selectedDays, endOption, endDate, occurrences, customSelectedMonth)

                    }

                    else if (rrule === "YEARLY") {
                        const repeatUnit = "yearly";
                        response = this.formatEvents(repeatEvery, repeatUnit, selectedDays, endOption, endDate, occurrences, customSelectedMonth)
                    }
                    // Decide if this recurrence needs custom encoding
                    const hasInterval = !!repeatEvery && Number(repeatEvery) > 1;
                    const hasEnd = !!count || !!until;
                    const hasByDayOrMonth = (byday && byday.length > 0) || (bymonthday && bymonthday.length > 0);
                    const isCustom = hasInterval || hasEnd || hasByDayOrMonth;

                    if (!rrule) {
                        repeatEvent = undefined;
                    } else if (!isCustom) {
                        // Simple standard patterns
                        if (rrule === 'DAILY') {
                            repeatEvent = 'daily';
                        } else if (rrule === 'WEEKLY') {
                            if (byday && byday.length > 0) {
                                repeatEvent = `weekly_${byday.join(',')}`;
                            } else {
                                repeatEvent = 'weekly';
                            }
                        } else if (rrule === 'MONTHLY') {
                            if (bymonthday && bymonthday.length > 0) {
                                repeatEvent = `monthly_${bymonthday[0]}`;
                            } else {
                                repeatEvent = 'monthly';
                            }
                        } else if (rrule === 'YEARLY') {
                            repeatEvent = 'yearly';
                        }
                    } else {
                        // Custom string goes into customRepeatEvent; repeatEvent signals custom
                        repeatEvent = 'custom_';
                        customRepeatEvent = response;
                    }
                    event.getAllProperties("attendee").forEach((attendee: any) => {
                        const attendeeEmail = attendee.getFirstValue();
                        list.push({ key: "guest", value: attendeeEmail?.split(":")[1] });
                    });

                    // Detect meeting links so they are treated like video-conferencing (not plain location)
                    const detectMeetingLink = (val: string | null) => {
                        if (!val) return null;
                        const lower = val.toLowerCase();
                        if (lower.includes('meet.google.com')) return { type: 'google', link: val };
                        if (lower.includes('zoom.us') || lower.includes('zoom.com')) return { type: 'zoom', link: val };
                        return null;
                    };

                    // Treat placeholder/none locations as empty
                    const isNoneLocation = (val: string | null) => {
                        if (!val) return true;
                        const norm = val.trim().toLowerCase();
                        return norm === 'none' || norm === 'no location' || norm === 'n/a';
                    };

                    const meetingDetection = detectMeetingLink(location) || detectMeetingLink(urlProp);
                    const locationTypeEntry = meetingDetection
                        ? { key: 'locationType', value: meetingDetection.type }
                        : null;

                    const entries = [
                        !isNoneLocation(location) ? {
                            key: "location",
                            value: meetingDetection?.link || location || ""
                        } : null,
                        locationTypeEntry,
                        {
                            key: "visibility",
                            value: visibility.toString()
                        },
                        {
                            key: "notification",
                            value: "Email".toString()
                        },
                        {
                            key: "guest_permission",
                            value: guestValue,
                        },
                        {
                            key: "repeatEvent",
                            value: repeatEvent,
                        },
                        {
                            key: "customRepeatEvent",
                            value: customRepeatEvent,
                        },
                        {
                            key: "organizer",
                            value: active.userName
                        }
                    ].filter((entry) => entry && entry.value !== undefined && entry.value !== '');
                    list.push(...entries);

                    console.log("From time logged", e.startDate);
                    console.log("To time logged", e.endDate);

                    eventsDetails.push({
                        uid: e.uid,
                        title: e.summary || "",
                        description: e.description || "",
                        fromTime: this.formattedDate(e.startDate, tzid), // Pass the object
                        toTime: this.formattedDate(e.endDate, tzid),
                        done: false,
                        list
                    });
                });
            });

            return eventsDetails;
        } catch (error: any) {
            console.error("Error parsing ICS data:", error);
            console.error("Error details:", {
                message: error?.message,
                stack: error?.stack,
                name: error?.name
            });
            return null;
        }
    };



    public convertToDayFormat(input: any) {
        if (input.length > 0) {
            const numberMatch = input.match(/\d+/);
            const dayAbbreviationMatch = input.match(/[A-Za-z]+/);
            const dayAbbreviation = dayAbbreviationMatch ? dayAbbreviationMatch[0] : '';
            const fullDayName = dayAbbreviation ? moment().day(dayAbbreviation).format('dddd') : '';
            if (numberMatch) {
                return `${numberMatch[0]}${fullDayName}`;
            } else {
                return `${fullDayName}`;
            }
        } else {
            const numberMatch = input.match(/\d+/);
            const dayAbbreviationMatch = input.match(/[A-Za-z]+/);
            const dayAbbreviation = dayAbbreviationMatch ? dayAbbreviationMatch[0] : '';
            const fullDayName = dayAbbreviation ? moment().day(dayAbbreviation).format('dddd') : '';
            if (numberMatch) {
                return `${numberMatch[0]}${fullDayName}`;
            } else {
                return `${fullDayName}`;
            }
        }
    }

    public formatEvents(repeatEvery: any, repeatUnit: any, selectedDays: any, endOption: any, endDate: any, occurrences: any, customSelectedMonth: any) {
        let formatCustomData = Number(repeatEvery) > 1 ? `_interval~${repeatEvery}` : '';
        formatCustomData += repeatUnit ? `_unit~${repeatUnit}` : '';
        formatCustomData += repeatUnit === 'weekly' && selectedDays?.length > 0 ? `_byday~${selectedDays}` : '';
        formatCustomData += repeatUnit === 'yearly' && selectedDays?.length > 0 ? `_byday~${selectedDays}` : '';
        formatCustomData += endOption === 'on' && endDate ? `_endDate~${endDate}` : '';
        formatCustomData += endOption === 'after' && occurrences ? `_count~${occurrences}` : '';
        formatCustomData += repeatUnit === 'monthly' && customSelectedMonth ? `_customMonth~${customSelectedMonth}` : '';
        return formatCustomData;
    }

    public isCustomizedRrule(rruleValues: any) {
        if (rruleValues) {
            if (rruleValues.byday || rruleValues.bymonthday) return true;
            if (rruleValues.count || rruleValues.until) return true;
        }
        return false;
    };

    // ... (rest of your ImportService class)

    public formattedDate(icalTimeObject: any, tzidParam: any) {
        if (!icalTimeObject) return null;

        // Handle all-day events (date-only)
        if (icalTimeObject.isDate) {
            const datePart = icalTimeObject.toString();
            return `${datePart}T000000`;
        }

        // Date-time events with timezone handling
        try {
            const icalString: string = icalTimeObject.toString();

            // Guard for malformed time
            if (icalString.includes('T::')) {
                return icalString.split('T')[0];
            }

            const hasZuluSuffix = /Z$/.test(icalString);

            // Source timezone: TZID if provided, else UTC if Z present, else treat as local-floating
            const sourceTz = tzidParam || (hasZuluSuffix ? 'UTC' : moment.tz.guess());
            // Target timezone: user's current timezone
            const targetTz = moment.tz.guess();

            let m;
            if (hasZuluSuffix) {
                // Example: 20250101T120000Z
                m = moment.utc(icalString, 'YYYYMMDDTHHmmss[Z]');
            } else if (tzidParam) {
                // Example: 20250101T120000 with TZID=Asia/Kolkata
                m = moment.tz(icalString, 'YYYYMMDDTHHmmss', sourceTz);
            } else {
                // Floating time (no TZID, no Z) — interpret in local timezone
                m = moment.tz(icalString, 'YYYYMMDDTHHmmss', sourceTz);
            }

            const localTime = m.tz(targetTz).format('YYYYMMDDTHHmmss');
            return localTime;
        } catch (error) {
            console.warn('Error formatting date, using raw date value:', error);
            const icalString = icalTimeObject.toString();
            return icalString.split('T')[0];
        }
    }

    /**
     * Cleans up malformed RRULE frequency values in ICS data
     * Fixes cases like:
     * - "FREQ=WEEKLY ON SATURDAY" → "FREQ=WEEKLY;BYDAY=SA"
     * - "FREQ=MONTHLY THIRD FRIDAY" → "FREQ=MONTHLY;BYDAY=3FR"
     */
    public cleanRRuleFrequency(icsBlock: string): string {
        // Pattern 1: Match "WEEKLY ON SATURDAY", "DAILY ON MONDAY", etc.
        const weeklyPattern = /FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)\s+ON\s+(\w+)/gi;
        
        // Pattern 2: Match "MONTHLY FIRST MONDAY", "MONTHLY THIRD FRIDAY", etc.
        const monthlyOrdinalPattern = /FREQ=MONTHLY\s+(FIRST|SECOND|THIRD|FOURTH|FIFTH|LAST)\s+(\w+)/gi;
        
        // Day name to abbreviation mapping
        const dayMap: { [key: string]: string } = {
            'SUNDAY': 'SU',
            'MONDAY': 'MO',
            'TUESDAY': 'TU',
            'WEDNESDAY': 'WE',
            'THURSDAY': 'TH',
            'FRIDAY': 'FR',
            'SATURDAY': 'SA'
        };
        
        // Ordinal to number mapping
        const ordinalMap: { [key: string]: string } = {
            'FIRST': '1',
            'SECOND': '2',
            'THIRD': '3',
            'FOURTH': '4',
            'FIFTH': '5',
            'LAST': '-1'
        };
        
        // First, handle weekly/daily patterns with "ON"
        let cleaned = icsBlock.replace(weeklyPattern, (match, freq, day) => {
            const dayAbbr = dayMap[day.toUpperCase()];
            if (dayAbbr) {
                return `FREQ=${freq.toUpperCase()};BYDAY=${dayAbbr}`;
            }
            return `FREQ=${freq.toUpperCase()}`;
        });
        
        // Then, handle monthly ordinal patterns
        cleaned = cleaned.replace(monthlyOrdinalPattern, (match, ordinal, day) => {
            const dayAbbr = dayMap[day.toUpperCase()];
            const ordinalNum = ordinalMap[ordinal.toUpperCase()];
            
            if (dayAbbr && ordinalNum) {
                return `FREQ=MONTHLY;BYDAY=${ordinalNum}${dayAbbr}`;
            }
            return `FREQ=MONTHLY`;
        });
        
        return cleaned;
    }
}