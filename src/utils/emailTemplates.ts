// src/utils/emailTemplates.ts
// Email template generator for event invitations (D-Calendar)

export interface EventEmailTemplateParams {
  eventTitle: string;
  organizer: string;
  organizerEmail: string;
  guests: { name: string; email: string }[];
  eventDate: string; // e.g. 'Thursday 29 Jan 2026'
  fromTime: string; // e.g. '07:00pm'
  toTime: string; // e.g. '03:20pm'
  timezone: string; // e.g. 'Asia/Karachi'
  meetingLink?: string;
  meetingType?: 'google' | 'zoom' | '';
  location?: string;
}

export function generateEventInvitationEmail({
  eventTitle,
  organizer,
  organizerEmail,
  guests,
  eventDate,
  fromTime,
  toTime,
  timezone,
  meetingLink = '',
  meetingType = '',
  location = '',
}: EventEmailTemplateParams): string {
  // Inline SVG icons for email compatibility
  const calendarIcon = `<img src="https://img.icons8.com/ios-filled/20/7950ed/calendar--v1.png" alt="calendar" style="vertical-align:middle;margin-right:6px;"/>`;
  const clockIcon = `<img src="https://img.icons8.com/ios-filled/18/7950ed/clock--v1.png" alt="clock" style="vertical-align:middle;margin-right:6px;"/>`;
  const userIcon = `<img src="https://img.icons8.com/ios-filled/18/7950ed/user.png" alt="user" style="vertical-align:middle;margin-right:6px;"/>`;
  const orgIcon = `<img src="https://img.icons8.com/ios-filled/18/7950ed/administrator-male.png" alt="organizer" style="vertical-align:middle;margin-right:6px;"/>`;
  const icsIcon = `<img src="https://img.icons8.com/ios-filled/18/7950ed/calendar-plus.png" alt="ics" style="vertical-align:middle;margin-right:6px;"/>`;
  const zoomIcon = `<img src="https://img.icons8.com/color/20/000000/zoom.png" alt="zoom" style="vertical-align:middle;margin-right:6px;"/>`;
  const meetIcon = `<img src="https://img.icons8.com/color/20/000000/google-meet--v2.png" alt="google meet" style="vertical-align:middle;margin-right:6px;"/>`;

  const guestHtml = [
    `<div class="guest-item">${orgIcon}<span class="guest-name">${organizer}</span><span class="guest-email">${organizerEmail}</span><span class="organizer-badge">organizer</span></div>`,
    ...guests.map(
      g =>
        `<div class="guest-item">${userIcon}<span class="guest-name">${g.name}</span><span class="guest-email">${g.email}</span></div>`,
    ),
  ].join('');

  // Meeting link section: only show if meetingType is 'google' or 'zoom' and meetingLink exists
  let meetingSection = '';
  if ((meetingType === 'google' || meetingType === 'zoom') && meetingLink) {
    const icon = meetingType === 'google' ? meetIcon : zoomIcon;
    const btnText =
      meetingType === 'google' ? 'Join with Google Meet' : 'Join with Zoom';
    meetingSection = `
        <a href="${meetingLink}" class="join-btn">${icon}${btnText}</a>
        <div class="meeting-link-section">
          <div class="section-title">Meeting link</div>
          <a href="${meetingLink}" class="meeting-url">${meetingLink}</a>
        </div>
      `;
  }

  // .ics attachment visual indicator
  const icsSection = `
      <div style="margin-top:18px;display:flex;align-items:center;">
        ${icsIcon}
        <span style="font-size:13px;color:#5f6368;">Calendar file attached: <b>invite.ics</b></span>
      </div>
    `;

  return `
  <html>
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Event Invitation</title>
      <style>
        .email-container {
          width: 100%;
          margin: 10px auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid #e1e5e9;
        }
        .content { padding: 0; }
        .main-section { display: flex; min-height: 300px; background: white; }
        .left-column { flex: 1; padding: 24px; background: white; }
        .right-column { flex: 1; margin-left: 50px; padding: 24px; background-color: #fafbfc; }
        .section-title { font-size: 12px; font-weight: 600; color: #5f6368; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px; }
        .event-time { font-size: 14px; color: #202124; margin-bottom: 24px; line-height: 1.5; font-weight: 500; padding: 12px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #1a73e8; }
        .guests-section { margin-bottom: 24px; }
        .guest-item { display: flex; align-items: center; margin-bottom: 6px; font-size: 14px; color: #202124; padding: 6px 0; }
        .guest-name { font-weight: 500; color: #202124; }
        .guest-email { color: #5f6368; margin-left: 8px; }
        .organizer-badge { background: #e8f0fe; color: #1a73e8; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 600; margin-left: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .join-btn { display: inline-block; background: linear-gradient(97deg, #18f06e -20%, #0b6de0 120%); color: white !important; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 16px; text-align: center; width: auto; box-sizing: border-box; transition: all 0.2s ease; border: none; }
        .join-btn:hover { opacity: 0.9; }
        .meeting-link-section { margin-top: 16px; }
        .meeting-url { color: #1a73e8; text-decoration: none; font-size: 14px; word-break: break-all; display: block; margin-top: 6px; }
        .meeting-url:hover { text-decoration: underline; }
        .footer { padding: 16px 24px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #5f6368; border-top: 1px solid #e8eaed; font-weight: 500; }
        @media (max-width: 600px) { .main-section { flex-direction: column; } .left-column, .right-column { border-right: none; border-bottom: 1px solid #e8eaed; } }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="content">
          <div class="main-section">
            <div class="left-column">
              <div class="section-title">When</div>
              <div class="event-time">${calendarIcon}${eventDate} · ${clockIcon}${fromTime} - ${toTime} (${timezone})</div>
              <div class="guests-section">
                <div class="section-title">Guests</div>
                ${guestHtml}
              </div>
              ${icsSection}
            </div>
            <div class="right-column">
              ${meetingSection}
            </div>
          </div>
        </div>
        <div class="footer">Invitation from D-Calendar</div>
      </div>
    </body>
  </html>
  `;
}
