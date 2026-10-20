/* UI fixture only: synthetic constants, no network, persistence or native actions. */
(() => {
  'use strict';
  const slotNames = {morning:'Reggeli sáv',office:'Office Hours',evening:'Esti sáv',day:'Egész nap'};
  const slotTimes = {morning:'06:30–09:30',office:'10:00–16:00',evening:'17:00–22:00',day:'06:30–22:00'};
  const events = [
    {day:5,slot:'morning',title:'Minta jóga',person:'Minta Anna'},
    {day:7,slot:'evening',title:'Minta beszélgetőkör',person:'Minta Bence'},
    {day:10,slot:'day',title:'Minta műhelynap',person:'Minta Csilla'},
    {day:12,slot:'office',title:'Minta coaching',person:'Minta Dániel'},
    {day:14,slot:'morning',title:'Minta meditáció',person:'Minta Anna'},
    {day:16,slot:'evening',title:'Minta csoport',person:'Minta Eszter'},
    {day:20,slot:'office',title:'Minta konzultáció',person:'Minta Dániel'},
    {day:22,slot:'morning',title:'Minta mozgásóra',person:'Minta Csilla'},
    {day:22,slot:'evening',title:'Minta műhely',person:'Minta Bence',pending:true},
    {day:24,slot:'day',title:'Minta egész napos program',person:'Minta Eszter'},
    {day:27,slot:'office',title:'Minta coaching',person:'Minta Dániel'},
    {day:29,slot:'evening',title:'Minta zárókör',person:'Minta Anna'}
  ];
  const element = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  };
  const dialog = document.getElementById('booking-dialog');
  const openDetails = event => {
    document.getElementById('booking-title').textContent = event.title;
    const details = document.getElementById('booking-details');
    details.replaceChildren();
    for (const [label,value] of Object.entries({'Dátum':`2026. október ${event.day}.`,'Sáv':`${slotNames[event.slot]} · ${slotTimes[event.slot]}`,'Szervező':event.person,'Állapot':event.pending?'Jóváhagyásra vár':'Visszaigazolt minta'})) {
      details.append(element('dt','',label),element('dd','',value));
    }
    dialog.showModal();
  };
  const eventButton = event => {
    const button = element('button',`fc-daygrid-event ohana-calendar-event ohana-slot-${event.slot}${event.pending?' pending':''}`);
    button.type = 'button';
    const content = element('span','ohana-event-content');
    content.append(element('span','ohana-event-slot',slotNames[event.slot]),element('span','ohana-event-title',event.title),element('span','ohana-event-time',slotTimes[event.slot]));
    if (event.pending) content.append(element('span','ohana-event-status','Jóváhagyásra vár'));
    button.append(content);
    button.setAttribute('aria-label',`Október ${event.day}. ${event.title}, ${slotNames[event.slot]}, ${slotTimes[event.slot]}, kitalált foglalás részletei`);
    button.addEventListener('click',()=>openDetails(event));
    return button;
  };
  const month = document.getElementById('month-view');
  for (const day of ['H','K','Sze','Cs','P','Szo','V']) {
    const header = element('div','fc-col-header-cell');
    header.append(element('span','fc-col-header-cell-cushion',day));
    month.append(header);
  }
  for (let index=0;index<35;index++) {
    const day=index-2;
    const current=day>=1&&day<=31;
    const cell=element('div',`fc-daygrid-day${day===20?' fc-day-today':''}`);
    const frame=element('div',`fc-daygrid-day-frame${current?'':' demo-muted-day'}`);
    const top=element('div','fc-daygrid-day-top');
    top.append(element('span','fc-daygrid-day-number',String(day<=0?30+day:day>31?day-31:day)));
    frame.append(top);
    const items=element('div','fc-daygrid-day-events');
    if (current) events.filter(e=>e.day===day).forEach(e=>items.append(eventButton(e)));
    frame.append(items);cell.append(frame);month.append(cell);
  }
  const list=document.getElementById('list-view');
  for (const day of [...new Set(events.map(e=>e.day))]) {
    list.append(element('h3','demo-list-day',`2026. október ${day}.`));
    events.filter(e=>e.day===day).forEach(event=>{
      const row=element('div','demo-list-row');
      row.append(element('div','demo-list-time',slotTimes[event.slot]),eventButton(event));
      list.append(row);
    });
  }
  const setView = type => {
    month.hidden=type!=='month';list.hidden=type!=='list';
    for (const view of ['month','list']) {
      const button=document.getElementById(`view-${view}`);
      button.setAttribute('aria-pressed',String(type===view));
      button.classList.toggle('fc-button-active',type===view);
    }
  };
  document.getElementById('view-month').addEventListener('click',()=>setView('month'));
  document.getElementById('view-list').addEventListener('click',()=>setView('list'));
  document.getElementById('close-booking').addEventListener('click',()=>dialog.close());
  setView(window.matchMedia('(max-width:600px)').matches?'list':'month');
})();
