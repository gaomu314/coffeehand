// 一次性转换：research-drinks.json → drinks.js（给 beans.html 用）
const fs = require("fs");
const path = __dirname;
const arr = JSON.parse(fs.readFileSync(path + "\\research-drinks.json", "utf8"));
const out = "// 由 research-drinks.json 转换生成 · 24 款市售饮品用豆调研\n" +
  "window.DRINKS = " + JSON.stringify(arr, null, 1) + ";\n";
fs.writeFileSync(path + "\\drinks.js", out, "utf8");
console.log("drinks.js written, records:", arr.length);
