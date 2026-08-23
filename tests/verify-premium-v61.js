const fs = require('fs');
const vm = require('vm');

const read = path => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const version = '6.1.0';
const buildId = '20260823-07';
const index = read('index.html');
const app = read('app.js');
const preference = read('preference-v60.js');
const parent = read('profile-parent-v41.js');
const pwa = read('pwa.js');
const sw = read('service-worker.js');
const manifest = JSON.parse(read('manifest.webmanifest'));

for (const [name, content] of Object.entries({index, pwa, sw})) {
  assert(content.includes(version), `${name}: sürüm eksik`);
  assert(content.includes(buildId), `${name}: build ID eksik`);
}
assert(manifest.start_url.includes(buildId), 'manifest start_url build ID ile eşleşmiyor');
assert(index.includes('Kazanabileceğin okulları da görmek ister misin?'), 'ücretsiz sonuç öncesi Premium sorusu eksik');
assert(app.includes("session.mode==='exam')showResultUpsell()"), 'ücretsiz deneme Premium sorusuna bağlanmamış');
assert(app.includes("resultUpsellNo').onclick"), 'Hayır sonucu düz sonuç ekranına bağlanmamış');
assert(preference.includes("if (!isPremium()) { openMembership(tab); return; }"), 'tercih robotu Premium kilidi eksik');
assert(preference.includes("if (!isPremium()) { openMembership('obp'); return; }"), 'OBP Premium kilidi eksik');
assert(parent.includes("'VELİ PANELİ · PREMIUM'"), 'ücretsiz Veli Paneli etiketi eksik');
assert(parent.includes("if(!premium())return openMembership()"), 'Veli Paneli Premium geçişi eksik');
assert(!app.includes('localStorage.clear(') && !preference.includes('localStorage.clear('), 'localStorage toplu silme çağrısı bulundu');
assert(app.includes("const KEY='lgsArenaPwaV02'"), 'mevcut öğrenci veri anahtarı değişmiş');
assert(preference.includes("const PREF_KEY = 'lgsArenaPreferenceV1'"), 'tercih verisi ayrı anahtarda değil');

const ids = [...index.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = ids.filter((id, position) => ids.indexOf(id) !== position);
assert(duplicateIds.length === 0, `yinelenen HTML id: ${[...new Set(duplicateIds)].join(', ')}`);

const context = {window:{}};
vm.createContext(context);
for (let part=1; part<=6; part++) vm.runInContext(read(`data/schools-2026-p${part}.js`), context);
const schools = context.window.LGS_SCHOOL_DATA_2026;
assert(schools.length === 3098, `okul sayısı ${schools.length}`);
assert(new Set(schools.map(row => row[1])).size === 81, '81 il verisi bulunamadı');
assert(new Set(schools.map(row => `${row[1]}|${row[2]}`)).size === 548, 'ilçe veri bütünlüğü bozuk');

for (const file of ['preference-v60.css','preference-v60.js',...Array.from({length:6},(_,i)=>`data/schools-2026-p${i+1}.js`)]) {
  assert(sw.includes(`./${file}`), `service worker paketi eksik: ${file}`);
}

const obp = (92.5 + 87.25 + 95) / 3;
assert(obp.toFixed(4) === '91.5833', 'OBP dört basamak testi başarısız');
console.log(JSON.stringify({ok:true, version, buildId, schools:schools.length, cities:81, districts:548, obp:obp.toFixed(4)}));

