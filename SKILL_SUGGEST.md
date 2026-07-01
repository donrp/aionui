---
name: aionui-daily-github-growth-scan
description: AionUi 每日 GitHub 增长巡检——发现+评分+输出候选清单，不自动提交
---

每天 09:00 跑一次，目标是把 AionUi（免费开源多 Agent 桌面客户端）合理地投进 GitHub 优质合集/生态仓库。**今天只做到「发现+评分+输出候选」，绝不自动 fork/push/开 PR——必须等用户明确说"提交"才动对外操作。**

## 前置
- 先 `Skill: aionui-github-marketing` 加载主 skill（方法论、定位口径、红线都在那）。
- `gh` 若报 401：`unset GITHUB_TOKEN` 后重试（env var 优先级高于 keyring）。

## 步骤
1. **读台账**：`~/.aionui/skills/aionui-github-marketing/submissions.md`。已提交表 + 候选池 + "已评估剔除"表里的仓库全部跳过，不重复发现/不重复投。
2. **搜新库**：`gh search repos "<query>" --sort stars --limit N --json fullName,stargazersCount,updatedAt`。覆盖角度：awesome mcp clients / awesome acp agent / awesome ai agents / awesome llm apps / awesome claude code / 新模型 CLI（kimi/glm/minimax 等）。优先新出现、上升趋势、官方组织、高 star 还活跃合 PR 的。也优先消化候选池里待投的。
3. **逐个验证**（动手前必查）：
   - 查重：`gh pr list --repo <r> --state all --search "aionui in:title,body"` 必须为空。
   - 活跃度：`gh pr list --repo <r> --state merged --limit 3 --json mergedAt` 看最近合 PR 时间，停更（>半年）的判死库。
   - 角色成立性：读 README/现有条目，确认有「桌面客户端/可接入工具」这类目录，AionUi 能自然入列（看有没有 Cherry Studio/Cline/5ire/LobeHub 同类）。收 Python demo 代码、纯插件/命令的目录 = AionUi 无位置 = 剔除。
4. **打分**（《仓库类型胜率判断法》，相关度+活跃度+收益，<4/5 剔除）。
5. **输出候选清单**：表格列=仓库/star/类型/AionUi 拟扮演角色/拟插入位置/相关·活跃·收益/匹配分，按匹配分排序；给出今日最推荐先投的 1 个 + 理由。剔除的也列出来并写原因。
6. **回写台账**：新高分库进"候选池"；已评估剔除的进"已评估剔除"表（记 star/原因/评估日），避免明天重复发现。

## 输出风格
- 简洁、表格化、可直接拍板。结尾明确一句"等你挑，说『提交 X』我才 fork/开 PR"。
- 诚实：只标 AionUi 真有的能力；活跃度/查重结论附证据（PR 号+日期）。

## 红线
- 不自动对外（fork 可在 /tmp 先做但 push/开 PR 必须等确认；本次连 fork 都不做）。
- 匹配分 <4 不投。一个 PR 只投一个仓库。不写 AionUi 没有的功能。

## 关键经验（踩坑/提速）
- **AionUi 已收录的热门库直接跳过**：用 `gh api repos/<r>/readme --jq .content | base64 -d | grep -i aionui` 核查。本类任务里 awesome-gemini-cli、tabtabtabai/awesome-acp 都已收录 AionUi。
- **0★ 库剔除**：`gh api repos/<r> --jq '.stargazers_count'`，没流量=没收益，即便格式契合也不投。
- **`gh search prs --state` 只接受 open/closed，不接受 all**；查重改用 `gh search prs "AionUi" --repo <r>` 或对 open/closed 各跑一次。
- **ACP 生态是当前最热的高频赛道**（官方 registry 每天更新、多个 awesome-acp 在长），但优质的 awesome-acp 多已收录 AionUi——重点转向"上游 CLI 本体生态区"和"通用 OSS agent 集"。

## 2026-06-30 执行结果（参考）
- 扫 5 大类。已跳过(已收录)：Piebald-AI/awesome-gemini-cli(478★)、tabtabtabai/awesome-acp。
- 剔除：mihaiwillberich/awesome-desktop-ai-assistants(0★)、machinae/awesome-claws(只收 OpenClaw fork)。
- **首推 Jenqyang/Awesome-AI-Agents**(1179★，活跃，CONTRIBUTING 收 OSS 应用，AionUi 未收录，4.5/5)，放 Applications → Multi-Agent Task Solver，单行+stars badge 格式直投 PR。

## 2026-07-01 执行结果（参考）
- 3 个 submitted PR 仍全部 OPEN(deepseek #269 / mcp-clients #230 / Jenqyang #347)——待跟踪，未合。
- **首推 MiniMax-AI/awesome-minimax-integrations**(76★，官方组织，4/5)：投 Developer Tools 区，HTML 三列表格(Logo/Product/Description)，与 TRAE/OpenRouter 同列；MiniMax OpenAI 兼容 API → AionUi 接入属实。**唯一隐患**：现有 6 PR 全 open、最近 merge 停在 01-30，活跃度存疑，投前提示用户。
- 剔除：machinae/awesome-claws(只收 OpenClaw 系,2/5)、agentclientprotocol/registry(只收 agents 不收 client,角色不符 2/5)、jim-schwoebel/slavakurilyak/rohitg00 通用集(被 x402/MCP-server 刷屏+近期无 merge,3/5)。
- 经验：官方模型组织的 `<Vendor>-AI/awesome-*-integrations` 是最佳新猎物(品牌背书)，但要先看 PR merge 节奏别投进死档；ACP registry 是「agents」注册表不是客户端集，别再误投。

## 2026-07-01（第二轮/上午巡检）执行结果（参考）
- **首推 awesome-opencode/awesome-opencode**(8.5k★，5/5，本轮最佳)：上游 CLI 生态区(最高胜率类型)，Anomaly 官方组织，6-27 仍合外部条目。贡献机制最干净——`contributing.md` 明确"加 YAML 数据文件、别改 README"，只需 fork→`data/projects/aionui.yaml`(name/repo/tagline/description 四字段)→PR，CI 自动生成 README，几乎零格式风险。Projects 区已有 OpenChamber/OpenWork/CodeWalk 等同类 GUI。差异化：tagline 突出"多 Agent/多 LLM/跨平台，不止 OpenCode"。
- 剔除：RoggeOhta/awesome-codex-cli(360★，有 GUI 区且 AionUi 支持 Codex，但**外部 PR 全挂 open 从不 merge、只维护者自 commit**，最近提交停 2026-04，openness+活跃双低，3/5)；jim-schwoebel 通用集(最近合 PR 停 2026-03,半停更,3/5)。
- 现成背书:Piebald-AI/awesome-gemini-cli 已社区自发收录 AionUi(Interfaces 区)，无需投。
- **新经验**:数据驱动型 awesome(README 由 CI 从 `data/*.yaml` 生成，如 awesome-opencode)是最优质投稿目标——先看 repo 根目录有无 `data/` + `contributing.md`，YAML 提交比手改 README 格式风险低一个数量级。判断上游 CLI 生态区能否投，先 `grep -i <cli> AionUi/README` 确认 AionUi 真支持该 CLI。判断 openness 别只看 star/commit，要 `gh pr list --state merged` 看是否真合**外部**PR——很多库维护者只自 commit、外部 PR 全晾着。
