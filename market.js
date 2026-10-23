/* 咖手 · 晓市场 DEMO —— 本地透明规则打分 + DeepSeek 按推荐市场语言生成文案（附中文翻译） */
"use strict";

/* ---------- 1. 已核实事实（供推荐依据与 AI 提示词使用，不编造） ---------- */
const FACTS = {
  wenchang1898: "1898 年，华侨邝世连从南洋带回利比里卡咖啡豆种子，在文昌种下海南第一棵咖啡树（海南省农业农村厅《海南新咖位》）。",
  fushan1935: "1935 年印尼归侨陈显彰在澄迈福山规模引种咖啡；福山咖啡文化风情镇是全国首个咖啡主题国家 4A 级景区。",
  xinglong1952: "1952 年新中国第一家咖啡厂在万宁兴隆建成；\u201c兴隆咖啡\u201d入选中国首批 100 个受欧盟保护的地理标志产品。",
  price: "全球精品咖啡 200–350g 装典型零售价中位数约 17.95 美元/250g（p25–p75：15.21–20.59；本团队 2026-10 平台在售观察，n=4,313 规格/33 店）。",
  priceSEA: "东南亚市场中位数约 13.68 美元/250g（p25–p75：12.23–17.54）。",
  priceJP: "日本市场中位数约 18.49 美元/250g（样本仅 2 家店，标注样本不足）。",
  priceUS: "北美市场中位数约 20.40 美元/250g（p25–p75：18.93–25.65）。",
  priceUK: "英国市场中位数约 17.19 美元/250g。",
  priceEU: "欧元区市场中位数约 17.61 美元/250g。",
  customs: "2025 年海南企业出口咖啡豆及制品 169.5 吨，为进口量（9,110.6 吨）的 1.86%；2026 上半年出口货值 1,177.8 万元、同比 +82.35%、销往 19 国（海口海关）。"
};

/* ---------- 2. 市场与价格带 ---------- */
const MARKETS = {
  id:  { name: "印度尼西亚", flag: "🇮🇩", group: "东南亚", price: "$13–18 / 250g", priceNote: FACTS.priceSEA },
  my:  { name: "马来西亚",   flag: "🇲🇾", group: "东南亚", price: "$13–18 / 250g", priceNote: FACTS.priceSEA },
  sg:  { name: "新加坡",     flag: "🇸🇬", group: "东南亚", price: "$14–20 / 250g", priceNote: FACTS.priceSEA + " 新加坡精品化程度更高，取区间上沿。" },
  th:  { name: "泰国",       flag: "🇹🇭", group: "东南亚", price: "$12–17 / 250g", priceNote: FACTS.priceSEA },
  jp:  { name: "日本",       flag: "🇯🇵", group: "日韩",   price: "$16–23 / 250g", priceNote: FACTS.priceJP },
  kr:  { name: "韩国",       flag: "🇰🇷", group: "日韩",   price: "$15–21 / 250g", priceNote: "参照日本口径，略低一档（样本不足，仅供参考）。" },
  us:  { name: "美国",       flag: "🇺🇸", group: "欧美",   price: "$19–26 / 250g", priceNote: FACTS.priceUS },
  eu:  { name: "欧洲（英/欧）", flag: "🇪🇺", group: "欧美", price: "$15–20 / 250g", priceNote: FACTS.priceUK + " " + FACTS.priceEU }
};

