(function(){
'use strict';
function byId(id){return document.getElementById(id)}
function enterArena(){
  var gate=byId('cleanStudentGate');
  if(gate)gate.classList.add('hidden');
  var cover=byId('cover'),shell=byId('shell');
  if(cover){cover.classList.remove('active');cover.classList.add('hidden')}
  if(shell)shell.classList.remove('hidden');
  try{
    if(window.LgsArenaCore&&typeof window.LgsArenaCore.showPage==='function')window.LgsArenaCore.showPage('arena');
    else setTimeout(function(){try{if(window.LgsArenaCore&&window.LgsArenaCore.showPage)window.LgsArenaCore.showPage('arena')}catch(e){}},250);
  }catch(e){}
  try{window.dispatchEvent(new CustomEvent('lgsarena:student-enter',{detail:{name:''}}))}catch(e){}
}
function bind(){
  var b=byId('skipCover');
  if(!b)return;
  b.textContent='ARENAYA GİR';
  b.onclick=function(e){if(e)e.preventDefault();enterArena()};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.LgsArenaEntry={open:enterArena,enter:enterArena,get:function(){return {name:''}}};
})();
