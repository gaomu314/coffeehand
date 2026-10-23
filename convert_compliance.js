// 一次性转换：research-compliance.json → compliance.js（给 market.html 用）
const fs = require("fs");
const path = __dirname;
const raw = fs.readFileSync(path + "\\research-compliance.json", "utf8");
const data = JSON.parse(raw);
const flags = {
  "印度尼西亚": "🇮🇩", "马来西亚": "🇲🇾", "日本": "🇯🇵",
  "美国（代表北美）": "🇺🇸", "欧盟": "🇪🇺", "阿联酋（代表中东）": "🇦🇪"
};
const arr = data.markets.map(m => Object.assign({ flag: flags[m.market] || "" }, m));
const out = "// 由 research-compliance.json 转换生成 · as_of " + data.as_of + "\n" +
  "COMPLIANCE = " + JSON.stringify(arr, null, 1) + ";\n";
fs.writeFileSync(path + "\\compliance.js", out, "utf8");
console.log("compliance.js written, records:", arr.length);
