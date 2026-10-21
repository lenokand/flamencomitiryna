export interface Schedule {
 weekday: number; startTime: string; endTime: string; timeZone: string;
 venue: string; address: string; status: string; excludedDates: string[]; dates?: string[];
}
export function validateSchedule(s: Schedule) {
 if (!Number.isInteger(s.weekday) || s.weekday < 0 || s.weekday > 6) throw new Error('schedule.weekday must be 0–6');
 for (const t of [s.startTime,s.endTime]) if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) throw new Error('Invalid schedule time');
 if (s.endTime <= s.startTime) throw new Error('endTime must follow startTime on the same day');
 if (!['active','paused'].includes(s.status)) throw new Error('status must be active or paused');
 new Intl.DateTimeFormat('en',{timeZone:s.timeZone}).format();
 if(!s.venue.trim() || !s.address.trim()) throw new Error('Venue and address are required');
 for (const d of [...s.excludedDates,...(s.dates || [])]) if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || new Date(d).toISOString().slice(0,10)!==d) throw new Error('Invalid excluded date');
}
function parts(date: Date, timeZone: string) {
 return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
}
export function zonedInstant(day: string, time: string, timeZone: string) {
 const target=Date.parse(`${day}T${time}:00Z`); let guess=target;
 for(let i=0;i<4;i++) { const p=parts(new Date(guess),timeZone);const shown=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);guess+=target-shown; }
 return new Date(guess);
}
export function nextClass(s: Schedule, now = new Date()) {
 validateSchedule(s);if(s.status==='paused') return null;
 if(s.dates) { for(const day of [...s.dates].sort()) { if(s.excludedDates.includes(day))continue;const start=zonedInstant(day,s.startTime,s.timeZone);if(start>now)return {day,start,end:zonedInstant(day,s.endTime,s.timeZone)}; }return null; }
 const p=parts(now,s.timeZone);const today=new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`);
 for(let i=0;i<370;i++) {const date=new Date(today);date.setUTCDate(date.getUTCDate()+i);const day=date.toISOString().slice(0,10);
 if(date.getUTCDay()!==s.weekday || s.excludedDates.includes(day))continue;
 const start=zonedInstant(day,s.startTime,s.timeZone);if(start<=now)continue;
 return {day,start,end:zonedInstant(day,s.endTime,s.timeZone)};
 }return null;
}
const stamp=(d:Date)=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
function fold(line:string) {let result='',width=0;for(const c of line){const n=new TextEncoder().encode(c).length;if(width+n>75){result+='\r\n ';width=1;}result+=c;width+=n;}return result;}
export function calendarLinks(s:Schedule, event:NonNullable<ReturnType<typeof nextClass>>, title:string, description:string, now=new Date()) {
 const location=`${s.venue}, ${s.address}`;
 const params=new URLSearchParams({action:'TEMPLATE',text:title,dates:`${stamp(event.start)}/${stamp(event.end)}`,ctz:s.timeZone,details:description,location});
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Flamenco mit Iryna//Classes//DE','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:flamenco-${event.day}-${s.startTime.replace(':','')}@flamenco-mit-iryna`,`DTSTAMP:${stamp(now)}`,`DTSTART:${stamp(event.start)}`,`DTEND:${stamp(event.end)}`,`SUMMARY:${escape(title)}`,`DESCRIPTION:${escape(description)}`,`LOCATION:${escape(location)}`,'END:VEVENT','END:VCALENDAR'];
 return {google:`https://calendar.google.com/calendar/render?${params}`,ics:lines.map(fold).join('\r\n')+'\r\n'};
}
