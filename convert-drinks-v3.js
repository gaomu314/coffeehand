// 合并生成 drinks.js：老 24 款 + v3 补充，按 brand+product 去重
const fs = require("fs");
const path = __dirname;

function readDrinks(file) {
  if (!fs.existsSync(file)) return [];
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return Array.isArray(raw) ? raw : (raw.drinks || []);
}

const seen = new Set();
const out = [];
function add(d) {
  if (!d.brand || !d.product) return;
  const key = d.brand + "|" + d.product;
  if (seen.has(key)) return;
  seen.add(key);
  let source = d.source;
  if (typeof source === "string") source = source ? [source] : [];
  if (!Array.isArray(source)) source = [];
  let unpub = d.unpublished;
  if (unpub === true) unpub = "未公开";
  if (unpub === false || unpub === null) unpub = "";
  out.push({
    brand: d.brand,
    product: d.product,
    type: d.type || "",
    beans: d.beans || "未公开",
    flavor: d.flavor || "",
    price_cny: d.price_cny !== undefined ? d.price_cny : "",
    source,
    confidence: d.confidence || "中",
    unpublished: typeof unpub === "string" ? unpub : ""
  });
}

readDrinks(path + "/research-drinks.json").forEach(add);
readDrinks(path + "/research-drinks-v3.json").forEach(add);

fs.writeFileSync(path + "/drinks.js", "// 咖手 · 市售咖啡饮品用豆数据库（自动生成，勿手改）\nwindow.DRINKS = " + JSON.stringify(out, null, 1) + ";\n");
console.log(JSON.stringify({ total: out.length, confidence: out.reduce((m, d) => { m[d.confidence] = (m[d.confidence] || 0) + 1; return m; }, {}), unpublished: out.filter(d => d.unpublished).length }, null, 2));