/* ---------- 3. 打分规则（透明、可解释；每项可溯源到市场常识或项目已验证逻辑） ---------- */
const RULES = [
  { id: "variety", label: "品种", apply(v, s) {
    if (v === "robusta")   { s.id+=3; s.my+=3; s.th+=2; s.sg+=1; s.us-=1; s.eu-=1; }
    if (v === "liberica")  { s.id+=2; s.my+=2; s.th+=1; s.us+=2; s.eu+=2; }        // 稀缺 + 故事溢价
    if (v === "blend")     { s.us+=3; s.eu+=3; s.jp+=2; s.kr+=2; s.sg+=1; }        // 阿拉比卡走精品
  }},
  { id: "roast", label: "烘度", apply(v, s) {
    if (v === "light")     { s.us+=2; s.eu+=2; s.jp+=2; s.kr+=1; s.id-=1; s.my-=1; }
    if (v === "medium")    { s.us+=1; s.eu+=1; s.jp+=2; s.kr+=1; s.id+=1; s.my+=1; s.sg+=1; }
    if (v === "mediumdark"){ s.jp+=1; s.kr+=1; s.id+=2; s.my+=2; s.th+=1; }
    if (v === "dark")      { s.id+=3; s.my+=3; s.th+=3; s.sg+=1; s.us-=1; s.eu-=1; } // 南洋 kopi 传统
  }},
  { id: "charcoal", label: "海南传统炭烧", apply(v, s) {
    if (v) { s.id+=2; s.my+=2; s.th+=1; s.sg+=1; }
  }},
  { id: "process", label: "处理法", apply(v, s) {
    if (v === "washed")  { s.jp+=1; s.kr+=1; }
    if (v === "natural") { s.us+=1; s.eu+=1; s.id+=1; s.my+=1; }
    if (v === "honey")   { s.us+=1; s.jp+=1; }
  }},
  { id: "flavor", label: "风味", apply(list, s) {
    const f = {
      "浓甜醇厚": ()=> { s.id+=2; s.my+=2; s.th+=1; },
      "黑巧坚果": ()=> { s.id+=1; s.my+=1; s.us+=1; s.eu+=1; },
      "花果酸质": ()=> { s.us+=2; s.eu+=2; s.jp+=1; s.id-=1; },
      "干净明亮": ()=> { s.jp+=2; s.kr+=2; s.us+=1; },
      "焦糖奶油": ()=> { s.jp+=1; s.kr+=1; s.us+=1; }
    };
    list.forEach(t => { if (f[t]) f[t](); });
  }},
  { id: "origin", label: "产地故事", apply(v, s) {
    if (v === "xinglong") { s.id+=1; s.my+=1; s.us+=1; s.eu+=1; }  // 1952 第一家厂 + 欧盟地理标志
    if (v === "fushan")   { s.us+=1; s.eu+=1; s.jp+=1; }           // 4A 景区背书
    if (v === "wenchang") { s.us+=2; s.eu+=2; s.jp+=1; s.id+=1; }  // 1898 起源稀缺性
  }}
];

function score(input) {
  const s = { id:0, my:0, sg:0, th:0, jp:0, kr:0, us:0, eu:0 };
  const reasons = [];
  RULES.forEach(r => {
    const before = { ...s };
    r.apply(input[r.id === "flavor" ? "flavors" : r.id], s);
    const hit = Object.keys(s).filter(k => s[k] !== before[k]).length > 0;
    if (hit) reasons.push({ rule: r.id, label: r.label });
  });
  const rows = Object.keys(MARKETS).map(k => ({ key: k, ...MARKETS[k], score: s[k] }));
  rows.sort((a, b) => b.score - a.score);
  return { rows, reasons };
}

/* ---------- 4. 输入读取 ---------- */
function readInput() {
  return {
    pname: document.getElementById("pname").value.trim() || "海南精品咖啡豆",
    origin: document.getElementById("origin").value,
    variety: document.getElementById("variety").value,
    roast: document.getElementById("roast").value,
    charcoal: document.getElementById("charcoal").checked,
    process: document.getElementById("process").value,
    flavors: [...document.querySelectorAll("#flavors .chip.on")].map(c => c.dataset.f),
    customFlavor: document.getElementById("customFlavor").value.trim()
  };
}

const LABEL = { origin: "产地", variety: "品种", roast: "烘度", charcoal: "海南传统炭烧", process: "处理法", flavor: "风味" };

