// src/utils/icsGenerator.ts
// Utility to generate a simple .ics calendar invite string for an event

export interface ICSParams {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  organizerEmail: string;
  guests: string[];
  meetingUrl?: string;
  timezone?: string;
}

function formatDateICS(date: Date, tzid?: string) {
  // Format: YYYYMMDDTHHmmssZ (UTC) or with TZID
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  if (tzid) {
    // Use local time with TZID
    return `TZID=${tzid}:${y}${m}${d}T${h}${min}${s}`;
  }
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

export function generateICS({
  title,
  description = '',
  location = '',
  startDate,
  endDate,
  organizerEmail,
  guests,
  meetingUrl = '',
  timezone = '',
}: ICSParams): string {
  const dtStart = formatDateICS(startDate, timezone || undefined);
  const dtEnd = formatDateICS(endDate, timezone || undefined);
  const uid = `${Date.now()}@dcalendar.app`;
  const attendeeLines = guests
    .map(
      email =>
        `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${
          email.split('@')[0]
        }:mailto:${email}`,
    )
    .join('\n');
  const organizerLine = `ORGANIZER;CN=Organizer:mailto:${organizerEmail}`;
  const urlLine = meetingUrl ? `X-GOOGLE-CONFERENCE:${meetingUrl}` : '';
  // VTIMEZONE block (simple UTC fallback)
  const tzid = timezone || 'UTC';
  const vtimezone = `BEGIN:VTIMEZONE\nTZID:${tzid}\nX-LIC-LOCATION:${tzid}\nBEGIN:STANDARD\nTZOFFSETFROM:+0000\nTZOFFSETTO:+0000\nTZNAME:GMT\nDTSTART:19700101T000000\nEND:STANDARD\nEND:VTIMEZONE`;
  // Alarm (reminder) block (optional, 15 min before)
  const alarm = `BEGIN:VALARM\nACTION:DISPLAY\nDESCRIPTION:This is an event reminder\nTRIGGER:-PT15M\nEND:VALARM`;
  return [
    'BEGIN:VCALENDAR',
    'PRODID:-//D-Calendar//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    vtimezone,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `DTSTART;TZID=${tzid}:${formatDateICS(startDate)}`,
    `DTEND;TZID=${tzid}:${formatDateICS(endDate)}`,
    organizerLine,
    attendeeLines,
    urlLine,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
    alarm,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}
