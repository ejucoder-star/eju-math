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

const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json")).sort();
console.log(`📑 发现 ${jsonFiles.length} 个 JSON 文件:`);
jsonFiles.forEach(f => console.log(`   - ${f}`));
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

    // 物理选择题：透传选项与正确答案
    if (q.questionType) converted.questionType = q.questionType;
    if (q.options) converted.options = q.options;

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

  // 写入 exam
  examDatabase[courseKey].exams[examKey] = {
    id: examKey,
    title: meta.examTitle,
    date: meta.examDate,
    questions
  };

  console.log(`✅ ${file} → ${courseKey} / ${examKey} (${questions.length} 题)`);
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

const sizeKB = (Buffer.byteLength(output, "utf8") / 1024).toFixed(1);
console.log(`\n✨ 构建完成: ${OUT_FILE} (${sizeKB} KB)`);
console.log(`   课程数: ${Object.keys(examDatabase).length}`);
console.log(`   试卷数: ${Object.values(examDatabase).reduce((s, c) => s + Object.keys(c.exams).length, 0)}`);
console.log(`   总题数: ${buildReport.total}`);
