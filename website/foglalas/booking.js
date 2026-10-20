
(function(){
var D=document;
var MONTHS=["január","február","március","április","május","június","július","augusztus","szeptember","október","november","december"];
var DOWS=["H","K","Sze","Cs","P","Szo","V"];
var DOWFULL=["hétfő","kedd","szerda","csütörtök","péntek","szombat","vasárnap"];
// Kapacitás programtípusonként (BASE-INFO.md)
var CAPACITY={"jóga":16,"workshop":16,"csoportterápia":21,"hangfürdő":21,"masszázs":4};
var state={useCase:null,date:null,blockId:null,block:null,name:"",email:"",phone:"",headcount:"",notes:""};
function budapestDateKey(){
  var parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Budapest',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  function part(type){return parts.find(function(p){return p.type===type;}).value;}
  return part('year')+'-'+part('month')+'-'+part('day');
}
var todayKey=budapestDateKey();
var todayParts=todayKey.split('-').map(Number);
var cur={y:todayParts[0],m:todayParts[1]-1};
var requestId=0;
var checkoutAttempt=null;
var bookingMode='unavailable';
var checkoutBusy=false;
var modeController=window.OhanaBookingMode;
function canPay(){return bookingMode==='test'||bookingMode==='live';}
function paymentLabel(){
  if(!canPay())return 'Online fizetés nem érhető el';
  var label=bookingMode==='live'?'Fizetés':'Próbafizetés';
  return label+(state.block?' – '+fmtFt(state.block.price):'');
}
function updatePaymentControls(){
  $('submit-booking').disabled=paymentReturn||checkoutBusy||!canPay()||!state.blockId||!state.useCase||!$('terms').checked;
  $('terms').disabled=checkoutBusy||!canPay();
  $('next-1').disabled=!canPay()||!state.blockId;
  $('next-2').disabled=!canPay();
  if(!checkoutBusy)$('submit-booking').textContent=paymentLabel();
}
function applyBookingMode(config){
  var nextMode=config&&(config.mode==='test'||config.mode==='live')?config.mode:'unavailable';
  if(nextMode!==bookingMode||config.loading)$('terms').checked=false;
  bookingMode=nextMode;
  $('checkout-panel').hidden=!canPay();
  if(bookingMode==='live')$('checkout-panel').open=true;
  else if(bookingMode!=='live')$('checkout-panel').open=false;
  $('step-details').setAttribute('aria-label','2. lépés: Adatok');
  updatePaymentControls();
}
function checkoutRequestId(){
  if(crypto.randomUUID)return crypto.randomUUID();
  var bytes=crypto.getRandomValues(new Uint8Array(16));
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  return Array.from(bytes,function(b){return b.toString(16).padStart(2,'0');}).join('').replace(/^(........)(....)(....)(....)(............)$/,'$1-$2-$3-$4-$5');
}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function updateSummary(){
  $('selection-summary').textContent=[state.useCase,state.date?huDate(state.date):null,state.block?blockLine()+' · '+fmtFt(state.block.price):null].filter(Boolean).join(' · ')||'Válassz napot és sávot.';
  updateContact();
}
function saveDraft(){
 try{sessionStorage.setItem('ohana_booking_draft',JSON.stringify({useCase:state.useCase,date:state.date,blockId:state.blockId}));}catch(e){}
}
function focusHeading(id){var h=$(id).querySelector('h2');h.tabIndex=-1;h.focus({preventScroll:true});}

function $(id){return D.getElementById(id);}
function validDateKey(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  var p=value.split('-').map(Number),dt=new Date(p[0],p[1]-1,p[2]);
  return fmtDate(dt)===value;
}
function fmtDate(d){var y=d.getFullYear(),m=d.getMonth(),da=d.getDate();return y+"-"+String(m+1).padStart(2,"0")+"-"+String(da).padStart(2,"0");}
function huDate(dateStr){var p=dateStr.split("-").map(Number);var dt=new Date(p[0],p[1]-1,p[2]);var dow=(dt.getDay()+6)%7;return p[0]+". "+MONTHS[p[1]-1]+" "+p[2]+"., "+DOWFULL[dow];}
function fmtFt(n){return n.toLocaleString("hu-HU")+" Ft";}

/* ---------- steps ---------- */
var step=1;
var paymentReturn=false;
function showStep(n, initial){
  if(paymentReturn)return;
  $("panel-success").hidden=true;
  step=n;
  [1,2,3].forEach(function(i){ $("panel-"+i).hidden=(i!==n); });
  D.querySelectorAll(".step").forEach(function(el){
    var s=+el.getAttribute("data-step");
    el.classList.toggle("active", s===n);
    el.classList.toggle("done", s<n);
    el.classList.toggle("locked", s>n);
    el.disabled=s>n;
    if(s===n) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');
  });
  if(n===3) renderPay();
  updateSummary(); if(!initial)saveDraft();
  if(!initial){focusHeading('panel-'+n); D.querySelector('.wiz').scrollIntoView({block:'start',behavior:'instant'});}
}
D.querySelectorAll('.step').forEach(function(b){b.addEventListener('click',function(){var n=+b.dataset.step;if(n<step)showStep(n);});});
D.querySelectorAll("[data-next]").forEach(function(b){ b.addEventListener("click",function(){ var n=+b.getAttribute("data-next"); if(validate(step)) showStep(n); }); });
D.querySelectorAll("[data-prev]").forEach(function(b){ b.addEventListener("click",function(){ showStep(+b.getAttribute("data-prev")); }); });
function validate(s){
  if(s===1)return canPay()&&!!state.blockId;
  if(s===2)return canPay()&&validateForm();
  return true;
}
function flash(el){ el.style.borderColor="#c0432f"; setTimeout(function(){el.style.borderColor="";},1500); }

/* ---------- program selection in the summary ---------- */
function updateProgramHelp(){
  var cap=CAPACITY[state.useCase];
  $('program-help').textContent=cap?'Ehhez a programhoz legfeljebb '+cap+' fővel számolj. A készülődés és elpakolás a sáv része.':'Válassz programot, hogy ellenőrizhessük a létszámot.';
  $('capacity-help').textContent=cap?'A választott program létszámhatára: '+cap+' fő.':'A létszámhatár programonként eltér. A program típusát az összegzésnél választod ki.';
  $('program-err').innerHTML=cap&&+state.headcount>cap?'<div class="err">Ehhez a programhoz legfeljebb '+cap+' fő fér el. Lépj vissza az adatokhoz, és módosítsd a létszámot, vagy válassz másik programot.</div>':'';
}
function validateProgram(){
  state.useCase=Object.prototype.hasOwnProperty.call(CAPACITY,$('usecase').value)?$('usecase').value:null;
  if(!state.useCase){
    $('usecase').setAttribute('aria-invalid','true');
    $('program-err').innerHTML='<div class="err">Válaszd ki a program típusát.</div>';
    $('usecase').focus();flash($('usecase'));return false;
  }
  $('usecase').removeAttribute('aria-invalid');updateProgramHelp();return true;
}
$("usecase").addEventListener("change",function(){
  state.useCase=Object.prototype.hasOwnProperty.call(CAPACITY,this.value)?this.value:null;
  $('terms').checked=false;
  $('usecase').removeAttribute('aria-invalid');
  updateProgramHelp();updateSummary();updatePaymentControls();saveDraft();
});

/* ---------- calendar ---------- */
(function(){
  var dows=""; DOWS.forEach(function(d){ dows+='<div class="cal-dow">'+d+'</div>'; }); $("cal-dows").innerHTML=dows;
})();
function renderCal(){
  todayKey=budapestDateKey();todayParts=todayKey.split('-').map(Number);
  if(cur.y*12+cur.m<todayParts[0]*12+todayParts[1]-1){cur={y:todayParts[0],m:todayParts[1]-1};}
  var y=cur.y, m=cur.m;
  $("cal-title").textContent=y+". "+MONTHS[m];
  var first=new Date(y,m,1); var startDow=(first.getDay()+6)%7;
  var dim=new Date(y,m+1,0).getDate();
  var today=new Date(todayParts[0],todayParts[1]-1,todayParts[2]);
  $("cal-prev").disabled=y===todayParts[0]&&m===todayParts[1]-1;
  var html="";
  for(var i=0;i<startDow;i++) html+='<div></div>';
  for(var d=1;d<=dim;d++){
    var dt=new Date(y,m,d); var cls="cal-day";
    if(dt<today) cls+=" disabled";
    if(dt.getTime()===today.getTime()) cls+=" today";
    if(state.date===fmtDate(dt)) cls+=" sel";
    html+='<button type="button" class="'+cls+'" data-d="'+fmtDate(dt)+'" aria-label="'+huDate(fmtDate(dt))+'" aria-pressed="'+(state.date===fmtDate(dt))+'" '+(dt<today?'disabled':'')+'>'+d+'</button>';
  }
  $("cal-days").innerHTML=html;
  $("cal-days").querySelectorAll(".cal-day:not(.disabled)").forEach(function(el){
    el.addEventListener("click",function(){ selectDate(el.getAttribute("data-d")); });
    el.addEventListener('keydown',function(e){
      var move={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];
      if(!move)return;e.preventDefault();
      var bits=el.dataset.d.split('-').map(Number),target=new Date(bits[0],bits[1]-1,bits[2]+move);
      if(fmtDate(target)<todayKey)return;
      cur={y:target.getFullYear(),m:target.getMonth()};renderCal();
      var next=$('cal-days').querySelector('[data-d="'+fmtDate(target)+'"]');if(next)next.focus();
    });
  });
}
$("cal-prev").addEventListener("click",function(){ cur.m--; if(cur.m<0){cur.m=11;cur.y--;} renderCal(); });
$("cal-next").addEventListener("click",function(){ cur.m++; if(cur.m>11){cur.m=0;cur.y++;} renderCal(); });

/* ---------- availability / blocks (sávok) ---------- */
function selectDate(dateStr, restoreBlock){
  todayKey=budapestDateKey();
  if(!validDateKey(dateStr)||dateStr<todayKey)return Promise.resolve();
  var request=++requestId;
  state.date=dateStr; state.blockId=null; state.block=null; $('terms').checked=false;updatePaymentControls();
  renderCal();updateSummary();saveDraft();
  var active=$('cal-days').querySelector('[data-d="'+dateStr+'"]');if(active&&step===1)active.focus({preventScroll:true});
  $('slots-for-date').textContent=huDate(dateStr);
  $('blocks').innerHTML=''; $('slots-msg').innerHTML='<span class="spinner" aria-hidden="true"></span> Sávok betöltése…';
  $('blocks').setAttribute('aria-busy','true');
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},20000);
  return fetch('/api/availability?date='+encodeURIComponent(dateStr),{signal:controller.signal})
    .then(function(r){if(!r.ok)throw new Error('availability');return r.json();})
    .then(function(data){
      if(request!==requestId)return;
      if(!data||!Array.isArray(data.blocks))throw new Error('availability');
      var blocks=data.blocks.filter(function(b){return typeof b.id==='string'&&typeof b.label==='string'&&typeof b.start==='string'&&typeof b.end==='string'&&Number.isFinite(b.price)&&Number.isFinite(b.hours);});
      var now=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Budapest',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
      blocks.forEach(function(b){b.available=b.available===true&&!(dateStr===todayKey&&b.start<=now);});
      if(restoreBlock){state.block=blocks.find(function(b){return b.id===restoreBlock&&b.available;})||null;state.blockId=state.block?state.block.id:null;}
      updatePaymentControls();
      renderBlocks(blocks);updateSummary();saveDraft();
    })
    .catch(function(){
      if(request!==requestId)return;
      $('slots-msg').innerHTML='<div class="err">A szabad sávokat most nem tudjuk ellenőrizni. <button type="button" class="text-back" id="retry-slots">Újrapróbálom</button> vagy <a href="https://wa.me/36705306514">egyeztess WhatsAppon</a>.</div>';bindRetry();
    }).finally(function(){clearTimeout(timer);if(request===requestId)$('blocks').removeAttribute('aria-busy');});
}
function bindRetry(){ var r=$("retry-slots"); if(r) r.addEventListener("click",function(e){e.preventDefault(); selectDate(state.date);}); }
function renderBlocks(blocks){
  if(!blocks.length){ $("slots-msg").textContent="Erre a napra nincs foglalható sáv."; return; }
  var anyFree=blocks.some(function(b){return b.available;});
  $("slots-msg").textContent=anyFree?"Válaszd ki a sávot — az egész időablak a tiéd.":"Erre a napra nincs elérhető sáv. Válassz másik napot, vagy egyeztess WhatsAppon.";
  var html="";
  blocks.forEach(function(b){
    var sel=state.blockId===b.id;
    html+='<button type="button" class="blk-opt'+(b.available?"":" disabled")+(sel?" sel":"")+'" data-bid="'+esc(b.id)+'" aria-pressed="'+sel+'" '+(b.available?"":"disabled")+'>'
      +'<span><span class="b-t">'+esc(b.label)+'</span><br><span class="b-d">'+esc(b.start)+' – '+esc(b.end)+' · '+b.hours+' óra'+(b.available?'':' · Nem elérhető')+'</span></span>'
      +'<span class="b-p">'+fmtFt(b.price)+'</span></button>';
  });
  $("blocks").innerHTML=html;
  $("blocks").querySelectorAll(".blk-opt:not(.disabled)").forEach(function(el){
    el.addEventListener("click",function(){
      state.blockId=el.getAttribute("data-bid");
      state.block=blocks.filter(function(b){return b.id===state.blockId;})[0]||null;
      $("terms").checked=false;updatePaymentControls();
      renderBlocks(blocks);updateSummary();saveDraft();
      var selected=$('blocks').querySelector('[aria-pressed="true"]');if(selected)selected.focus({preventScroll:true});
    });
  });
}

