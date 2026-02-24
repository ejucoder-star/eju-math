import { useState, useEffect, useRef, useCallback } from "react";

// ==================== GLOBAL KATEX LOADER ====================
let _katexLoadState = "idle";
let _katexCallbacks = [];

function ensureKaTeX(cb) {
  if (_katexLoadState === "ready") { cb(); return; }
  _katexCallbacks.push(cb);
  if (_katexLoadState === "loading") return;
  _katexLoadState = "loading";
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css";
  document.head.appendChild(link);
  const s1 = document.createElement("script");
  s1.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js";
  s1.onload = () => {
    const s2 = document.createElement("script");
    s2.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js";
    s2.onload = () => { _katexLoadState = "ready"; _katexCallbacks.forEach(fn => fn()); _katexCallbacks = []; };
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
}

function renderMath(el) {
  if (el && window.renderMathInElement) {
    window.renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
    });
  }
}

// ==================== MATH TEXT COMPONENT ====================
const MathText = ({ children, style = {} }) => {
  const ref = useRef(null);
  const [ready, setReady] = useState(_katexLoadState === "ready");

  useEffect(() => {
    if (_katexLoadState === "ready") { setReady(true); return; }
    ensureKaTeX(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready && ref.current) renderMath(ref.current);
  }, [ready, children]);

  const lines = String(children).split("\n");
  return (
    <div ref={ref} style={style}>
      {lines.map((l, i) => (
        <span key={i}>{l}{i < lines.length - 1 && <br />}</span>
      ))}
    </div>
  );
};

// ==================== SVG DIAGRAM (renders from JSON string) ====================
const SvgDiagram = ({ svg }) => {
  if (!svg) return null;
  return (
    <div
      style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

// ==================== ICONS ====================
const ChevUp = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>;
const BookIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const ChkIco = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const WhyIco = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;

// ==================== WHY BUTTON ====================
const WhyButton = ({ text }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: "10px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "5px 12px", borderRadius: "8px",
          border: "1.5px solid " + (open ? "#7c3aed" : "#d6d3d1"),
          background: open ? "rgba(124,58,237,0.04)" : "#fff",
          color: open ? "#7c3aed" : "#78716c",
          fontSize: "12.5px", fontWeight: "600", cursor: "pointer"
        }}
      >
        <WhyIco /> {open ? "收起" : "为什么？"}
      </button>
      {open && (
        <div style={{
          marginTop: "8px", padding: "12px 14px",
          background: "#f5f3ff", borderRadius: "8px", border: "1px solid #ddd6fe"
        }}>
          <MathText style={{ color: "#4c1d95", lineHeight: "2", fontSize: "13.5px" }}>{text}</MathText>
        </div>
      )}
    </div>
  );
};

// ==================== SOLUTION PANEL ====================
const SolutionPanel = ({ solution, humanVerified }) => (
  <div style={{ background: "#fafaf9", borderRadius: "12px", border: "1px solid #e7e5e4", overflow: "hidden" }}>
    <div style={{ padding: "18px 22px", borderBottom: "1px solid #e7e5e4" }}>
      <span style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "99px" }}>中文翻译</span>
      <MathText style={{ color: "#44403c", lineHeight: "1.9", fontSize: "14px", marginTop: "10px" }}>{solution.translation}</MathText>
    </div>
    <div style={{ padding: "18px 22px", borderBottom: "1px solid #e7e5e4" }}>
      <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "99px" }}>解题思路</span>
      <MathText style={{ color: "#44403c", lineHeight: "1.85", fontSize: "14px", marginTop: "10px" }}>{solution.analysis}</MathText>
    </div>
    <div style={{ padding: "18px 22px", borderBottom: "1px solid #e7e5e4" }}>
      <span style={{ background: "#dcfce7", color: "#166534", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "99px" }}>详细步骤</span>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "14px" }}>
        {solution.steps.map((step, i) => (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "50%", background: "#292524", color: "#fff", fontSize: "11px", fontWeight: "800", flexShrink: 0 }}>{i + 1}</span>
              <MathText style={{ fontSize: "13.5px", fontWeight: "700", color: "#1c1917" }}>{step.title}</MathText>
            </div>
            <div style={{ marginLeft: "30px", padding: "14px 16px", background: "#fff", borderRadius: "8px", border: "1px solid #e7e5e4" }}>
              <MathText style={{ color: "#292524", lineHeight: "2.05", fontSize: "14px" }}>{step.content}</MathText>
              {step.diagramSvg && <SvgDiagram svg={step.diagramSvg} />}
              {step.why && <WhyButton text={step.why} />}
            </div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ padding: "18px 22px", background: "#f5f5f4" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
        <span style={{ background: "#292524", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "99px" }}>最终答案</span>
        {humanVerified
          ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#16a34a", fontWeight: "600" }}><ChkIco /> 人工校对通过</span>
          : <span style={{ fontSize: "11px", color: "#a8a29e", fontWeight: "500" }}>⏳ 待人工校对</span>
        }
      </div>
      <MathText style={{ color: "#1c1917", lineHeight: "2", fontSize: "14.5px", fontWeight: "500" }}>{solution.finalAnswer}</MathText>
    </div>
  </div>
);

// ==================== QUESTION CARD ====================
const QuestionCard = ({ question }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #d6d3d1", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e7e5e4" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "48px", height: "34px", borderRadius: "9px", background: "#1c1917", color: "#fff", fontSize: "12.5px", fontWeight: "800", padding: "0 10px" }}>{question.number}</span>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#44403c" }}>{question.topic}</div>
        </div>
        <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "99px", background: "#f5f5f4", color: "#78716c", border: "1px solid #e7e5e4", whiteSpace: "nowrap" }}>{question.topicTag}</span>
      </div>
      <div style={{ padding: "18px 20px" }}>
        <MathText style={{ fontSize: "14.5px", lineHeight: "2", color: "#1c1917" }}>{question.question}</MathText>
        {question.questionDiagramSvg && <SvgDiagram svg={question.questionDiagramSvg} />}
      </div>
      <div style={{ padding: "0 20px 18px" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
            width: "100%", padding: "11px", borderRadius: "10px",
            border: open ? "1.5px solid #292524" : "1.5px solid #d6d3d1",
            background: open ? "#292524" : "#fff",
            color: open ? "#fff" : "#57534e",
            fontSize: "13.5px", fontWeight: "600", cursor: "pointer"
          }}
        >
          {open ? <><span>收起解析</span> <ChevUp /></> : <><BookIco /> <span>查看解析</span></>}
        </button>
      </div>
      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          <SolutionPanel solution={question.solution} humanVerified={question.humanVerified} />
        </div>
      )}
    </div>
  );
};

