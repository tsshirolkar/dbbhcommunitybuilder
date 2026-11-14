/* Prototype backend: behaves like the Supabase cb_ functions, but stores everything in the browser (localStorage).
   Same names, same arguments, same return shapes, so community-builder.js cannot tell the difference. */
(function(w){
'use strict';
var K='cb_local_db_v1';
var SEED=[
['Maya Chen',2027,'Biology','Public Policy','Healthcare Management','Venture Capital,Biotech,Health Policy','curious, driven, collaborative','Healthcare venture investor','Hiking, board games','Drug pricing is opaque and patients pay for it.','Pre-med exploring the business side of biotech.',1],
['Jordan Williams',2028,'Economics','Computer Science','','Private Equity,Investment Banking,Wearables/Technology','ambitious, analytical, social','Healthcare PE associate','Basketball, cooking','Hospital billing is far too complicated.','Interested in how deals shape hospital systems.',1],
['Priya Natarajan',2027,'Neuroscience','Global Health','','Clinical,Research,Health Policy','compassionate, inquisitive, determined','Physician-scientist','Classical dance, coffee','Rural patients wait too long for specialist care.','Research assistant and future MD/PhD applicant.',1],
['Ethan Brooks',2029,'Public Policy','Economics','','Consulting,Insurance,Health Policy','policy, systems, impact','Health policy consultant','Running, podcasts','Insurance denials leave patients stuck.','Wants to understand why care costs what it does.',1],
['Sofia Alvarez',2028,'Biomedical Engineering','','Medical Device Design','Medical Devices,Biotech,Wearables/Technology','creative, hands-on, curious','Medical device founder','3D printing, soccer','Good devices never reach low-income clinics.','Building a low-cost diagnostic prototype.',0],
['Daniel Okafor',2030,'Chemistry','Economics','','Pharmaceuticals,Drug Design,Venture Capital','focused, nerdy, kind','Pharma business development','Chess, film','Generic drugs are not always easy to get.','First year, still deciding between lab and business.',0],
['Hannah Kim',2029,'Statistics','Biology','','Telehealth,Research,Consulting','data, access, growth','Digital health product lead','Photography, tennis','Telehealth leaves some patients behind.','Likes turning messy data into clear stories.',0],
['Marcus Reid',2027,'Global Health','Business Admin','','Investment Banking,Insurance,Private Equity','driven, steady, funny','Healthcare investment banker','Football, travel','Rising costs squeeze small practices.','Interning in healthcare finance this summer.',0]];
function load(){try{var d=JSON.parse(localStorage.getItem(K));if(d&&d.people)return d}catch(e){}return seed()}
function save(d){try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}}
function seed(){var d={people:SEED.map(function(r,i){return{id:'demo-'+(i+1),token:null,demo:1,likes_back:r[11],
 name:r[0],class_year:r[1],major:r[2],minor:r[3]||null,certificates:r[4]||null,interests:r[5].split(','),three_words:r[6],dream_role:r[7],ask_me:r[8],fix_problem:r[9],bio:r[10],
 duke_email:'demo'+(i+1)+'@duke.edu',phone:'919-555-010'+(i+1)}}),chats:[]};save(d);return d}
function rnd(){var a=new Uint8Array(16);(w.crypto||{getRandomValues:function(x){for(var i=0;i<x.length;i++)x[i]=Math.random()*256}}).getRandomValues(a);return Array.prototype.map.call(a,function(b){return('0'+b.toString(16)).slice(-2)}).join('')}
function err(m){return{data:null,error:{message:m}}}
function ok(x){return{data:x,error:null}}
function who(d,t){return d.people.filter(function(p){return t&&p.token===t})[0]}
function pub(m){return{id:m.id,name:m.name,class_year:m.class_year,major:m.major,minor:m.minor,certificates:m.certificates,interests:m.interests,three_words:m.three_words,dream_role:m.dream_role,ask_me:m.ask_me,fix_problem:m.fix_problem,bio:m.bio}}
function has(d,a,b){return d.chats.some(function(c){return c.from_id===a&&c.to_id===b})}
var FN={
cb_overview:function(a){var d=load(),me=who(d,a.p_token);if(!me)return err('Not logged in');
 var self=JSON.parse(JSON.stringify(me));delete self.token;delete self.demo;delete self.likes_back;
 return ok({profile:self,
  directory:d.people.filter(function(m){return m.id!==me.id}).map(pub),
  requested:d.chats.filter(function(c){return c.from_id===me.id}).map(function(c){return c.to_id}),
  matches:d.people.filter(function(m){return m.id!==me.id&&has(d,me.id,m.id)&&has(d,m.id,me.id)}).map(function(m){var o=pub(m);o.duke_email=m.duke_email;o.phone=m.phone;return o})})},
cb_save_profile:function(a){var d=load(),p=a.p_data||{},me=who(d,a.p_token),em=String(p.duke_email||'').trim().toLowerCase(),
 ints=Array.isArray(p.interests)?p.interests:[],T=function(k){return String(p[k]==null?'':p[k]).trim()},N=function(k){return T(k)||null};
 if(!T('name')||!T('major')||!T('phone'))return err('Name, major and phone number are required.');
 if([2027,2028,2029,2030].indexOf(+p.class_year)<0)return err('Pick your class year.');
 if(ints.length<1||ints.length>14)return err('Pick between 1 and 14 professional interests.');
 var f={name:T('name'),phone:T('phone'),class_year:+p.class_year,major:T('major'),minor:N('minor'),certificates:N('certificates'),interests:ints,three_words:N('three_words'),dream_role:N('dream_role'),ask_me:N('ask_me'),fix_problem:N('fix_problem'),bio:N('bio')};
 if(me){Object.assign(me,f);save(d);return ok({token:null})}
 if(!/^[a-z0-9._-]+@duke\.edu$/.test(em))return err('Please use your @duke.edu email.');
 if(d.people.some(function(m){return m.duke_email===em}))return err('A profile with that email already exists in this browser. Use a different email, or choose Reset demo at the top.');
 var n=Object.assign({id:'u-'+rnd(),token:rnd(),duke_email:em},f);d.people.push(n);save(d);return ok({token:n.token})},
cb_request_chat:function(a){var d=load(),me=who(d,a.p_token);if(!me)return err('Not logged in');
 var to=d.people.filter(function(m){return m.id===a.p_to})[0];if(!to||to.id===me.id)return err('That member was not found.');
 if(!has(d,me.id,to.id))d.chats.push({from_id:me.id,to_id:to.id});
 if(to.likes_back&&!has(d,to.id,me.id))d.chats.push({from_id:to.id,to_id:me.id}); /* sample members marked likes_back always chat back, so the match flow can be demoed */
 save(d);return ok({matched:has(d,to.id,me.id)})},
cb_delete_profile:function(a){var d=load(),me=who(d,a.p_token);if(!me)return err('Not logged in');
 d.people=d.people.filter(function(m){return m.id!==me.id});d.chats=d.chats.filter(function(c){return c.from_id!==me.id&&c.to_id!==me.id});save(d);return ok(null)}};
w.CBLocal={
 client:function(){return{rpc:function(name,args){return new Promise(function(res){setTimeout(function(){res(FN[name]?FN[name](args||{}):err('Unknown function '+name))},120)})}}},
 reset:function(){try{localStorage.removeItem(K);localStorage.removeItem('cb_token')}catch(e){}}};
})(window);
