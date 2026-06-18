let currentId = null;
const $ = id => document.getElementById(id);

const modules = [
  ['modTickets','ticketQuestions'],
  ['modBuffet','buffetQuestions'],
  ['modFreeFlow','freeFlowQuestions'],
  ['modCanapes','canapeQuestions']
];

modules.forEach(([check, block]) => {
  $(check).addEventListener('change', () => $(block).classList.toggle('hidden', !$(check).checked));
});

$('newEventBtn').addEventListener('click', newEvent);
document.querySelectorAll('.step').forEach(btn => btn.addEventListener('click', () => goToStep(btn.dataset.step)));
$('canapeRounds').addEventListener('input', () => renderCanapeRoundInputs());
$('foodServiceStyle').addEventListener('change', syncFoodServiceStyle);

function goToStep(step){
  document.querySelectorAll('.step').forEach(b => b.classList.toggle('active', b.dataset.step == step));
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  $('step'+step).classList.add('active');
}

function getEvents(){ return JSON.parse(localStorage.getItem('rodeoEvents') || '[]'); }
function setEvents(events){ localStorage.setItem('rodeoEvents', JSON.stringify(events)); renderEventList(); }

function getRoundTimes(){
  return Array.from(document.querySelectorAll('.canape-round-time')).map(input => input.value);
}

function getCheckedBeverages(){
  return Array.from(document.querySelectorAll('#freeFlowDrinks input[type="checkbox"]:checked')).map(input => input.value);
}

function setCheckedBeverages(values = []){
  document.querySelectorAll('#freeFlowDrinks input[type="checkbox"]').forEach(input => {
    input.checked = values.includes(input.value);
  });
}

function getCheckedBuffetItems(){
  return Array.from(document.querySelectorAll('#buffetMenu input[type="checkbox"]:checked')).map(input => input.value);
}

function setCheckedBuffetItems(values = []){
  document.querySelectorAll('#buffetMenu input[type="checkbox"]').forEach(input => {
    input.checked = values.includes(input.value);
  });
}

function syncFoodServiceStyle(){
  const style = $('foodServiceStyle').value;
  const isBuffet = style === 'Buffet';
  const isCanapes = style === 'Canapés / Finger Food';
  const isALaCarte = style === 'À La Carte (Standard Menu)';

  $('modBuffet').checked = isBuffet;
  $('modCanapes').checked = isCanapes;
  $('buffetQuestions').classList.toggle('hidden', !isBuffet);
  $('canapeQuestions').classList.toggle('hidden', !isCanapes);
  $('aLaCarteQuestions').classList.toggle('hidden', !isALaCarte);
}

function inferFoodServiceStyle(d){
  if(d.foodServiceStyle) return d.foodServiceStyle;
  if(d.modBuffet) return 'Buffet';
  if(d.modCanapes) return 'Canapés / Finger Food';
  return '-';
}

function renderCanapeRoundInputs(existingTimes = []){
  const count = Math.max(0, Number($('canapeRounds').value || 0));
  const container = $('canapeRoundTimes');
  const currentTimes = existingTimes.length ? existingTimes : getRoundTimes();
  container.innerHTML = '';

  for(let i = 1; i <= count; i++){
    const div = document.createElement('div');
    div.className = 'round-time-item';
    const input = document.createElement('input');
    input.type = 'time';
    input.className = 'canape-round-time';
    input.value = currentTimes[i-1] || defaultRoundTime(i);
    div.innerHTML = `<span>Round ${i} time</span>`;
    div.appendChild(input);
    container.appendChild(div);
  }
}

function defaultRoundTime(round){
  const hour = 18 + round;
  return `${String(hour).padStart(2,'0')}:00`;
}

function readForm(){
  const ids = ['eventName','clientName','eventType','eventDate','startTime','endTime','guestCount','contactName','contactEmail','contactPhone','eventLead','foodServiceStyle','ticketsPerGuest','spareTickets','spareWristbands','ticketNotes','buffetLocation','buffetStart','buffetEnd','freeFlowDuration','lastCall','canapeRounds','canapeMenu','aLaCartePayment','aLaCarteBudgetCap','aLaCarteLimitedMenu','aLaCarteNotes','pricePerPerson','minimumSpend','paymentTerms','additionalCharges'];
  const data = {};
  ids.forEach(id => data[id] = $(id).value);
  ['modTickets','modBuffet','modFreeFlow','modCanapes','modRegistration','modDJ'].forEach(id => data[id] = $(id).checked);
  data.canapeRoundTimes = getRoundTimes();
  data.freeFlowDrinks = getCheckedBeverages();
  data.buffetMenu = getCheckedBuffetItems();
  data.planHtml = $('actionPlan').innerHTML;
  return data;
}

