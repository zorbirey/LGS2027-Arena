'use strict';
const fs=require('fs'),assert=require('assert');
const index=fs.readFileSync('index.html','utf8'),plans=fs.readFileSync('plans-v80.js','utf8'),profile=fs.readFileSync('profile-parent-v41.js','utf8'),core=fs.readFileSync('arena-core-v1.js','utf8');
for(const plan of ['free','premium','pro','pro_plus'])assert.match(core,new RegExp(plan));
for(const feature of ['smartNotes','wrongbook','parentTracking','preferenceRobot','manualTransfer','aiTeacher','photoSolve','secureSync','humanCoach'])assert.match(core,new RegExp(feature));
assert.match(index,/Arena Pro\+/);assert.match(index,/DÖRT KADEMELİ/);assert.match(plans,/ARENA_DEVICE_TRANSFER|LGS_ARENA_DEVICE_TRANSFER/);assert.match(profile,/verifiedByServer/);assert.match(profile,/freePremiumVerifiedByServer/);console.log('LGS plan standard OK');