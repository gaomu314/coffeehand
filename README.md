# 咖手 CoffeeHand · 会呼吸的成果（网页演示）

让好咖啡，从被喝到被爱。
咖手是一个纯前端、零依赖、离线可用的品牌演示平台（AI 功能可选、缺 Key 也能跑）。
文件都在本目录，双击 `index.html` 即可使用，也可以部署到 GitHub Pages。

## 页面结构（4 页）

| 文件 | 入口 | 功能 |
|---|---|---|
| `index.html` | 首页 | 四扇门：咖啡旅程 / 豆子百科 / 咖啡知识库 / 出海服务台 |
| `journey.html` + `journey.js` | 消费者 · 咖啡旅程 | 五段旅程：第一杯测评 → 风味地图 → 含义 → 从豆到杯 → 咖啡人格卡（可分享/下载）；推荐豆可点进豆子百科 |
| `beans.html` + `beans.js` | 消费者 · 豆子百科 | 23 支豆六段式百科（产地档案/风味科学/历史故事/冲煮指南/健康与文化/市售对应）+ 风味轴筛选 + 市售对应产品（`drinks.js`，44 款）+ 深链自动弹详情 |
| `knowledge.html` + `knowledge.js` | 消费者 · 咖啡知识库 | 四章 18 节深读：风味化学 / 咖啡因与健康 / 全球咖啡史与贸易 / 中国咖啡产业，16 条论文/报告来源（含真实 DOI） |
| `market.html` + `market.js` | 商家 · 出海服务台 | 晓市场 6 国打分 + 商品文案（按推荐市场语言生成、每种附中文翻译，DeepSeek 逐语言生成+失败自动重试）+ 六大环节全链路服务（手风琴，每环节 7 条可执行清单）+ 卖法大全（8 种出海卖货方法）+ 六国合规卡（标签页，`compliance.js`） |

## 数据文件

- `chain.js`：从豆到杯全链路数据（种植→加工→出海→上架→萃取→数据回流），一张数据、双视图（消费者故事 / 商家服务台），每环节含执行清单与对应卖法指引。
- `channels.js`：卖法大全 8 扇门（B2B 大宗出口 / 餐饮供货 / 平台电商 / 独立站 DTC / 内容社交电商 / 代理分销 / ODM 代工 / 线下渠道），每门含适合谁、怎么起步、门槛成本、常见坑、咖啡适配。
- `beans.js`：23 支咖啡豆百科（`convert-beans-v2.js` 由 `research-beans-upgrade.json` + `research-beans-asia.json` + `research-beans-afam.json` 合并生成，高 7 / 中 15 / 低 1）。
- `drinks.js`：44 款市售咖啡饮品用豆（`convert-drinks-v3.js` 由 `research-drinks-v3.json` 合并生成，高 12 / 中 28 / 低 4）。
- `compliance.js`：六国出海合规卡（由调研结果 `research-compliance.json` 转换生成）。
- `knowledge.js`：四章 18 节 / 16 条来源（`convert-knowledge.js` 由 `research-knowledge-a.json` + `research-knowledge-b.json` 合并生成）。
- `research-*.json`：各调研子代理的原始产出，保留溯源。
- `styles.css`：全站样式。

## AI 功能（可选）

DeepSeek API Key 只存在浏览器 localStorage（键名 `kahou_ds_key`），不上传、不写进代码。
不填 Key：旅程测评、风味地图、豆子百科、市场打分全部离线可用；只有「AI 宣言 / 四语文案 / AI 顾问」会提示需要 Key。

## 诚实原则

- 所有事实数据标注来源与采集时间（2026-10）；查不到官方来源的写「未公开」。
- 拼配比例、具体配方属商业机密，本平台只引用官方已公开信息。
- 涉及资质、关税、标签合规以各国官方最新规定为准。