/* ---------- cart / pay ---------- */
function blockLine(){ if(!state.block) return "—"; return state.block.label+" ("+state.block.start+" – "+state.block.end+")"; }
function line(k,v){ return '<div class="sumline"><span class="k">'+esc(k)+'</span><span class="v">'+esc(v)+'</span></div>'; }
function updateContact(){
  var message='Szia! Időpontot szeretnék egyeztetni az Ohana⁶-ba.\nProgram: '+(state.useCase||'egyeztetendő')+'\nDátum: '+(state.date?huDate(state.date):'egyeztetendő')+'\nSáv: '+blockLine()+(state.headcount?'\nLétszám: '+state.headcount+' fő':'');
  D.querySelectorAll('.contact-booking').forEach(function(a){a.href='https://wa.me/36705306514?text='+encodeURIComponent(message);});

}
/* ---------- form ---------- */
["name","email","phone","headcount","notes"].forEach(function(k){ $(k).addEventListener("input",function(){ state[k]=this.value.trim(); $("terms").checked=false;updatePaymentControls(); }); });
function validateForm(){
  // Read the inputs again: browser autofill need not emit an input event.
  ['name','email','phone','headcount','notes'].forEach(function(k){state[k]=$(k).value.trim();});
  var errs=[];
  ['name','email','phone','headcount'].forEach(function(k){$(k).removeAttribute('aria-invalid');});
  function invalid(id,label){errs.push(label);$(id).setAttribute('aria-invalid','true');}
  if(!state.name) invalid("name","a név");
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email)) invalid("email","érvényes email");
  if(state.phone.replace(/\D/g,"").length<9) invalid("phone","telefonszám");
  if(state.headcount){
    if(!/^\d{1,3}$/.test(state.headcount)||+state.headcount<1){ invalid("headcount","érvényes létszám"); }
    else{
      var cap=CAPACITY[state.useCase]||31;
      if(+state.headcount>cap){ $("form-err").innerHTML='<div class="err">'+(state.useCase?'A(z) '+esc(state.useCase)+' maximum '+cap+' főt fogad.':'A terem legfeljebb '+cap+' főt fogad. A pontos létszámhatár a program típusától függ.')+' Válassz kisebb létszámot, vagy írj WhatsAppon: <a href="https://wa.me/36705306514">+36 70 530 6514</a></div>'; $('headcount').setAttribute('aria-invalid','true');$('headcount').focus();return false; }
    }
  }
  if(errs.length){ $("form-err").innerHTML='<div class="err">Kérlek töltsd ki: '+errs.join(", ")+'.</div>';D.querySelector('[aria-invalid="true"]').focus();return false; }
  $("form-err").innerHTML=""; return true;
}

