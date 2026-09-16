// Durable in-app notifications. No browser permission or external delivery.
function bookingEventSnapshot(b){return {day:b.day,time:b.time,status:b.status,participants:b.participants||1,refund:b.refund||0,coach:b.coach,customerId:b.customerId}}
function captureBookingEvents(){
 if(!identity?.eventSnapshots)return;
 for(let b of state.bookings){
  let previous=identity.eventSnapshots[b.id],next=bookingEventSnapshot(b),kind='';
  if(!previous&&b.status==='confirmed')kind='booked';
  else if(previous){
   if(previous.status!==b.status&&b.status==='cancelled')kind='cancelled';
   else if(previous.day!==b.day||previous.time!==b.time)kind='rescheduled';
   else if(previous.refund!==next.refund)kind='refunded';
   else if(previous.participants!==next.participants)kind='participants';
  }
  identity.eventSnapshots[b.id]=next;
  if(!kind)continue;
  let recipients=['coach-'+b.coach,identity.accounts.find(a=>a.customerId===b.customerId)?.id].filter(id=>id&&id!==actorId());
  for(let recipient of recipients)identity.events.push({id:'event-'+(++identity.eventSequence),bookingId:b.id,recipient,kind,category:kind==='booked'?'booking':'changes',before:previous||null,after:next,clientName:identity.customers[b.customerId]?.name||b.clientName||'Client',coachName:coaches[b.coach].name,serviceName:b.serviceName||b.kind,at:Date.now(),read:false});
 }
}
function myNotifications(){return (identity.events||[]).filter(n=>n.recipient===actorId()).slice().reverse()}
function notificationEnabled(n){return state.auth?.role!=='coach'||ownerConfig(state.auth.coachId).notifications[n.category]!==false}
function unreadNotifications(){return myNotifications().filter(n=>!n.read&&notificationEnabled(n))}
function notificationTitle(n){return {booked:'Nouvelle réservation',rescheduled:'Séance déplacée',cancelled:'Séance annulée',refunded:'Remboursement actualisé',participants:'Participants modifiés'}[n.kind]}
function notificationDescription(n){let who=state.auth?.role==='coach'?n.clientName:n.coachName,after=dayLabel(n.after.day)+' à '+n.after.time;return esc(who)+' · '+esc(n.serviceName)+'<br>'+(n.kind==='rescheduled'?'<span class="muted">Avant : '+dayLabel(n.before.day)+' à '+n.before.time+'</span><br><strong>Maintenant : '+after+'</strong>':after)+(n.after.participants>1?'<br>'+n.after.participants+' places':'')+(n.kind==='cancelled'||n.kind==='refunded'?'<br>Remboursement simulé : '+n.after.refund+' €':'')}
function notificationsPage(){let list=myNotifications();return `${pagebar('Notifications')}<div class="section"><h1>Ce qui a changé.</h1><p class="muted space">Vos rendez-vous, à jour.</p>${list.some(n=>!n.read)?'<button class="textbtn space" data-action="notifications-read">Tout marquer comme lu</button>':''}${list.length?list.map(n=>`<article class="booking-row"><div class="row between"><h2 style="font-size:18px">${notificationTitle(n)}</h2><span class="badge">${n.read?'Lu':notificationEnabled(n)?'Nouveau':'Silencieux'}</span></div><p class="space">${notificationDescription(n)}</p><button class="pill light full space" data-action="notification-open" data-id="${n.id}">Voir la séance</button></article>`).join(''):'<div class="note space">Tout est à jour. Les prochaines réservations, modifications et annulations apparaîtront ici.</div>'}<p class="small muted space">Historique conservé dans ce navigateur. Aucun e-mail ni notification push n’est envoyé.${state.auth?.role==='coach'?' Vos réglages contrôlent les compteurs et les alertes dans l’agenda ; les événements restent consultables ici.':''}</p></div>`}
function notificationButton(){let n=unreadNotifications().length;return `<button class="textbtn" style="color:inherit" data-action="notifications" aria-label="Notifications${n?' · '+n+' non lues':''}">Notifications${n?' · '+n:''}</button>`}
function notificationBanner(){let unread=unreadNotifications(),n=unread[0];return n?`<section class="note subhead" aria-label="Dernière notification"><div class="row between"><strong>${notificationTitle(n)}</strong><span class="badge">${unread.length} non lue${unread.length>1?'s':''}</span></div><p style="margin-top:8px">${notificationDescription(n)}</p><button class="textbtn" data-action="notification-open" data-id="${n.id}">Voir la séance</button>${unread.length>1?'<button class="textbtn" style="margin-left:16px" data-action="notifications">Tout voir</button>':''}</section>`:''}
