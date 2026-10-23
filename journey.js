// 咖手 · 咖啡旅程 —— 本地规则引擎 + 可选 DeepSeek 增强
(function () {
  "use strict";

  // ---------- 数据 ----------
  const PROFILES = [
    { id: "yirg", name: "埃塞俄比亚 · 耶加雪菲", roast: "浅烘", brew: "手冲", axis: "sour",
      desc: "像雨后的一杯柠檬水，带一点茉莉花香。", badge: "入门即巅峰",
      why: "你喜欢酸——不是醋的酸，是水果的酸。浅烘把这种明亮放到最大，手冲让香气一层层打开。第一杯就喝到“咖啡的干净感”，你会立刻明白它和速溶不是同一种东西。" },
    { id: "kenya", name: "肯尼亚 AA", roast: "浅烘", brew: "手冲", axis: "sour",
      desc: "像咬开一颗树莓，酸甜明亮得像果汁。", badge: "果汁派",
      why: "你的酸味偏好里藏着一点冒险精神。肯尼亚的莓果酸浓烈又干净，是所有“像果汁的咖啡”里最有名的一支。" },
    { id: "colombia", name: "哥伦比亚 · 慧兰", roast: "中烘", brew: "手冲", axis: "floral",
      desc: "干净、平衡，像清晨山间的一阵凉风。", badge: "平衡之美",
      why: "你喜欢清香——不是浓烈的香，是干净的香。哥伦比亚是“最不容易出错”的产区，酸甜苦都克制，最适合慢慢品出咖啡本味。" },
    { id: "brazil", name: "巴西 · 喜拉多", roast: "中深烘", brew: "法压 / 意式", axis: "sweet",
      desc: "焦糖与坚果的甜，像融化的太妃糖。", badge: "经典甜感",
      why: "你喜欢甜——好咖啡天然回甘。巴西豆的焦糖坚果甜是最稳的甜，不挑冲法，早上随便一冲都好喝。" },
    { id: "fushan", name: "海南 · 福山日晒", roast: "中烘", brew: "手冲", axis: "sweet",
      desc: "蜂蜜与桂圆干的甜，带着日晒的阳光味。", badge: "国产之光",
      why: "你喜欢甜，那一定要试试海南自己的豆子。福山火山富硒土 + 日晒处理，甜得像桂圆干，是国产咖啡里最被低估的一支。" },
    { id: "mandheling", name: "印尼 · 曼特宁", roast: "深烘", brew: "法压", axis: "bitter",
      desc: "85% 黑巧的苦，苦完是悠长的回甘。", badge: "醇厚担当",
      why: "你喜欢苦——但咖啡的苦不是难受的苦，是黑巧那种“苦得有内容”。曼特宁是醇厚系的标杆，苦得干净，回甘很长。" },
    { id: "xinglong", name: "海南 · 兴隆炭烧", roast: "深烘", brew: "南洋 / 意式", axis: "bitter",
      desc: "浓甜醇厚，带着老街炭火的气息。", badge: "南洋记忆",
      why: "你喜欢苦中带甜的味道——这正是南洋 kopi 的传统。兴隆炭烧把苦做成了醇厚，加一点炼奶，就是海南人喝了七十年的味道。" },
    { id: "gesha", name: "巴拿马 · 瑰夏", roast: "浅烘", brew: "手冲", axis: "aroma",
      desc: "茉莉与佛手柑的香，像走进一座开满花的园子。", badge: "香气天花板",
      why: "你喜欢清香——那你该直接认识咖啡香气的天花板。瑰夏的花香被形容为“香水豆”，闻一次就忘不掉。" }
  ];

  const PERSONAS = {
    adventurer: { name: "风味探索家", motto: "世界这么大，我的舌头想先去。", next: "瑰夏 / 肯尼亚 AA" },
    steady:     { name: "浓香守夜人",   motto: "经典就是经典，稳得刚刚好。",   next: "巴西喜拉多 / 曼特宁" },
    ritual:     { name: "仪式主义者",   motto: "生活需要一点郑重，哪怕只是一杯咖啡。", next: "耶加雪菲 / 哥伦比亚" },
    simple:     { name: "甜感分享官",   motto: "好喝，才值得分享。",             next: "福山日晒 / 兴隆炭烧" }
  };

  const Q2_BREW = {
    morning: "早上赶时间：法压或挂耳，三分钟搞定，提神效率最高。",
    afternoon: "午后放松：手冲最合适，看水流慢慢打圈，本身就是休息。",
    night: "晚上慢品：手冲小杯，细细闻香；对咖啡因敏感可选低因豆。",
    social: "分享时刻：冲一壶甜感足的，大家都喝得高兴。"
  };

  const NEXT_LINKS = {
    adventurer: [["gesha", "瑰夏"], ["kenya", "肯尼亚 AA"]],
    steady:     [["brazil", "巴西喜拉多"], ["mandheling", "曼特宁"]],
    ritual:     [["yirg", "耶加雪菲"], ["colombia", "哥伦比亚"]],
    simple:     [["fushan", "福山日晒"], ["xinglong", "兴隆炭烧"]]
  };
  function beanLink(id, text) {
    return '<a class="bean-link" href="beans.html?id=' + id + '">' + text + ' ↗</a>';
  }

  const FLAVORS = {
    sour: { label: "酸", blurb: "咖啡的酸不是醋的酸，是水果的酸——明亮、活泼、让人流口水。", items: [
      { n: "明亮果酸", like: "雨后的一杯柠檬水", beans: "埃塞俄比亚 · 耶加雪菲（浅烘）", id: "yirg" },
      { n: "莓果酸",   like: "咬开一颗树莓的瞬间", beans: "肯尼亚 AA（浅烘）", id: "kenya" },
      { n: "柑橘酸",   like: "剥橙子时溅出的香气", beans: "哥伦比亚 · 慧兰（中烘）", id: "colombia" }
    ]},
    sweet: { label: "甜", blurb: "好咖啡天然回甘——甜是第一层奖赏，也是最容易让人入坑的味道。", items: [
      { n: "焦糖甜", like: "融化的太妃糖", beans: "巴西 · 喜拉多（中深烘）", id: "brazil" },
      { n: "蜂蜜甜", like: "一杯温蜂蜜水", beans: "海南 · 福山日晒（中烘）", id: "fushan" },
      { n: "果脯甜", like: "咬一口桂圆干", beans: "哥斯达黎加 · 蜜处理（中烘）", id: "costarica" }
    ]},
    bitter: { label: "苦", blurb: "苦是咖啡的骨架——好的苦像黑巧，苦完是悠长的回甘。", items: [
      { n: "黑巧苦", like: "含一块 85% 黑巧", beans: "印尼 · 曼特宁（深烘）", id: "mandheling" },
      { n: "烟熏苦", like: "老街的炭火气息", beans: "海南 · 兴隆炭烧（深烘）", id: "xinglong" },
      { n: "坚果苦", like: "烘核桃的香气", beans: "哥伦比亚（中深烘）", id: "colombia" }
    ]},
    aroma: { label: "香", blurb: "香气是最早抵达的告白——从干香到杯底，层层不同。", items: [
      { n: "花香",   like: "茉莉与佛手柑", beans: "巴拿马 · 瑰夏（浅烘）", id: "gesha" },
      { n: "果香",   like: "熟透的芒果", beans: "埃塞俄比亚 · 日晒耶加（浅烘）", id: "nattyirg" },
      { n: "香料香", like: "肉桂与丁香", beans: "也门 · 摩卡（深烘）", id: "yemen" }
    ]}
  };

  const KEY_NAME = "kahou_ds_key"; // 与晓市场共享
  let answers = {}; // {1:axis, 2:scene, 3:persona}

  // ---------- 工具 ----------
  function $(id) { return document.getElementById(id); }
  function getKey() { return localStorage.getItem(KEY_NAME) || ""; }

  // ---------- 第一杯：答题 ----------
  function bindQuiz() {
    document.querySelectorAll(".q-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        var q = b.dataset.q;
        var card = $("q" + q);
        card.querySelectorAll(".q-opt").forEach(function (x) { x.classList.remove("sel"); });
        b.classList.add("sel");
        answers[q] = b.dataset.a;
        if (answers[1] && answers[2] && answers[3]) renderFirstCup();
        renderPersona();
      });
    });
  }

  function pickProfile() {
    var axis = answers[1], persona = answers[3];
    var best = null, bestScore = -1;
    PROFILES.forEach(function (p) {
      var s = 0;
      if (p.axis === axis) s += 3;
      // Q3 微调：尝新→更"奇"的豆；稳定→经典；仪式→精品手冲；简单→甜感/浓甜
      if (persona === "adventurer" && (p.id === "gesha" || p.id === "kenya" || p.id === "fushan")) s += 2;
      if (persona === "steady" && (p.id === "brazil" || p.id === "mandheling" || p.id === "colombia")) s += 2;
      if (persona === "ritual" && (p.id === "yirg" || p.id === "colombia" || p.id === "gesha")) s += 2;
      if (persona === "simple" && (p.id === "xinglong" || p.id === "fushan" || p.id === "brazil")) s += 2;
      if (s > bestScore) { bestScore = s; best = p; }
    });
    return best;
  }

  function renderFirstCup() {
    var p = pickProfile();
    var per = PERSONAS[answers[3]];
    var el = $("firstCup");
    el.style.display = "block";
    el.innerHTML =
      '<div class="first-cup-card">' +
        '<div class="fc-title">你的第一杯</div>' +
        '<h3>' + esc(p.name) + ' <span class="badge">' + esc(p.badge) + '</span></h3>' +
        '<p class="fc-desc">' + esc(p.desc) + '</p>' +
        '<div class="fc-meta"><span>' + esc(p.roast) + '</span><span>' + esc(p.brew) + '</span></div>' +
        '<p class="fc-why">为什么是它：' + esc(p.why) + '</p>' +
        '<p class="fc-why">怎么喝：' + esc(Q2_BREW[answers[2]]) + '</p>' +
        '<p class="fc-link">' + beanLink(p.id, "去豆子百科看这支豆的完整档案 →") + '</p>' +
        '<p class="fc-hint">✏️ 以上推荐基于你的 3 个答案（本地规则，无需联网）。也可以回去改答案，推荐会跟着变。</p>' +
      '</div>';
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ---------- 风味地图 ----------
  function bindFlavors() {
    document.querySelectorAll(".axis").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".axis").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        var f = FLAVORS[b.dataset.axis];
        var html = '<div class="flavor-panel"><p class="flavor-blurb">' + esc(f.blurb) + '</p>';
        f.items.forEach(function (it) {
          html += '<div class="flavor-item"><b>' + esc(it.n) + '</b> —— 喝起来像「' + esc(it.like) + '」<span class="beans">' + beanLink(it.id, it.beans) + '</span></div>';
        });
        html += '</div>';
        $("flavorDetail").innerHTML = html;
      });
    });
  }

  // ---------- 咖啡人格卡 ----------
  function renderPersona() {
    if (!answers[1] || !answers[2] || !answers[3]) return;
    var p = pickProfile();
    var per = PERSONAS[answers[3]];
    $("persona").innerHTML =
      '<div class="persona-card" id="personaCard">' +
        '<div class="p-brand">咖手 · CoffeeHand</div>' +
        '<div class="p-name">' + esc(per.name) + '</div>' +
        '<div class="p-motto">「' + esc(per.motto) + '」</div>' +
        '<div class="p-row"><span>本命豆</span><b>' + beanLink(p.id, p.name) + '</b></div>' +
        '<div class="p-row"><span>冲煮</span><b>' + esc(p.brew) + ' · ' + esc(p.roast) + '</b></div>' +
        '<div class="p-row"><span>下一杯</span><b>' + (NEXT_LINKS[answers[3]] || []).map(function (n) { return beanLink(n[0], n[1]); }).join(" / ") + '</b></div>' +
        '<div class="p-ai" id="pAi">' + esc(defaultDeclaration(per, p)) + '</div>' +
      '</div>' +
      '<div class="p-actions">' +
        '<button class="btn" id="btnCopyCard">复制卡片文案</button>' +
        '<button class="btn ghost" id="btnDownload">下载卡片图片</button>' +
        '<button class="btn ghost" id="btnAi">✨ AI 为我写宣言</button>' +
        '<span id="pStatus" class="edit-hint"></span>' +
      '</div>' +
      '<div id="aiKeyRow" style="display:none;margin-top:10px">' +
        '<label>DeepSeek API Key（可选，只存本地）</label>' +
        '<input type="password" id="jKey" placeholder="sk-..." value="' + esc(getKey()) + '">' +
        '<button class="btn ghost" id="btnSaveJKey">保存并使用</button>' +
      '</div>';
    $("btnCopyCard").addEventListener("click", copyCard);
    $("btnDownload").addEventListener("click", downloadCard);
    $("btnAi").addEventListener("click", aiDeclare);
    $("btnSaveJKey").addEventListener("click", function () {
      var k = $("jKey").value.trim();
      if (k) localStorage.setItem(KEY_NAME, k);
      else localStorage.removeItem(KEY_NAME);
      $("aiKeyRow").style.display = "none";
      aiDeclare();
    });
  }

  function defaultDeclaration(per, p) {
    return "你的咖啡宣言：" + per.motto + " 第一杯从「" + p.name + "」开始，" + p.desc;
  }

  function cardText() {
    var per = PERSONAS[answers[3]], p = pickProfile();
    return "☕ 我的咖啡人格：" + per.name + "\n" +
      "「" + per.motto + "」\n" +
      "本命豆：" + p.name + "（" + p.brew + " · " + p.roast + "）\n" +
      "下一杯：" + per.next + "\n" +
      "—— 来自 咖手 · CoffeeHand";
  }

  function copyCard() {
    navigator.clipboard.writeText(cardText()).then(function () {
      setPStatus("已复制，去发朋友圈吧", true);
    }, function () { setPStatus("复制失败，请手动选中文字", false); });
  }

  function setPStatus(t, ok) {
    var s = $("pStatus"); if (s) { s.textContent = t; s.style.color = ok ? "#1d6b3c" : "#a23a2f"; }
  }

  function downloadCard() {
    var per = PERSONAS[answers[3]], p = pickProfile();
    var c = document.createElement("canvas");
    c.width = 600; c.height = 800;
    var x = c.getContext("2d");
    x.fillStyle = "#1d4d3c"; x.fillRect(0, 0, 600, 800);
    x.strokeStyle = "#c9a227"; x.lineWidth = 6; x.strokeRect(24, 24, 552, 752);
    x.fillStyle = "#f7f2e7";
    x.textAlign = "center";
    x.font = "22px 'Microsoft YaHei'"; x.fillText("咖手 · CoffeeHand", 300, 100);
    x.font = "bold 52px 'Microsoft YaHei'"; x.fillText(per.name, 300, 210);
    x.font = "26px 'Microsoft YaHei'"; x.fillText("「" + per.motto + "」", 300, 300);
    x.font = "22px 'Microsoft YaHei'";
    x.fillText("本命豆：" + p.name, 300, 430);
    x.fillText("冲煮：" + p.brew + " · " + p.roast, 300, 480);
    x.fillText("下一杯：" + per.next, 300, 530);
    x.font = "18px 'Microsoft YaHei'";
    x.fillText(p.desc, 300, 620);
    x.fillText("—— 让好咖啡，从被喝到被爱 ——", 300, 720);
    var a = document.createElement("a");
    a.download = "我的咖啡人格卡.png";
    a.href = c.toDataURL("image/png");
    a.click();
  }

  // ---------- 可选 AI ----------
  async function aiDeclare() {
    var key = getKey();
    if (!key) { $("aiKeyRow").style.display = "block"; setPStatus("先填 DeepSeek Key（免费注册，只存本地）", false); return; }
    var per = PERSONAS[answers[3]], p = pickProfile();
    setPStatus("AI 正在写…", false);
    try {
      var resp = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
        body: JSON.stringify({
          model: "deepseek-chat",
          temperature: 0.9,
          max_tokens: 200,
          messages: [
            { role: "system", content: "你是咖手 CoffeeHand 的咖啡文案师。为咖啡爱好者写一段 60 字以内的中文'咖啡人格宣言'，温暖、有画面感，不要术语堆砌。" },
            { role: "user", content: "人格：" + per.name + "；口味偏好：" + answers[1] + "；场景：" + answers[2] + "；本命豆：" + p.name + "（" + p.desc + "）。写一段宣言。" }
          ]
        })
      });
      var data = await resp.json();
      var text = (data.choices && data.choices[0] && data.choices[0].message.content || "").trim();
      if (!text) throw new Error("empty");
      var ai = $("pAi"); if (ai) ai.textContent = text;
      setPStatus("AI 宣言已生成", true);
    } catch (e) {
      setPStatus("AI 生成失败（" + (e.message || "网络") + "），保留本地宣言", false);
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function renderChain() {
    if (typeof CHAIN === "undefined") return;
    var steps = $("chainSteps"), detail = $("chainDetail");
    if (!steps || !detail) return;
    steps.innerHTML = CHAIN.map(function (c) {
      return '<button class="chain-step" data-id="' + c.id + '">' + c.icon + '<br><span>' + c.step + '</span></button>';
    }).join("");
    steps.querySelectorAll(".chain-step").forEach(function (b) {
      b.addEventListener("click", function () {
        steps.querySelectorAll(".chain-step").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        var c = CHAIN.find(function (x) { return x.id === b.dataset.id; });
        detail.innerHTML =
          '<h3>' + c.icon + ' ' + c.step + ' · ' + c.consumer.title + '</h3>' +
          '<p class="chain-story">' + c.consumer.story + '</p>' +
          '<div class="chain-facts">' + c.consumer.facts.map(function (f) { return '<div class="chain-fact">· ' + f + '</div>'; }).join("") + '</div>';
      });
    });
  }

  bindQuiz();
  bindFlavors();
  renderChain();
})();
