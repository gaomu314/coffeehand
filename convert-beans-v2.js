// 合并生成 beans.js（v2）：调研文件为文本唯一来源，legacy 只贡献 sources；未覆盖 id 才回退 legacy
const fs = require("fs");
const path = __dirname;

function readBeans(file) {
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return data.beans || [];
}

function loadLegacy() {
  const src = fs.readFileSync(path + "/beans.js", "utf8");
  const fn = new Function(src + "\nreturn BEANS;");
  return fn();
}

const AXIS = { sour: "sour", sweet: "sweet", bitter: "bitter", floral: "floral", aroma: "aroma", fragrant: "aroma", 酸: "sour", 甜: "sweet", 苦: "bitter", 香: "aroma", 花: "floral" };
const LIKE = { sour: "酸", sweet: "甜", bitter: "苦", floral: "花香", aroma: "香" };

function normalize(b) {
  b.axis = AXIS[b.axis] || "aroma";
  if (Array.isArray(b.like)) b.like = b.like.map(t => LIKE[t] || t).join("、");
  if (typeof b.like !== "string" || !b.like) b.like = (b.flavors || []).slice(0, 2).join("、");
  const secs = ["origin", "science", "history", "brew", "culture", "market"];
  b.sections = b.sections || {};
  secs.forEach(k => { if (typeof b.sections[k] !== "string") b.sections[k] = ""; });
  b.sources = Array.isArray(b.sources) ? b.sources : [];
  b.confidence = b.confidence || "中";
  b.flavors = Array.isArray(b.flavors) ? b.flavors : [];
  b.similar = Array.isArray(b.similar) ? b.similar : [];
  return b;
}

function mergeSources(a, b) {
  const seen = new Set(a.sources.map(s => s.url));
  (b.sources || []).forEach(s => { if (s && s.url && !seen.has(s.url)) { seen.add(s.url); a.sources.push(s); } });
}

// 1) legacy 仅作为来源库与未覆盖回退
const legacyMap = new Map();
loadLegacy().forEach(b => { if (b.id) legacyMap.set(b.id, b); });

// 2) 调研文件按优先级依次覆盖：upgrade(12) → asia(6) → afam(12)
const map = new Map();
const researchIds = new Set();

readBeans(path + "/research-beans-upgrade.json").forEach(b => {
  if (!b.id) return;
  researchIds.add(b.id);
  map.set(b.id, normalize(b));
});
readBeans(path + "/research-beans-asia.json").forEach(b => {
  if (!b.id) return;
  researchIds.add(b.id);
  map.set(b.id, normalize(b));
});
readBeans(path + "/research-beans-afam.json").forEach(b => {
  if (!b.id) return;
  researchIds.add(b.id);
  map.set(b.id, normalize(b));
});

// 3) legacy 未覆盖的 id 回退整条
legacyMap.forEach((b, id) => { if (!map.has(id)) map.set(id, normalize(b)); });

// 4) 所有条目并入 legacy sources（按 url 去重）
map.forEach((b, id) => {
  const leg = legacyMap.get(id);
  if (leg) mergeSources(b, leg);
});

const beans = [...map.values()];
fs.writeFileSync(path + "/beans.js", "// 咖手 · 豆子百科数据库（自动生成，勿手改）\nconst BEANS = " + JSON.stringify(beans, null, 2) + ";\n");
console.log(JSON.stringify({ total: beans.length, ids: beans.map(b => b.id), confidence: beans.reduce((m, b) => { m[b.confidence] = (m[b.confidence] || 0) + 1; return m; }, {}) }, null, 2));
