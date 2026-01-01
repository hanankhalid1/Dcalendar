
export class ExportService {

    // Export events to ICS format
    public static async exportEvents(events: any[], activeAccount: any): Promise<string[]> {
        const icsContent: string[] = [];

        // Use Promise.all to wait for all events to be processed
        const promises = events.map(async (element) => {
            const response = await this.generateEvent(element, activeAccount, "");
            return response;
        });

        const results = await Promise.all(promises);
        icsContent.push(...results);
        
        console.log("Generated ICS content for", icsContent.length, "events");
        return icsContent;
    }

    public static async generateEvent(icsParams: any, user: any, subject: any): Promise<string> {
        console.log("icsParams", icsParams);
        
        const fdate = icsParams.fromTime;
        const todate = icsParams.toTime;
        let location = "";
        let image = "";
        const username = user;

        // Extract location and image from list
        icsParams.list?.forEach((event: any) => {
            if (event.key === "location") {
                location = event.value;
            }
            if (event.key === "image") {
                image = event.value;
            }
        });

        const timeZone = "Etc/GMT";

        const event = {
            uid: icsParams.uid,
            start: {
                dateTime: fdate,
                timeZone: timeZone,
            },
            end: {
                dateTime: todate,
                timeZone: timeZone,
            },
            title: icsParams.title,
            description: icsParams.description || "",
            location: location,
            organizer: {
                name: "Organizer",
                email: user,
            },
            list: icsParams.list || [],
            username,
        };

        const icsContent = await this.generateICS(event, subject);
        
        return icsContent;
    }

