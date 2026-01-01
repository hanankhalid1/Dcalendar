
import moment from 'moment';
import { db } from './dbhelper';

/**
 * Process events and set triggers in the database.
 * @param {Array} events - The list of events to process.
 */
export const setTriggerNotification = async (events: any[]): Promise<void> => {
    await db.table('trigger').clear();
    if (!Array.isArray(events)) return;

    // Filter events with a valid 'trigger' attribute
    const filteredEvents = events.filter(event =>
        event?.list && findAttribute(event.list, 'trigger') !== ''
    );
    if (filteredEvents.length > 0) {
        // Clear the 'trigger' table before adding new data

        // Add filtered events to the 'trigger' table
        await Promise.all(
            filteredEvents.map(async event => {
                const trigger = findAttribute(event.list, 'trigger');
                const notivicationValue = findAttribute(event.list, 'notification');
                if (trigger && notivicationValue === 'Notification') {
                    const localTime = calculateTriggerTime(event.fromTime, trigger);
                    if (localTime) {
                        const now = new Date();
                        const yesterday = Math.floor((now.getTime() - (24 * 60 * 60 * 1000)) / 1000);
                        const triggerTime = Math.floor(new Date(localTime).getTime() / 1000);
                        if (triggerTime > yesterday) {
                            await db.table('trigger').add({ time: localTime, value: event });
                        }
                    }
                }
            })
        );

        //mock data for triggering the notification

        // await db.table('trigger').add({
        //     time: '2024-11-27T08:55:00.000Z', value: {
        //         "0": "b1271396-ae32-446b-a579-f9fcabd23060@bmail.earth",
        //         "1": "trigger",
        //         "2": "<p>www</p>",
        //         "3": "20241119T183000",
        //         "4": "20241121T183000",
        //         "5": false,
        //         "6": [
        //             {
        //                 "0": "busy",
        //                 "1": "Busy",
        //                 "__length__": 2,
        //                 "key": "busy",
        //                 "value": "Busy"
        //             },
        //             {
        //                 "0": "visibility",
        //                 "1": "Default Visibility",
        //                 "__length__": 2,
        //                 "key": "visibility",
        //                 "value": "Default Visibility"
        //             },
        //             {
        //                 "0": "notification",
        //                 "1": "Notification",
        //                 "__length__": 2,
        //                 "key": "notification",
        //                 "value": "Notification"
        //             },
        //             {
        //                 "0": "options",
        //                 "1": "",
        //                 "__length__": 2,
        //                 "key": "options",
        //                 "value": ""
        //             },
        //             {
        //                 "0": "guest_permission",
        //                 "1": "",
        //                 "__length__": 2,
        //                 "key": "guest_permission",
        //                 "value": ""
        //             },
        //             {
        //                 "0": "trigger",
        //                 "1": "-P0DT0H6M0S",
        //                 "__length__": 2,
        //                 "key": "trigger",
        //                 "value": "-P0DT0H6M0S"
        //             }
        //         ],
        //         "__length__": 7,
        //         "uid": "b1271396-ae32-446b-a579-f9fcabd23060@bmail.earth",
        //         "title": "trigger",
        //         "description": "<p>www</p>",
        //         "fromTime": "20241119T183000",
        //         "toTime": "20241121T183000",
        //         "done": false,
        //         "list": [
        //             {
        //                 "0": "busy",
        //                 "1": "Busy",
        //                 "__length__": 2,
        //                 "key": "busy",
        //                 "value": "Busy"
        //             },
        //             {
        //                 "0": "visibility",
        //                 "1": "Default Visibility",
        //                 "__length__": 2,
        //                 "key": "visibility",
        //                 "value": "Default Visibility"
        //             },
        //             {
        //                 "0": "notification",
        //                 "1": "Notification",
        //                 "__length__": 2,
        //                 "key": "notification",
        //                 "value": "Notification"
        //             },
        //             {
        //                 "0": "options",
        //                 "1": "",
        //                 "__length__": 2,
        //                 "key": "options",
        //                 "value": ""
        //             },
        //             {
        //                 "0": "guest_permission",
        //                 "1": "",
        //                 "__length__": 2,
        //                 "key": "guest_permission",
        //                 "value": ""
        //             },
        //             {
        //                 "0": "trigger",
        //                 "1": "-P0DT0H6M0S",
        //                 "__length__": 2,
        //                 "key": "trigger",
        //                 "value": "-P0DT0H6M0S"
        //             }
        //         ]
        //     }
        // });
    } else {
        // Clear the 'trigger' table if no valid events are found
        await db.table('trigger').clear();
    }
};



/**
 * Find the value of a specific key in an attribute array.
 * @param {Array} attributes - The list of attributes to search.
 * @param {string} key - The key to search for.
 * @returns {string} - The value corresponding to the key, or an empty string if not found.
 */
export const findAttribute = (attributes: any[], key: string): string => {
    if (!Array.isArray(attributes)) return '';
    return attributes.find((attr: any) => attr.key === key)?.value || '';
};




/**
 * Calculates the trigger time by subtracting a duration from a base UTC time.
 * @param {string} fromTime - The base time in UTC (e.g., "20241119T183000").
 * @param {string} duration - The ISO-8601 duration string (e.g., -P0DT0H6M0S).
 * @returns {string} - The calculated trigger time in UTC, or an empty string if invalid.
 */
const calculateTriggerTime = (fromTime: string, duration: string): string => {
    try {
        // Parse the base UTC time
        const baseTime = moment.utc(fromTime, 'YYYYMMDDTHHmmss');
        if (!baseTime.isValid()) throw new Error(`Invalid fromTime: ${fromTime}`);

        // Parse the duration
        const parsedDuration = moment.duration(duration);
        if (!parsedDuration) throw new Error(`Invalid duration: ${duration}`);

        // Subtract the duration from the base time
        const triggerTime = baseTime.add(parsedDuration); // Use `.subtract()` if `duration` is negative

        // Return the final UTC time as an ISO string
        return triggerTime.toISOString();
    } catch (error) {
        console.error(`Error calculating trigger time: ${error.message}`);
        return '';
    }
};


/**
 * Send a Windows Notification using the Notification API.
 * @param {string} title - The title of the notification.
 * @param {string} body - The body of the notification.
 */
export const sendNotification = (title: string, body: string, uid: string) => {
    // Request notification permission if not already granted
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                const notification = new Notification(title, {
                    body: body,
                    icon: '/Dcalendar.png',
                });
                notification.onclick = () => {
                    window.open(`${process.env.NEXT_PUBLIC_URL}app/calendar?uid=${uid}`);
                };
            } else {
                console.warn('Notification permission denied.');
            }
        });
    } else if (Notification.permission === 'granted') {
        // Create and show the notification
        try {
            const notification = new Notification(title, {
                body: body,
                icon: '/Dcalendar.png',
            });
            notification.onclick = () => {
                window.open(`${process.env.NEXT_PUBLIC_URL}app/calendar?uid=${uid}`);
            };
        } catch (err) {
            console.error('Notification creation failed:', err);
        }
    } else {
        console.warn('Notifications are blocked by the user.');
    }
};