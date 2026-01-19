// Timezone constants for Dcalendar (no external libraries)

export const TIMEZONES = [
  { label: '(GMT-12:00) International Date Line West', value: 'Etc/GMT+12' },

  { label: '(GMT-11:00) Midway Island, Samoa', value: 'Pacific/Midway' },

  { label: '(GMT-10:00) Hawaii', value: 'Pacific/Honolulu' },

  { label: '(GMT-09:00) Alaska', value: 'America/Anchorage' },

  {
    label: '(GMT-08:00) Pacific Time (US & Canada)',
    value: 'America/Los_Angeles',
  },
  { label: '(GMT-08:00) Tijuana, Baja California', value: 'America/Tijuana' },

  { label: '(GMT-07:00) Arizona', value: 'America/Phoenix' },
  { label: '(GMT-07:00) Mountain Time (US & Canada)', value: 'America/Denver' },
  {
    label: '(GMT-07:00) Chihuahua, La Paz, Mazatlan',
    value: 'America/Chihuahua',
  },

  { label: '(GMT-06:00) Central America', value: 'America/Guatemala' },
  { label: '(GMT-06:00) Central Time (US & Canada)', value: 'America/Chicago' },
  {
    label: '(GMT-06:00) Guadalajara, Mexico City, Monterrey',
    value: 'America/Mexico_City',
  },
  { label: '(GMT-06:00) Saskatchewan', value: 'America/Regina' },

  { label: '(GMT-05:00) Bogota, Lima, Quito', value: 'America/Bogota' },
  {
    label: '(GMT-05:00) Eastern Time (US & Canada)',
    value: 'America/New_York',
  },
  {
    label: '(GMT-05:00) Indiana (East)',
    value: 'America/Indiana/Indianapolis',
  },

  { label: '(GMT-04:30) Caracas', value: 'America/Caracas' },

  { label: '(GMT-04:00) Atlantic Time (Canada)', value: 'America/Halifax' },
  { label: '(GMT-04:00) Santiago', value: 'America/Santiago' },
  { label: '(GMT-04:00) La Paz', value: 'America/La_Paz' },
  { label: '(GMT-04:00) Asuncion', value: 'America/Asuncion' },

  { label: '(GMT-03:30) Newfoundland', value: 'America/St_Johns' },

  { label: '(GMT-03:00) Brasilia', value: 'America/Sao_Paulo' },
  {
    label: '(GMT-03:00) Buenos Aires',
    value: 'America/Argentina/Buenos_Aires',
  },
  { label: '(GMT-03:00) Montevideo', value: 'America/Montevideo' },
  { label: '(GMT-03:00) Greenland', value: 'America/Godthab' },

  { label: '(GMT-02:00) Mid-Atlantic', value: 'Etc/GMT+2' },

  { label: '(GMT-01:00) Azores', value: 'Atlantic/Azores' },
  { label: '(GMT-01:00) Cape Verde Islands', value: 'Atlantic/Cape_Verde' },

  {
    label: '(GMT+00:00) Dublin, Edinburgh, Lisbon, London',
    value: 'Europe/London',
  },
  { label: '(GMT+00:00) Casablanca, Monrovia', value: 'Africa/Casablanca' },
  { label: '(GMT+00:00) Reykjavik', value: 'Atlantic/Reykjavik' },

  {
    label: '(GMT+01:00) Amsterdam, Berlin, Rome, Paris',
    value: 'Europe/Paris',
  },
  { label: '(GMT+01:00) Brussels, Copenhagen, Madrid', value: 'Europe/Madrid' },
  { label: '(GMT+01:00) Belgrade, Budapest, Prague', value: 'Europe/Prague' },
  {
    label: '(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb',
    value: 'Europe/Warsaw',
  },
  { label: '(GMT+01:00) West Central Africa', value: 'Africa/Lagos' },

  { label: '(GMT+02:00) Athens, Bucharest', value: 'Europe/Athens' },
  {
    label: '(GMT+02:00) Helsinki, Kyiv, Riga, Sofia',
    value: 'Europe/Helsinki',
  },
  { label: '(GMT+02:00) Cairo', value: 'Africa/Cairo' },
  { label: '(GMT+02:00) Jerusalem', value: 'Asia/Jerusalem' },
  { label: '(GMT+02:00) Harare, Pretoria', value: 'Africa/Johannesburg' },

  { label: '(GMT+03:00) Moscow, St. Petersburg', value: 'Europe/Moscow' },
  { label: '(GMT+03:00) Kuwait, Riyadh', value: 'Asia/Riyadh' },
  { label: '(GMT+03:00) Baghdad', value: 'Asia/Baghdad' },
  { label: '(GMT+03:00) Nairobi', value: 'Africa/Nairobi' },

  { label: '(GMT+03:30) Tehran', value: 'Asia/Tehran' },

  { label: '(GMT+04:00) Abu Dhabi, Muscat', value: 'Asia/Dubai' },
  { label: '(GMT+04:00) Baku', value: 'Asia/Baku' },
  { label: '(GMT+04:00) Tbilisi', value: 'Asia/Tbilisi' },
  { label: '(GMT+04:00) Yerevan', value: 'Asia/Yerevan' },

  { label: '(GMT+04:30) Kabul', value: 'Asia/Kabul' },

  { label: '(GMT+05:00) Islamabad, Karachi', value: 'Asia/Karachi' },
  { label: '(GMT+05:00) Tashkent', value: 'Asia/Tashkent' },

  {
    label: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi',
    value: 'Asia/Kolkata',
  },
  { label: '(GMT+05:30) Sri Jayawardenepura', value: 'Asia/Colombo' },

  { label: '(GMT+05:45) Kathmandu', value: 'Asia/Kathmandu' },

  { label: '(GMT+06:00) Astana', value: 'Asia/Almaty' },
  { label: '(GMT+06:00) Dhaka', value: 'Asia/Dhaka' },

  { label: '(GMT+06:30) Yangon (Rangoon)', value: 'Asia/Yangon' },

  { label: '(GMT+07:00) Bangkok, Hanoi, Jakarta', value: 'Asia/Bangkok' },

  {
    label: '(GMT+08:00) Beijing, Chongqing, Hong Kong',
    value: 'Asia/Shanghai',
  },
  { label: '(GMT+08:00) Kuala Lumpur, Singapore', value: 'Asia/Singapore' },
  { label: '(GMT+08:00) Taipei', value: 'Asia/Taipei' },
  { label: '(GMT+08:00) Perth', value: 'Australia/Perth' },

  { label: '(GMT+09:00) Osaka, Sapporo, Tokyo', value: 'Asia/Tokyo' },
  { label: '(GMT+09:00) Seoul', value: 'Asia/Seoul' },

  { label: '(GMT+09:30) Adelaide', value: 'Australia/Adelaide' },
  { label: '(GMT+09:30) Darwin', value: 'Australia/Darwin' },

  { label: '(GMT+10:00) Brisbane', value: 'Australia/Brisbane' },
  {
    label: '(GMT+10:00) Canberra, Melbourne, Sydney',
    value: 'Australia/Sydney',
  },
  { label: '(GMT+10:00) Hobart', value: 'Australia/Hobart' },

  { label: '(GMT+11:00) Solomon Islands', value: 'Pacific/Guadalcanal' },
  { label: '(GMT+11:00) Magadan', value: 'Asia/Magadan' },

  { label: '(GMT+12:00) Auckland, Wellington', value: 'Pacific/Auckland' },
  { label: '(GMT+12:00) Fiji', value: 'Pacific/Fiji' },

  { label: "(GMT+13:00) Nuku'alofa", value: 'Pacific/Tongatapu' },
];

// Returns the label for a given timezone value
export function getTimezoneLabel(timezoneValue: string): string {
  const tz = TIMEZONES.find(tz => tz.value === timezoneValue);
  return tz ? tz.label : timezoneValue;
}

// Returns true if the timezone value exists in the list
export function isValidTimezone(timezoneValue: string): boolean {
  return TIMEZONES.some(tz => tz.value === timezoneValue);
}
