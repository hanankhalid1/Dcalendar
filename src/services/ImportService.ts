import ICAL from 'ical.js';
import moment from 'moment-timezone';
export class ImportService {

    public parseIcal(icalData: any, active: any, events: any) {
        try {
            const activeEvents = events
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
                    const rruleProp = event.getFirstProperty("rrule");
                    const rruleValues = rruleProp ? rruleProp.toJSON()[3] : null;
                    const rrule = rruleValues ? rruleValues.freq : null;
                    const byday = rruleValues ? rruleValues.byday : null;
                    const until = rruleValues ? rruleValues.until : null;
                    const wkst = rruleValues ? rruleValues.wkst : null;
                    const repeatEvery = rruleValues ? rruleValues.interval : null;
                    const count = rruleValues ? rruleValues.count : null;
                    const bymonthday = rruleValues ? rruleValues.bymonthday : null;
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
                            const day = moment(until).subtract(1, 'days').format('YYYY-MM-DD');
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
                    const isCustom = this.isCustomizedRrule(rruleValues);
                    if (isCustom) {
                        repeatEvent = "custom_";
                        customRepeatEvent = response;
                    } else {
                        repeatEvent = response;
                    }
                    event.getAllProperties("attendee").forEach((attendee: any) => {
                        const attendeeEmail = attendee.getFirstValue();
                        list.push({ key: "guest", value: attendeeEmail?.split(":")[1] });
                    });

                    const entries = [
                        {
                            key: "location",
                            value: location || ""
                        },
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
                    ].filter((entry) => entry.value !== undefined && entry.value !== '');
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


            const response = eventsDetails.filter(data => {
                return !activeEvents.some(res => res.uid === data.uid);
            });

            return response;
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

    public formattedDate(icalTimeObject: any, timezone: any) {
        if (!icalTimeObject) return null; // Safety check

        // 1. Check if it's an all-day event (Date-Only)
        if (icalTimeObject.isDate) {
            // For Date-Only events, simply format the date part (YYYYMMDD)
            const datePart = icalTimeObject.toString();
            return `${datePart}T000000`; // Should return format like YYYYMMDD
        } else {
            // 2. It's a Date-Time event
            const userTimezone = timezone || moment.tz.guess();

            try {
                const icalString = icalTimeObject.toString();

                // Check if the time part is invalid (like "T::")
                if (icalString.includes('T::')) {
                    // Treat it as a date-only event
                    return icalString.split('T')[0]; // Return just the date part (YYYYMMDD)
                }

                const localTime = moment.utc(icalString).tz(userTimezone).format('YYYYMMDDTHHmmss');
                return localTime;
            } catch (error) {
                console.warn('Error formatting date, using raw date value:', error);
                // Fallback: return just the date part
                const icalString = icalTimeObject.toString();
                return icalString.split('T')[0];
            }
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