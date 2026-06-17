import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { SUBJECT_GROUPS, lookupGroup, buildTopicIndex, courseToSubject } from "./topicGroups.js";

// ============================================================
// EXAM DATA (injected by build.cjs)
// ============================================================
const examDatabase = __EXAM_DATABASE__;

// ============================================================
// KATEX LOADER
// ============================================================
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
  const lines = String(children || "").split("\n");
  return (
    <div ref={ref} style={style}>
      {lines.map((l, i) => (
        <span key={i}>{l}{i < lines.length - 1 && <br />}</span>
      ))}
    </div>
  );
};

const SvgDiagram = ({ svg }) => {
  if (!svg) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
};

// ============================================================
// ICONS
// ============================================================
const Ic = (d, w = 18, h = 18, sw = 2) => <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />;
const IconBook = () => Ic('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>');
const IconChevUp = () => Ic('<path d="M18 15l-6-6-6 6"/>', 16, 16);
const IconChevR = () => Ic('<path d="M9 18l6-6-6-6"/>', 16, 16);
const IconChevL = () => Ic('<path d="M15 18l-6-6 6-6"/>', 16, 16);
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconWhy = () => Ic('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', 14, 14, 2.5);
const IconMenu = () => Ic('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>', 20, 20);
const IconHome = () => Ic('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', 16, 16);
const IconTarget = () => Ic('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>', 16, 16);
const IconCal = () => Ic('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', 16, 16);
const IconRefresh = () => Ic('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>', 14, 14);
const IconStar = ({ filled }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke={filled ? "#f59e0b" : "#d6d3d1"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;

// ============================================================
// PROGRESS TRACKING (localStorage)
// ============================================================
const PROGRESS_KEY = "eju_progress_v1";

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { answered: {}, lastVisited: null };
    return JSON.parse(raw);
  } catch {
    return { answered: {}, lastVisited: null };
  }
}

function saveProgress(p) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {}
}

function recordAnswer(qid, picked, correct) {
  const p = loadProgress();
  p.answered = p.answered || {};
  p.answered[qid] = { picked, correct, ts: Date.now() };
  saveProgress(p);
  return p;
}

function recordVisit(courseId, examId, qIdx) {
  const p = loadProgress();
  p.lastVisited = { courseId, examId, qIdx, ts: Date.now() };
  saveProgress(p);
}