function renderScore() {
  const input = readInput();
  const { rows } = score(input);
  const top3 = rows.slice(0, 3);
  const out = document.getElementById("scoreOut");
  out.innerHTML = top3.map((r, i) => {
    const reasons = reasonText(r.key, input);
    return `<div class="rank-card ${i === 0 ? "top" : ""}">
      <h3>${r.flag} ${r.name}
        <span class="score">${r.score} 分</span>
        ${i === 0 ? '<span class="score" style="background:var(--green);color:#fff">最适配</span>' : ""}
      </h3>
      <ul>${reasons.map(x => `<li>${x}</li>`).join("")}</ul>
      <div class="price">建议零售价：<span contenteditable="true">${r.price}</span>
        <span class="edit-hint">（可改）</span></div>
    </div>`;
  }).join("");
}

function reasonText(marketKey, input) {
  const m = MARKETS[marketKey];
  const r = [];
  if (input.variety === "robusta" && (marketKey === "id" || marketKey === "my" || marketKey === "th")) r.push("罗布斯塔是该国传统咖啡消费主力品种");
  if (input.variety === "liberica" && (marketKey === "us" || marketKey === "eu")) r.push("利比里卡稀缺 + 1898 起源故事支撑溢价");
  if (input.variety === "blend" && (marketKey === "us" || marketKey === "eu" || marketKey === "jp")) r.push("阿拉比卡契合精品咖啡市场偏好");
  if (input.roast === "dark" && m.group === "东南亚") r.push("深烘契合南洋 kopi 传统口味");
  if (input.roast === "light" && m.group !== "东南亚") r.push("浅烘保留花果酸质，适合精品定位");
  if (input.charcoal) r.push("海南传统炭烧是差异化卖点");
  if (input.flavors.includes("浓甜醇厚") && m.group === "东南亚") r.push("浓甜醇厚匹配东南亚味觉偏好");
  if (input.flavors.includes("花果酸质") && (marketKey === "us" || marketKey === "eu")) r.push("欧美愿为花果酸质付溢价");
  if (input.flavors.includes("干净明亮") && (marketKey === "jp" || marketKey === "kr")) r.push("日韩偏好干净明亮");
  if (input.origin === "xinglong" && marketKey === "id") r.push("2025 年正大兴隆咖啡首次出口目的地正是印尼——有现成需求证据");
  if (input.origin === "wenchang" && (marketKey === "us" || marketKey === "eu")) r.push("1898 年起源故事是最强的稀缺性叙事");
  if (r.length === 0) r.push(m.group + "整体适配度靠前（综合评分）");
  return r.slice(0, 3);
}

/* ---------- 5. DeepSeek 调用（按推荐市场语言生成，每种语言附中文翻译；逐语言独立生成，失败自动重试一次） ---------- */
function getKey() { return localStorage.getItem("kahou_ds_key") || ""; }

const LANG_BY_MARKET = {
  id: { key: "id", name: "🇮🇩 印尼语", use: "印尼/马来西亚/新加坡/泰国市场（Shopee、Lazada、Tokopedia 商品页）" },
  my: { key: "id", name: "🇮🇩 印尼语", use: "印尼/马来西亚/新加坡/泰国市场（Shopee、Lazada、Tokopedia 商品页）" },
  sg: { key: "id", name: "🇮🇩 印尼语", use: "印尼/马来西亚/新加坡/泰国市场（Shopee、Lazada、Tokopedia 商品页）" },
  th: { key: "id", name: "🇮🇩 印尼语", use: "印尼/马来西亚/新加坡/泰国市场（Shopee、Lazada、Tokopedia 商品页）" },
  jp: { key: "ja", name: "🇯🇵 日语", use: "日本/韩国市场（乐天、Amazon 日本站商品页）" },
  kr: { key: "ja", name: "🇯🇵 日语", use: "日本/韩国市场（乐天、Amazon 日本站商品页）" },
  us: { key: "en", name: "🇬🇧 英语", use: "美国/欧洲市场（Amazon、独立站商品页）" },
  eu: { key: "en", name: "🇬🇧 英语", use: "美国/欧洲市场（Amazon、独立站商品页）" }
};

