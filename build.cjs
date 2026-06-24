#!/usr/bin/env node

/**
 * EJU Math Builder
 * ================
 * 读取 data/ 下所有 JSON（Dify 工作流输出） → 合并 → 生成可部署的 JSX 页面
 *
 * 用法:
 *   node build.js                    # 读取 ./data/ 输出到 ./dist/eju-math.jsx
 *   node build.js --data ./my-data   # 指定数据目录
 *   node build.js --out ./output.jsx # 指定输出文件
 *
 * 数据目录结构:
 *   data/
 *   ├── 2011_R1_course1.json
 *   ├── 2011_R1_course2.json
 *   ├── 2011_R2_course1.json
 *   └── ...
 */

const fs = require("fs");
const path = require("path");

// ============================================================
// 1. 解析命令行参数
// ============================================================
const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};

const DATA_DIR = path.resolve(getArg("--data", "./data"));
const OUT_FILE = path.resolve(getArg("--out", "./dist/eju-math.jsx"));
const TEMPLATE_FILE = path.resolve(getArg("--template", "./template/app-template.jsx"));
const TOPIC_GROUPS_FILE = path.resolve(getArg("--topic-groups", "./template/topicGroups.js"));

console.log(`📂 数据目录: ${DATA_DIR}`);
console.log(`📄 模板文件: ${TEMPLATE_FILE}`);
console.log(`📦 输出文件: ${OUT_FILE}`);
console.log("");

// ============================================================
// 2. 读取所有 JSON 文件
// ============================================================
if (!fs.existsSync(DATA_DIR)) {
  console.error(`❌ 数据目录不存在: ${DATA_DIR}`);
  process.exit(1);
}

const allFiles = fs.readdirSync(DATA_DIR);
const jsonFiles = allFiles.filter(f => f.endsWith(".json")).sort();
const skippedFiles = allFiles.filter(f => !f.endsWith(".json") && !f.startsWith("."));
console.log(`📑 发现 ${jsonFiles.length} 个 JSON 文件:`);
jsonFiles.forEach(f => console.log(`   - ${f}`));
if (skippedFiles.length > 0) {
  console.log(`\n⚠️  跳过了 ${skippedFiles.length} 个非 JSON 文件（检查命名是否有错）:`);
  skippedFiles.forEach(f => console.log(`   - ${f}`));
}
console.log("");

// ============================================================
// 3. 合并为 examDatabase 结构
// ============================================================
//    examDatabase = {
//      course1: { id, name, ..., exams: { "2011-1": { id, title, ..., questions: [...] } } },
//      course2: { ... }
//    }
const examDatabase = {};
const buildReport = { total: 0, passed: 0, needsReview: 0, errors: [] };

for (const file of jsonFiles) {
  const filePath = path.join(DATA_DIR, file);
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    buildReport.errors.push(`❌ JSON 解析失败: ${file} - ${e.message}`);
    continue;
  }

  const meta = raw.metadata;
  if (!meta || !meta.course || !meta.year || !meta.session) {
    buildReport.errors.push(`❌ 缺少 metadata: ${file}`);
    continue;
  }

  const courseKey = meta.course; // "course1" | "course2"
  const examKey = `${meta.year}-${meta.session}`; // "2011-1"

  // 初始化 course
  if (!examDatabase[courseKey]) {
    examDatabase[courseKey] = {
      id: courseKey,
      name: meta.courseNameJa || (courseKey === "course1" ? "数学1" : "数学2"),
      nameEn: meta.courseNameEn || "",
      description: meta.description || "",
      color: meta.color || (courseKey === "course1" ? "#2563eb" : "#dc2626"),
      exams: {}
    };
  }

  // 转换每道题：将 JSON 格式转为 JSX 数据格式
  const questions = (raw.questions || []).map(q => {
    buildReport.total++;
    if (q.answer_match) buildReport.passed++;
    if (q.needs_review) buildReport.needsReview++;

      const converted = {
      id: q.id,
      number: q.number,
      topic: q.topic,
      topicTag: q.topicTag,
      humanVerified: q.humanVerified || false,
      question: q.japanese,
      solution: q.solution
    };
    
    // 物理题：透传选项、正确答案、图片路径
    if (q.questionType) converted.questionType = q.questionType;
    if (q.options) converted.options = q.options;
    if (q.questionImage) converted.questionImage = q.questionImage;

    // 处理 SVG 图表（JSON 中以 SVG 字符串存储，JSX 中需要特殊渲染）
    if (q.questionDiagram && q.questionDiagram.svg) {
      converted.questionDiagramSvg = q.questionDiagram.svg;
    }

    // 处理解题步骤中的图表
    if (converted.solution && converted.solution.steps) {
      converted.solution.steps = converted.solution.steps.map(step => {
        const s = { ...step };
        if (step.diagram && step.diagram.svg) {
          s.diagramSvg = step.diagram.svg;
          delete s.diagram;
        }
        return s;
      });
    }

    return converted;
  });

  // 写入 exam — 标题统一规范化为「YYYY年度（令和/平成 X年）第Z回」
  examDatabase[courseKey].exams[examKey] = {
    id: examKey,
    title: normalizeExamTitle(meta.year, meta.session),
    date: meta.examDate,
    questions
  };

  console.log(`✅ ${file} → ${courseKey} / ${examKey} (${questions.length} 题)`);
}