function fillForm(data){
  Object.entries(data).forEach(([k,v]) => {
    const el = $(k); if(!el) return;
    if(el.type === 'checkbox') el.checked = !!v; else el.value = v ?? '';
  });
  setCheckedBeverages(data.freeFlowDrinks || []);
  setCheckedBuffetItems(data.buffetMenu || []);
  modules.forEach(([check, block]) => $(block).classList.toggle('hidden', !$(check).checked));
  syncFoodServiceStyle();
  renderCanapeRoundInputs(data.canapeRoundTimes || []);
  $('actionPlan').innerHTML = data.planHtml || '';
}

function newEvent(){
  currentId = Date.now().toString();
  document.querySelectorAll('input, textarea, select').forEach(el => {
    if(el.type === 'checkbox') el.checked = false;
    else if(el.type !== 'time') el.value = '';
  });
  $('eventType').value = 'Corporate Event';
  $('eventLead').value = 'Name 1';
  $('foodServiceStyle').value = '';
  $('aLaCartePayment').value = 'Guests pay individually';
  $('aLaCarteLimitedMenu').value = 'No';
  $('guestCount').value = 50;
  $('startTime').value = '18:00';
  $('endTime').value = '00:00';
  $('ticketsPerGuest').value = 5;
  $('spareTickets').value = 50;
  $('spareWristbands').value = 20;
  $('canapeRounds').value = 3;
  renderCanapeRoundInputs(['19:00','20:00','21:00']);
  $('actionPlan').innerHTML = '';
  modules.forEach(([c,b]) => $(b).classList.add('hidden'));
  $('aLaCarteQuestions').classList.add('hidden');
  goToStep(1);
}

function saveEvent(){
  if(!currentId) currentId = Date.now().toString();
  const events = getEvents();
  const data = readForm(); data.id = currentId; data.updatedAt = new Date().toISOString();
  const idx = events.findIndex(e => e.id === currentId);
  if(idx >= 0) events[idx] = data; else events.unshift(data);
  setEvents(events);
}

function loadEvent(id){
  const event = getEvents().find(e => e.id === id); if(!event) return;
  currentId = id; fillForm(event); goToStep(1);
}

function deleteEvent(id){
  const event = getEvents().find(e => e.id === id);
  const name = event?.eventName || 'this event';
  if(!confirm(`Delete ${name}? This cannot be undone.`)) return;

  const events = getEvents().filter(e => e.id !== id);
  setEvents(events);

  if(currentId === id){
    newEvent();
  }
}

function renderEventList(){
  const list = $('eventList'); list.innerHTML = '';
  const events = getEvents();
  if(!events.length){ list.innerHTML = '<p class="small">No events yet.</p>'; return; }
  events.forEach(e => {
    const div = document.createElement('div'); div.className='event-item'; div.onclick=()=>loadEvent(e.id);
    div.innerHTML = `
      <div class="event-info">
        <strong>${e.eventName || 'Untitled Event'}</strong>
        <span>${e.clientName || 'No client'} · ${e.eventDate || 'No date'}</span>
      </div>
      <button class="delete-event-btn" title="Delete event" aria-label="Delete event">Delete</button>
    `;
    div.querySelector('.delete-event-btn').addEventListener('click', (event) => {
      event.stopPropagation();
      deleteEvent(e.id);
    });
    list.appendChild(div);
  });
}

function timeRow(time, activity){ return `<tr><td>${time || '-'}</td><td>${activity}</td></tr>`; }
function nl(text){ return (text || '').split('\n').filter(Boolean).map(x=>`<li>${x}</li>`).join('') || '<li>-</li>'; }

