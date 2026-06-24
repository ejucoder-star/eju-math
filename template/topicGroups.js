// ============================================================
// topicGroups.js — 知识点归一化映射
// ============================================================
// JSON 中的 topicTag 共 ~134 种，但很多是同一大类的细分变体
// （例如「二次函数」「二次函数·最值」「二次函数与几何」其实都属"二次函数"）。
// 此文件把所有 tag 归并到 18 个大类，用于：
//   1. sidebar 的「按知识点」聚类
//   2. 专项练习模式
//   3. 学习统计的覆盖度计算
//
// 修改方法：
//   - 新增 tag 时，在对应大类的 tags 数组里加一条即可
//   - 如果某 tag 没在任何大类，会被归入"其他"
// ============================================================

export const SUBJECT_GROUPS = {
  // ========== 数学（13 大类）==========
  math: [
    {
      key: "quadratic_function",
      label: "二次函数",
      tags: [
        "二次函数",
        "二次函数·最值",
        "二次函数与几何",
        "二次函数与判别式",
        "二次函数与平移",
        "二次函数与韦达定理",
        "二次函数与坐标几何",
      ],
    },
    {
      key: "equations_inequalities",
      label: "方程·不等式",
      tags: [
        "二次方程",
        "二次不等式",
        "二次方程与不等式",
        "不等式",
        "绝对值不等式",
        "绝对值与最值",
        "方程与不等式",
        "方程组与不等式",
      ],
    },
    {
      key: "algebra",
      label: "数与代数运算",
      tags: [
        "代数运算",
        "代数恒等变形",
        "代数·绝对值",
        "代数·不等式",
        "代数·因式分解",
        "因式分解",
        "因式分解与整数条件",
        "整式",
        "整式运算",
        "二项式定理",
        "判别式与最值",
      ],
    },
    {
      key: "set_logic",
      label: "集合·逻辑",
      tags: [
        "集合·不等式",
        "集合·逻辑",
        "集合与二次不等式",
        "集合与逻辑",
        "集合与整数",
        "命题·逻辑",
        "逻辑与充要条件",
      ],
    },
    {
      key: "trig",
      label: "三角函数·三角形",
      tags: [
        "三角函数",
        "三角方程",
        "三角形面积",
        "三角形与余弦定理",
        "圆与余弦定理",
        "三角形与内切圆",
        "三角形与外接圆",
        "三角形与不等式",
        "三角形与三角函数",
        "三角形与几何",
        "三角·最值",
        "平面几何与三角函数",
      ],
    },
    {
      key: "geometry",
      label: "几何（平面·立体·解析）",
      tags: [
        "平面几何",
        "平面几何·坐标",
        "立体几何",
        "立体几何与展开图",
        "解析几何",
        "坐标与面积",
        "最值·几何",
      ],
    },
    {
      key: "vectors",
      label: "向量",
      tags: ["向量", "平面向量", "空间向量", "向量·几何", "向量·极限"],
    },
    {
      key: "sequences",
      label: "数列",
      tags: ["数列", "数列·级数", "数列与对数", "数列·极限"],
    },
    {
      key: "calculus",
      label: "微积分",
      tags: [
        "微分·切线",
        "微分·积分",
        "微分·极值",
        "微分·对数",
        "微分·三角",
        "微分方程·积分",
        "微积分",
        "积分",
        "积分·递推",
        "积分·极值",
        "积分·旋转体",
        "积分与微分",
        "积分与面积",
        "积分·面积",
        "积分·切线",
        "三次函数·微分",
        "曲线·微分",
        "定积分·级数",
        "极限·定积分",
        "指数·微分",
        "对数·微分",
        "对数·积分",
        "三角·积分",
        "三角·微分",
        "三角·微分·积分",
        "参数方程·积分",
      ],
    },
    {
      key: "exp_log",
      label: "指数·对数",
      tags: ["对数·圆与直线", "对数·指数", "对数·最值", "指数·对数"],
    },
    {
      key: "complex",
      label: "复数",
      tags: ["复数"],
    },
    {
      key: "combinatorics_probability",
      label: "排列组合·概率",
      tags: [
        "概率",
        "概率与期望值",
        "概率与期望",
        "概率·组合",
        "概率·二次方程",
        "组合",
        "组合计数",
        "组合·容斥",
        "排列与组合",
        "排列组合",
      ],
    },
    {
      key: "integers_numbertheory",
      label: "整数·数论",
      tags: [
        "整数",
        "整数·多项式",
        "整数·同余",
        "整数·集合",
        "整数与素数",
        "整数与数论",
        "整数与整除",
        "整数·分式",
        "整数·数论",
        "无理数",
        "实数与无理数",
        "无理数与方程",
        "无理数与不等式",
        "无理数·整数部分",
      ],
    },
  ],

  // ========== 物理（5 大类）==========
  physics: [
    {
      key: "mechanics",
      label: "力学",
      tags: [
        "力学·静力平衡",
        "力学·静力平衡·力矩",
        "力学·摩擦",
        "力学·摩擦·功",
        "力学·能量守恒",
        "力学·运动学",
        "力学·能量·恢复系数",
        "力学·振动",
        "力学·圆周运动",
        "力学·动量守恒",
        "力学·动量·平抛",
        "力学·动能定理",
        "力学·万有引力",
        "力学·简谐振动",
        "力学·功",
        "力学·碰撞",
        "力学·牛顿运动定律",
      ],
    },
    {
      key: "thermodynamics",
      label: "热学",
      tags: [
        "热学·相变",
        "热学·热力学第一定律",
        "热学·热力学循环",
        "热学·比热",
        "热学·比热·潜热",
        "热学·理想气体",
        "热学·热力学",
      ],
    },
    {
      key: "waves_optics",
      label: "波动·光学",
      tags: [
        "波动·多普勒",
        "波动·驻波",
        "波动·薄膜干涉",
        "波动·行波",
        "波动·光速",
        "波动·声波·驻波",
        "波动·纵波",
      ],
    },
    {
      key: "electromagnetism",
      label: "电磁",
      tags: [
        "电磁·静电",
        "电磁·电容",
        "电磁·磁场",
        "电磁·洛伦兹力",
        "电磁·电路",
        "电磁·电路·欧姆定律",
        "电磁·静电势能",
        "电磁·电磁感应",
        "电磁·磁场·安培力",
      ],
    },
    {
      key: "modern_physics",
      label: "近代物理",
      tags: ["近代物理·原子核"],
    },
  ],
};