/* ---------- pay ---------- */
function renderPay(){
  updateContact();
  $("pay-summary").innerHTML =
    line("Dátum", state.date?huDate(state.date):"—") +
    line("Sáv", blockLine()) + (state.headcount?line("Létszám", state.headcount+" fő"):"") + line("Név", state.name) + line("Email",state.email) + line("Telefon",state.phone);
  $("pay-total").innerHTML='<span>A sáv díja</span><span>'+fmtFt(state.block?state.block.price:0)+'</span>';
  updateProgramHelp();
  updatePaymentControls();
}
$("terms").addEventListener("change",function(){ updatePaymentControls(); $("terms-wrap").classList.toggle("err-border",!this.checked); });

/* ---------- submit ---------- */
function showResult(kind, ref, detailText, message){
  paymentReturn=true;
  var complete=kind==='test'||kind==='confirmed';
  var waiting=kind==='checking';
  var pending=kind==='pending';
  var conflict=kind==='conflict';
  D.querySelector('.success .big').hidden=!complete;
  $('result-title').textContent=kind==='test'?'A próbafizetés sikeres.':kind==='confirmed'?'A foglalásod rögzítve.':conflict?'A foglalás egyeztetést igényel.':pending?'A foglalás feldolgozás alatt.':waiting?'Fizetés és foglalás ellenőrzése…':'Az eredményt még nem tudjuk ellenőrizni.';
  $('result-copy').textContent=kind==='test'?'Ez csak teszt: nem történt valódi terhelés, és nem foglaltunk le időpontot. Végleges foglaláshoz egyeztess velünk WhatsAppon.':kind==='confirmed'?'A fizetés sikeres, az időpontot lefoglaltuk. Őrizd meg a foglalási azonosítót.':conflict?'A fizetés sikeres, de a foglalást ellenőriznünk kell. Ne fizess újra. Írj nekünk az alábbi azonosítóval; ellenőrizzük a foglalást, és egyeztetjük a következő lépést.':pending?'A fizetés sikeres, a foglalás rögzítése még folyamatban van. Ne fizess újra; ellenőrizd ismét az állapotot, vagy egyeztess velünk az azonosítóval.':waiting?'Várj az ellenőrzésre. Ne indíts új fizetést.':'A fizetés vagy a foglalás állapota nem ismert. Ne indíts új fizetést. Ellenőrizd ismét az állapotot, vagy egyeztess velünk az azonosítóval.';
  $('success-ref').textContent='Azonosító: '+(ref||'—');
  $('success-detail').textContent=detailText||message||'';
  $('result-retry').hidden=complete||conflict||!ref;
  $('result-retry').disabled=waiting;
  $('book-again').hidden=!complete;
  $('book-again').textContent=kind==='test'?'Új próba':'Új foglalás';
  $('panel-success').setAttribute('aria-busy',String(waiting));
  [1,2,3].forEach(function(i){$('panel-'+i).hidden=true;});
  D.querySelectorAll('.step').forEach(function(el){
    el.disabled=true;el.classList.remove('active');el.classList.toggle('done',complete);el.removeAttribute('aria-current');
  });
  var wasHidden=$('panel-success').hidden;
  $('panel-success').hidden=false;
  if(wasHidden)focusHeading('panel-success');
}
function fetchJson(url, options){
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},12000);
  return fetch(url,Object.assign({},options,{signal:controller.signal}))
    .then(function(response){return response.json().then(function(data){return {status:response.status,data:data};});})
    .finally(function(){clearTimeout(timer);});
}
/* Step 3 -> Stripe Checkout (the reservation is created only AFTER successful payment) */
$("submit-booking").addEventListener("click",function(){
  if(paymentReturn||checkoutBusy||!canPay()||!state.blockId||!$("terms").checked||!validateProgram()) return;
  if(!validateForm()){
    showStep(2);
    var invalid=D.querySelector('[aria-invalid="true"]');if(invalid)invalid.focus();
    return;
  }
  checkoutBusy=true;updatePaymentControls();
  var btn=this; btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Átirányítás a fizetéshez…';
  var body={date:state.date, blockId:state.blockId, useCase:state.useCase,
            name:state.name, email:state.email, phone:state.phone, headcount:state.headcount, notes:state.notes, termsAccepted:true, expectedMode:bookingMode};
  // Preserve the attempt across an uncertain network result. Personal form
  // values stay in memory; an edited form starts a distinct checkout attempt.
  var fingerprint=JSON.stringify(body);
  if(!checkoutAttempt||checkoutAttempt.fingerprint!==fingerprint){checkoutAttempt={fingerprint:fingerprint,id:checkoutRequestId()};}
  body.requestId=checkoutAttempt.id;
  try{ sessionStorage.setItem("ohana_booking", JSON.stringify({useCase:state.useCase,date:state.date,range:blockLine(),total:state.block?state.block.price:0})); }catch(e){}
  $("pay-err").textContent="";
  fetchJson("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
    .then(async function(reply){
      var res=reply.data;
      if(res&&(res.code==='mode_changed'||res.code==='booking_unavailable')){
        $('terms').checked=false;
        applyBookingMode({mode:'unavailable',loading:true});
        if(modeController)await modeController.refresh();
        $('pay-err').innerHTML='<div class="err">'+(canPay()?'A fizetési mód megváltozott. Ellenőrizd újra az időpontot, az adataidat és az összeget, majd fogadd el újra a feltételeket. Az új fizetést nem indítottuk el.':'Az online fizetés most nem érhető el. Egyeztess velünk WhatsAppon, vagy ellenőrizd újra a fizetési lehetőséget.')+'</div>';
        focusHeading('panel-3');
        return;
      }
      if(res && res.ok && res.url){ window.location.href=res.url; }
      else if(res&&res.code==='checkout_pending'){throw new Error(bookingMode==='test'?'A próbafizetés indítása még folyamatban van. Az újrapróbálás ugyanezt a próbafizetést ellenőrzi.':'A fizetés indítása még folyamatban van. Az újrapróbálás ugyanezt a fizetést ellenőrzi.');}
      else { throw new Error((res&&res.error)||"A fizetés indítása nem sikerült."); }
    })
    .catch(function(e){
      $("pay-err").innerHTML='<div class="err">'+esc(e.message||"Hiba történt.")+' Próbáld újra, vagy írj WhatsAppon: <a href="https://wa.me/36705306514">+36 70 530 6514</a></div>';
    }).finally(function(){checkoutBusy=false;updatePaymentControls();});
});
/* Initialize before handling payment returns; never overwrite a return result. */
renderCal();showStep(1,true);
if(modeController)modeController.subscribe(applyBookingMode);else applyBookingMode({mode:'unavailable',loading:false});
/* Return from Stripe */
(function(){
  var q=new URLSearchParams(location.search);
  if(q.get("canceled")){
    var draft=null;try{draft=JSON.parse(sessionStorage.getItem('ohana_booking_draft')||'null');}catch(e){}
    if(draft&&typeof draft==='object'){
      state.useCase=Object.prototype.hasOwnProperty.call(CAPACITY,draft.useCase)?draft.useCase:null;
      $('usecase').value=state.useCase||'';updateProgramHelp();showStep(1);
      if(validDateKey(draft.date)&&draft.date>=todayKey){var parts=draft.date.split('-').map(Number);cur={y:parts[0],m:parts[1]-1};selectDate(draft.date,draft.blockId);}
    }
    var notice=D.createElement('p');notice.className='err';notice.setAttribute('role','status');notice.textContent='A fizetést megszakítottad. Nem jött létre foglalás. Ellenőrizd újra az időpontot; az elérhetőségi adatokat ismét meg kell adnod.';
    $('panel-'+step).prepend(notice);
    return;
  }
  var sid=q.get('session_id');
  if(q.get('paid')&&!sid){showResult('unknown',null,'Hiányzik a fizetési azonosító. Egyeztess velünk az ellenőrzéshez.');return;}
  if(q.get('paid') && sid){
    var saved=null;try{saved=JSON.parse(sessionStorage.getItem('ohana_booking')||'null');}catch(e){}
    var running=false;
    var maxAttempts=4;
    function detail(res){
      if(saved&&validDateKey(saved.date)&&typeof saved.range==='string'&&Number.isFinite(saved.total)){
        var price=Number.isFinite(res.totalPrice)?res.totalPrice:saved.total;
        return saved.useCase+' · '+huDate(saved.date)+' · '+saved.range+' · '+fmtFt(price);
      }
      return '';
    }
    async function checkPayment(){
      if(running)return;
      running=true;
      var lastPending=false,lastError='';
      try{
        for(var attempt=0;attempt<maxAttempts;attempt++){
          showResult('checking',sid,'Automatikus ellenőrzés: '+(attempt+1)+' / '+maxAttempts);
          try{
            var reply=await fetchJson('/api/finalize?session_id='+encodeURIComponent(sid));
            var res=reply.data;
            if(res&&res.ok&&res.referenceNumber){
              if(res.testMode===true&&res.simulated===true){showResult('test',res.referenceNumber,detail(res));}
              else if(res.paid===true&&!res.testMode){showResult('confirmed',res.referenceNumber,detail(res));}
              else{showResult('unknown',sid,'A szerver válasza nem igazolta a foglalást.');return;}
              try{sessionStorage.removeItem('ohana_booking');sessionStorage.removeItem('ohana_booking_draft');}catch(e){}
              return;
            }
            if(res&&res.paid&&(res.code==='slot_conflict'||res.reviewRequired===true)){
              showResult('conflict',sid,'',res.error);return;
            }
            lastPending=lastPending||!!(res&&res.paid&&res.pending);
            lastError=res&&res.error||'';
            if(!lastPending&&reply.status<500&&reply.status!==202){
              showResult('unknown',sid,'',lastError);return;
            }
          }catch(e){lastError='A kapcsolat megszakadt. Az állapot ismét ellenőrizhető.';}
          if(attempt<maxAttempts-1){await new Promise(function(resolve){setTimeout(resolve,[1500,3000,6000][attempt]);});}
        }
        showResult(lastPending?'pending':'unknown',sid,'',lastError);
      }finally{running=false;}
    }
    $('result-retry').addEventListener('click',checkPayment);
    checkPayment();
  }

})();
$("book-again").addEventListener("click",function(e){ e.preventDefault(); location.href=location.pathname; });


})();