// ==================== EXAM DATA (injected by build.js) ====================
const examDatabase = {
  "course1": {
    "id": "course1",
    "name": "数学1",
    "nameEn": "Course 1 (Basic)",
    "description": "基础课程｜文科方向",
    "color": "#2563eb",
    "exams": {
      "2011-1": {
        "id": "2011-1",
        "title": "2011年度（平成23年）第1回",
        "date": "2011年6月",
        "questions": [
          {
            "id": "c1-I-1",
            "number": "I-1",
            "topic": "二次函数最值",
            "topicTag": "二次函数",
            "humanVerified": false,
            "question": "已知 $x, y$ 满足\n$$3x + y = 18, \\quad x \\geqq 1, \\quad y \\geqq 6$$\n求 $xy$ 的最大值和最小值。\n\n将 $xy$ 用 $x$ 表示并配方，得\n$$xy = \\fbox{AB}\\left(x - \\fbox{C}\\right)^2 + \\fbox{DE}$$\n\n$x$ 的取值范围为\n$$\\fbox{F} \\leqq x \\leqq \\fbox{G}$$\n\n因此 $xy$ 在 $x = \\fbox{H}$ 时取最大值 $\\fbox{IJ}$，\n在 $x = \\fbox{K}$ 时取最小值 $\\fbox{LM}$。",
            "solution": {
              "translation": "$x, y$ 满足 $3x + y = 18,\\ x \\geqq 1,\\ y \\geqq 6$。求 $xy$ 的最大值和最小值。",
              "analysis": "条件最值问题。消元后配方，在闭区间上求最值。",
              "steps": [
                {
                  "title": "消元并配方",
                  "content": "由 $y = 18 - 3x$ 代入，得\n$$xy = x(18-3x) = -3x^2 + 18x = -3(x-3)^2 + 27$$\n\n因此 $\\fbox{AB} = -3$，$\\fbox{C} = 3$，$\\fbox{DE} = 27$。",
                  "why": "配方得顶点式，可直接看出顶点 $(3, 27)$，开口方向 $a = -3 < 0$（朝下）。"
                },
                {
                  "title": "确定定义域",
                  "content": "由 $x \\geqq 1$ 且 $y = 18-3x \\geqq 6$ 得 $x \\leqq 4$。\n\n所以 $1 \\leqq x \\leqq 4$，即 $\\fbox{F} = 1$，$\\fbox{G} = 4$。",
                  "why": null
                },
                {
                  "title": "求最值",
                  "content": "顶点 $x = 3$ 在区间 $[1, 4]$ 内，\n最大值 $= 27$（$x = 3$）。\n\n比较端点：$f(1) = -3 + 18 = 15$，$f(4) = -48 + 72 = 24$。\n最小值 $= 15$（$x = 1$）。\n\n$\\fbox{H} = 3$，$\\fbox{IJ} = 27$，$\\fbox{K} = 1$，$\\fbox{LM} = 15$。",
                  "why": "开口朝下的抛物线在闭区间上，最小值一定在离顶点最远的端点取得。$|1-3| = 2 > |4-3| = 1$，所以最小值在 $x=1$。"
                }
              ],
              "finalAnswer": "$xy$ 的最大值为 $27$（$x = 3$），最小值为 $15$（$x = 1$）。"
            }
          },
          {
            "id": "c1-I-2",
            "number": "I-2",
            "topic": "无理数与小数部分",
            "topicTag": "实数与无理数",
            "humanVerified": false,
            "question": "正实数 $a, b$ 满足\n$$a^2 = 3 + \\sqrt{5}, \\quad b^2 = 3 - \\sqrt{5}$$\n设 $a + b$ 的小数部分为 $c$，求 $\\dfrac{1}{c} - c$ 的值。\n\n(1)　$(ab)^2 = \\fbox{N}$，$(a+b)^2 = \\fbox{OP}$\n\n(2)　$\\fbox{Q} < a + b < \\fbox{Q} + 1$，所以 $c = \\sqrt{\\fbox{RS}} - \\fbox{T}$。\n从而 $\\dfrac{1}{c} - c = \\fbox{U}$。\n\n注）小数部分：fractional portion",
            "solution": {
              "translation": "正实数 $a, b$ 满足 $a^2 = 3+\\sqrt{5}$，$b^2 = 3-\\sqrt{5}$，$c$ 为 $a+b$ 的小数部分。求 $\\frac{1}{c}-c$。",
              "analysis": "先求 $(ab)^2$ 和 $(a+b)^2$，再确定整数部分，提取小数部分，有理化求值。",
              "steps": [
                {
                  "title": "求积与和的平方",
                  "content": "$(ab)^2 = a^2 b^2 = (3+\\sqrt{5})(3-\\sqrt{5}) = 9-5 = 4$，$\\fbox{N}=4$。\n\n$(a+b)^2 = a^2 + 2ab + b^2 = (3+\\sqrt{5}) + 2 \\cdot 2 + (3-\\sqrt{5}) = 10$，$\\fbox{OP}=10$。",
                  "why": "由于 $a,b>0$，所以 $ab=2$，$a+b=\\sqrt{10}$。"
                },
                {
                  "title": "确定整数部分和小数部分",
                  "content": "$\\sqrt{9} < \\sqrt{10} < \\sqrt{16}$，即 $3 < a+b < 4$，$\\fbox{Q}=3$。\n\n小数部分 $c = \\sqrt{10} - 3$，即 $\\sqrt{\\fbox{RS}} - \\fbox{T} = \\sqrt{10} - 3$。",
                  "why": null
                },
                {
                  "title": "求 $1/c - c$",
                  "content": "$\\dfrac{1}{c} = \\dfrac{1}{\\sqrt{10}-3} = \\dfrac{\\sqrt{10}+3}{(\\sqrt{10}-3)(\\sqrt{10}+3)} = \\dfrac{\\sqrt{10}+3}{10-9} = \\sqrt{10}+3$\n\n$\\dfrac{1}{c} - c = (\\sqrt{10}+3)-(\\sqrt{10}-3) = 6$，$\\fbox{U}=6$。",
                  "why": "有理化分母是处理无理数分式的基本方法。"
                }
              ],
              "finalAnswer": "$\\frac{1}{c}-c = 6$"
            }
          },
          {
            "id": "c1-II-1",
            "number": "II-1",
            "topic": "概率与期望值",
            "topicTag": "概率与期望值",
            "humanVerified": false,
            "question": "箱中有写着 1 到 9 各一个整数的 9 张卡片。从中同时取出 2 张。\n\n设取出的 2 张卡片上数字之和为 $S$。\n\n(1)　$S \\leqq 5$ 的概率为 $\\dfrac{\\fbox{A}}{\\fbox{B}}$。规定 $S \\leqq 5$ 时得分为 $10 - S$，\n$S > 5$ 时得分为 2。此时得分的期望值为 $\\dfrac{\\fbox{CD}}{\\fbox{EF}}$。\n\n(2)　将上述试行重复 2 次（第 1 次取出的卡片放回后再进行第 2 次）。\n\n(i)　2 次都满足 $S \\leqq 5$ 的概率为 $\\dfrac{\\fbox{G}}{\\fbox{HI}}$。\n\n(ii)　至少 1 次满足 $S \\leqq 5$ 的概率为 $\\dfrac{\\fbox{JK}}{\\fbox{LM}}$。\n\n注）期望值：expected value，试行：trial",
            "solution": {
              "translation": "箱中有数字1-9的9张卡，同时抽2张，令 $S$ = 两数之和。\n(1) 求 $P(S \\leq 5)$ 和得分期望值。\n(2) 放回抽样做2次，求相关概率。",
              "analysis": "组合计数求概率，再用期望公式和独立事件公式。",
              "steps": [
                {
                  "title": "$P(S \\leq 5)$",
                  "content": "总数 $C_9^2 = 36$。\n$S \\leq 5$ 的组合：$(1,2)$, $(1,3)$, $(1,4)$, $(2,3)$，共 4 组。\n\n$P(S \\leq 5) = \\dfrac{4}{36} = \\dfrac{1}{9}$，$\\fbox{A}=1$，$\\fbox{B}=9$。",
                  "why": null
                },
                {
                  "title": "期望值",
                  "content": "$S \\leq 5$ 时得分 $10-S$：$S=3 \\to 7$，$S=4 \\to 6$，$S=5 \\to 5$（2组）。\n各概率 $\\frac{1}{36}$，得分总和 $= 7+6+5+5=23$。\n\n$S>5$ 时得 2 分，有 32 组，得分总和 $= 32 \\times 2 = 64$。\n\n$E = \\dfrac{23+64}{36} = \\dfrac{87}{36} = \\dfrac{29}{12}$，$\\fbox{CD}=29$，$\\fbox{EF}=12$。",
                  "why": "期望值 = 各得分乘以对应概率之和。"
                },
                {
                  "title": "放回抽样",
                  "content": "(i) 两次都 $S \\leq 5$：$P = (\\frac{1}{9})^2 = \\dfrac{1}{81}$，$\\fbox{G}=1$，$\\fbox{HI}=81$。\n\n(ii) 至少一次 $S \\leq 5$：$P = 1 - P(\\text{两次都}>5) = 1-(\\frac{8}{9})^2 = 1 - \\dfrac{64}{81} = \\dfrac{17}{81}$，$\\fbox{JK}=17$，$\\fbox{LM}=81$。",
                  "why": "放回抽样，两次独立。用对立事件更方便：$P(\\text{至少一次}) = 1 - P(\\text{零次})$。"
                }
              ],
              "finalAnswer": "$P(S \\leq 5)=\\frac{1}{9}$，期望值 $\\frac{29}{12}$；两次都 $\\leq 5$ 的概率 $\\frac{1}{81}$，至少一次 $\\leq 5$ 的概率 $\\frac{17}{81}$。"
            }
          },
          {
            "id": "c1-II-2",
            "number": "II-2",
            "topic": "二次函数与直线交点",
            "topicTag": "二次函数与判别式",
            "humanVerified": false,
            "question": "设 $a$ 为常数。对 $x$ 的两个函数\n$$f(x) = 2x^2 + x + a - 2$$\n$$g(x) = -4x - 5$$\n调查满足 $f(x) = g(x)$ 的实数 $x$ 及其对应的函数值。\n\n(1)　从 ⓪~⑧ 中为 $\\fbox{N}$、$\\fbox{O}$、$\\fbox{P}$ 选择合适的选项。\n当 $\\fbox{N}$ 时，$f(x) = g(x)$ 有 2 个实数解。\n当 $\\fbox{O}$ 时，$f(x) = g(x)$ 恰有 1 个实数解。\n当 $\\fbox{P}$ 时，$f(x) = g(x)$ 无实数解。\n⓪ $a > \\frac{1}{8}$　① $a = \\frac{17}{8}$　② $a = \\frac{1}{6}$　③ $a < \\frac{1}{6}$　④ $a < \\frac{17}{8}$\n⑤ $a < \\frac{1}{8}$　⑥ $a > \\frac{1}{6}$　⑦ $a = \\frac{1}{8}$　⑧ $a > \\frac{17}{8}$\n\n(2)　当 $\\fbox{N}$ 时，$f(x) = g(x)$ 的解为 $x = \\dfrac{-\\fbox{Q} \\pm \\sqrt{\\fbox{R} - \\fbox{S}a}}{\\fbox{T}}$，\n此时两个函数的值为 $\\mp\\sqrt{\\fbox{U} - \\fbox{V}a}$（复号同顺）。\n\n当 $\\fbox{O}$ 时，$x = -\\dfrac{\\fbox{W}}{\\fbox{X}}$，函数值为 $\\fbox{Y}$。\n\n(3)　$f(x) = g(x)$ 时函数值的绝对值不小于 3 的条件为 $a \\leqq -\\fbox{Z}$。\n\n注）绝对值：absolute value",
            "solution": {
              "translation": "$f(x)=2x^2+x+a-2$，$g(x)=-4x-5$。调查 $f(x)=g(x)$ 时 $x$ 的存在情况和函数值。",
              "analysis": "联立方程化为二次方程，用判别式分类讨论。",
              "steps": [
                {
                  "title": "联立并分类",
                  "content": "$f(x)=g(x)$：$2x^2+5x+a+3=0$\n判别式 $D = 25-8(a+3) = 1-8a$\n\n$D>0$（两解）：$a<\\frac{1}{8}$ → $\\fbox{N}=⑤$\n$D=0$（一解）：$a=\\frac{1}{8}$ → $\\fbox{O}=⑦$\n$D<0$（无解）：$a>\\frac{1}{8}$ → $\\fbox{P}=⓪$",
                  "why": null
                },
                {
                  "title": "求解和函数值",
                  "content": "当 $\\fbox{N}$ 时：$x = \\dfrac{-5 \\pm \\sqrt{1-8a}}{4}$\n$\\fbox{Q}=5$，$\\fbox{R}=1$，$\\fbox{S}=8$，$\\fbox{T}=4$\n\n函数值 $g(x) = -4 \\cdot \\frac{-5 \\pm \\sqrt{1-8a}}{4} - 5 = \\mp\\sqrt{1-8a}$\n$\\fbox{U}=1$，$\\fbox{V}=8$\n\n当 $\\fbox{O}$ 时：$x=-\\frac{5}{4}$，$g(-\\frac{5}{4})=5-5=0$\n$\\fbox{W}=5$，$\\fbox{X}=4$，$\\fbox{Y}=0$",
                  "why": null
                },
                {
                  "title": "绝对值条件",
                  "content": "函数值 $|\\mp\\sqrt{1-8a}| = \\sqrt{1-8a} \\geqq 3$\n$1-8a \\geqq 9$ → $a \\leqq -1$\n$\\fbox{Z}=1$",
                  "why": "对于重根情况 $a=1/8$，函数值为 0，不满足 $\\geq 3$。所以只需考虑两解的情况。"
                }
              ],
              "finalAnswer": "$\\fbox{N}=⑤$，$\\fbox{O}=⑦$，$\\fbox{P}=⓪$；绝对值条件 $a \\leqq -1$。"
            }
          },
          {
            "id": "c1-III",
            "number": "III",
            "topic": "二次函数参数与平移",
            "topicTag": "二次函数与平移",
            "humanVerified": false,
            "question": "设 $a$ 为常数，考虑 $x$ 的二次函数\n$$y = 2x^2 + ax + 3 \\qquad \\cdots\\cdots ①$$\n设 ① 的图像顶点位于第一象限。\n\n(1)　$a$ 的取值范围为\n$$\\fbox{AB}\\sqrt{\\fbox{C}} < a < \\fbox{D}$$\n满足此不等式的最小整数 $a$ 为 $\\fbox{EF}$。\n\n(2)　在 ① 中令 $a = \\fbox{EF}$，将 ① 的图像沿 $x$ 轴方向平移 $-\\dfrac{1}{n}$，沿 $y$ 轴方向平移 $\\dfrac{6}{n^2}$ 后的方程为\n$$y = 2x^2 + px + q$$\n此时\n$$p = \\frac{\\fbox{G}}{n} - \\fbox{H}, \\quad q = \\frac{\\fbox{I}}{n^2} - \\frac{\\fbox{J}}{n} + \\fbox{K}$$\n\n(3)　使 $p$ 为整数的自然数 $n$ 共有 $\\fbox{L}$ 个。\n其中 $q$ 也为整数时，$q$ 最小值在 $n = \\fbox{M}$ 时取得，其值为 $q = \\fbox{N}$。\n\n注）第一象限：first (upper right-hand) quadrant",
            "solution": {
              "translation": "$y=2x^2+ax+3$ 的顶点在第一象限。求 $a$ 的范围、平移后参数与整数条件。",
              "analysis": "顶点坐标用 $a$ 表示 → 第一象限条件列不等式 → 平移后展开求系数 → 整除分析。",
              "steps": [
                {
                  "title": "第一象限条件",
                  "content": "顶点 $\\left(-\\frac{a}{4},\\ 3-\\frac{a^2}{8}\\right)$\n\n$x > 0$：$-\\frac{a}{4} > 0$ → $a < 0$\n$y > 0$：$3-\\frac{a^2}{8} > 0$ → $a^2 < 24$ → $|a| < 2\\sqrt{6}$\n\n合并：$-2\\sqrt{6} < a < 0$，$\\fbox{AB}=-2$，$\\fbox{C}=6$，$\\fbox{D}=0$。\n\n$-2\\sqrt{6} \\approx -4.899$，最小整数 $a = -4$，$\\fbox{EF}=-4$。",
                  "why": null
                },
                {
                  "title": "平移后展开",
                  "content": "$a=-4$ 时 $y=2x^2-4x+3$。\n$x$ 方向 $-1/n$，$y$ 方向 $+6/n^2$：\n\n$y = 2(x+\\frac{1}{n})^2 - 4(x+\\frac{1}{n})+3+\\frac{6}{n^2}$\n$= 2x^2 + (\\frac{4}{n}-4)x + (\\frac{8}{n^2}-\\frac{4}{n}+3)$\n\n$p = \\frac{4}{n}-4$，$\\fbox{G}=4$，$\\fbox{H}=4$\n$q = \\frac{8}{n^2}-\\frac{4}{n}+3$，$\\fbox{I}=8$，$\\fbox{J}=4$，$\\fbox{K}=3$",
                  "why": null
                },
                {
                  "title": "整数条件",
                  "content": "$p = \\frac{4}{n}-4$ 为整数 ⟺ $n|4$ ⟹ $n \\in \\{1,2,4\\}$，$\\fbox{L}=3$。\n\n$q$ 的值：\n$n=1$：$q=8-4+3=7$ ✓\n$n=2$：$q=2-2+3=3$ ✓\n$n=4$：$q=\\frac{1}{2}-1+3=\\frac{5}{2}$ ✗\n\n$q$ 最小值 $= 3$，$n=2$。$\\fbox{M}=2$，$\\fbox{N}=3$。",
                  "why": null
                }
              ],
              "finalAnswer": "$a$ 范围：$-2\\sqrt{6}<a<0$；最小整数 $a=-4$；$q$ 最小值 $=3$（$n=2$）。"
            }
          },
          {
            "id": "c1-IV",
            "number": "IV",
            "topic": "圆内接四边形",
            "topicTag": "圆与余弦定理",
            "humanVerified": false,
            "question": "四边形 ABCD 内接于圆 O，满足\n$$AB = BC = \\sqrt{2}, \\quad BD = \\frac{3\\sqrt{3}}{2}, \\quad \\angle ABC = 120^\\circ$$\n且 $AD > CD \\qquad \\cdots\\cdots ①$\n\n(1)　$AC = \\sqrt{\\fbox{A}}$，圆 O 的半径为 $\\sqrt{\\fbox{B}}$。\n\n(2)　设 $AD = x$。$\\angle ADB = \\fbox{CD}^\\circ$，于是 $x$ 满足\n$$4x^2 - \\fbox{EF}x + \\fbox{GH} = 0$$\n\n类似地，设 $CD = y$，则 $y$ 满足\n$$4y^2 - \\fbox{IJ}y + \\fbox{KL} = 0$$\n\n由以上结论及条件 ①，得\n$$AD = \\frac{\\fbox{M} + \\sqrt{\\fbox{N}}}{\\fbox{O}}, \\quad CD = \\frac{\\fbox{P} - \\sqrt{\\fbox{Q}}}{\\fbox{R}}$$\n\n注）内接：be inscribed",
            "questionDiagramSvg": "<svg viewBox=\"0 0 260 260\" style=\"width:100%;max-width:240px;display:block;margin:12px auto\"><circle cx=\"130\" cy=\"130\" r=\"105\" fill=\"none\" stroke=\"#1c1917\" stroke-width=\"1.5\"/><circle cx=\"130\" cy=\"130\" r=\"2\" fill=\"#1c1917\"/><text x=\"138\" y=\"134\" font-size=\"11\" fill=\"#1c1917\">O</text><polygon points=\"197.5,49.6 31.3,94.1 49.6,197.5 210.4,197.5\" fill=\"none\" stroke=\"#1c1917\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/><line x1=\"31.3\" y1=\"94.1\" x2=\"210.4\" y2=\"197.5\" stroke=\"#78716c\" stroke-width=\"1\" stroke-dasharray=\"5,3\"/><line x1=\"197.5\" y1=\"49.6\" x2=\"49.6\" y2=\"197.5\" stroke=\"#78716c\" stroke-width=\"1\" stroke-dasharray=\"5,3\"/><text x=\"203.5\" y=\"43.6\" font-size=\"13\" fill=\"#1c1917\" font-weight=\"700\">A</text><text x=\"15.3\" y=\"92.1\" font-size=\"13\" fill=\"#1c1917\" font-weight=\"700\">B</text><text x=\"33.6\" y=\"211.5\" font-size=\"13\" fill=\"#1c1917\" font-weight=\"700\">C</text><text x=\"216.4\" y=\"211.5\" font-size=\"13\" fill=\"#1c1917\" font-weight=\"700\">D</text></svg>",
            "solution": {
              "translation": "圆内接四边形 ABCD，$AB=BC=\\sqrt{2}$，$BD=\\frac{3\\sqrt{3}}{2}$，$\\angle ABC=120°$，$AD>CD$。求 AC、外接圆半径、AD、CD。",
              "analysis": "余弦定理求 AC → 正弦定理求 R → 圆周角定理 + 余弦定理求 AD, CD。",
              "steps": [
                {
                  "title": "求 AC 和外接圆半径",
                  "content": "在 △ABC 中用余弦定理：\n$AC^2 = AB^2+BC^2-2 \\cdot AB \\cdot BC \\cdot \\cos 120°$\n$= 2+2-2 \\cdot \\sqrt{2} \\cdot \\sqrt{2} \\cdot (-\\frac{1}{2}) = 4+2 = 6$\n$AC = \\sqrt{6}$，$\\fbox{A}=6$\n\n正弦定理：$\\dfrac{AC}{\\sin(\\angle ABC)} = 2R$\n$\\dfrac{\\sqrt{6}}{\\sin 120°} = \\dfrac{\\sqrt{6}}{\\frac{\\sqrt{3}}{2}} = \\dfrac{2\\sqrt{6}}{\\sqrt{3}} = 2\\sqrt{2} = 2R$\n$R = \\sqrt{2}$，$\\fbox{B}=2$",
                  "why": "$\\cos 120° = -1/2$，$\\sin 120° = \\sqrt{3}/2$。",
                  "diagramSvg": "<svg viewBox=\"0 0 280 280\" style=\"width:100%;max-width:260px;display:block;margin:12px auto\"><circle cx=\"130\" cy=\"130\" r=\"105\" fill=\"none\" stroke=\"#d6d3d1\" stroke-width=\"1\"/><polygon points=\"197.5,49.6 31.3,94.1 49.6,197.5 210.4,197.5\" fill=\"none\" stroke=\"#d6d3d1\" stroke-width=\"1\" stroke-linejoin=\"round\"/><polygon points=\"197.5,49.6 31.3,94.1 49.6,197.5\" fill=\"rgba(37,99,235,0.06)\" stroke=\"#2563eb\" stroke-width=\"1.8\" stroke-linejoin=\"round\"/><line x1=\"197.5\" y1=\"49.6\" x2=\"49.6\" y2=\"197.5\" stroke=\"#dc2626\" stroke-width=\"1.5\" stroke-dasharray=\"5,3\"/><text x=\"92\" y=\"62\" font-size=\"10\" fill=\"#2563eb\" font-weight=\"600\">AB=BC=√2</text><text x=\"132\" y=\"116\" font-size=\"10\" fill=\"#dc2626\" font-weight=\"600\">AC=?</text><text x=\"203.5\" y=\"43.6\" font-size=\"12\" fill=\"#1c1917\" font-weight=\"700\">A</text><text x=\"15.3\" y=\"92.1\" font-size=\"12\" fill=\"#1c1917\" font-weight=\"700\">B</text><text x=\"33.6\" y=\"211.5\" font-size=\"12\" fill=\"#1c1917\" font-weight=\"700\">C</text><text x=\"216.4\" y=\"211.5\" font-size=\"12\" fill=\"#a8a29e\" font-weight=\"500\">D</text></svg>"
                },
                {
                  "title": "利用圆周角求 ∠ADB",
                  "content": "在圆内接四边形中，$\\angle ADB = \\angle ACB$（同弧 AB 上的圆周角）。\n在 △ABC 中：$\\dfrac{\\sin(\\angle ACB)}{AB} = \\dfrac{\\sin(\\angle ABC)}{AC}$\n$\\sin(\\angle ACB) = \\dfrac{\\sqrt{2} \\cdot \\frac{\\sqrt{3}}{2}}{\\sqrt{6}} = \\dfrac{\\frac{\\sqrt{6}}{2}}{\\sqrt{6}} = \\frac{1}{2}$\n\n$\\angle ACB = 30°$，所以 $\\angle ADB = 30°$，$\\fbox{CD}=30$。",
                  "why": "圆周角定理：同弧上的圆周角相等。",
                  "diagramSvg": "<svg viewBox=\"0 0 280 280\" style=\"width:100%;max-width:260px;display:block;margin:12px auto\"><circle cx=\"130\" cy=\"130\" r=\"105\" fill=\"rgba(37,99,235,0.04)\" stroke=\"#2563eb\" stroke-width=\"1.5\"/><circle cx=\"130\" cy=\"130\" r=\"2.5\" fill=\"#2563eb\"/><text x=\"138\" y=\"126\" font-size=\"11\" fill=\"#2563eb\" font-weight=\"600\">O</text><polygon points=\"197.5,49.6 31.3,94.1 49.6,197.5 210.4,197.5\" fill=\"none\" stroke=\"#1c1917\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/><line x1=\"130\" y1=\"130\" x2=\"197.5\" y2=\"49.6\" stroke=\"#dc2626\" stroke-width=\"1.3\" stroke-dasharray=\"4,2\"/><text x=\"170\" y=\"82\" font-size=\"10\" fill=\"#dc2626\" font-weight=\"600\">R=√2</text><line x1=\"197.5\" y1=\"49.6\" x2=\"49.6\" y2=\"197.5\" stroke=\"#16a34a\" stroke-width=\"1.3\" stroke-dasharray=\"5,3\"/><text x=\"132\" y=\"116\" font-size=\"10\" fill=\"#16a34a\" font-weight=\"600\">AC=√6</text><text x=\"203.5\" y=\"43.6\" font-size=\"12\" fill=\"#1c1917\" font-weight=\"700\">A</text><text x=\"15.3\" y=\"92.1\" font-size=\"12\" fill=\"#1c1917\" font-weight=\"700\">B</text><text x=\"33.6\" y=\"211.5\" font-size=\"12\" fill=\"#1c1917\" font-weight=\"700\">C</text><text x=\"216.4\" y=\"211.5\" font-size=\"12\" fill=\"#1c1917\" font-weight=\"700\">D</text></svg>"
                },
                {
                  "title": "求 AD 和 CD",
                  "content": "在 △ABD 中用余弦定理（$\\angle ADB=30°$）：\n$AB^2 = AD^2+BD^2-2 \\cdot AD \\cdot BD \\cdot \\cos 30°$\n$2 = x^2 + \\frac{27}{4} - 2 \\cdot x \\cdot \\frac{3\\sqrt{3}}{2} \\cdot \\frac{\\sqrt{3}}{2}$\n$2 = x^2 + \\frac{27}{4} - \\frac{9x}{2}$\n$4x^2-18x+19=0$，$\\fbox{EF}=18$，$\\fbox{GH}=19$\n\n同理，$\\angle CDB = \\angle CAB = 30°$，在 △BCD 中：\n$4y^2-18y+19=0$，$\\fbox{IJ}=18$，$\\fbox{KL}=19$\n\n$x,y = \\dfrac{18 \\pm \\sqrt{324-304}}{8} = \\dfrac{18 \\pm 2\\sqrt{5}}{8} = \\dfrac{9 \\pm \\sqrt{5}}{4}$\n\n$AD > CD$ → $AD = \\dfrac{9+\\sqrt{5}}{4}$，$CD = \\dfrac{9-\\sqrt{5}}{4}$\n$\\fbox{M}=9$，$\\fbox{N}=5$，$\\fbox{O}=4$，$\\fbox{P}=9$，$\\fbox{Q}=5$，$\\fbox{R}=4$",
                  "why": "$\\angle CDB = \\angle CAB$ 也是同弧（CB）上的圆周角。AD 和 CD 满足同一方程，由 AD>CD 确定大小根的对应。"
                }
              ],
              "finalAnswer": "$AC=\\sqrt{6}$，$R=\\sqrt{2}$，$\\angle ADB=30°$，$AD=\\frac{9+\\sqrt{5}}{4}$，$CD=\\frac{9-\\sqrt{5}}{4}$。"
            }
          }
        ]
      }
    }
  },
  "course2": {
    "id": "course2",
    "name": "数学2",
    "nameEn": "Course 2 (Advanced)",
    "description": "高级课程｜理科方向",
    "color": "#dc2626",
    "exams": {
      "2011-1": {
        "id": "2011-1",
        "title": "2011年度（平成23年）第1回",
        "date": "2011年6月",
        "questions": [
          {
            "id": "c1-I-1",
            "number": "I-1",
            "topic": "二次函数最值",
            "topicTag": "二次函数",
            "humanVerified": false,
            "question": "已知 $x, y$ 满足\n$$3x + y = 18, \\quad x \\geqq 1, \\quad y \\geqq 6$$\n求 $xy$ 的最大值和最小值。\n\n将 $xy$ 用 $x$ 表示并配方，得\n$$xy = \\fbox{AB}\\left(x - \\fbox{C}\\right)^2 + \\fbox{DE}$$\n\n$x$ 的取值范围为\n$$\\fbox{F} \\leqq x \\leqq \\fbox{G}$$\n\n因此 $xy$ 在 $x = \\fbox{H}$ 时取最大值 $\\fbox{IJ}$，\n在 $x = \\fbox{K}$ 时取最小值 $\\fbox{LM}$。",
            "solution": {
              "translation": "$x, y$ 满足 $3x + y = 18,\\ x \\geqq 1,\\ y \\geqq 6$。求 $xy$ 的最大值和最小值。",
              "analysis": "条件最值问题。消元后配方，在闭区间上求最值。",
              "steps": [
                {
                  "title": "消元并配方",
                  "content": "由 $y = 18 - 3x$ 代入，得\n$$xy = x(18-3x) = -3x^2 + 18x = -3(x-3)^2 + 27$$\n\n因此 $\\fbox{AB} = -3$，$\\fbox{C} = 3$，$\\fbox{DE} = 27$。",
                  "why": "配方得顶点式，可直接看出顶点 $(3, 27)$，开口方向 $a = -3 < 0$（朝下）。"
                },
                {
                  "title": "确定定义域",
                  "content": "由 $x \\geqq 1$ 且 $y = 18-3x \\geqq 6$ 得 $x \\leqq 4$。\n\n所以 $1 \\leqq x \\leqq 4$，即 $\\fbox{F} = 1$，$\\fbox{G} = 4$。",
                  "why": null
                },
                {
                  "title": "求最值",
                  "content": "顶点 $x = 3$ 在区间 $[1, 4]$ 内，\n最大值 $= 27$（$x = 3$）。\n\n比较端点：$f(1) = -3 + 18 = 15$，$f(4) = -48 + 72 = 24$。\n最小值 $= 15$（$x = 1$）。\n\n$\\fbox{H} = 3$，$\\fbox{IJ} = 27$，$\\fbox{K} = 1$，$\\fbox{LM} = 15$。",
                  "why": "开口朝下的抛物线在闭区间上，最小值一定在离顶点最远的端点取得。$|1-3| = 2 > |4-3| = 1$，所以最小值在 $x=1$。"
                }
              ],
              "finalAnswer": "$xy$ 的最大值为 $27$（$x = 3$），最小值为 $15$（$x = 1$）。"
            }
          },
          {
            "id": "c1-I-2",
            "number": "I-2",
            "topic": "无理数与小数部分",
            "topicTag": "实数与无理数",
            "humanVerified": false,
            "question": "正实数 $a, b$ 满足\n$$a^2 = 3 + \\sqrt{5}, \\quad b^2 = 3 - \\sqrt{5}$$\n设 $a + b$ 的小数部分为 $c$，求 $\\dfrac{1}{c} - c$ 的值。\n\n(1)　$(ab)^2 = \\fbox{N}$，$(a+b)^2 = \\fbox{OP}$\n\n(2)　$\\fbox{Q} < a + b < \\fbox{Q} + 1$，所以 $c = \\sqrt{\\fbox{RS}} - \\fbox{T}$。\n从而 $\\dfrac{1}{c} - c = \\fbox{U}$。\n\n注）小数部分：fractional portion",
            "solution": {
              "translation": "正实数 $a, b$ 满足 $a^2 = 3+\\sqrt{5}$，$b^2 = 3-\\sqrt{5}$，$c$ 为 $a+b$ 的小数部分。求 $\\frac{1}{c}-c$。",
              "analysis": "先求 $(ab)^2$ 和 $(a+b)^2$，再确定整数部分，提取小数部分，有理化求值。",
              "steps": [
                {
                  "title": "求积与和的平方",
                  "content": "$(ab)^2 = a^2 b^2 = (3+\\sqrt{5})(3-\\sqrt{5}) = 9-5 = 4$，$\\fbox{N}=4$。\n\n$(a+b)^2 = a^2 + 2ab + b^2 = (3+\\sqrt{5}) + 2 \\cdot 2 + (3-\\sqrt{5}) = 10$，$\\fbox{OP}=10$。",
                  "why": "由于 $a,b>0$，所以 $ab=2$，$a+b=\\sqrt{10}$。"
                },
                {
                  "title": "确定整数部分和小数部分",
                  "content": "$\\sqrt{9} < \\sqrt{10} < \\sqrt{16}$，即 $3 < a+b < 4$，$\\fbox{Q}=3$。\n\n小数部分 $c = \\sqrt{10} - 3$，即 $\\sqrt{\\fbox{RS}} - \\fbox{T} = \\sqrt{10} - 3$。",
                  "why": null
                },
                {
                  "title": "求 $1/c - c$",
                  "content": "$\\dfrac{1}{c} = \\dfrac{1}{\\sqrt{10}-3} = \\dfrac{\\sqrt{10}+3}{(\\sqrt{10}-3)(\\sqrt{10}+3)} = \\dfrac{\\sqrt{10}+3}{10-9} = \\sqrt{10}+3$\n\n$\\dfrac{1}{c} - c = (\\sqrt{10}+3)-(\\sqrt{10}-3) = 6$，$\\fbox{U}=6$。",
                  "why": "有理化分母是处理无理数分式的基本方法。"
                }
              ],
              "finalAnswer": "$\\frac{1}{c}-c = 6$"
            }
          },
          {
            "id": "c2-II",
            "number": "II",
            "topic": "数列与对数",
            "topicTag": "数列与对数",
            "humanVerified": false,
            "question": "数列 $\\{a_n\\}$ 满足\n$$a_1 = 1, \\quad a_{n+1} = 2a_n^2 \\quad (n=1,2,3,\\cdots) \\qquad \\cdots\\cdots ①$$\n求满足 $a_n < 10^{60}$ 的自然数 $n$ 的个数。已知 $\\log_{10} 2 = 0.301$。\n\n由条件可知对所有自然数 $n$ 均有 $a_n > 0$。对 ① 两边取常用对数，得\n$$\\log_{10} a_{n+1} = \\log_{10} \\fbox{A} + \\fbox{B} \\log_{10} a_n$$\n\n令 $b_n = \\log_{10} a_n + \\log_{10} \\fbox{A}$，则 $\\{b_n\\}$ 是公比为 $\\fbox{C}$ 的等比数列。从而\n$$\\log_{10} a_n = \\left(\\fbox{D}^{n-1} - \\fbox{E}\\right) \\log_{10} \\fbox{F}$$\n\n再由 $a_n < 10^{60}$，得\n$$\\fbox{D}^{n-1} < \\frac{\\fbox{GH}}{\\log_{10} \\fbox{F}} + \\fbox{E} \\qquad \\cdots\\cdots ②$$\n\n② 右边值以上的最小自然数为 $\\fbox{IJK}$，\n因此满足条件的自然数 $n$ 共 $\\fbox{L}$ 个。\n\n注）常用对数：common logarithm，公比：common ratio，等比数列：geometric progression",
            "solution": {
              "translation": "递推数列 $a_1=1$，$a_{n+1}=2a_n^2$，求满足 $a_n<10^{60}$ 的自然数 $n$ 的个数。",
              "analysis": "取对数将乘方递推转化为线性递推，换元化为等比数列求通项，再解指数不等式。",
              "steps": [
                {
                  "title": "取对数",
                  "content": "$\\log_{10} a_{n+1} = \\log_{10}(2a_n^2) = \\log_{10} 2 + 2\\log_{10} a_n$\n\n$\\fbox{A}=2$，$\\fbox{B}=2$",
                  "why": null
                },
                {
                  "title": "化为等比数列",
                  "content": "令 $b_n = \\log_{10} a_n + \\log_{10} 2$，则\n\n$b_{n+1} = \\log_{10}a_{n+1}+\\log_{10}2 = (\\log_{10}2+2\\log_{10}a_n)+\\log_{10}2 = 2(\\log_{10}a_n+\\log_{10}2) = 2b_n$\n\n$\\{b_n\\}$ 是公比 $\\fbox{C}=2$ 的等比数列。\n$b_1 = \\log_{10}1 + \\log_{10}2 = \\log_{10}2$\n$b_n = 2^{n-1}\\log_{10}2$\n\n$\\log_{10}a_n = b_n - \\log_{10}2 = (2^{n-1}-1)\\log_{10}2$\n\n$\\fbox{D}=2$，$\\fbox{E}=1$，$\\fbox{F}=2$",
                  "why": "换元 $b_n$ 的关键是把递推式中的常数项吸收，使之成为纯比例关系。"
                },
                {
                  "title": "解不等式求 $n$ 的个数",
                  "content": "$a_n < 10^{60}$ 即 $\\log_{10}a_n < 60$：\n$(2^{n-1}-1)\\log_{10}2 < 60$\n$2^{n-1} < \\dfrac{60}{\\log_{10}2}+1 = \\dfrac{60}{0.301}+1 \\approx 199.3+1 = 200.3$\n\n$\\fbox{GH}=60$\n\n$2^7 = 128 < 200.3 < 256 = 2^8$\n\n所以 $n-1 \\leqq 7$，即 $n \\leqq 8$。\n\n大于 $200.3$ 的最小自然数为 $201$，$\\fbox{IJK}=201$\n满足条件的 $n$ 共 $\\fbox{L}=8$ 个。",
                  "why": null
                }
              ],
              "finalAnswer": "满足 $a_n<10^{60}$ 的自然数 $n$ 共 $8$ 个（$n=1,2,\\ldots,8$）。"
            }
          },
          {
            "id": "c2-III",
            "number": "III",
            "topic": "对数方程与圆",
            "topicTag": "对数·圆与直线",
            "humanVerified": false,
            "question": "考虑以下两个方程：\n$$(\\log_4 2\\sqrt{x})^2 + (\\log_4 2\\sqrt{y})^2 = \\log_2(\\sqrt[4]{2} \\cdot x\\sqrt{y}) \\qquad \\cdots\\cdots ①$$\n$$\\sqrt[3]{x} \\cdot \\sqrt[4]{y} = 2^k \\qquad \\cdots\\cdots ②$$\n\n当 ①② 同时有正实数解 $x, y$ 时，求常数 $k$ 的取值范围。\n\n令 $\\log_2 x = X$，$\\log_2 y = Y$，将 ①② 用 $X, Y$ 表示。\n\n先看 ①：\n$$\\log_4 2\\sqrt{x} = \\frac{\\log_2 x + \\fbox{A}}{\\fbox{B}}$$\n以及\n$$\\log_2(\\sqrt[4]{2} \\cdot x\\sqrt{y}) = \\frac{\\fbox{C}}{\\fbox{D}} + \\log_2 x + \\frac{\\log_2 y}{\\fbox{E}}$$\n\n于是 ① 化为\n$$\\left(X - \\fbox{F}\\right)^2 + \\left(Y - \\fbox{G}\\right)^2 = \\fbox{HI} \\qquad \\cdots\\cdots ③$$\n\n② 类似地化为\n$$4X + \\fbox{J}Y = \\fbox{KL}k \\qquad \\cdots\\cdots ④$$\n\n在 $XY$ 平面上，圆 ③ 的圆心到直线 ④ 的距离 $d$ 为\n$$d = \\frac{|\\fbox{MN} - \\fbox{OP}k|}{\\fbox{Q}}$$\n\n因此 $k$ 的取值范围为 $\\fbox{R} \\leqq k \\leqq \\fbox{S}$。",
            "solution": {
              "translation": "对数方程组 ①② 有正实数解时，求常数 $k$ 的取值范围。",
              "analysis": "对数换元 $X=\\log_2 x$，$Y=\\log_2 y$，将 ① 化为圆方程、② 化为直线方程，利用圆心到直线的距离不超过半径来求 $k$ 的范围。",
              "steps": [
                {
                  "title": "换底变换",
                  "content": "$\\log_4 2\\sqrt{x} = \\dfrac{\\log_2(2x^{1/2})}{\\log_2 4} = \\dfrac{1+X/2}{2} = \\dfrac{X+2}{4}$\n\n$\\fbox{A}=2$，$\\fbox{B}=4$\n\n$\\log_2(\\sqrt[4]{2} \\cdot x\\sqrt{y}) = \\dfrac{1}{4}+X+\\dfrac{Y}{2}$\n\n$\\fbox{C}=1$，$\\fbox{D}=4$，$\\fbox{E}=2$",
                  "why": "$\\log_4 M = \\frac{\\log_2 M}{\\log_2 4} = \\frac{\\log_2 M}{2}$，这是换底公式。$\\sqrt[4]{2}=2^{1/4}$。"
                },
                {
                  "title": "化为圆方程",
                  "content": "将 ① 代入：\n$$\\left(\\frac{X+2}{4}\\right)^2 + \\left(\\frac{Y+2}{4}\\right)^2 = \\frac{1}{4}+X+\\frac{Y}{2}$$\n\n两边乘 16：\n$(X+2)^2+(Y+2)^2 = 4+16X+8Y$\n\n展开整理：$X^2-12X+Y^2-4Y+4=0$\n\n配方：$(X-6)^2+(Y-2)^2 = 36$\n\n$\\fbox{F}=6$，$\\fbox{G}=2$，$\\fbox{HI}=36$\n\n这是圆心 $(6,2)$、半径 $r=6$ 的圆。",
                  "why": null
                },
                {
                  "title": "化直线方程并求距离",
                  "content": "② 取对数：$\\dfrac{X}{3}+\\dfrac{Y}{4}=k$，即 $4X+3Y=12k$\n\n$\\fbox{J}=3$，$\\fbox{KL}=12$\n\n圆心 $(6,2)$ 到直线 $4X+3Y-12k=0$ 的距离：\n$$d = \\frac{|4 \\times 6+3 \\times 2-12k|}{\\sqrt{4^2+3^2}} = \\frac{|30-12k|}{5}$$\n\n$\\fbox{MN}=30$，$\\fbox{OP}=12$，$\\fbox{Q}=5$",
                  "why": null
                },
                {
                  "title": "求 $k$ 的范围",
                  "content": "方程组有解要求圆与直线相交，即 $d \\leqq r$：\n$$\\frac{|30-12k|}{5} \\leqq 6 \\implies |30-12k| \\leqq 30$$\n\n$-30 \\leqq 30-12k \\leqq 30$\n$0 \\leqq 12k \\leqq 60$\n$0 \\leqq k \\leqq 5$\n\n$\\fbox{R}=0$，$\\fbox{S}=5$",
                  "why": "当 $d=r$ 时直线与圆相切（有 1 组解），$d<r$ 时相交（有 2 组解）。"
                }
              ],
              "finalAnswer": "$0 \\leqq k \\leqq 5$"
            }
          },
          {
            "id": "c2-IV-1",
            "number": "IV-1",
            "topic": "积分与微分",
            "topicTag": "积分与微分",
            "humanVerified": false,
            "question": "对 $f(x) = \\displaystyle\\int_0^{2x}(t^2-x^2)\\sin 3t\\, dt$ 关于 $x$ 求导。\n\n(1)　一般地，设连续函数 $g(t)$ 的一个原函数为 $G(t)$，则\n$$\\int_0^{2x} g(t)\\, dt = G(2x) - G(0)$$\n两边对 $x$ 求导得\n$$\\frac{d}{dx}\\int_0^{2x} g(t)\\, dt = \\fbox{A}$$\n\n$\\fbox{A}$ 从以下 ⓪~⑦ 中选择：\n⓪ $g(x)$　① $\\frac{1}{2}g(x)$　② $2g(x)$　③ $g(2x)$\n④ $\\frac{1}{2}g(2x)$　⑤ $2g(2x)$　⑥ $g(x)-g(0)$　⑦ $g(2x)-g(0)$\n\n(2)　将 $f(x)$ 拆分为\n$$f(x) = \\int_0^{2x} t^2 \\sin 3t\\, dt - \\int_0^{2x} x^2 \\sin 3t\\, dt$$\n\n$$\\frac{d}{dx}\\int_0^{2x} t^2 \\sin 3t\\, dt = \\fbox{B}x^2\\sin\\fbox{C}x$$\n\n$$\\frac{d}{dx}\\int_0^{2x} x^2 \\sin 3t\\, dt = \\frac{\\fbox{D}}{\\fbox{E}}x\\left(-\\cos\\fbox{F}x + \\fbox{G} + \\fbox{H}x\\sin\\fbox{I}x\\right)$$\n\n因此\n$$f'(x) = \\frac{\\fbox{D}}{\\fbox{E}}x\\left(\\cos\\fbox{J}x - \\fbox{K} + \\fbox{L}x\\sin\\fbox{M}x\\right)$$\n\n注）连续函数：continuous function，原函数：primitive function",
            "solution": {
              "translation": "对含参变上限积分 $f(x)=\\int_0^{2x}(t^2-x^2)\\sin 3t\\,dt$ 求导。",
              "analysis": "利用变上限积分求导公式（链式法则）和乘积法则，分两部分分别求导后合并。",
              "steps": [
                {
                  "title": "变上限积分求导公式",
                  "content": "$\\dfrac{d}{dx}\\int_0^{2x}g(t)\\,dt = \\dfrac{d}{dx}[G(2x)-G(0)] = G'(2x)\\cdot 2 = 2g(2x)$\n\n$\\fbox{A}=⑤$（即 $2g(2x)$）",
                  "why": "这是复合函数求导：上限是 $2x$ 而非 $x$，所以要乘以内层导数 $2$。"
                },
                {
                  "title": "第一项求导",
                  "content": "令 $g(t) = t^2\\sin 3t$，由 (1) 的公式：\n\n$\\dfrac{d}{dx}\\int_0^{2x}t^2\\sin 3t\\,dt = 2g(2x) = 2(2x)^2\\sin(3\\cdot 2x) = 8x^2\\sin 6x$\n\n$\\fbox{B}=8$，$\\fbox{C}=6$",
                  "why": null
                },
                {
                  "title": "第二项求导",
                  "content": "先计算内层积分：\n$\\int_0^{2x}x^2\\sin 3t\\,dt = x^2\\left[-\\dfrac{\\cos 3t}{3}\\right]_0^{2x} = \\dfrac{x^2}{3}(1-\\cos 6x)$\n\n对 $x$ 求导（乘积法则）：\n$\\dfrac{d}{dx}\\left[\\dfrac{x^2(1-\\cos 6x)}{3}\\right] = \\dfrac{1}{3}\\left[2x(1-\\cos 6x)+x^2\\cdot 6\\sin 6x\\right]$\n\n$= \\dfrac{2}{3}x(-\\cos 6x+1+3x\\sin 6x)$\n\n$\\fbox{D}=2$，$\\fbox{E}=3$，$\\fbox{F}=6$，$\\fbox{G}=1$，$\\fbox{H}=3$，$\\fbox{I}=6$",
                  "why": "注意 $x^2$ 既出现在被积函数中（作为关于 $t$ 的常数），又是外层变量，因此需要乘积法则。"
                },
                {
                  "title": "合并得 $f'(x)$",
                  "content": "$f'(x) = 8x^2\\sin 6x - \\dfrac{2}{3}x(-\\cos 6x+1+3x\\sin 6x)$\n\n$= 8x^2\\sin 6x + \\dfrac{2}{3}x(\\cos 6x-1) - 2x^2\\sin 6x$\n\n$= 6x^2\\sin 6x + \\dfrac{2}{3}x(\\cos 6x-1)$\n\n$= \\dfrac{2}{3}x(\\cos 6x - 1 + 9x\\sin 6x)$\n\n$\\fbox{J}=6$，$\\fbox{K}=1$，$\\fbox{L}=9$，$\\fbox{M}=6$",
                  "why": "$8x^2 - 2x^2 = 6x^2$，提取公因子 $\\frac{2}{3}x$ 后 $6x^2 = \\frac{2}{3}x \\cdot 9x$。"
                }
              ],
              "finalAnswer": "$f'(x) = \\dfrac{2}{3}x(\\cos 6x - 1 + 9x\\sin 6x)$"
            }
          },
          {
            "id": "c2-IV-2",
            "number": "IV-2",
            "topic": "曲线围成面积",
            "topicTag": "积分与面积",
            "humanVerified": false,
            "question": "设 $a$ 为正实数。两条曲线\n$$C_1: y = \\frac{3}{x}, \\quad C_2: y = \\frac{a}{x^2}$$\n的交点为 P，$C_2$ 在 P 处的切线为 $\\ell$。求 $C_1$ 与 $\\ell$ 所围区域的面积 $S$。\n\nP 的坐标为 $\\left(\\dfrac{a}{\\fbox{N}},\\ \\dfrac{\\fbox{O}}{a}\\right)$，由此得 $\\ell$ 的方程为\n$$y = -\\frac{\\fbox{PQ}}{a^2}x + \\frac{\\fbox{RS}}{a}$$\n\n设 $C_1$ 与 $\\ell$ 的两个交点的 $x$ 坐标为\n$$p = \\frac{a}{\\fbox{T}}, \\quad q = \\frac{a}{\\fbox{U}} \\quad (p < q)$$\n\n则 $S = \\left[\\fbox{V}\\right]_p^q$ 即可求得。$\\fbox{V}$ 从 ⓪~⑤ 中选择：\n⓪ $\\frac{18}{a^2}x^2-\\frac{27}{a}x+3\\log|x|$\n① $\\frac{9}{a^2}x^2-\\frac{9}{a}x+3\\log|x|$\n② $-\\frac{27}{a^2}x^2+\\frac{18}{a}x-3\\log|x|$\n③ $-\\frac{27}{a^2}x^2+\\frac{27}{a}x-3\\log|x|$\n④ $\\frac{27}{a^2}x^2-\\frac{27}{a}x+3\\log|x|$\n⑤ $-\\frac{18}{a^2}x^2+\\frac{27}{a}x-3\\log|x|$\n\n因此\n$$S = \\frac{\\fbox{W}}{\\fbox{X}} - 3\\log\\fbox{Y}$$",
            "solution": {
              "translation": "$C_1:y=3/x$ 与 $C_2:y=a/x^2$ 交于 P，求 $C_2$ 在 P 处切线 $\\ell$ 与 $C_1$ 围成的面积。",
              "analysis": "求交点 → 求切线 → 联立 $\\ell$ 和 $C_1$ 求积分区间 → 定积分求面积。",
              "steps": [
                {
                  "title": "求交点 P 和切线 $\\ell$",
                  "content": "$C_1 = C_2$：$\\dfrac{3}{x} = \\dfrac{a}{x^2}$ → $x = \\dfrac{a}{3}$，$y = \\dfrac{9}{a}$\n\n$\\fbox{N}=3$，$\\fbox{O}=9$\n\n$C_2$ 的导数：$y' = -\\dfrac{2a}{x^3}$\n在 P 处：$y'\\left(\\dfrac{a}{3}\\right) = -\\dfrac{2a}{(a/3)^3} = -\\dfrac{2a \\cdot 27}{a^3} = -\\dfrac{54}{a^2}$\n\n切线：$y = -\\dfrac{54}{a^2}x + \\dfrac{27}{a}$\n\n$\\fbox{PQ}=54$，$\\fbox{RS}=27$",
                  "why": null
                },
                {
                  "title": "求 $\\ell$ 与 $C_1$ 的交点",
                  "content": "$-\\dfrac{54}{a^2}x + \\dfrac{27}{a} = \\dfrac{3}{x}$\n\n两边乘 $x$ 整理：$-54x^2/a^2 + 27x/a - 3 = 0$\n乘以 $-a^2/3$：$18x^2 - 9ax + a^2 = 0$\n$(6x-a)(3x-a) = 0$\n\n$x = \\dfrac{a}{6}$ 或 $x = \\dfrac{a}{3}$\n\n$p = \\dfrac{a}{6}$，$q = \\dfrac{a}{3}$（$p < q$）\n$\\fbox{T}=6$，$\\fbox{U}=3$",
                  "why": null
                },
                {
                  "title": "定积分求面积",
                  "content": "在 $[p, q]$ 上，$\\ell$ 在 $C_1$ 上方，面积：\n$$S = \\int_{a/6}^{a/3}\\left(-\\frac{54}{a^2}x+\\frac{27}{a}-\\frac{3}{x}\\right)dx$$\n\n原函数为 $-\\dfrac{27}{a^2}x^2+\\dfrac{27}{a}x-3\\log|x|$，即选 $\\fbox{V}=③$\n\n$S = \\left[-\\dfrac{27x^2}{a^2}+\\dfrac{27x}{a}-3\\ln|x|\\right]_{a/6}^{a/3}$\n\n在 $x=a/3$：$-3+9-3\\ln(a/3) = 6-3\\ln(a/3)$\n在 $x=a/6$：$-3/4+9/2-3\\ln(a/6) = 15/4-3\\ln(a/6)$\n\n$S = (6-3\\ln(a/3))-(15/4-3\\ln(a/6))$\n$= 9/4 - 3\\ln\\dfrac{a/3}{a/6} = \\dfrac{9}{4}-3\\ln 2$\n\n$\\fbox{W}=9$，$\\fbox{X}=4$，$\\fbox{Y}=2$",
                  "why": "$\\ln(a/3)-\\ln(a/6) = \\ln\\frac{a/3}{a/6} = \\ln 2$，所以含 $a$ 的项全部消掉，面积与 $a$ 无关。"
                }
              ],
              "finalAnswer": "$S = \\dfrac{9}{4}-3\\log 2$"
            }
          }
        ]
      }
    }
  }
};

