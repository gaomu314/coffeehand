// 合并生成 knowledge.js：A（风味/健康）+ B（历史/中国产业）
const fs = require("fs");
const path = __dirname;

function readChapters(file) {
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return data.chapters || [];
}

const chapters = [
  ...readChapters(path + "/research-knowledge-a.json"),
  ...readChapters(path + "/research-knowledge-b.json")
].map(c => ({
  id: c.id,
  title: c.title,
  intro: c.intro || "",
  sections: (c.sections || []).map(s => ({
    heading: s.heading || "",
    text: s.text || "",
    sources: Array.isArray(s.sources) ? s.sources : []
  })),
  papers: Array.isArray(c.papers) ? c.papers : []
}));

const data = {
  title: "咖啡知识库",
  as_of: "2026-10",
  disclaimer: "部分结论来自二手资料，未逐一复核；涉及健康与贸易的数据以权威机构最新发布为准。",
  chapters
};

fs.writeFileSync(path + "/knowledge.js", "// 咖手 · 咖啡知识库（自动生成，勿手改）\nwindow.KNOWLEDGE = " + JSON.stringify(data, null, 2) + ";\n");
console.log(JSON.stringify({ chapters: chapters.length, sections: chapters.reduce((n, c) => n + c.sections.length, 0), papers: chapters.reduce((n, c) => n + c.papers.length, 0) }, null, 2));