    public static async generateICS(event: any, subject: any): Promise<string> {
        const cancelled = subject;
        const { uid, start, end, title, description, location, list } = event;
        
        // Extract attendees
        const attendees = list
            .filter((item: any) => item.key === 'guest')
            .map((guest: any) => ({
                name: guest.value.split('@')[0],
                email: guest.value,
                role: 'REQ-PARTICIPANT',
                partstat: 'NEEDS-ACTION',
                rsvp: 'TRUE',
                cutype: 'INDIVIDUAL'
            }));

        // Extract organizer
        const organizerValue = list
            .filter((item: any) => item.key === "organizer")
            .map((data: any) => data.value);

        // Extract permissions and status
        const eventPermission = list.filter(
            (item: any) => item.key === "visibility" && item.value !== "Default Visibility"
        );
        
        const guestPermission = list.filter(
            (item: any) => item.key === "guest_permission" && item.value
        );
        
        const busyStatus = list
            .filter((item: any) => item.key === "busy")
            .map((busy: any) => busy.value)[0] || "Busy";

        // Generate recurrence rule
        const rule = await this.generateRecurrenceRule(list);
        
        // Format description
        const updatedDescriptions = this.formatDescriptionForHTML(description);
        
        // Process organizer email
        const domainName = organizerValue[0]?.split('@').pop();
        const userName = organizerValue[0]?.split('@')?.[0];
        let updatedUserName = organizerValue[0] || event.organizer.email;

        // Get trigger for alarm
        const getTriggerValue = this.findAttribute(list, 'trigger');

        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DMail Calendar//EN
METHOD:${cancelled === "Your event has been Cancelled." ? "CANCEL" : "REQUEST"}
BEGIN:VEVENT
UID:${uid}
DTSTART;TZID=${start.timeZone}:${start.dateTime}
DTEND;TZID=${end.timeZone}:${end.dateTime}
SUMMARY:${title}
${eventPermission.length > 0 && eventPermission[0].value === "Public" ? `CLASS:PUBLIC` : `CLASS:PRIVATE`}
DESCRIPTION:${updatedDescriptions}
${location ? `LOCATION:${location}` : ""}
${guestPermission.length > 0 && guestPermission[0]?.value === "Modify event" ? `X-GUEST-PERMISSION:MODIFY` : guestPermission[0]?.value === "View event" ? `X-GUEST-PERMISSION:INVITE` : `X-GUEST-PERMISSION:GUEST`}
${cancelled !== "Your event has been Cancelled." ? rule : ``}
ORGANIZER;CN=${userName}:MAILTO:${updatedUserName}
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE;CN=${updatedUserName}:mailto:${updatedUserName}
${attendees.map((attendee: any) => `ATTENDEE;CUTYPE=${attendee.cutype || 'INDIVIDUAL'};ROLE=${attendee.role || 'REQ-PARTICIPANT'};PARTSTAT=${cancelled === "Your event has been Cancelled." ? "DECLINED" : attendee.partstat || 'ACCEPTED'};RSVP=${attendee.rsvp || 'TRUE'};CN=${attendee.name}:mailto:${attendee.email}`).join('\n')}
TRANSP:${busyStatus === "Free" ? `TRANSPARENT` : `OPAQUE`}
${getTriggerValue ? `BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:This is an event reminder
TRIGGER:${getTriggerValue}
END:VALARM` : ``}
END:VEVENT
BEGIN:VTIMEZONE
TZID:${start.timeZone}
X-LIC-LOCATION:${start.timeZone}
BEGIN:STANDARD
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
TZNAME:GMT
DTSTART:${start.dateTime}
END:STANDARD
END:VTIMEZONE
END:VCALENDAR`;
    }

    public static findAttribute = (attributes: any[], key: string): string => {
        if (!Array.isArray(attributes)) return '';
        const found = attributes.find((attr: any) => attr.key === key);
        return found?.value || '';
    };

    public static async generateRecurrenceRule(list: any[]): Promise<string> {
        try {
            const repeatEvent = list
                .filter((item: any) => item.key === "repeatEvent")
                .map((repeat: any) => repeat.value);
                
            const customRepeatEvent = list
                .filter((item: any) => item.key === "customRepeatEvent")
                .map((repeat: any) => repeat.value);

            const { object: customRepeatObject } = this.parseEvent(customRepeatEvent);
            const { object: repeatObject } = this.parseEvent(repeatEvent);

            if (!repeatEvent.length || repeatEvent[0] === '') return "";

            const repeatEventSplit = repeatEvent[0]?.split("_").filter(Boolean);
            let rule = "";

            if (repeatEventSplit[0] === "custom") {
                // Custom repeat logic
                rule = `RRULE:FREQ=${customRepeatObject?.unit?.toUpperCase() || "DAILY"};WKST=SU;INTERVAL=${customRepeatObject?.interval || 1}`;
                
                if (customRepeatObject?.count) rule += `;COUNT=${customRepeatObject.count}`;
                if (customRepeatObject?.byday) rule += `;BYDAY=${customRepeatObject.byday}`;
                
                if (customRepeatObject?.customMonth) {
                    if (isNaN(customRepeatObject?.customMonth)) {
                        const match = customRepeatObject.customMonth.match(/(\d+)(\w+)/);
                        if (match) {
                            const [, week, day] = match;
                            rule += `;BYDAY=${week}${day.slice(0, 2).toUpperCase()}`;
                        }
                    } else {
                        rule += `;BYMONTHDAY=${customRepeatObject.customMonth}`;
                    }
                }
                
                if (customRepeatObject?.endDate) {
                    rule += `;UNTIL=${this.formatUntilDate(customRepeatObject.endDate)}`;
                }
            } else {
                // Standard repeat logic
                rule = `RRULE:FREQ=${repeatEventSplit[0].toUpperCase()}`;
                
                if (repeatEventSplit.length === 2) {
                    const secondPart = repeatEventSplit[1];

                    if (/\d/.test(secondPart) && repeatEventSplit[0] !== "daily") {
                        const match = secondPart.match(/(\d+)(\w+)/);
                        if (match) {
                            const [, week, day] = match;
                            rule += `;BYDAY=${week}${day.slice(0, 2).toUpperCase()}`;
                        }
                    } else if (/,/.test(secondPart)) {
                        rule += `;BYDAY=${secondPart}`;
                    } else if (repeatEventSplit[0] !== "daily") {
                        rule += `;BYDAY=${secondPart.slice(0, 2).toUpperCase()}`;
                    }
                }

                if (repeatObject?.endDate) {
                    rule += `;UNTIL=${this.formatUntilDate(repeatObject.endDate)}`;
                }
            }

            return rule;

        } catch (error) {
            console.error("Error generating recurrence rule:", error);
            return "";
        }
    }

    public static parseEvent(event: string[]): { values: any[]; object: Record<string, any> } {
        const parsedValues: any[] = [];
        const parsedObject: Record<string, string> = {};
        
        if (event?.length && event[0]) {
            event[0].split("_").forEach((item: string) => {
                if (item) {
                    const [key, value] = item.split("~");
                    if (key && value) {
                        parsedValues.push({ [key]: value });
                        parsedObject[key] = value;
                    }
                }
            });
        }
        
        return { values: parsedValues, object: parsedObject };
    }

    public static formatDescriptionForHTML(description: string): string {
        if (!description) return '';
        
        const escapeHTML = (str: string) => {
            return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };
        
        return escapeHTML(description).replace(/\n/g, '<br>');
    }

    // Helper function to format date for UNTIL in RRULE
    public static formatUntilDate(dateString: string): string {
        // Expected format: YYYYMMDDTHHMMSS
        // Ensure it's in the correct format
        if (dateString && dateString.length >= 15) {
            return dateString.replace(/[-:]/g, '');
        }
        return dateString;
    }
}