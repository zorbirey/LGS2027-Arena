(function(){
'use strict';
var PROFILE_KEY='lgsArenaStudentProfileV20';
var PARENT_KEY='lgsArenaParentPortalV2';
function byId(id){return document.getElementById(id)}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){return {}}}
function saveProfile(name){var old=read(PROFILE_KEY);var p={name:name,createdAt:old.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),storage:'device-demo'};localStorage.setItem(PROFILE_KEY,JSON.stringify(p));var parent=read(PARENT_KEY);parent.studentName=name;localStorage.setItem(PARENT_KEY,JSON.stringify(parent));return p}
function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function addName(name){var chip=byId('studentNameChip');if(!chip){chip=document.createElement('div');chip.id='studentNameChip';chip.className='student-name-chip';var brand=document.querySelector('.brand');if(brand)brand.appendChild(chip)}if(chip)chip.textContent=name}
function enter(name){var gate=byId('cleanStudentGate');if(gate)gate.classList.add('hidden');var cover=byId('cover'),shell=byId('shell');if(cover){cover.classList.remove('active');cover.classList.add('hidden')}if(shell)shell.classList.remove('hidden');addName(name);try{window.dispatchEvent(new CustomEvent('lgsarena:student-enter',{detail:{name:name}}))}catch(e){}}
function ensureGate(){var gate=byId('cleanStudentGate');if(gate)return gate;gate=document.createElement('div');gate.id='cleanStudentGate';gate.className='clean-student-gate hidden';document.body.appendChild(gate);return gate}
function renderGate(){var gate=ensureGate(),p=read(PROFILE_KEY),has=!!String(p.name||'').trim();gate.innerHTML='<section class="clean-student-card" role="dialog" aria-modal="true" aria-label="Öğrenci girişi"><div class="clean-student-mark">⚡</div><span>LGS ARENA</span><h2>'+(has?'Hoş geldin, '+esc(p.name):'Öğrenci Girişi')+'</h2><p>'+(has?'Bu cihazdaki çalışma geçmişinle devam edebilirsin.':'İlerlemenin sana ait olması için öğrenci adını gir.')+'</p>'+(has?'':'<label><span>Öğrenci adı</span><input id="cleanStudentName" maxlength="24" autocomplete="nickname" placeholder="Örn. Kaan"></label>')+'<button id="cleanStudentContinue" class="clean-student-primary">'+(has?'ARENAYA DEVAM ET':'PROFİLİ OLUŞTUR VE DEVAM ET')+'</button><button id="cleanParentOpen" class="clean-student-secondary">VELİ GİRİŞİ</button><button id="cleanStudentCancel" class="clean-student-link">Geri dön</button><small>Demo sürümünde ilerleme bu cihazda saklanır. Merkezi hesap sistemi sonraki altyapı aşamasında bağlanacaktır.</small></section>';
byId('cleanStudentContinue').onclick=function(){var current=read(PROFILE_KEY),name=String(current.name||'').trim();if(!name){var input=byId('cleanStudentName');name=String(input&&input.value||'').trim();if(name.length<2){if(input)input.focus();return}saveProfile(name)}enter(name)};
byId('cleanParentOpen').onclick=function(){gate.classList.add('hidden');if(window.LgsArenaParentPortal&&window.LgsArenaParentPortal.open)window.LgsArenaParentPortal.open()};
byId('cleanStudentCancel').onclick=function(){gate.classList.add('hidden')};
gate.classList.remove('hidden');if(!has)setTimeout(function(){var i=byId('cleanStudentName');if(i)i.focus()},60)}
function bind(){var b=byId('skipCover');if(!b)return;b.onclick=function(e){if(e)e.preventDefault();renderGate()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.LgsArenaEntry={open:renderGate,enter:enter,get:function(){return read(PROFILE_KEY)}};
})();
