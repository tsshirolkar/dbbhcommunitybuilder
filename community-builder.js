/* dBBH Community Builder: self-contained module (no login; a profile is created on the device).
   Standalone:  CBuilder.init()                       (reads window.CB_CONFIG)
   Integrated:  CBuilder.init({mount:'#cb-root', client: sb, heading:false})  (reuse the host site's Supabase client) */
(function(w){
'use strict';
var INTERESTS=['Venture Capital','Investment Banking','Private Equity','Insurance','Pharmaceuticals','Biotech','Clinical','Research','Drug Design','Wearables/Technology','Telehealth','Medical Devices','Consulting','Health Policy'];
var CLASSES=[2027,2028,2029,2030];
var BLOCK=['idiot','stupid','hate','dumb'];
var F=['name','duke_email','class_year','major','minor','certificates','phone','three_words','dream_role','ask_me','fix_problem','bio'];
var ML={name:80,duke_email:120,phone:20,major:120,minor:120,certificates:200,three_words:80,dream_role:120,ask_me:200,fix_problem:300};
var S={token:null,loaded:false,me:null,dir:[],liked:{},matches:[],cls:0,fint:[],pint:[],view:'browse',msg:null,draft:null,busy:false};
var sb=null,root=null,cfg={},KEY='cb_token';

function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function tg(a,v){var k=a.indexOf(v);if(k>-1)a.splice(k,1);else a.push(v)}
function chip(label,on,a,v){return '<button type="button" class="cb-chip'+(on?' on':'')+'" data-a="'+a+'" data-v="'+esc(v)+'">'+esc(label)+'</button>'}
function getTok(){try{return localStorage.getItem(KEY)}catch(e){return null}}
function setTok(t){try{if(t)localStorage.setItem(KEY,t);else localStorage.removeItem(KEY)}catch(e){}}
function reset(){S.token=null;S.me=null;S.dir=[];S.matches=[];S.liked={};S.draft=null;S.view='browse';S.pint=[]}
function grab(){if(!$('cb-f'))return;S.draft=S.draft||{};F.forEach(function(k){var e=$('cb-'+k);if(e)S.draft[k]=e.value});var g=$('cb-agree');if(g)S.draft.agree=g.checked}
function fv(k){var d=S.draft;if(d&&d[k]!=null)return d[k];var m=S.me;if(m&&m[k]!=null)return m[k];return ''}
function shared(m){var mine=S.me?S.me.interests||[]:[];return (m.interests||[]).filter(function(x){return mine.indexOf(x)>-1})}
function sim(m){var a=(m.interests||[]).length,b=S.me?(S.me.interests||[]).length:0,s=shared(m).length;return [s,s/((a+b-s)||1)]}
function say(t,bad){S.msg={t:t,bad:bad?1:0};draw()}
function msg(){return '<div class="cb-msg'+(S.msg.bad?' bad':'')+'">'+esc(S.msg.t)+'</div>'}

/* ---------- drawing ---------- */
function draw(){
  if(!root)return;
  var h=cfg.heading===false?'':'<div class="cb-eyebrow">dBBH members</div><h1 class="cb-hed">Community <i>Builder</i></h1>';
  if(!sb){root.innerHTML=h+'<div class="cb-card"><div class="cb-empty"><b>Directory unavailable</b><br>The member database could not be loaded. Check config.js and your connection, then refresh.</div></div>';return}
  if(S.token&&!S.loaded){root.innerHTML=h+'<div class="cb-card"><div class="cb-empty">Loading…</div></div>';return}
  if(!S.me)S.view='profile';
  if(S.me){
    h+='<div class="cb-tabs">'+[['browse','Browse'],['matches','Matches'+(S.matches.length?' ('+S.matches.length+')':'')],['profile','My profile']].map(function(t){return chip(t[1],S.view===t[0],'view',t[0])}).join('')+'</div>';
  }else{
    h+='<p class="cb-p">Create your profile to join the community and see other members. There is no account or password in this test version.</p>';
  }
  if(S.msg)h+=msg();
  root.innerHTML=h+(S.view==='browse'?browse():S.view==='matches'?matchesView():profileView());
}
function browse(){
  var h='<p class="cb-p">Members with the most professional interests in common with you show up first. Choose “Let’s Chat!” and, if they choose it too, you both get each other’s Duke email and phone number.</p>';
  h+='<div class="cb-chips">'+chip('All classes',!S.cls,'cls',0)+CLASSES.map(function(c){return chip('Class of '+c,S.cls===c,'cls',c)}).join('')+'</div>';
  h+='<div class="cb-chips">'+INTERESTS.map(function(i){return chip(i,S.fint.indexOf(i)>-1,'fint',i)}).join('')+'</div>';
  var d=S.dir.filter(function(m){return (!S.cls||m.class_year===S.cls)&&(!S.fint.length||(m.interests||[]).some(function(x){return S.fint.indexOf(x)>-1}))});
  d.sort(function(a,b){var x=sim(a),y=sim(b);return y[0]-x[0]||y[1]-x[1]||String(a.name).localeCompare(b.name)});
  return h+(d.length?d.map(card).join(''):'<div class="cb-card"><div class="cb-empty"><b>No members match yet</b><br>Try clearing a filter, or check back as more members join.</div></div>');
}
function card(m){
  var sh=shared(m),isM=S.matches.some(function(x){return x.id===m.id}),sent=S.liked[m.id];
  var ed=[m.major?'Major: '+m.major:'',m.minor?'Minor: '+m.minor:'',m.certificates?'Certificates: '+m.certificates:''].filter(Boolean).join(' · ');
  var btn=isM?'<button class="cb-btn pale" disabled>Matched ✓ See Matches</button>':sent?'<button class="cb-btn pale" disabled>Request sent</button>':'<button class="cb-btn" data-a="chat" data-v="'+esc(m.id)+'">Let’s Chat!</button>';
  return '<div class="cb-card"><div class="cb-top"><div><div class="cb-nm">'+esc(m.name)+'</div><div class="cb-meta">Class of '+esc(m.class_year)+(ed?' · '+esc(ed):'')+'</div></div>'+(sh.length?'<span class="cb-badge">Suggested for you · '+sh.length+' in common</span>':'')+'</div>'
  +'<div style="margin-top:8px">'+(m.interests||[]).map(function(x){return '<span class="cb-tag'+(sh.indexOf(x)>-1?' sh':'')+'">'+esc(x)+'</span>'}).join('')+'</div>'
  +(m.three_words?'<div class="cb-q">Why I joined dBBH in 3 words</div><div class="cb-a">'+esc(m.three_words)+'</div>':'')
  +(m.dream_role?'<div class="cb-q">Dream role</div><div class="cb-a">'+esc(m.dream_role)+'</div>':'')
  +(m.ask_me?'<div class="cb-q">Ask me about…</div><div class="cb-a">'+esc(m.ask_me)+'</div>':'')
  +(m.fix_problem?'<div class="cb-q">If I could fix one problem in the healthcare economy, I would…</div><div class="cb-a">'+esc(m.fix_problem)+'</div>':'')
  +(m.bio?'<div class="cb-q">Bio</div><div class="cb-a">'+esc(m.bio)+'</div>':'')
  +'<div>'+btn+'</div></div>';
}
function matchesView(){
  if(!S.matches.length)return '<div class="cb-card"><div class="cb-empty"><b>No matches yet</b><br>Choose “Let’s Chat!” on a few profiles. A match appears here once they choose it on you too.</div></div>';
  return '<p class="cb-p">These members chose “Let’s Chat!” on you too. Reach out by email or text.</p>'+S.matches.map(function(m){return '<div class="cb-card"><div class="cb-nm">'+esc(m.name)+'</div><div class="cb-meta">Class of '+esc(m.class_year)+' · '+esc(m.major)+'</div><div class="cb-ct"><span>Duke email: <a href="mailto:'+esc(m.duke_email)+'">'+esc(m.duke_email)+'</a></span><span>Phone: <a href="tel:'+esc(m.phone)+'">'+esc(m.phone)+'</a></span></div></div>'}).join('');
}
function profileView(){
  function inp(k,l,ph,type,dis){return '<div><label class="cb-l">'+l+'</label><input class="cb-in" id="cb-'+k+'" type="'+(type||'text')+'" value="'+esc(fv(k))+'" placeholder="'+esc(ph||'')+'"'+(ML[k]?' maxlength="'+ML[k]+'"':'')+(dis?' disabled':'')+'></div>'}
  var cy=String(fv('class_year')),opts='<option value="">Select</option>'+CLASSES.map(function(c){return '<option'+(String(c)===cy?' selected':'')+'>'+c+'</option>'}).join('');
  var agree=S.draft&&S.draft.agree!=null?S.draft.agree:!!S.me;
  return '<div class="cb-card" id="cb-f"><p class="cb-p" style="margin-bottom:6px">'+(S.me?'Update this anytime.':'Tell us about you.')+' Your interests decide who is suggested to you, and you to them.</p><div class="cb-grid">'
  +inp('name','Name')+'<div><label class="cb-l">Class year</label><select class="cb-in" id="cb-class_year">'+opts+'</select></div>'
  +inp('major','Major')+inp('minor','Minor','Optional')+inp('certificates','Certificates','Optional')
  +inp('duke_email','Duke email','netid@duke.edu','email',!!S.me)
  +inp('phone','Phone number','Shared only after a match','tel')+'</div>'
  +'<label class="cb-l">Professional interests ('+S.pint.length+' selected)</label><div class="cb-chips">'+INTERESTS.map(function(i){return chip(i,S.pint.indexOf(i)>-1,'pint',i)}).join('')+'</div>'
  +'<div class="cb-grid">'+inp('three_words','Why I joined dBBH in 3 words','e.g. curious, collaborative, driven')+inp('dream_role','Dream role in healthcare')+inp('ask_me','Ask me about…','e.g. hobbies')+inp('fix_problem','If I could fix one problem in the healthcare economy, I would…')+'</div>'
  +'<label class="cb-l">Short bio</label><textarea class="cb-in" id="cb-bio" rows="3" maxlength="600">'+esc(fv('bio'))+'</textarea>'
  +'<label class="cb-agree"><input type="checkbox" id="cb-agree"'+(agree?' checked':'')+'><span>I understand my Duke email and phone number are shared only with members I match with, and the rest of my profile is visible to everyone who uses this site.</span></label>'
  +'<button class="cb-btn" data-a="save"'+(S.busy?' disabled':'')+'>'+(S.me?'Save profile':'Create my profile')+'</button>'
  +(S.me?' <button class="cb-btn pale" data-a="del">Delete my profile</button><div class="cb-note">Your profile is saved to this browser. If you clear your browser data or switch devices, you will need to create it again.</div>':'')+'</div>';
}

/* ---------- data (every read and write goes through database functions) ---------- */
async function load(mode){
  if(!S.token){S.loaded=true;draw();return}
  var r=await sb.rpc('cb_overview',{p_token:S.token});
  S.loaded=true;
  if(r.error){
    if(/not logged in/i.test(r.error.message)){setTok(null);reset();S.loaded=true;S.msg={bad:1,t:'Your saved profile was not found. Please create it again.'}}
    else S.msg={bad:1,t:'Setup problem: '+r.error.message+'. Make sure setup.sql was run in Supabase.'};
    draw();return}
  var d=r.data||{};
  S.dir=d.directory||[];S.liked={};(d.requested||[]).forEach(function(x){S.liked[x]=1});S.matches=d.matches||[];
  if(mode==='full'||!S.me){S.me=d.profile||null;S.pint=S.me?(S.me.interests||[]).slice():S.pint;S.msg=null}
  draw();
}
var A={
  view:function(v){grab();S.view=v;S.msg=null;draw();if(v!=='profile')load('soft')},
  cls:function(v){S.cls=+v;draw()},
  fint:function(v){tg(S.fint,v);draw()},
  pint:function(v){grab();tg(S.pint,v);draw()},
  chat:async function(id){
    var r=await sb.rpc('cb_request_chat',{p_token:S.token,p_to:id});
    if(r.error)return say(r.error.message,1);
    S.liked[id]=1;await load('soft');
    say(r.data&&r.data.matched?'It’s a match! Their Duke email and phone are under Matches.':'Request sent. If they choose Let’s Chat! too, you’ll both get each other’s contact info.');
  },
  save:async function(){
    grab();var d=S.draft||{},t=function(k){return String(d[k]!=null?d[k]:fv(k)).trim()};
    var f={name:t('name'),duke_email:t('duke_email').toLowerCase(),phone:t('phone'),class_year:+t('class_year')||null,major:t('major'),minor:t('minor'),certificates:t('certificates'),interests:S.pint.slice(),three_words:t('three_words'),dream_role:t('dream_role'),ask_me:t('ask_me'),fix_problem:t('fix_problem'),bio:t('bio')};
    var all=[f.name,f.major,f.minor,f.certificates,f.three_words,f.dream_role,f.ask_me,f.fix_problem,f.bio].join(' ').toLowerCase();
    var bad=BLOCK.filter(function(x){return all.indexOf(x)>-1});
    if(!f.name||!f.class_year||!f.major||!f.phone)return say('Name, class year, major and phone number are required.',1);
    if(!S.me&&!/^[a-z0-9._-]+@duke\.edu$/i.test(f.duke_email))return say('Please use your @duke.edu email.',1);
    if(!(d.agree!=null?d.agree:!!S.me))return say('Please check the box to confirm how your info is shared.',1);
    if(!f.interests.length)return say('Pick at least one professional interest.',1);
    if(bad.length)return say('Please remove: '+bad.join(', '),1);
    S.busy=true;draw();
    var r=await sb.rpc('cb_save_profile',{p_token:S.token,p_data:f});
    S.busy=false;
    if(r.error){
      if(/not logged in/i.test(r.error.message)){setTok(null);var keep=S.draft;reset();S.draft=keep;S.loaded=true;return say('Your saved profile was not found, so a new one will be created. Press the button again.',1)}
      return say(r.error.message,1)}
    if(r.data&&r.data.token){S.token=r.data.token;setTok(S.token)}
    S.draft=null;await load('full');S.view='browse';say('Profile saved.');
  },
  del:async function(){
    if(!w.confirm('Delete your profile and your chat requests? This cannot be undone.'))return;
    var r=await sb.rpc('cb_delete_profile',{p_token:S.token});
    if(r.error)return say(r.error.message,1);
    setTok(null);reset();S.loaded=true;S.msg={t:'Your profile was deleted.'};draw();
  }
};

/* ---------- start ---------- */
function init(opts){
  cfg=Object.assign({},w.CB_CONFIG||{},opts||{});
  root=typeof cfg.mount==='string'?document.querySelector(cfg.mount):(cfg.mount||$('cb-root'));
  if(!root)return;
  sb=cfg.client||(cfg.url&&cfg.key&&w.supabase?w.supabase.createClient(cfg.url,cfg.key):null);
  root.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-a]');if(!b||b.disabled)return;var f=A[b.getAttribute('data-a')];if(f)f(b.getAttribute('data-v'))});
  reset();S.token=sb?getTok():null;S.loaded=!S.token;draw();
  if(sb&&S.token)load('full');
}
w.CBuilder={init:init};
})(window);