// Custom hook: subscribe to progress changes
function useProgress() {
  const [version, setVersion] = useState(0);
  const progressRef = useRef(loadProgress());
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PROGRESS_KEY) {
        progressRef.current = loadProgress();
        setVersion(v => v + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  // refresh helper for in-tab updates
  const refresh = useCallback(() => {
    progressRef.current = loadProgress();
    setVersion(v => v + 1);
  }, []);
  return [progressRef.current, refresh, version];
}

// ============================================================
// COLOR / UTILS
// ============================================================
function hexToRgba(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
const badgeBg = (c) => hexToRgba(c, 0.08);
const badgeBorder = (c) => hexToRgba(c, 0.18);
const iconBg = (c) => hexToRgba(c, 0.08);
const iconBorder = (c) => hexToRgba(c, 0.16);
const courseIcon = (id) => id === "course1" ? "I" : id === "course2" ? "II" : id === "physics" ? "物" : "?";

// Estimate difficulty stars (placeholder — later AI)
function estimateStars(q, idx) {
  // simple heuristic: based on number of solution steps
  const stepCount = q.solution?.steps?.length || 1;
  if (stepCount <= 2) return 1;
  if (stepCount <= 4) return 2;
  return 3;
}

// ============================================================
// GLOBAL CSS
// ============================================================
const GlobalCSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans SC', 'Noto Sans JP', -apple-system, sans-serif; background: #fafaf9; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .katex-display { margin: 10px 0 !important; overflow-x: auto; overflow-y: hidden; }
    .katex { font-size: 1.05em !important; }
    button { font-family: inherit; }
    a { text-decoration: none; color: inherit; }
    .sidebar-link { display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 8px; font-size: 13.5px; color: #57534e; cursor: pointer; min-width: 0; }
    .sidebar-link:hover { background: #f5f5f4; color: #1c1917; }
    .sidebar-link.active { background: #1c1917; color: #fff; font-weight: 600; }
    .sidebar-link > span:first-of-type { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sidebar-sub { display: flex; align-items: center; gap: 8px; padding: 6px 14px 6px 36px; border-radius: 6px; font-size: 12.5px; color: #78716c; cursor: pointer; min-width: 0; }
    .sidebar-sub:hover { background: #f5f5f4; color: #1c1917; }
    .sidebar-sub.active { background: #f5f5f4; color: #1c1917; font-weight: 600; }
    .sidebar-sub > span:first-of-type { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .topic-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 99px; background: #f5f5f4; color: #57534e; font-size: 11.5px; font-weight: 600; border: 1px solid #e7e5e4; cursor: pointer; }
    .topic-chip:hover { background: #1c1917; color: #fff; }
    @media (max-width: 768px) {
      .sidebar-desktop { display: none !important; }
    }
    @media (min-width: 769px) {
      .topbar-mobile-only { display: none !important; }
      .qnav-mobile { display: none !important; }
    }
  `}</style>
);

// ============================================================
// WHY BUTTON
// ============================================================
const WhyButton = ({ text }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: "10px" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "5px 12px", borderRadius: "8px",
        border: "1.5px solid " + (open ? "#7c3aed" : "#d6d3d1"),
        background: open ? "rgba(124,58,237,0.04)" : "#fff",
        color: open ? "#7c3aed" : "#78716c",
        fontSize: "12.5px", fontWeight: "600", cursor: "pointer"
      }}>
        <IconWhy /> {open ? "收起" : "为什么？"}
      </button>
      {open && (
        <div style={{ marginTop: "8px", padding: "12px 14px", background: "#f5f3ff", borderRadius: "8px", border: "1px solid #ddd6fe" }}>
          <MathText style={{ color: "#4c1d95", lineHeight: "2", fontSize: "13.5px" }}>{text}</MathText>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SOLUTION PANEL
// ============================================================
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
          ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#16a34a", fontWeight: "600" }}><IconCheck /> 人工校对通过</span>
          : <span style={{ fontSize: "11px", color: "#a8a29e", fontWeight: "500" }}>⏳ 待人工校对</span>
        }
      </div>
      <MathText style={{ color: "#1c1917", lineHeight: "2", fontSize: "14.5px", fontWeight: "500" }}>{solution.finalAnswer}</MathText>
    </div>
  </div>
);

// ============================================================
// OPTIONS LIST — with instant feedback on click
// ============================================================
const OptionsList = ({ options, correctOption, qId, onAnswer }) => {
  const [progress, refresh] = useProgress();
  const userAnswer = progress.answered?.[qId];
  const picked = userAnswer?.picked;

  const handlePick = (label) => {
    if (picked) return; // lock after picking
    const correct = label === correctOption;
    recordAnswer(qId, label, correct);
    refresh();
    if (onAnswer) onAnswer(correct);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
      {options.map((opt) => {
        const isPicked = picked === opt.label;
        const isCorrect = correctOption === opt.label;
        const reveal = !!picked;
        let bg = "#fafaf9";
        let border = "1px solid #e7e5e4";
        let circleBg = "#e7e5e4";
        let circleColor = "#57534e";
        if (reveal) {
          if (isCorrect) {
            bg = "rgba(22,163,74,0.08)"; border = "1.5px solid #16a34a";
            circleBg = "#16a34a"; circleColor = "#fff";
          } else if (isPicked && !isCorrect) {
            bg = "rgba(220,38,38,0.06)"; border = "1.5px solid #dc2626";
            circleBg = "#dc2626"; circleColor = "#fff";
          }
        }
        return (
          <button key={opt.label} onClick={() => handlePick(opt.label)} disabled={!!picked} style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "10px 14px", borderRadius: "9px",
            border, background: bg, cursor: picked ? "default" : "pointer",
            textAlign: "left", width: "100%", transition: "all 0.15s"
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "26px", height: "26px", borderRadius: "50%",
              background: circleBg, color: circleColor,
              fontSize: "12px", fontWeight: "700", flexShrink: 0
            }}>{opt.label}</span>
            <MathText style={{ fontSize: "14px", color: "#1c1917", lineHeight: "1.7", flex: 1 }}>{opt.content}</MathText>
            {reveal && isCorrect && <IconCheck />}
            {reveal && isPicked && !isCorrect && <IconX />}
          </button>
        );
      })}
      {picked && (
        <div style={{
          fontSize: "12.5px", padding: "10px 14px", borderRadius: "8px",
          background: userAnswer.correct ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.05)",
          color: userAnswer.correct ? "#15803d" : "#b91c1c",
          fontWeight: "600", marginTop: "4px"
        }}>
          {userAnswer.correct ? "✓ 答对了！" : `✗ 答错了，正确答案是 ${correctOption}`}
        </div>
      )}
    </div>
  );
};

// ============================================================
// QUESTION CARD
// ============================================================
const QuestionCard = ({ question, courseId, examId, qIdx, autoOpen = false, showPracticeButton = true }) => {
  const [open, setOpen] = useState(autoOpen);
  const isChoice = question.questionType === "choice" && Array.isArray(question.options);
  const stars = estimateStars(question, qIdx);

  return (
    <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #d6d3d1", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e7e5e4", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "48px", height: "34px", borderRadius: "9px", background: "#1c1917", color: "#fff", fontSize: "12.5px", fontWeight: "800", padding: "0 10px" }}>{question.number}</span>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#44403c" }}>{question.topic}</div>
          <div style={{ display: "flex", gap: "1px" }}>
            {[1, 2, 3].map(i => <IconStar key={i} filled={i <= stars} />)}
          </div>
        </div>
        <Link to={`/topic/${courseToSubject(courseId)}/${lookupGroup(question.topicTag, courseId).key}`}
          className="topic-chip" style={{ whiteSpace: "nowrap" }}>
          {question.topicTag}
        </Link>
      </div>
      <div style={{ padding: "18px 20px" }}>
        <MathText style={{ fontSize: "14.5px", lineHeight: "2", color: "#1c1917" }}>{question.question}</MathText>
        {question.questionDiagramSvg && <SvgDiagram svg={question.questionDiagramSvg} />}
        {question.questionImage && (
          <img src={question.questionImage} alt={question.topic}
            style={{ width: "100%", height: "auto", display: "block", borderRadius: "6px", border: "1px solid #e7e5e4", marginTop: "14px" }} />
        )}
        {isChoice && (
          <OptionsList
            options={question.options}
            correctOption={question.solution && question.solution.correctOption}
            qId={question.id}
          />
        )}
      </div>
      <div style={{ padding: "0 20px 18px" }}>
        <button onClick={() => setOpen(!open)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
          width: "100%", padding: "11px", borderRadius: "10px",
          border: open ? "1.5px solid #292524" : "1.5px solid #d6d3d1",
          background: open ? "#292524" : "#fff",
          color: open ? "#fff" : "#57534e",
          fontSize: "13.5px", fontWeight: "600", cursor: "pointer"
        }}>
          {open ? <><span>收起解析</span> <IconChevUp /></> : <><IconBook /> <span>查看解析</span></>}
        </button>
      </div>
      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          <SolutionPanel solution={question.solution} humanVerified={question.humanVerified} />
        </div>
      )}
      {showPracticeButton && (
        <div style={{ padding: "0 20px 18px", display: "flex", justifyContent: "flex-end" }}>
          <button disabled title="付费功能 · 即将推出" style={{
            display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px",
            border: "1.5px dashed #d6d3d1", borderRadius: "8px",
            background: "#fafaf9", color: "#a8a29e", cursor: "not-allowed",
            fontSize: "12px", fontWeight: "600"
          }}>
            <IconRefresh /> 来一道类似的
            <span style={{
              padding: "1px 7px", borderRadius: "99px", background: "#fef3c7", color: "#92400e",
              fontSize: "9.5px", fontWeight: "700", marginLeft: "4px"
            }}>Pro 即将推出</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SIDEBAR
// ============================================================
const Sidebar = ({ open, onClose }) => {
  const courses = Object.values(examDatabase);
  const topicIndex = useMemo(() => buildTopicIndex(examDatabase), []);

  const [yearOpen, setYearOpen] = useState({});
  const [topicOpen, setTopicOpen] = useState({ math: true, physics: false });

  const toggleYear = (cid) => setYearOpen(s => ({ ...s, [cid]: !s[cid] }));
  const toggleTopicSubj = (subj) => setTopicOpen(s => ({ ...s, [subj]: !s[subj] }));

  return (
    <>
      {open && <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40
      }} className="topbar-mobile-only" />}
      <aside className={open ? "" : "sidebar-desktop"} style={{
        position: open ? "fixed" : "sticky",
        top: 0, left: 0,
        width: "260px", height: "100vh",
        background: "#fff", borderRight: "1px solid #e7e5e4",
        padding: "16px 12px", overflow: "auto",
        zIndex: 50, flexShrink: 0,
        transform: open ? "translateX(0)" : undefined,
      }}>
        {/* Logo */}
        <Link to="/" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", marginBottom: "16px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "9px", background: "#1c1917", color: "#fafaf9", fontSize: "15px", fontWeight: "900", fontFamily: "Georgia, serif" }}>E</div>
          <span style={{ fontSize: "15px", fontWeight: "800", color: "#1c1917" }}>EJU 真题</span>
        </Link>

        {/* Home */}
        <NavLink to="/" end onClick={onClose} className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
          <IconHome /> 首页
        </NavLink>

        {/* By Year */}
        <div style={{ marginTop: "18px", marginBottom: "6px", padding: "0 14px", fontSize: "11px", fontWeight: "700", color: "#a8a29e", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          按年份
        </div>
        {courses.map(c => (
          <div key={c.id}>
            <div onClick={() => toggleYear(c.id)} className="sidebar-link" title={c.name}>
              <IconCal />
              <span>{c.name}</span>
              <span style={{ fontSize: "11px", color: "#a8a29e", flexShrink: 0 }}>{Object.keys(c.exams).length}</span>
            </div>
            {yearOpen[c.id] && Object.values(c.exams).map(exam => (
              <NavLink key={exam.id} to={`/exam/${c.id}/${exam.id}`} onClick={onClose} title={exam.title}
                className={({ isActive }) => "sidebar-sub" + (isActive ? " active" : "")}>
                <span>{exam.title}</span>
                <span style={{ fontSize: "10.5px", color: "#a8a29e", flexShrink: 0 }}>{exam.questions.length} 题</span>
              </NavLink>
            ))}
          </div>
        ))}

        {/* By Topic */}
        <div style={{ marginTop: "20px", marginBottom: "6px", padding: "0 14px", fontSize: "11px", fontWeight: "700", color: "#a8a29e", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          按知识点
        </div>
        {["math", "physics"].map(subj => {
          const subjLabel = subj === "math" ? "数学" : "物理";
          const groups = topicIndex[subj] || {};
          const groupArr = Object.values(groups).sort((a, b) => b.questions.length - a.questions.length);
          if (groupArr.length === 0) return null;
          return (
            <div key={subj}>
              <div onClick={() => toggleTopicSubj(subj)} className="sidebar-link" title={subjLabel}>
                <IconTarget />
                <span>{subjLabel}</span>
                <span style={{ fontSize: "11px", color: "#a8a29e", flexShrink: 0 }}>{groupArr.length}</span>
              </div>
              {topicOpen[subj] && groupArr.map(g => (
                <NavLink key={g.key} to={`/topic/${subj}/${g.key}`} onClick={onClose} title={g.label}
                  className={({ isActive }) => "sidebar-sub" + (isActive ? " active" : "")}>
                  <span>{g.label}</span>
                  <span style={{ fontSize: "10.5px", color: "#a8a29e", flexShrink: 0 }}>{g.questions.length}</span>
                </NavLink>
              ))}
            </div>
          );
        })}

        <div style={{ marginTop: "32px", padding: "14px", borderTop: "1px solid #e7e5e4", textAlign: "center" }}>
          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "99px", background: "#f5f5f4", color: "#78716c", fontSize: "10.5px", fontWeight: "600" }}>免费版</span>
          <div style={{ fontSize: "10.5px", color: "#a8a29e", marginTop: "8px" }}>解析仅供学习参考</div>
        </div>
      </aside>
    </>
  );
};

// ============================================================
// TOPBAR with breadcrumbs
// ============================================================
const Topbar = ({ onMenuClick }) => {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);
  const crumbs = [];

  if (parts[0] === "exam") {
    const [_, courseId, examId, , qNum] = parts;
    const course = examDatabase[courseId];
    crumbs.push({ label: "首页", to: "/" });
    if (course) {
      crumbs.push({ label: course.name, to: `/course/${courseId}` });
      const exam = course.exams[examId];
      if (exam) {
        crumbs.push({ label: exam.title, to: `/exam/${courseId}/${examId}` });
        if (qNum) crumbs.push({ label: `Q${qNum}`, to: null });
      }
    }
  } else if (parts[0] === "course") {
    crumbs.push({ label: "首页", to: "/" });
    const course = examDatabase[parts[1]];
    if (course) crumbs.push({ label: course.name, to: null });
  } else if (parts[0] === "topic") {
    crumbs.push({ label: "首页", to: "/" });
    const subj = parts[1];
    const groupKey = parts[2];
    const isPractice = parts[3] === "practice";
    crumbs.push({ label: subj === "math" ? "数学知识点" : "物理知识点", to: null });
    const groupDef = (SUBJECT_GROUPS[subj] || []).find(g => g.key === groupKey);
    if (groupDef) crumbs.push({ label: groupDef.label, to: `/topic/${subj}/${groupKey}` });
    if (isPractice) crumbs.push({ label: "专项练习", to: null });
  }

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 30,
      background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)",
      borderBottom: "1px solid #e7e5e4",
      padding: "12px 20px",
      display: "flex", alignItems: "center", gap: "12px"
    }}>
      <button onClick={onMenuClick} className="topbar-mobile-only" style={{
        border: "none", background: "none", padding: "6px", cursor: "pointer", color: "#44403c"
      }}>
        <IconMenu />
      </button>
      <nav style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, flexWrap: "wrap", fontSize: "13px" }}>
        {crumbs.length === 0 ? (
          <span style={{ color: "#a8a29e", fontWeight: "600" }}>EJU 真题学习</span>
        ) : crumbs.map((c, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {c.to ? <Link to={c.to} style={{ color: "#78716c", fontWeight: "500" }}>{c.label}</Link> : <span style={{ color: "#1c1917", fontWeight: "700" }}>{c.label}</span>}
            {i < crumbs.length - 1 && <span style={{ color: "#d6d3d1" }}>›</span>}
          </span>
        ))}
      </nav>
      <span style={{ padding: "4px 10px", borderRadius: "99px", background: "#f5f5f4", color: "#78716c", fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap" }}>免费版</span>
    </header>
  );
};

// ============================================================
// PAGE: DASHBOARD (Home)
// ============================================================
const DashboardPage = () => {
  const [progress] = useProgress();
  const topicIndex = useMemo(() => buildTopicIndex(examDatabase), []);
  const courses = Object.values(examDatabase);

  const totalQ = courses.reduce((s, c) =>
    s + Object.values(c.exams).reduce((s2, e) => s2 + e.questions.length, 0), 0);
  const answeredCount = Object.keys(progress.answered || {}).length;
  const correctCount = Object.values(progress.answered || {}).filter(a => a.correct).length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Find last visited
  const last = progress.lastVisited;
  let lastInfo = null;
  if (last && examDatabase[last.courseId]) {
    const c = examDatabase[last.courseId];
    const e = c.exams[last.examId];
    if (e) lastInfo = { course: c, exam: e, qIdx: last.qIdx };
  }

  // Top topics by question count
  const topTopics = [];
  for (const subj of ["math", "physics"]) {
    for (const g of Object.values(topicIndex[subj] || {})) {
      topTopics.push({ subject: subj, ...g });
    }
  }
  topTopics.sort((a, b) => b.questions.length - a.questions.length);
  const recommendTopics = topTopics.slice(0, 6);

  return (
    <div style={{ padding: "24px 28px 48px", maxWidth: "1100px", animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1c1917", letterSpacing: "-0.02em" }}>欢迎回来 👋</h1>
        <p style={{ fontSize: "14px", color: "#78716c", marginTop: "6px" }}>EJU 数学 / 物理 · 真题详解与专项练习</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        <StatCard label="总题库" value={totalQ} unit="题" color="#1c1917" />
        <StatCard label="已练习" value={answeredCount} unit="题" color="#2563eb" />
        <StatCard label="答对" value={correctCount} unit="题" color="#16a34a" />
        <StatCard label="准确率" value={accuracy} unit="%" color="#7c3aed" />
      </div>

      {/* Continue */}
      {lastInfo && (
        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1c1917", marginBottom: "10px" }}>继续学习</h2>
          <Link to={`/exam/${lastInfo.course.id}/${lastInfo.exam.id}/q/${(lastInfo.qIdx || 0) + 1}`} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 22px", background: "#fff", borderRadius: "12px",
            border: "1.5px solid #d6d3d1", cursor: "pointer"
          }}>
            <div>
              <div style={{ fontSize: "11.5px", color: lastInfo.course.color, fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>{lastInfo.course.name}</div>
              <div style={{ fontSize: "15.5px", fontWeight: "700", color: "#1c1917", marginTop: "2px" }}>{lastInfo.exam.title}</div>
              <div style={{ fontSize: "12.5px", color: "#78716c", marginTop: "3px" }}>上次看到第 {(lastInfo.qIdx || 0) + 1} 题</div>
            </div>
            <IconChevR />
          </Link>
        </section>
      )}

      {/* Courses */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1c1917", marginBottom: "10px" }}>科目</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
          {courses.map((c) => {
            const qCount = Object.values(c.exams).reduce((s, e) => s + e.questions.length, 0);
            return (
              <Link key={c.id} to={`/course/${c.id}`} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "18px 20px", background: "#fff", borderRadius: "12px",
                border: "1.5px solid #d6d3d1"
              }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: iconBg(c.color), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "900", color: c.color, border: `2px solid ${iconBorder(c.color)}`, flexShrink: 0 }}>{courseIcon(c.id)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1c1917" }}>{c.name}</div>
                  <div style={{ fontSize: "11.5px", color: "#a8a29e", marginTop: "2px" }}>{Object.keys(c.exams).length} 套 · {qCount} 题</div>
                </div>
                <IconChevR />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recommended Topics */}
      <section>
        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1c1917", marginBottom: "4px" }}>推荐专项练习 🎯</h2>
        <p style={{ fontSize: "12.5px", color: "#a8a29e", marginBottom: "10px" }}>按知识点聚类，挑一个集中突破</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
          {recommendTopics.map((t) => (
            <Link key={t.subject + t.key} to={`/topic/${t.subject}/${t.key}`} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", background: "#fff", borderRadius: "10px",
              border: "1px solid #e7e5e4"
            }}>
              <div>
                <div style={{ fontSize: "10.5px", color: "#a8a29e", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>{t.subject === "math" ? "数学" : "物理"}</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1c1917", marginTop: "2px" }}>{t.label}</div>
              </div>
              <div style={{ fontSize: "11.5px", color: "#78716c", fontWeight: "600" }}>{t.questions.length} 题</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ label, value, unit, color }) => (
  <div style={{ padding: "16px 18px", background: "#fff", borderRadius: "12px", border: "1px solid #e7e5e4" }}>
    <div style={{ fontSize: "11.5px", color: "#a8a29e", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "4px" }}>
      <span style={{ fontSize: "26px", fontWeight: "800", color }}>{value}</span>
      <span style={{ fontSize: "13px", color: "#78716c", fontWeight: "600" }}>{unit}</span>
    </div>
  </div>
);

// ============================================================
// PAGE: COURSE (list exams + by-topic shortcut)
// ============================================================
const CoursePage = () => {
  const { courseId } = useParams();
  const course = examDatabase[courseId];
  const topicIndex = useMemo(() => buildTopicIndex(examDatabase), []);

  if (!course) return <div style={{ padding: 28 }}>科目不存在</div>;

  const subj = courseToSubject(courseId);
  const subjTopics = Object.values(topicIndex[subj] || {})
    .filter(g => g.questions.some(item => item.courseId === courseId))
    .sort((a, b) => b.questions.length - a.questions.length);

  return (
    <div style={{ padding: "24px 28px 48px", maxWidth: "1100px", animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: "24px" }}>
        <span style={{ padding: "3px 12px", borderRadius: "99px", background: badgeBg(course.color), color: course.color, fontSize: "12px", fontWeight: "700", border: `1.5px solid ${badgeBorder(course.color)}` }}>{course.name}</span>
        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#1c1917", marginTop: "10px" }}>{course.name}</h1>
        <p style={{ fontSize: "13.5px", color: "#78716c", marginTop: "4px" }}>{course.description}</p>
      </div>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "15.5px", fontWeight: "700", color: "#1c1917", marginBottom: "10px" }}>按年份浏览</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
          {Object.values(course.exams).map(exam => (
            <Link key={exam.id} to={`/exam/${courseId}/${exam.id}`} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 18px", background: "#fff", borderRadius: "11px",
              border: "1.5px solid #d6d3d1"
            }}>
              <div>
                <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#1c1917" }}>{exam.title}</div>
                <div style={{ fontSize: "11.5px", color: "#a8a29e", marginTop: "3px" }}>{exam.date} · {exam.questions.length} 题</div>
              </div>
              <IconChevR />
            </Link>
          ))}
        </div>
      </section>

      {subjTopics.length > 0 && (
        <section>
          <h2 style={{ fontSize: "15.5px", fontWeight: "700", color: "#1c1917", marginBottom: "4px" }}>按知识点专项练习</h2>
          <p style={{ fontSize: "12.5px", color: "#a8a29e", marginBottom: "10px" }}>跨年份聚合同一知识点的所有题目</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
            {subjTopics.map(g => (
              <Link key={g.key} to={`/topic/${subj}/${g.key}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", background: "#fff", borderRadius: "9px",
                border: "1px solid #e7e5e4"
              }}>
                <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#1c1917" }}>{g.label}</span>
                <span style={{ fontSize: "11.5px", color: "#78716c", fontWeight: "600" }}>{g.questions.length}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ============================================================
// PAGE: EXAM (all questions of one exam, with right Q-grid)
// ============================================================
const ExamPage = () => {
  const { courseId, examId } = useParams();
  const course = examDatabase[courseId];
  const exam = course && course.exams[examId];
  const [progress] = useProgress();

  if (!exam) return <div style={{ padding: 28 }}>试卷不存在</div>;

  return (
    <div style={{ display: "flex", gap: "20px", padding: "24px 28px 48px", maxWidth: "1200px", animation: "fadeIn 0.3s ease" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
            <span style={{ padding: "3px 12px", borderRadius: "99px", background: badgeBg(course.color), color: course.color, fontSize: "11.5px", fontWeight: "700", border: `1.5px solid ${badgeBorder(course.color)}` }}>{course.name}</span>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#1c1917" }}>{exam.title}</h1>
          <p style={{ fontSize: "13px", color: "#78716c", marginTop: "4px" }}>{exam.date} · {exam.questions.length} 题</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {exam.questions.map((q, i) => (
            <div key={q.id} id={`q-${i + 1}`} style={{ animation: `fadeUp 0.35s ease ${Math.min(i, 8) * 0.04}s both` }}>
              <QuestionCard question={q} courseId={courseId} examId={examId} qIdx={i} />
            </div>
          ))}
        </div>
      </div>
      <QuestionGrid exam={exam} progress={progress} courseId={courseId} examId={examId} />
    </div>
  );
};

const QuestionGrid = ({ exam, progress, courseId, examId, currentIdx }) => (
  <aside className="qnav-mobile" style={{
    width: "180px", flexShrink: 0,
    position: "sticky", top: "70px", maxHeight: "calc(100vh - 90px)",
    overflow: "auto", padding: "14px",
    background: "#fff", borderRadius: "12px", border: "1px solid #e7e5e4",
    alignSelf: "flex-start"
  }}>
    <div style={{ fontSize: "11px", fontWeight: "700", color: "#a8a29e", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>题号导航</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
      {exam.questions.map((q, i) => {
        const a = progress.answered?.[q.id];
        const isCurrent = currentIdx === i;
        let bg = "#f5f5f4", color = "#57534e", border = "1px solid #e7e5e4";
        if (a) {
          if (a.correct) { bg = "rgba(22,163,74,0.12)"; color = "#15803d"; border = "1px solid #86efac"; }
          else { bg = "rgba(220,38,38,0.08)"; color = "#b91c1c"; border = "1px solid #fca5a5"; }
        }
        if (isCurrent) { border = "2px solid #1c1917"; }
        return (
          <Link key={q.id} to={`/exam/${courseId}/${examId}/q/${i + 1}`} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            aspectRatio: "1", borderRadius: "7px",
            background: bg, color, border, fontSize: "12px", fontWeight: "700"
          }}>{i + 1}</Link>
        );
      })}
    </div>
    <div style={{ marginTop: "14px", fontSize: "10.5px", color: "#a8a29e", lineHeight: "1.7" }}>
      <div><span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "3px", background: "rgba(22,163,74,0.18)", border: "1px solid #86efac", marginRight: "5px", verticalAlign: "middle" }} /> 答对</div>
      <div><span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "3px", background: "rgba(220,38,38,0.12)", border: "1px solid #fca5a5", marginRight: "5px", verticalAlign: "middle" }} /> 答错</div>
      <div><span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "3px", background: "#f5f5f4", border: "1px solid #e7e5e4", marginRight: "5px", verticalAlign: "middle" }} /> 未做</div>
    </div>
  </aside>
);

// ============================================================
// PAGE: SINGLE QUESTION (deep link, with prev/next)
// ============================================================
const QuestionPage = () => {
  const { courseId, examId, qNum } = useParams();
  const navigate = useNavigate();
  const course = examDatabase[courseId];
  const exam = course && course.exams[examId];
  const [progress] = useProgress();

  const idx = parseInt(qNum, 10) - 1;
  const q = exam && exam.questions[idx];

  useEffect(() => {
    if (q) recordVisit(courseId, examId, idx);
  }, [courseId, examId, idx]);

  if (!q) return <div style={{ padding: 28 }}>题目不存在</div>;

  const goPrev = () => {
    if (idx > 0) navigate(`/exam/${courseId}/${examId}/q/${idx}`);
  };
  const goNext = () => {
    if (idx < exam.questions.length - 1) navigate(`/exam/${courseId}/${examId}/q/${idx + 2}`);
  };

  return (
    <div style={{ display: "flex", gap: "20px", padding: "24px 28px 48px", maxWidth: "1200px", animation: "fadeIn 0.25s ease" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ padding: "3px 12px", borderRadius: "99px", background: badgeBg(course.color), color: course.color, fontSize: "11.5px", fontWeight: "700", border: `1.5px solid ${badgeBorder(course.color)}` }}>{course.name}</span>
          <Link to={`/exam/${courseId}/${examId}`} style={{ padding: "3px 12px", borderRadius: "99px", background: "#f5f5f4", color: "#57534e", fontSize: "11.5px", fontWeight: "600", border: "1px solid #e7e5e4" }}>{exam.title}</Link>
          <span style={{ padding: "3px 12px", borderRadius: "99px", background: "#1c1917", color: "#fff", fontSize: "11.5px", fontWeight: "700" }}>第 {idx + 1} / {exam.questions.length} 题</span>
        </div>
        <QuestionCard question={q} courseId={courseId} examId={examId} qIdx={idx} autoOpen={false} />
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={goPrev} disabled={idx === 0} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "10px 16px", borderRadius: "10px",
            border: "1.5px solid #d6d3d1", background: idx === 0 ? "#f5f5f4" : "#fff",
            color: idx === 0 ? "#a8a29e" : "#1c1917", fontSize: "13.5px", fontWeight: "600",
            cursor: idx === 0 ? "not-allowed" : "pointer", flex: 1
          }}><IconChevL /> 上一题</button>
          <button onClick={goNext} disabled={idx >= exam.questions.length - 1} style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px",
            padding: "10px 16px", borderRadius: "10px",
            border: "1.5px solid #1c1917", background: idx >= exam.questions.length - 1 ? "#f5f5f4" : "#1c1917",
            color: idx >= exam.questions.length - 1 ? "#a8a29e" : "#fff", fontSize: "13.5px", fontWeight: "600",
            cursor: idx >= exam.questions.length - 1 ? "not-allowed" : "pointer", flex: 1
          }}>下一题 <IconChevR /></button>
        </div>
      </div>
      <QuestionGrid exam={exam} progress={progress} courseId={courseId} examId={examId} currentIdx={idx} />
    </div>
  );
};

// ============================================================
// PAGE: TOPIC (cluster view + practice entry)
// ============================================================
const TopicPage = () => {
  const { subject, groupKey } = useParams();
  const topicIndex = useMemo(() => buildTopicIndex(examDatabase), []);
  const group = topicIndex[subject] && topicIndex[subject][groupKey];
  const [progress] = useProgress();

  if (!group) return <div style={{ padding: 28 }}>知识点不存在</div>;

  const questions = group.questions;
  const answeredInGroup = questions.filter(item => progress.answered?.[item.q.id]).length;
  const correctInGroup = questions.filter(item => progress.answered?.[item.q.id]?.correct).length;

  return (
    <div style={{ padding: "24px 28px 48px", maxWidth: "1100px", animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: "20px" }}>
        <span style={{ padding: "3px 12px", borderRadius: "99px", background: "#f5f5f4", color: "#78716c", fontSize: "11.5px", fontWeight: "700", border: "1px solid #e7e5e4" }}>
          🎯 {subject === "math" ? "数学" : "物理"} 知识点
        </span>
        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#1c1917", marginTop: "10px" }}>{group.label}</h1>
        <p style={{ fontSize: "13.5px", color: "#78716c", marginTop: "4px" }}>
          共 {questions.length} 道题 · 已练习 {answeredInGroup} · 答对 {correctInGroup}
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        <Link to={`/topic/${subject}/${groupKey}/practice`} style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "11px 20px", borderRadius: "10px",
          background: "#1c1917", color: "#fff", fontSize: "13.5px", fontWeight: "700"
        }}>
          <IconTarget /> 开始专项练习
        </Link>
        <button disabled title="付费功能 · 即将推出" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "11px 20px", borderRadius: "10px",
          background: "#fafaf9", color: "#a8a29e", border: "1.5px dashed #d6d3d1",
          fontSize: "13px", fontWeight: "600", cursor: "not-allowed"
        }}>
          <IconRefresh /> 无限刷题模式
          <span style={{ padding: "1px 7px", borderRadius: "99px", background: "#fef3c7", color: "#92400e", fontSize: "9.5px", fontWeight: "700", marginLeft: "4px" }}>Pro</span>
        </button>
      </div>

      <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#1c1917", marginBottom: "10px" }}>题目列表</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {questions.map((item, i) => {
          const a = progress.answered?.[item.q.id];
          let statusColor = "#a8a29e", statusText = "未做";
          if (a) {
            if (a.correct) { statusColor = "#16a34a"; statusText = "✓ 答对"; }
            else { statusColor = "#dc2626"; statusText = "✗ 答错"; }
          }
          return (
            <Link key={item.q.id} to={`/exam/${item.courseId}/${item.examId}/q/${getQNumInExam(item)}`} style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "14px 16px", background: "#fff", borderRadius: "10px",
              border: "1px solid #e7e5e4"
            }}>
              <span style={{ width: "44px", height: "44px", borderRadius: "10px", background: iconBg(item.courseColor), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "900", color: item.courseColor, border: `1.5px solid ${iconBorder(item.courseColor)}`, flexShrink: 0 }}>{courseIcon(item.courseId)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#1c1917" }}>{item.q.topic}</div>
                <div style={{ fontSize: "11.5px", color: "#78716c", marginTop: "2px" }}>{item.courseName} · {item.examTitle} · {item.q.number}</div>
              </div>
              <span style={{ fontSize: "11.5px", color: statusColor, fontWeight: "600", whiteSpace: "nowrap" }}>{statusText}</span>
              <IconChevR />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

function getQNumInExam(item) {
  const exam = examDatabase[item.courseId].exams[item.examId];
  const idx = exam.questions.findIndex(q => q.id === item.q.id);
  return idx + 1;
}

// ============================================================
// PAGE: PRACTICE MODE (one question at a time)
// ============================================================
const PracticePage = () => {
  const { subject, groupKey } = useParams();
  const navigate = useNavigate();
  const topicIndex = useMemo(() => buildTopicIndex(examDatabase), []);
  const group = topicIndex[subject] && topicIndex[subject][groupKey];
  const [idx, setIdx] = useState(0);
  const [progress] = useProgress();

  if (!group) return <div style={{ padding: 28 }}>知识点不存在</div>;
  const questions = group.questions;
  const item = questions[idx];
  if (!item) return <div style={{ padding: 28 }}>题目不存在</div>;

  const goPrev = () => idx > 0 && setIdx(idx - 1);
  const goNext = () => idx < questions.length - 1 && setIdx(idx + 1);
  const isLast = idx === questions.length - 1;

  const answeredCount = questions.filter(it => progress.answered?.[it.q.id]).length;
  const correctCount = questions.filter(it => progress.answered?.[it.q.id]?.correct).length;

  return (
    <div style={{ padding: "24px 28px 48px", maxWidth: "900px", margin: "0 auto", animation: "fadeIn 0.25s ease" }}>
      <div style={{ marginBottom: "16px" }}>
        <Link to={`/topic/${subject}/${groupKey}`} style={{ fontSize: "12.5px", color: "#78716c", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <IconChevL /> 退出练习
        </Link>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1c1917" }}>专项练习 · {group.label}</span>
          <span style={{ fontSize: "12px", color: "#78716c", fontWeight: "600" }}>{idx + 1} / {questions.length}</span>
        </div>
        <div style={{ height: "6px", background: "#f5f5f4", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{ width: `${((idx + 1) / questions.length) * 100}%`, height: "100%", background: "#1c1917", transition: "width 0.3s" }} />
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "8px", fontSize: "11.5px", color: "#78716c" }}>
          <span>已练习 {answeredCount}</span>
          <span>·</span>
          <span style={{ color: "#16a34a" }}>答对 {correctCount}</span>
        </div>
      </div>

      <QuestionCard question={item.q} courseId={item.courseId} examId={item.examId} qIdx={idx} autoOpen={false} />

      <div style={{ marginTop: "12px", padding: "10px 14px", background: "#fff", borderRadius: "9px", border: "1px solid #e7e5e4", fontSize: "11.5px", color: "#78716c" }}>
        来自 <Link to={`/exam/${item.courseId}/${item.examId}`} style={{ color: "#1c1917", fontWeight: "600" }}>{item.courseName} · {item.examTitle}</Link>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={goPrev} disabled={idx === 0} style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "10px 16px", borderRadius: "10px",
          border: "1.5px solid #d6d3d1", background: idx === 0 ? "#f5f5f4" : "#fff",
          color: idx === 0 ? "#a8a29e" : "#1c1917", fontSize: "13.5px", fontWeight: "600",
          cursor: idx === 0 ? "not-allowed" : "pointer", flex: 1
        }}><IconChevL /> 上一题</button>
        <button onClick={() => isLast ? navigate(`/topic/${subject}/${groupKey}`) : goNext()} style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px",
          padding: "10px 16px", borderRadius: "10px",
          border: "1.5px solid #1c1917", background: "#1c1917",
          color: "#fff", fontSize: "13.5px", fontWeight: "600",
          cursor: "pointer", flex: 1
        }}>{isLast ? "完成练习" : "下一题"} <IconChevR /></button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <HashRouter>
      <GlobalCSS />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/course/:courseId" element={<CoursePage />} />
              <Route path="/exam/:courseId/:examId" element={<ExamPage />} />
              <Route path="/exam/:courseId/:examId/q/:qNum" element={<QuestionPage />} />
              <Route path="/topic/:subject/:groupKey" element={<TopicPage />} />
              <Route path="/topic/:subject/:groupKey/practice" element={<PracticePage />} />
              <Route path="*" element={<DashboardPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
}