// ==================== NAVIGATION COMPONENTS ====================
const BackBtn = ({ onClick, label }) => (
  <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", fontSize: "13.5px", color: "#78716c", cursor: "pointer", padding: "6px 0", marginBottom: "24px" }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> {label}
  </button>
);

const ChevR = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>;

const GlobalCSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans SC', 'Noto Sans JP', -apple-system, sans-serif; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    .katex-display { margin: 10px 0 !important; overflow-x: auto; overflow-y: hidden; }
    .katex { font-size: 1.05em !important; }
    button { font-family: inherit; }
  `}</style>
);

const Shell = ({ children }) => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fafaf9 0%, #f5f5f4 40%, #e7e5e4 100%)" }}>
    <GlobalCSS />
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "36px 20px 72px" }}>{children}</div>
  </div>
);

// ==================== APP WITH 3-LEVEL NAVIGATION ====================
export default function App() {
  const [courseId, setCourseId] = useState(null);
  const [examId, setExamId] = useState(null);

  // helper: color-aware badge background
  const badgeBg = (color) => color === "#2563eb" ? "rgba(37,99,235,0.06)" : "rgba(220,38,38,0.06)";
  const badgeBorder = (color) => color === "#2563eb" ? "rgba(37,99,235,0.12)" : "rgba(220,38,38,0.12)";
  const iconBg = (color) => color === "#2563eb" ? "rgba(37,99,235,0.05)" : "rgba(220,38,38,0.05)";
  const iconBorder = (color) => color === "#2563eb" ? "rgba(37,99,235,0.1)" : "rgba(220,38,38,0.1)";

  // ===== LEVEL 1: Course Selection =====
  if (!courseId) {
    return (
      <Shell>
        <div style={{ textAlign: "center", marginBottom: "52px", animation: "fadeUp 0.45s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "58px", height: "58px", borderRadius: "16px", background: "#1c1917", marginBottom: "18px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
            <span style={{ color: "#fafaf9", fontSize: "24px", fontWeight: "900", fontFamily: "Georgia, serif" }}>E</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1c1917", letterSpacing: "-0.02em" }}>EJU 数学真题解析</h1>
          <p style={{ fontSize: "14px", color: "#78716c", marginTop: "8px" }}>日本留学考试 · 数学科目 · 全题详解</p>
        </div>
        {Object.values(examDatabase).map((c, i) => {
          const qCount = Object.values(c.exams).reduce((s, e) => s + e.questions.length, 0);
          const roman = c.id === "course2" ? "II" : "I";
          return (
            <button key={c.id} onClick={() => setCourseId(c.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px",
              background: "#fff", width: "100%", borderRadius: "14px", border: "1.5px solid #d6d3d1",
              cursor: "pointer", textAlign: "left", marginBottom: "14px",
              animation: `fadeUp 0.45s ease ${0.08 + i * 0.08}s both`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "13px", background: iconBg(c.color), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "900", color: c.color, border: `2px solid ${iconBorder(c.color)}` }}>{roman}</div>
                <div>
                  <div style={{ fontSize: "17px", fontWeight: "700", color: "#1c1917" }}>{c.name}</div>
                  <div style={{ fontSize: "12.5px", color: "#78716c", marginTop: "2px" }}>{c.description}</div>
                  <div style={{ fontSize: "11.5px", color: "#a8a29e", marginTop: "3px" }}>{Object.keys(c.exams).length} 套试卷 · {qCount} 道题目</div>
                </div>
              </div>
              <ChevR />
            </button>
          );
        })}
        <p style={{ textAlign: "center", marginTop: "44px", fontSize: "11.5px", color: "#a8a29e" }}>题目来源于 EJU 历年真题 · 解析仅供学习参考</p>
      </Shell>
    );
  }

  const course = examDatabase[courseId];

  // ===== LEVEL 2: Exam Selection =====
  if (!examId) {
    return (
      <Shell>
        <BackBtn onClick={() => setCourseId(null)} label="返回科目选择" />
        <div style={{ marginBottom: "32px", animation: "fadeUp 0.35s ease" }}>
          <span style={{ padding: "3px 12px", borderRadius: "99px", background: badgeBg(course.color), color: course.color, fontSize: "12px", fontWeight: "700", border: `1.5px solid ${badgeBorder(course.color)}` }}>{course.name}</span>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1c1917", marginTop: "10px" }}>选择试卷</h2>
        </div>
        {Object.values(course.exams).map((exam, i) => (
          <button key={exam.id} onClick={() => setExamId(exam.id)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px",
            background: "#fff", width: "100%", borderRadius: "12px", border: "1.5px solid #d6d3d1",
            cursor: "pointer", textAlign: "left", marginBottom: "10px",
            animation: `fadeUp 0.35s ease ${i * 0.05}s both`
          }}>
            <div>
              <div style={{ fontSize: "15.5px", fontWeight: "700", color: "#1c1917" }}>{exam.title}</div>
              <div style={{ fontSize: "12.5px", color: "#a8a29e", marginTop: "3px" }}>{exam.date} · {exam.questions.length} 题</div>
            </div>
            <ChevR />
          </button>
        ))}
      </Shell>
    );
  }

  // ===== LEVEL 3: Questions =====
  const exam = course.exams[examId];
  return (
    <Shell>
      <BackBtn onClick={() => setExamId(null)} label="返回试卷列表" />
      <div style={{ marginBottom: "32px", animation: "fadeUp 0.35s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
          <span style={{ padding: "3px 12px", borderRadius: "99px", background: badgeBg(course.color), color: course.color, fontSize: "11.5px", fontWeight: "700", border: `1.5px solid ${badgeBorder(course.color)}` }}>{course.name}</span>
          <span style={{ padding: "3px 12px", borderRadius: "99px", background: "#f5f5f4", color: "#57534e", fontSize: "11.5px", fontWeight: "600", border: "1px solid #e7e5e4" }}>{exam.title}</span>
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1c1917" }}>{exam.title}</h2>
        <p style={{ fontSize: "13.5px", color: "#78716c", marginTop: "6px" }}>
          {exam.date} · {exam.questions.length} 题 · 点击「查看解析」获取详解 · 紫色「为什么？」展开补充说明
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {exam.questions.map((q, i) => (
          <div key={q.id} style={{ animation: `fadeUp 0.35s ease ${i * 0.05}s both` }}>
            <QuestionCard question={q} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: "44px", padding: "18px 0", fontSize: "11.5px", color: "#a8a29e", borderTop: "1px solid #e7e5e4" }}>
        解析仅供学习参考
      </div>
    </Shell>
  );
}