function buildLangList(top3) {
  const seen = new Set();
  const list = [];
  top3.forEach(r => {
    const lang = LANG_BY_MARKET[r.key];
    if (!lang || seen.has(lang.key)) return;
    seen.add(lang.key);
    const markets = top3.filter(x => LANG_BY_MARKET[x.key] && LANG_BY_MARKET[x.key].key === lang.key).map(x => x.name);
    list.push({ ...lang, markets: markets.join("、") });
  });
  return list;
}

const COPY_FIELDS = `{"title":"标题","selling_point":"核心卖点","story":"品牌故事","flavor":"风味描述","brew":"冲泡建议","zh":{"title":"中文标题","selling_point":"中文卖点","story":"中文故事","flavor":"中文风味","brew":"中文冲泡"}}`;

async function callCopyLang(lang, input) {
  const key = getKey();
  if (!key) throw new Error("NO_KEY");
  const model = document.getElementById("model").value;
  const system = `你是"咖手·CoffeeHand"的出海文案引擎，为海南咖啡商家撰写目标市场商品文案。\n事实底线：只能使用下面提供的已验证事实与产品信息；不得编造产地、海拔、获奖、历史年代、认证、关税等任何未提供的信息；不确定的写"以实物杯测为准"。\n已验证事实：\n${Object.values(FACTS).map(f => "- " + f).join("\n")}\n输出要求：严格输出一个 JSON 对象（JSON），结构为 ${COPY_FIELDS}；所有字段（含 zh 里的 5 个字段）都必须有非空文字；zh 是上面 5 个字段的准确中文翻译，不是另写一份中文文案；按目标市场表达习惯写，不要翻译腔。`;
  const user = `请用${lang.name.replace(/^\S+\s/, "")}写一份咖啡商品文案，并把每个字段翻译成中文放在 zh 里。\n目标市场：${lang.markets}（${lang.use}）。\n产品信息：${JSON.stringify(input)}\n只输出 JSON，不要多余说明。`;
  const resp = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.7,
      max_tokens: 1800,
      response_format: { type: "json_object" }
    })
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    if (resp.status === 401) throw new Error("KEY_INVALID");
    if (resp.status === 429) throw new Error("RATE_LIMIT");
    throw new Error("HTTP_" + resp.status + " " + err.slice(0, 120));
  }
  const data = await resp.json();
  const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
  if (!content.trim()) throw new Error("EMPTY");
  const parsed = parseJson(content);
  if (parsed.raw) throw new Error("BAD_JSON");
  return content;
}

async function withRetry(fn) {
  let lastErr;
  const retryable = e => e && (e.message === "RATE_LIMIT" || e.message === "EMPTY" || e.message === "BAD_JSON");
  for (let attempt = 1; attempt <= 2; attempt++) {
    try { return await fn(); } catch (e) { lastErr = e; }
    if (attempt === 1 && retryable(lastErr)) await new Promise(r => setTimeout(r, lastErr.message === "RATE_LIMIT" ? 3000 : 1500));
    else break;
  }
  throw lastErr;
}

async function generateCopy() {
  const btn = document.getElementById("btnGen");
  const out = document.getElementById("copyOut");
  btn.disabled = true;
  out.innerHTML = '<p class="placeholder">正在根据推荐市场确定文案语言…</p>';
  try {
    const input = readInput();
    const { rows } = score(input);
    const top3 = rows.slice(0, 3);
    const langs = buildLangList(top3);
    if (langs.length === 0) { out.innerHTML = '<p class="placeholder">没有可生成的推荐市场语言。</p>'; return; }
    const results = [];
    for (let i = 0; i < langs.length; i++) {
      const lang = langs[i];
      btn.textContent = `生成中 ${lang.name} ${i + 1}/${langs.length}…`;
      out.innerHTML = `<p class="placeholder">正在生成 ${lang.name} 文案并翻译成中文（${i + 1}/${langs.length}，每语言约 10—20 秒）…</p>`;
      try {
        const content = await withRetry(() => callCopyLang(lang, input));
        results.push({ status: "fulfilled", value: content, lang });
      } catch (e) {
        results.push({ status: "rejected", reason: e, lang });
      }
      if (i < langs.length - 1) await new Promise(r => setTimeout(r, 800));
    }
    renderCopy(results, langs);
  } finally {
    btn.disabled = false; btn.textContent = "生成文案（DeepSeek）";
  }
}