function generatePlan(){
  saveEvent();
  const d = readForm();
  const guests = Number(d.guestCount || 0);
  const price = Number(d.pricePerPerson || 0);
  const minSpend = Number(d.minimumSpend || 0);
  const ticketTotal = guests * Number(d.ticketsPerGuest || 0);
  const totalTickets = ticketTotal + Number(d.spareTickets || 0);
  const totalWristbands = guests + Number(d.spareWristbands || 0);
  const packageTotal = guests * price;
  const aLaCarteBudgetCap = Number(d.aLaCarteBudgetCap || 0);
  const commercialSubtotal = Math.max(packageTotal, minSpend, aLaCarteBudgetCap);
  const serviceCharge = commercialSubtotal * 0.10;
  const subtotalAfterService = commercialSubtotal + serviceCharge;
  const vat = subtotalAfterService * 0.07;
  const grandTotal = subtotalAfterService + vat;

  let operationalSuggestions = [];
  if(guests >= 150) operationalSuggestions.push('High guest count: assign additional service staff and registration support.');
  if(d.modDJ) operationalSuggestions.push('DJ included: schedule sound check before guest arrival.');
  if(d.modRegistration) operationalSuggestions.push('Registration required: prepare guest list, pens, signage and registration table.');
  if(d.modTickets) operationalSuggestions.push('Ticket/wristband event: prepare counted ticket packs and wristbands before registration opens.');

  let timeline = '';
  timeline += timeRow('15:00','Setup begins / venue preparation');
  if(d.modRegistration) timeline += timeRow(d.startTime,'Registration opens');
  timeline += timeRow(d.startTime,'Event begins');
  if(d.modBuffet) timeline += timeRow(d.buffetStart,'Buffet service begins');
  if(d.modCanapes){
    d.canapeRoundTimes.forEach((t, i) => {
      timeline += timeRow(t, `Canapé round ${i + 1}`);
    });
  }
  if(d.lastCall) timeline += timeRow(d.lastCall,'Last call for free flow / beverage package');
  timeline += timeRow(d.endTime,'Event concludes / reset begins');

  let html = `<h1>Rodeo Tex Mex Event Action Plan</h1>
  <p><strong>${d.eventName || 'Untitled Event'}</strong></p>

  <h2>1. Event Overview</h2>
  <table>
    <tr><th>Client</th><td>${d.clientName || '-'}</td></tr>
    <tr><th>Event Type</th><td>${d.eventType}</td></tr>
    <tr><th>Food Service Style</th><td>${inferFoodServiceStyle(d)}</td></tr>
    <tr><th>Date</th><td>${d.eventDate || '-'}</td></tr>
    <tr><th>Time</th><td>${d.startTime || '-'} - ${d.endTime || '-'}</td></tr>
    <tr><th>Guests</th><td>${guests || '-'}</td></tr>
    <tr><th>Contact Name</th><td>${d.contactName || '-'}</td></tr>
    <tr><th>Contact Email</th><td>${d.contactEmail || '-'}</td></tr>
    <tr><th>Contact Phone Number</th><td>${d.contactPhone || '-'}</td></tr>
    <tr><th>Event Lead</th><td>${d.eventLead || '-'}</td></tr>
  </table>

  <h2>2. Commercial Arrangement</h2>
  <table>
    <tr><th>Package Price / Person</th><td>THB ${price.toLocaleString()}</td></tr>
    <tr><th>Package Total</th><td>THB ${packageTotal.toLocaleString()}</td></tr>
    <tr><th>Minimum / Guaranteed Spend</th><td>THB ${minSpend.toLocaleString()}</td></tr>
    ${aLaCarteBudgetCap ? `<tr><th>À La Carte Budget Cap / Hosted Tab</th><td>THB ${aLaCarteBudgetCap.toLocaleString()}</td></tr>` : ''}
    <tr><th>Subtotal Before Service Charge & VAT</th><td>THB ${commercialSubtotal.toLocaleString(undefined, {maximumFractionDigits: 2})}</td></tr>
    <tr><th>Service Charge 10%</th><td>THB ${serviceCharge.toLocaleString(undefined, {maximumFractionDigits: 2})}</td></tr>
    <tr><th>Subtotal After Service Charge</th><td>THB ${subtotalAfterService.toLocaleString(undefined, {maximumFractionDigits: 2})}</td></tr>
    <tr><th>VAT 7%</th><td>THB ${vat.toLocaleString(undefined, {maximumFractionDigits: 2})}</td></tr>
    <tr><th>Grand Total</th><td><strong>THB ${grandTotal.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong></td></tr>
    <tr><th>Payment Terms</th><td>${d.paymentTerms || '-'}</td></tr>
  </table>
  <p><strong>Additional charges/services:</strong> ${d.additionalCharges || '-'}</p>

  <h2>3. Food & Beverage</h2>`;

  html += `<p><strong>Food Service Style:</strong> ${inferFoodServiceStyle(d)}</p>`;
  if(d.modBuffet) html += `<h3>Buffet</h3><p><strong>Location:</strong> ${d.buffetLocation || '-'}</p><ul>${(d.buffetMenu || []).map(x=>`<li>${x}</li>`).join('') || '<li>-</li>'}</ul>`;
  if(d.foodServiceStyle === 'À La Carte (Standard Menu)') html += `<h3>À La Carte / Standard Menu</h3>
    <table>
      <tr><th>Payment Structure</th><td>${d.aLaCartePayment || '-'}</td></tr>
      <tr><th>Budget Cap / Hosted Tab</th><td>THB ${aLaCarteBudgetCap.toLocaleString()}</td></tr>
      <tr><th>Limited Event Menu Required?</th><td>${d.aLaCarteLimitedMenu || '-'}</td></tr>
    </table>
    <p><strong>Notes:</strong> ${d.aLaCarteNotes || 'Guests will order from the standard Rodeo menu.'}</p>`;
  if(d.foodServiceStyle === 'Set Menu') html += `<h3>Set Menu</h3><p>Set menu details to be added manually.</p>`;
  if(d.foodServiceStyle === 'Sharing Style') html += `<h3>Sharing Style</h3><p>Sharing menu details to be added manually.</p>`;
  if(d.foodServiceStyle === 'No Food') html += `<h3>No Food</h3><p>No food service required for this event.</p>`;
  if(d.modFreeFlow) html += `<h3>Free Flow Drinks</h3><p><strong>Duration:</strong> ${d.freeFlowDuration || '-'}</p><ul>${(d.freeFlowDrinks || []).map(x=>`<li>${x}</li>`).join('') || '<li>-</li>'}</ul>`;
  if(d.modCanapes) html += `<h3>Canapés</h3><p><strong>Rounds:</strong> ${d.canapeRounds || '-'}</p><ul>${nl(d.canapeMenu)}</ul>`;
  if(d.modTickets) html += `<h3>Drink Ticket + Wristband System</h3>
    <table>
      <tr><th>Guest tickets</th><td>${ticketTotal.toLocaleString()} tickets (${guests} guests × ${d.ticketsPerGuest || 0})</td></tr>
      <tr><th>Spare tickets</th><td>${Number(d.spareTickets || 0).toLocaleString()} tickets</td></tr>
      <tr><th>Total tickets to prepare</th><td>${totalTickets.toLocaleString()} tickets</td></tr>
      <tr><th>Guest wristbands</th><td>${guests.toLocaleString()} wristbands, based on guest count</td></tr>
      <tr><th>Spare wristbands</th><td>${Number(d.spareWristbands || 0).toLocaleString()} wristbands</td></tr>
      <tr><th>Total wristbands to prepare</th><td>${totalWristbands.toLocaleString()} wristbands</td></tr>
    </table>
    <p>${d.ticketNotes || 'Each ticket can be redeemed according to the agreed beverage package.'}</p>`;

  html += `<h2>4. Event Timeline</h2><table><tr><th>Time</th><th>Activity</th></tr>${timeline}</table>

  <h2>5. Operational Notes</h2><ul>${operationalSuggestions.map(s=>`<li>${s}</li>`).join('') || '<li>No automatic notes generated.</li>'}</ul>

  <h2>6. Important Contacts</h2><ul>
    <li>Client: ${d.contactName || 'TBC'}${d.contactEmail ? ' / ' + d.contactEmail : ''}${d.contactPhone ? ' / ' + d.contactPhone : ''}</li>
    <li>Rodeo Event Lead: ${d.eventLead || 'TBC'}</li>
    <li>Operations Lead: TBC</li>
    <li>Kitchen Lead: TBC</li>
    <li>Bar Lead: TBC</li>
  </ul>

  <h2>7. Special Notes</h2><p>Add client requests, VIP guests, weather concerns or other notes here.</p>

  <h2>8. Approval & Sign-Off</h2>
  <table>
    <tr><th>Prepared By</th><td></td></tr>
    <tr><th>Reviewed / Approved By</th><td></td></tr>
    <tr><th>Signature</th><td style="height:60px;"></td></tr>
    <tr><th>Date</th><td></td></tr>
  </table>`;

  $('actionPlan').innerHTML = html;
  savePlanEdits();
}

function savePlanEdits(){
  if(!currentId) return;
  const events = getEvents(); const idx = events.findIndex(e => e.id === currentId);
  if(idx >= 0){ events[idx].planHtml = $('actionPlan').innerHTML; setEvents(events); }
}

newEvent(); renderEventList();
