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
const examDatabase = __EXAM_DATABASE__;

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