function parseJson(text) {
  try { return JSON.parse(text); } catch (e) { /* fallthrough */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (e2) { /* fallthrough */ } }
  return { raw: text };
}

function renderCopy(results, langs) {
  const out = document.getElementById("copyOut");
  let okCount = 0;
  const cards = [];
  langs.forEach((lang, i) => {
    const r = results[i];
    if (!r || r.status !== "fulfilled") {
      const raw = r && r.reason ? String(r.reason.message || r.reason) : "生成失败";
      const show = raw === "NO_KEY" ? "需要 API Key"
        : raw === "KEY_INVALID" ? "Key 无效（401）"
        : raw === "RATE_LIMIT" ? "请求太频繁，自动重试后仍失败（稍等再点一次）"
        : raw === "EMPTY" ? "模型返回了空内容，自动重试后仍失败"
        : "生成失败：" + raw;
      cards.push(`<div class="copy-card"><h4>${lang.name}</h4><p class="placeholder" style="color:#a23a2f">${esc(show)}</p></div>`);
      return;
    }
    const parsed = parseJson(r.value);
    if (parsed.raw) { cards.push(`<div class="copy-card"><h4>${lang.name}</h4><p class="placeholder">${esc(parsed.raw)}</p></div>`); return; }
    okCount++;
    const labels = [["title", "标题"], ["selling_point", "核心卖点"], ["story", "品牌故事"], ["flavor", "风味描述"], ["brew", "冲泡建议"]];
    const main = labels.map(([k, lab]) => parsed[k] ? `<p><b>${lab}：</b><span contenteditable="true">${esc(parsed[k])}</span></p>` : "").join("");
    const zh = parsed.zh && typeof parsed.zh === "object" ? parsed.zh : {};
    const zhBody = labels.map(([k, lab]) => zh[k] ? `<p class="zh"><b>${lab}：</b><span contenteditable="true">${esc(zh[k])}</span></p>` : "").join("") || '<p class="zh">（模型没给中文翻译，可点「重新生成」重试）</p>';
    cards.push(`<div class="copy-card"><h4>${lang.name}<span class="mkt-tag">${esc(lang.markets)}</span></h4>${main}<div class="zh-block"><b>中文翻译</b>${zhBody}</div></div>`);
  });
  out.innerHTML = `<p class="placeholder" style="margin-bottom:10px">按推荐市场生成了 ${langs.length} 种语言，成功 ${okCount} 种；每种语言都附中文翻译，点击文字可直接修改。</p>` + cards.join("");
}

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/* ---------- 6. 复制结果 ---------- */
function copyAll() {
  const parts = [document.getElementById("scoreOut").innerText, document.getElementById("copyOut").innerText];
  navigator.clipboard.writeText(parts.join("\n\n")).then(() => {
    const b = document.getElementById("btnCopy"); b.textContent = "已复制 ✓"; setTimeout(() => b.textContent = "复制全部结果", 1500);
  }).catch(() => alert("复制失败，请手动全选复制"));
}

