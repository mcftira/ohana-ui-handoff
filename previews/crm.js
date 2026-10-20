/* UI fixture only: invented records with reserved example.com emails. */
(() => {
  'use strict';
  const records = [
    {name:'Minta Anna',email:'anna@example.com',program:'Jóga',status:'Aktív'},
    {name:'Minta Bence',email:'bence@example.com',program:'Csoportfoglalkozás',status:'Aktív'},
    {name:'Minta Csilla',email:'csilla@example.com',program:'Workshop',status:'Új'},
    {name:'Minta Dániel',email:'daniel@example.com',program:'Coaching',status:'Aktív'},
    {name:'Minta Eszter',email:'eszter@example.com',program:'Meditáció',status:'Új'},
    {name:'Minta Ferenc',email:'ferenc@example.com',program:'Beszélgetőkör',status:'Aktív'}
  ];
  const leadView = new URLSearchParams(location.search).get('view')==='leads';
  if (leadView) {
    document.getElementById('workspace-title').textContent='Érdeklődők';
    document.getElementById('new-contact').textContent='+ Új érdeklődő';
    document.querySelectorAll('.navbar-nav li').forEach((li,index)=>{
      li.classList.toggle('active',index===2);
      if(index===2)li.querySelector('a').setAttribute('aria-current','page');
      else li.querySelector('a').removeAttribute('aria-current');
    });
  }
  const node=(tag,text)=>{const item=document.createElement(tag);if(text)item.textContent=text;return item;};
  const dialog=document.getElementById('contact-dialog');
  const openDetails=record=>{
    document.getElementById('contact-title').textContent=record?record.name:'Új kapcsolat — UI-minta';
    const detail=document.getElementById('contact-details');detail.replaceChildren();
    if(record){
      const list=node('dl');
      for(const [key,value] of Object.entries({'Email':record.email,'Program':record.program,'Állapot':record.status})){list.append(node('dt',key),node('dd',value));}
      detail.append(list);
    }
    detail.append(node('p','Ez a párbeszéd csak vizuális minta. A valódi kapcsolat űrlapja és a mentés az EspoCRM alkalmazásban működik.'));
    dialog.showModal();
  };
  const render=()=>{
    const query=document.getElementById('search').value.trim().toLocaleLowerCase('hu');
    const status=document.getElementById('status-filter').value;
    const filtered=records.filter(record=>(!leadView||record.status==='Új')&&(!status||record.status===status)&&Object.values(record).join(' ').toLocaleLowerCase('hu').includes(query));
    const tbody=document.getElementById('contact-list');tbody.replaceChildren();
    for(const record of filtered){
      const row=node('tr'),name=node('td'),button=node('button',record.name);
      button.className='record-link';button.type='button';button.addEventListener('click',()=>openDetails(record));name.append(button);
      const statusCell=node('td'),badge=node('span',record.status);badge.className=`badge${record.status==='Aktív'?' active':''}`;statusCell.append(badge);
      row.append(name,node('td',record.email),node('td',record.program),statusCell);tbody.append(row);
    }
    document.getElementById('empty-state').hidden=filtered.length!==0;
    document.getElementById('result-count').textContent=`${filtered.length} mintarekord`;
  };
  document.getElementById('search').addEventListener('input',render);
  document.getElementById('status-filter').addEventListener('change',render);
  document.getElementById('new-contact').addEventListener('click',()=>openDetails(null));
  document.getElementById('close-contact').addEventListener('click',()=>dialog.close());
  render();
})();
