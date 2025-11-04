import Dexie from 'dexie';

const db = new Dexie('dcalendar');
const EventsDb = new Dexie("MyDatabase");
const dcontactsDb = new Dexie("Contacts");

db.version(1).stores({
    account: '++id, value',
    activeUser: '++id, value',
    trigger: '++id, time, value'
});  

  
EventsDb.version(1).stores({
  Event: "id",
  DecryptedValue: "id",
  DeletedEvents:"id"
});

dcontactsDb.version(1).stores({
   contacts: "id",
   decryptedValue: "id"
})


export  {db,EventsDb,dcontactsDb};