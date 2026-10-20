(function(){
'use strict';
var D=document;
var state={mode:'unavailable',loading:true};
var listeners=[];
var request=0;
// These strings describe the currently verified server mode. Static HTML stays
// neutral and payment controls remain disabled until this request succeeds.
var copy={
 'home-status':{
  test:'Az online foglalás próbaüzemben működik. Végleges időpontért egyeztess velünk WhatsAppon.',
  live:'Válaszd ki az időpontot, add meg az adataidat, és fizesd ki a sávot bankkártyával.',
  unavailable:'Az online fizetés jelenleg nem érhető el. Foglaláshoz egyeztess velünk WhatsAppon.'
 },
 'home-payment-title':{test:'Egyeztetsz velünk',live:'Bankkártyával fizetsz',unavailable:'Egyeztetsz velünk'},
 'home-payment-copy':{
  test:'Az online fizetés próbaüzemben működik. A végleges foglalást egyeztesd velünk WhatsAppon.',
  live:'A Stripe fizetőoldalán kifizeted a kiválasztott sávot. Ezután ellenőrizzük és rögzítjük a foglalást.',
  unavailable:'A kiválasztott időpontot WhatsAppon tudod egyeztetni velünk.'
 },
 'notice':{
  test:'Az online foglalás próbaüzemben működik. A próbafizetés nem terheli meg a kártyádat, és nem foglal le időpontot. Ne adj meg valódi kártyaadatot. Végleges időpontért egyeztess velünk.',
  live:'Online teremfoglalás bankkártyás fizetéssel. A kiválasztott sáv díját a Stripe fizetőoldalán fizeted ki.',
  unavailable:'Az online fizetés jelenleg nem érhető el. Foglaláshoz egyeztess velünk WhatsAppon.'
 },
 'details-step':{test:'Tesztadatok',live:'Adataid',unavailable:'Adatok'},
 'cart-copy':{
  test:'Végleges foglaláshoz küldd el a választott időpontot WhatsAppon. Ehhez nem kell további adatot megadnod ezen az oldalon.',
  live:'Folytasd az elérhetőségi adataiddal, majd ellenőrizd és fizesd ki a kiválasztott sávot.',
  unavailable:'A kiválasztott időpontot WhatsAppon tudod egyeztetni velünk.'
 },
 'cart-contact':{test:'Egyeztetés WhatsAppon ↗',live:'Segítség WhatsAppon ↗',unavailable:'Egyeztetés WhatsAppon ↗'},
 'details-next':{test:'Tovább a teszthez',live:'Tovább az adatokhoz',unavailable:'Online fizetés nem érhető el'},
 'details-title':{test:'A tesztfoglalás adatai',live:'A foglalás adatai',unavailable:'A foglalás adatai'},
 'details-copy':{
  test:'Ez a próbafizetéshez vezető tesztfolyamat. Csak tesztadatokat adj meg. A csillaggal jelölt mezők kötelezők.',
  live:'Add meg az elérhetőségi adataidat a foglaláshoz. A csillaggal jelölt mezők kötelezők.',
  unavailable:'Az online fizetés nem érhető el. Az időpontot WhatsAppon tudod egyeztetni.'
 },
 'email-help':{test:'A próbához teszt emailcímet adj meg.',live:'A foglalásodhoz használt emailcímed.',unavailable:'Online fizetés jelenleg nem indítható.'},
 'phone-help':{test:'A próbához teszt telefonszámot adj meg.',live:'Olyan számot adj meg, amelyen a foglalásoddal kapcsolatban elérhetünk.',unavailable:'Online fizetés jelenleg nem indítható.'},
 'payment-title':{test:'Egyeztessük a foglalást.',live:'Ellenőrzés és fizetés',unavailable:'Egyeztessük a foglalást.'},
 'payment-copy':{
  test:'Az online rendszer próbaüzemben van. A végleges időpontot WhatsAppon tudod egyeztetni.',
  live:'Ellenőrizd az időpontot és az adataidat. A következő lépésben a Stripe fizetőoldalára irányítunk.',
  unavailable:'Az online fizetés nem érhető el. Egyeztess velünk a kiválasztott időpontról.'
 },
 'payment-summary':{test:'Próbafizetés tesztelőknek',live:'Bankkártyás fizetés',unavailable:'Online fizetés nem érhető el'},
 'payment-help':{test:'Csak tesztadatokkal használd. Valódi foglaláshoz válaszd a WhatsApp-egyeztetést.',live:'Az alábbi gombbal valódi bankkártyás fizetést indítasz a feltüntetett összegért.',unavailable:'A fizetési lehetőséget még nem tudtuk ellenőrizni.'},
 'payment-footer':{test:'Stripe tesztfizetés. Valódi bankkártyát ne használj.',live:'A bankkártyaadatokat a Stripe kezeli.',unavailable:'Online fizetés jelenleg nem indítható.'}
};
function paint(){
 D.querySelectorAll('[data-booking-copy]').forEach(function(el){
  var messages=copy[el.getAttribute('data-booking-copy')];
  if(messages)el.textContent=state.loading&&['notice','home-status'].includes(el.getAttribute('data-booking-copy'))?'Az online fizetési lehetőséget ellenőrizzük. Addig WhatsAppon tudsz egyeztetni.':messages[state.mode];
 });
 D.querySelectorAll('[data-booking-refresh]').forEach(function(el){el.hidden=state.mode!=='unavailable';el.disabled=state.loading;});
 D.querySelectorAll('[data-booking-status]').forEach(function(el){el.setAttribute('aria-busy',String(state.loading));});
}
function notify(){paint();listeners.forEach(function(fn){fn({mode:state.mode,loading:state.loading});});}
async function refresh(){
 var current=++request;
 state={mode:'unavailable',loading:true};notify();
 var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},12000);
 try{
  var response=await fetch('/api/booking-config',{cache:'no-store',credentials:'same-origin',signal:controller.signal});
  if(!response.ok)throw new Error('Booking configuration unavailable');
  var config=await response.json();
  if(current===request)state={mode:config&&(config.mode==='test'||config.mode==='live')?config.mode:'unavailable',loading:false};
 }catch(e){if(current===request)state={mode:'unavailable',loading:false};}
 finally{clearTimeout(timer);if(current===request)notify();}
 return {mode:state.mode,loading:state.loading};
}
window.OhanaBookingMode={
 get:function(){return {mode:state.mode,loading:state.loading};},
 subscribe:function(fn){listeners.push(fn);fn({mode:state.mode,loading:state.loading});},
 refresh:refresh
};
D.querySelectorAll('[data-booking-refresh]').forEach(function(el){el.addEventListener('click',refresh);});
refresh();
})();
