'use strict';
const fs=require('fs'),assert=require('assert');
const app=fs.readFileSync('app.js','utf8'),plans=fs.readFileSync('plans-v80.js','utf8'),pwa=fs.readFileSync('pwa.js','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
assert.match(app,/syncTrustedClock/);assert.match(app,/Europe\/Istanbul/);assert.match(plans,/freePremiumVerifiedByServer===true/);assert.equal((pwa.match(/serviceWorker\.register/g)||[]).length,1);assert.doesNotMatch(pwa,/controllerchange[\s\S]{0,200}location\.reload/);assert.match(sw,/ARENA_SW_READY/);console.log('LGS security/PWA standard OK');