// ============================================================
// 反查表：根据 tag 找大类
// ============================================================
export const TAG_TO_GROUP = {};
for (const subject of Object.keys(SUBJECT_GROUPS)) {
  for (const group of SUBJECT_GROUPS[subject]) {
    for (const tag of group.tags) {
      TAG_TO_GROUP[tag] = { subject, key: group.key, label: group.label };
    }
  }
}

// ============================================================
// 工具函数
// ============================================================

// 根据 course id 得到 subject ("course1"/"course2" → "math"; "physics" → "physics")
export function courseToSubject(courseId) {
  if (courseId === "physics") return "physics";
  return "math";
}

// 给定一个 topicTag，返回其大类 {subject, key, label}；找不到则归入"其他"
export function lookupGroup(tag, courseId) {
  const hit = TAG_TO_GROUP[tag];
  if (hit) return hit;
  return {
    subject: courseToSubject(courseId),
    key: "other",
    label: "其他",
  };
}

// 输入完整 examDatabase，返回按 subject + group 聚类的索引：
// {
//   math: {
//     quadratic_function: { label, questions: [{courseId, examId, q}, ...] },
//     ...
//   },
//   physics: { ... }
// }
export function buildTopicIndex(examDatabase) {
  const index = { math: {}, physics: {} };

  // 先把每个 subject 的所有 group 初始化（即使空也要有 label）
  for (const subject of Object.keys(SUBJECT_GROUPS)) {
    for (const group of SUBJECT_GROUPS[subject]) {
      index[subject][group.key] = {
        label: group.label,
        key: group.key,
        questions: [],
      };
    }
    // 给"其他"留位
    index[subject]["other"] = {
      label: "其他",
      key: "other",
      questions: [],
    };
  }

  // 遍历所有题
  for (const courseId of Object.keys(examDatabase)) {
    const course = examDatabase[courseId];
    for (const examId of Object.keys(course.exams)) {
      const exam = course.exams[examId];
      for (const q of exam.questions) {
        const g = lookupGroup(q.topicTag, courseId);
        if (!index[g.subject][g.key]) {
          index[g.subject][g.key] = { label: g.label, key: g.key, questions: [] };
        }
        index[g.subject][g.key].questions.push({
          courseId,
          courseName: course.name,
          courseColor: course.color,
          examId,
          examTitle: exam.title,
          q,
        });
      }
    }
  }

  // 移除空 group
  for (const subject of Object.keys(index)) {
    for (const key of Object.keys(index[subject])) {
      if (index[subject][key].questions.length === 0) {
        delete index[subject][key];
      }
    }
  }

  return index;
}