// 把 (年份, 回数) 规范化成数学一致的「2024年度（令和6年）第1回」格式
function normalizeExamTitle(year, session) {
  const y = parseInt(year, 10);
  let era = "";
  if (y >= 2019) era = `令和${y - 2018}年`;
  else if (y >= 1989) era = `平成${y - 1988}年`;
  else if (y >= 1926) era = `昭和${y - 1925}年`;
  return era ? `${year}年度（${era}）第${session}回` : `${year}年度 第${session}回`;
}

// ============================================================
// 4. 生成报告
// ============================================================
console.log("\n" + "=".repeat(50));
console.log("📊 构建报告");
console.log("=".repeat(50));
console.log(`总题数: ${buildReport.total}`);
console.log(`答案匹配: ${buildReport.passed} ✅`);
console.log(`需人工审查: ${buildReport.needsReview} ⚠️`);
if (buildReport.errors.length) {
  console.log(`错误:`);
  buildReport.errors.forEach(e => console.log(`  ${e}`));
}
console.log("");

// 汇总各 course/exam 的题目数
for (const [ck, cv] of Object.entries(examDatabase)) {
  const examCount = Object.keys(cv.exams).length;
  const qCount = Object.values(cv.exams).reduce((s, e) => s + e.questions.length, 0);
  console.log(`${cv.name} (${ck}): ${examCount} 套试卷, ${qCount} 题`);
}

// ============================================================
// 5. 读取模板并注入数据
// ============================================================
if (!fs.existsSync(TEMPLATE_FILE)) {
  console.error(`\n❌ 模板文件不存在: ${TEMPLATE_FILE}`);
  console.log("请先运行 extract-template.js 从现有 JSX 中提取模板。");
  process.exit(1);
}

let template = fs.readFileSync(TEMPLATE_FILE, "utf8");

// 生成 examDatabase 的 JS 代码
const dataCode = `const examDatabase = ${JSON.stringify(examDatabase, null, 2)};`;

// 替换模板中的占位符
if (!template.includes("__EXAM_DATABASE__")) {
  console.error("❌ 模板中未找到 __EXAM_DATABASE__ 占位符");
  process.exit(1);
}

const output = template.replace(
  "const examDatabase = __EXAM_DATABASE__;",
  dataCode
);

// ============================================================
// 6. 写入输出文件
// ============================================================
const outDir = path.dirname(OUT_FILE);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(OUT_FILE, output, "utf8");

// 同时把 topicGroups.js 拷贝到 dist/，让 eju-math.jsx 里的 import "./topicGroups.js" 能解析
if (fs.existsSync(TOPIC_GROUPS_FILE)) {
  const topicGroupsOut = path.join(outDir, "topicGroups.js");
  fs.copyFileSync(TOPIC_GROUPS_FILE, topicGroupsOut);
  console.log(`📋 复制 topicGroups.js → ${topicGroupsOut}`);
} else {
  console.warn(`⚠️  未找到 topicGroups.js: ${TOPIC_GROUPS_FILE}`);
}

const sizeKB = (Buffer.byteLength(output, "utf8") / 1024).toFixed(1);
console.log(`\n✨ 构建完成: ${OUT_FILE} (${sizeKB} KB)`);
console.log(`   课程数: ${Object.keys(examDatabase).length}`);
console.log(`   试卷数: ${Object.values(examDatabase).reduce((s, c) => s + Object.keys(c.exams).length, 0)}`);
console.log(`   总题数: ${buildReport.total}`);