/* ---------- 7.5 全链路服务台 + 合规卡 ---------- */
function renderChainService() {
  const box = document.getElementById("chainService");
  if (!box || typeof CHAIN === "undefined") return;
  box.innerHTML = `<div class="chain-timeline">` + CHAIN.map((c, i) => `
    <div class="chain-acc ${i === 0 ? "open" : ""}">
      <button class="acc-head" type="button" data-id="${c.id}" onclick="toggleAcc('${c.id}')">
        <span class="acc-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="acc-title">${c.icon} ${c.step}<small>${c.merchant.title}</small></span>
        <span class="acc-arrow">▾</span>
      </button>
      <div class="acc-body">
        <ul class="acc-list">${c.merchant.points.map(p => `<li>${p}</li>`).join("")}</ul>
        <button class="btn ghost" onclick="askChain('${c.id}')">AI 顾问：${c.step}建议</button>
        <div class="ai-out" id="aiOut-${c.id}"></div>
      </div>
    </div>`).join("") + `</div>`;
}

function toggleAcc(id) {
  const btn = document.querySelector(`.acc-head[data-id="${id}"]`);
  if (btn) btn.parentElement.classList.toggle("open");
}

async function askChain(stageId) {
  const c = CHAIN.find(x => x.id === stageId);
  if (!c) return;
  const out = document.getElementById("aiOut-" + stageId);
  out.innerHTML = "生成中…";
  try {
    const input = readInput();
    const { rows } = score(input);
    const prompt = c.merchant.aiPrompt + "\n\n产品信息：" + JSON.stringify(input) +
      "\n目标市场（评分Top1）：" + rows[0].name + "\n请直接输出建议文本。";
    const text = await callChainAI(prompt);
    out.innerHTML = `<div class="ai-answer">${esc(text).replace(/\n/g, "<br>")}</div>
      <div class="warn">AI 建议仅供参考；涉及资质与关税以官方最新规定为准。</div>`;
  } catch (e) {
    const msg = e.message === "NO_KEY" ? "请先在上方填入并保存 DeepSeek API Key。"
      : e.message === "KEY_INVALID" ? "Key 无效（401）。"
      : "调用失败：" + e.message;
    out.innerHTML = `<div class="ai-answer" style="color:#a23a2f">${esc(msg)}</div>`;
  }
}

async function callChainAI(prompt) {
  const key = getKey();
  if (!key) throw new Error("NO_KEY");
  const model = document.getElementById("model").value;
  const resp = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "你是咖手出海服务台的顾问。事实底线：只能使用提供的产品信息与常识，不得编造产地、海拔、获奖、关税税率、认证编号等任何未提供或未核实的信息；不确定的写「以官方最新规定为准」或「建议实测」。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 1200
    })
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error("KEY_INVALID");
    throw new Error("HTTP_" + resp.status);
  }
  const data = await resp.json();
  return data.choices[0].message.content.trim();
}

function renderChannels() {
  const box = document.getElementById("channelBox");
  if (!box || typeof CHANNELS === "undefined") return;
  const stepName = (id) => { const c = CHAIN.find(x => x.id === id); return c ? c.step : id; };
  box.innerHTML = `<div class="chn-grid">` + CHANNELS.map((ch, i) => `
    <div class="chn-card ${i === 0 ? "open" : ""}">
      <button class="chn-head" type="button" data-id="${ch.id}" onclick="toggleChn('${ch.id}')">
        <span class="chn-icon">${ch.icon}</span>
        <span class="chn-name">${ch.name}<small>${ch.tagline}</small></span>
        <span class="chn-arrow">▾</span>
      </button>
      <div class="chn-body">
        <p class="chn-fit"><b>适合谁：</b>${ch.fit}</p>
        <p class="chn-sub"><b>怎么起步</b></p>
        <ol class="chn-steps">${ch.how.map(s => `<li>${s}</li>`).join("")}</ol>
        <p class="chn-sub"><b>门槛与成本</b></p>
        <p class="chn-cost">${ch.cost}</p>
        <p class="chn-sub"><b>常见坑</b></p>
        <ul class="chn-traps">${ch.traps.map(t => `<li>${t}</li>`).join("")}</ul>
        <p class="chn-sub"><b>咖啡适配</b></p>
        <p class="chn-coffee">${ch.coffeeTip}</p>
        <a class="chn-link" href="#chain">↳ 回到「六环节落地 · ${stepName(ch.link)}」看执行清单</a>
      </div>
    </div>`).join("") + `</div>`;
}

