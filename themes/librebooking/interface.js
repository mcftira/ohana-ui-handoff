/* Additive UI helpers. No authentication, reservation, or account actions. */
(function(){
 'use strict';
 const hu=document.documentElement.lang.toLowerCase().startsWith('hu');
 const text=(hungarian,english)=>hu?hungarian:english;
 const main=document.getElementById('main');
 if(!main)return;
 document.body.classList.add('ohana-interface');
 const skip=document.createElement('a');skip.className='ohana-skip';skip.href='#main';skip.textContent=text('Ugrás a tartalomhoz','Skip to content');document.body.prepend(skip);
 main.tabIndex=-1;
 const strip=document.querySelector('body > div.d-flex.align-items-center.gap-2');
 if(strip){
  const home=document.createElement('a');home.className='ohana-home';home.href='https://ohana6.com/';home.textContent=text('← Ohana főoldal','← Ohana website');strip.append(home);
  const logo=strip.querySelector('.navbar-brand');if(logo)logo.setAttribute('aria-label',text('Ohana – vezérlőpult','Ohana – dashboard'));
 }
 const login=document.getElementById('page-login');
 if(login){
  document.body.classList.add('ohana-login');
  const intro=document.createElement('section');intro.className='ohana-login-intro';
  const h=document.createElement('h1');h.textContent=text('Jó újra itt látni.','Welcome back.');
  const p=document.createElement('p');p.textContent=text('Lépj be a naptáradhoz és meglévő foglalásaidhoz.','Sign in to view your calendar and existing reservations.');
  const a=document.createElement('a');a.href='https://ohana6.com/foglalas/';a.className='ohana-guest-link';a.textContent=text('Új időpontot keresel? Kezdd itt ↗','Looking for a new booking? Start here ↗');
  intro.append(h,p,a);login.prepend(intro);
  [['email',text('Felhasználónév vagy email','Username or email'),'username'],['password',text('Jelszó','Password'),'current-password']].forEach(([id,title,auto])=>{
   const input=document.getElementById(id);if(!input)return;
   const label=document.createElement('label');label.htmlFor=id;label.className='ohana-field-label';label.textContent=title;
   input.closest('.input-group').before(label);input.autocomplete=auto;
   if(id==='email'){input.autocapitalize='none';input.spellcheck=false;}
  });
  const pass=document.getElementById('password');
  if(pass){
   const toggle=document.createElement('button');toggle.type='button';toggle.className='ohana-password-toggle';toggle.textContent=text('Mutat','Show');toggle.setAttribute('aria-controls','password');toggle.setAttribute('aria-label',text('Jelszó megjelenítése','Show password'));toggle.setAttribute('aria-pressed','false');
   toggle.addEventListener('click',()=>{const show=pass.type==='password';pass.type=show?'text':'password';toggle.textContent=show?text('Elrejt','Hide'):text('Mutat','Show');toggle.setAttribute('aria-pressed',String(show));toggle.setAttribute('aria-label',show?text('Jelszó elrejtése','Hide password'):text('Jelszó megjelenítése','Show password'));});pass.after(toggle);
  }
  const error=document.getElementById('loginError');if(error){error.setAttribute('role','alert');error.tabIndex=-1;error.focus();}
 }
 const dashboard=document.getElementById('dashboardList');
 if(dashboard){
  const heading=document.createElement('div');heading.className='ohana-page-heading';
  const title=document.createElement('h1');title.textContent=text('Foglalási áttekintés','Booking overview');
  const p=document.createElement('p');p.textContent=text('A terem elérhetősége és a foglalásaid egy helyen.','Room availability and your reservations in one place.');heading.append(title,p);dashboard.before(heading);
 }
 const schedule=document.getElementById('page-schedule');
 if(schedule){
  const heading=document.createElement('div');heading.className='ohana-page-heading';
  const title=document.createElement('h1');title.textContent=text('A terem naptára','Room calendar');
  const p=document.createElement('p');p.textContent=text('A naptárban a meglévő foglalásokat kezelheted. Új vendégfoglaláshoz használd a négy fix sávos időpontválasztót.','Manage existing reservations here. For a new guest booking, use the four-slot booking flow.');
  const a=document.createElement('a');a.href='https://ohana6.com/foglalas/';a.className='ohana-guest-link';a.textContent=text('Vendégfoglalás ↗','Guest booking ↗');heading.append(title,p,a);schedule.prepend(heading);
  const enhance=()=>{
   schedule.querySelectorAll('table.reservations').forEach(table=>{
    const parent=table.parentElement;
    parent.classList.add('ohana-grid-scroll');parent.tabIndex=0;parent.setAttribute('role','region');parent.setAttribute('aria-label',text('Foglalási naptár, vízszintesen görgethető','Reservation calendar, scroll horizontally'));
    table.setAttribute('aria-label',text('A terem foglaltsága','Room availability'));
   });
   schedule.querySelectorAll('a[title],button[title]').forEach(e=>{if(!e.getAttribute('aria-label'))e.setAttribute('aria-label',e.title);});
  };
  enhance();
  window.addEventListener('load',enhance,{once:true});
 }
})();

/* The staff month view uses LibreBooking's authenticated calendar and its
   privacy-filtered event feed. Presentation only: no new reservation endpoint,
   inferred availability, payment state, or write operation. */
(function(){
 'use strict';
 const main=document.getElementById('main');
 if(!main||document.getElementById('page-login'))return;
 const hu=document.documentElement.lang.toLowerCase().startsWith('hu');
 const text=(hungarian,english)=>hu?hungarian:english;
 const query=new URLSearchParams(window.location.search);
 const monthUrl=(source=window.location.href)=>{
  const from=new URL(source,window.location.href),to=new URL('calendar.php',from);
  for(const key of ['sid','rid','gid','uid','pid','start','d','m','y']){
   if(from.searchParams.has(key))to.searchParams.set(key,from.searchParams.get(key));
  }
  const start=from.searchParams.get('sd');
  if(start&&/^\d{4}-\d{2}-\d{2}$/.test(start))to.searchParams.set('start',start);
  to.searchParams.set('ct','month');
  return to.pathname+to.search;
 };
 const schedule=document.getElementById('page-schedule');
 if(schedule&&query.get('ohana-view')!=='detail'){
  // The old grid remains reachable explicitly; no native grid controls or
  // buffer rules are removed. Partial AJAX responses have no #main.
  window.location.replace(monthUrl());
  return;
 }
 const dashboard=document.getElementById('dashboardList');
 if(dashboard){
  const link=document.createElement('a');link.className='ohana-guest-link ohana-calendar-open';
  link.href=monthUrl();link.textContent=text('Havi naptár megnyitása →','Open monthly calendar →');
  dashboard.before(link);
 }
 // Make ordinary navigation open the month; leave reservation, action and
 // subscription URLs alone. The explicit detailed-grid link is added below.
 document.querySelectorAll('nav a[href]').forEach(link=>{
  const url=new URL(link.href,window.location.href);
  if(url.origin===window.location.origin&&/\/schedule.php$/.test(url.pathname)&&!url.searchParams.has('action'))link.href=monthUrl(url.href);
 });
 const page=document.getElementById('page-calendar');
 if(!page||!window.FullCalendar||!window.FullCalendar.Calendar)return;

 const make=(tag,className,value)=>{const e=document.createElement(tag);e.className=className;if(value)e.textContent=value;return e;};
 const heading=make('div','ohana-page-heading');
 heading.append(make('h1','',text('A terem naptára','Room calendar')),make('p','',text('A foglalás részleteit a színes sávra kattintva nyithatod meg.','Select a coloured booking to open its details.')));
 const guest=make('a','ohana-guest-link',text('Vendégfoglalás ↗','Guest booking ↗'));guest.href='https://ohana6.com/foglalas/';heading.append(guest);page.prepend(heading);
 const legend=make('ul','ohana-slot-legend');legend.setAttribute('aria-label',text('Sávok színei','Slot colours'));
 const slots={morning:text('Reggel','Morning'),office:'Office Hours',evening:text('Este','Evening'),day:text('Egész nap','All day')};
 for(const [key,label] of Object.entries(slots))legend.append(make('li','ohana-slot-'+key,label));
 const calendarElement=document.getElementById('calendar');calendarElement.before(legend);
 const status=make('div','ohana-calendar-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');calendarElement.before(status);
 const retry=make('button','ohana-calendar-retry',text('Újrapróbálom','Retry'));retry.type='button';retry.hidden=true;status.after(retry);
 const details=make('details','ohana-calendar-details');details.append(make('summary','',text('További beállítások','More options')));
 const filter=page.querySelector('.row.form-inline'),subscription=document.getElementById('subscriptionContainer');
 if(filter)details.append(filter);if(subscription)details.append(subscription);
 const gridLink=make('a','ohana-grid-link',text('Részletes időrács ↗','Detailed time grid ↗'));
 const gridUrl=new URL('schedule.php',window.location.href);gridUrl.searchParams.set('ohana-view','detail');
 for(const key of ['sid','rid','gid'])if(query.has(key))gridUrl.searchParams.set(key,query.get(key));
 gridLink.href=gridUrl.pathname+gridUrl.search;details.append(gridLink);page.append(details);

 // LibreBooking 5.3 constructs FullCalendar in jQuery's DOM-ready callback.
 // This deferred script installs the adapter before DOMContentLoaded, then
 // delegates all native click, date-click, popup and authorization behavior.
 const NativeCalendar=window.FullCalendar.Calendar;
 let calendar,loaded=false,failed=false;
 const syncGridLink=options=>{
  const url=new URL('schedule.php',window.location.href);url.searchParams.set('ohana-view','detail');
  const filters=options.events&&typeof options.events.extraParams==='function'?options.events.extraParams():{};
  for(const key of ['sid','rid','gid','uid','pid']){
   const value=Object.prototype.hasOwnProperty.call(filters,key)?filters[key]:query.get(key);
   if(value!==null&&value!==undefined&&String(value)!=='')url.searchParams.set(key,String(value));
  }
  if(calendar&&calendar.view){
   const date=calendar.view.currentStart;
   if(date instanceof Date&&!Number.isNaN(date.getTime()))url.searchParams.set('sd',[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'));
  }
  gridLink.href=url.pathname+url.search;
 };
 retry.addEventListener('click',()=>{if(calendar){retry.hidden=true;calendar.refetchEvents();}});
 const classes=event=>Array.isArray(event.classNames)?event.classNames:[];
 const wallTime=value=>{
  const m=String(value||'').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  return m?{day:m[1],time:m[2]+':'+m[3]}:null;
 };
 const slotFor=event=>{
  if(classes(event).includes('unreservable'))return 'blocked';
  if(classes(event).includes('reservable'))return 'available';
  const start=wallTime(event.startStr),end=wallTime(event.endStr);
  if(!start||!end||start.day!==end.day)return 'other';
  const range=start.time+'–'+end.time;
  return {'06:30–09:30':'morning','10:00–16:00':'office','17:00–22:00':'evening','06:30–22:00':'day'}[range]||'other';
 };
 const eventLabel=event=>{
  const slot=slotFor(event),start=wallTime(event.startStr),end=wallTime(event.endStr);
  const label=slots[slot]||(slot==='blocked'?text('Blokkolt','Blocked'):slot==='available'?text('Szabad','Available'):text('Egyedi időpont','Custom time'));
  const time=start&&end?start.time+'–'+end.time:'';
  const pending=classes(event).includes('pending')?text('Jóváhagyásra vár','Awaiting approval'):'';
  return {slot,label,time,pending};
 };
 window.FullCalendar.Calendar=class extends NativeCalendar{
  constructor(element,options){
   if(element!==calendarElement){super(element,options);return;}
   const native={...options};
   super(element,{
    ...native,
    initialView:query.get('ct')==='agendaDay'?'timeGridDay':query.get('ct')==='agendaWeek'?'timeGridWeek':window.matchMedia&&window.matchMedia('(max-width: 600px)').matches?'listMonth':'dayGridMonth',
    headerToolbar:{left:'prev,next today',center:'title',right:'dayGridMonth,listMonth'},
    buttonText:{...native.buttonText,dayGridMonth:text('Hónap','Month'),listMonth:text('Lista','List')},
    views:{...native.views,listMonth:{buttonText:text('Lista','List')}},
    firstDay:1,weekNumbers:false,fixedWeekCount:false,height:'auto',
    eventDisplay:'block',displayEventTime:false,dayMaxEvents:false,
    // Avoid accidental drag-to-move in the compact overview. The original
    // reservation form remains the single place to change a booking.
    eventStartEditable:false,eventDurationEditable:false,
    eventDataTransform(raw){
     const event=native.eventDataTransform?native.eventDataTransform(raw):raw;
     return event?{...event,startEditable:false,durationEditable:false}:event;
    },
    eventContent(info){
     if(!['dayGridMonth','listMonth'].includes(info.view.type))return native.eventContent?native.eventContent(info):true;
     const {slot,label,time,pending}=eventLabel(info.event);
     const card=make(info.view.type==='listMonth'&&info.event.url?'a':'span','ohana-event-content');
     card.append(make('span','ohana-event-slot',label));
     card.append(make('span','ohana-event-title',info.event.title||text('Foglalás','Reservation')));
     if(time)card.append(make('span','ohana-event-time',time));
     if(pending)card.append(make('span','ohana-event-status',pending));
     return {domNodes:[card]};
    },
    eventDidMount(info){
     if(native.eventDidMount)native.eventDidMount(info);
     if(!['dayGridMonth','listMonth'].includes(info.view.type))return;
     const {slot,label,time,pending}=eventLabel(info.event);
     info.el.classList.add('ohana-calendar-event','ohana-slot-'+slot);
     const content=info.el.querySelector('.ohana-event-content');
     if(content)content.style.setProperty('color','var(--slot-ink)','important');
     const description=[info.event.title||text('Foglalás','Reservation'),label,time,pending].filter(Boolean).join(' · ');
     info.el.setAttribute('aria-label',description);info.el.title=description;
     // FullCalendar's custom list content replaces its built-in anchor. Restore
     // that semantic link using the URL already resolved by LibreBooking.
     const link=info.el.querySelector('a.ohana-event-content');
     if(link){
      const href=info.el.getAttribute('href')||info.event.url;
      const url=new URL(href,window.location.href);
      if(url.origin===window.location.origin){link.href=url.href;link.setAttribute('aria-label',description);}
     }
    },
    loading(isLoading){
     if(native.loading)native.loading(isLoading);
     calendarElement.setAttribute('aria-busy',String(isLoading));
     if(isLoading){status.textContent=text('Foglalások betöltése…','Loading bookings…');status.dataset.state='loading';retry.hidden=true;}
    },
    datesSet(info){syncGridLink(native);if(native.datesSet)native.datesSet(info);},
    eventSourceSuccess(...args){loaded=true;failed=false;syncGridLink(native);return native.eventSourceSuccess?native.eventSourceSuccess(...args):undefined;},
    eventSourceFailure(...args){
     failed=true;status.textContent=text('A foglalások nem tölthetők be. Próbáld újra, vagy jelentkezz be ismét.','Bookings could not be loaded. Retry or sign in again.');status.dataset.state='error';retry.hidden=false;
     if(native.eventSourceFailure)native.eventSourceFailure(...args);
    },
    eventsSet(events){
     if(native.eventsSet)native.eventsSet(events);
     if(loaded&&!failed){status.dataset.state='success';status.textContent=events.length?'':text('Ebben a nézetben nincs megjeleníthető foglalás.','No bookings to display in this view.');retry.hidden=true;}
    }
   });
   calendar=this;
  }
 };
})();