function toggleChn(id) {
  const btn = document.querySelector(`.chn-head[data-id="${id}"]`);
  if (btn) btn.parentElement.classList.toggle("open");
}

function renderCompliance() {
  const box = document.getElementById("complianceBox");
  if (!box) return;
  if (typeof COMPLIANCE === "undefined" || !COMPLIANCE.length) {
    box.innerHTML = '<p class="placeholder">六国合规卡整理中（调研完成后自动点亮）。</p>';
    return;
  }
  const tabs = COMPLIANCE.map((c, i) => `<button class="comp-tab ${i === 0 ? "on" : ""}" type="button" data-idx="${i}" onclick="switchComp(${i})">${c.flag || ""} ${(c.market || c.name || "").split("（")[0]}</button>`).join("");
  const panels = COMPLIANCE.map((c, i) => {
    const items = [
      c.label_language ? `<li><b>标签语言：</b>${c.label_language}</li>` : "",
      c.certification ? `<li><b>认证：</b>${c.certification}</li>` : "",
      c.tariff ? `<li><b>关税（HS 0901）：</b>${c.tariff}</li>` : "",
      c.access ? `<li><b>准入要点：</b>${c.access}</li>` : "",
      c.customs ? `<li><b>报关要点：</b>${c.customs}</li>` : ""
    ].filter(Boolean).join("");
    const srcs = (c.source || []).map(u => `<a href="${u}" target="_blank">来源 ↗</a>`).join(" ");
    return `<div class="comp-panel ${i === 0 ? "on" : ""}" id="compPanel-${i}">
      <h4>${c.flag || ""} ${c.market || c.name || ""}</h4>
      <ul class="comp-list">${items}</ul>
      <div class="warn">${c.note || "以官方最新规定为准"} ${srcs} · 采集 2026-10</div>
    </div>`;
  }).join("");
  box.innerHTML = `<div class="comp-tabs">${tabs}</div>${panels}`;
}

function switchComp(i) {
  document.querySelectorAll(".comp-tab").forEach((t, j) => t.classList.toggle("on", j === i));
  document.querySelectorAll(".comp-panel").forEach((p, j) => p.classList.toggle("on", j === i));
}

/* ---------- 7. 事件绑定与初始化 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("kahou_ds_key");
  if (saved) { document.getElementById("apiKey").value = saved; setStatus("已保存（本地）", "ok"); }

  document.getElementById("btnSaveKey").onclick = () => {
    const k = document.getElementById("apiKey").value.trim();
    if (k) { localStorage.setItem("kahou_ds_key", k); setStatus("已保存（本地）", "ok"); }
    else { localStorage.removeItem("kahou_ds_key"); setStatus("未配置", ""); }
  };
  document.getElementById("btnTest").onclick = async () => {
    const btn = document.getElementById("btnTest");
    btn.disabled = true; btn.textContent = "测试中…";
    try {
      const resp = await fetch("https://api.deepseek.com/models", { headers: { Authorization: "Bearer " + (document.getElementById("apiKey").value.trim() || getKey()) } });
      setStatus(resp.ok ? "连接成功" : "连接失败 HTTP " + resp.status, resp.ok ? "ok" : "bad");
    } catch (e) { setStatus("网络错误：" + e.message, "bad"); }
    finally { btn.disabled = false; btn.textContent = "测试连接"; }
  };
  document.getElementById("btnScore").onclick = renderScore;
  document.getElementById("btnGen").onclick = generateCopy;
  document.getElementById("btnCopy").onclick = copyAll;

  document.querySelectorAll("#flavors .chip").forEach(c => c.onclick = () => c.classList.toggle("on"));

  renderScore();
  renderChainService();
  renderChannels();
  renderCompliance();
});

function setStatus(text, cls) {
  const el = document.getElementById("apiStatus");
  el.textContent = text; el.className = "api-status " + (cls || "");
}
