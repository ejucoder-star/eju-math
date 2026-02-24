# EJU 数学真题解析

## 项目结构

```
eju-math/
├── data/                          ← 【题目数据】你只需要动这里
│   ├── 2011_R1_course1.json       ← 2011年第1回·数学1
│   ├── 2011_R1_course2.json       ← 2011年第1回·数学2
│   ├── 2012_R1_course1.json       ← （示例）新增一个文件即可
│   └── ...
│
├── template/
│   └── app-template.jsx           ← UI 模板（一般不动）
├── build.js                       ← 构建脚本（一般不动）
├── dist/
│   └── eju-math.jsx               ← 自动生成，不要手动编辑
│
├── src/main.jsx                   ← Vite 入口
├── index.html
├── package.json
└── vite.config.js
```

## 更新题目的流程

### 第一步：准备 JSON 文件

文件名格式：`{年份}_R{回次}_{course1或course2}.json`

例如要添加 2012 年第 1 回数学 1，就创建 `2012_R1_course1.json`。

### 第二步：JSON 格式

```json
{
  "metadata": {
    "course": "course1",
    "year": "2012",
    "session": "1",
    "courseNameJa": "数学1",
    "courseNameEn": "Course 1 (Basic)",
    "description": "基础课程｜文科方向",
    "color": "#2563eb",
    "examTitle": "2012年度（平成24年）第1回",
    "examDate": "2012年6月"
  },
  "questions": [
    {
      "id": "c1-I-1",
      "number": "I-1",
      "topic": "二次函数最值",
      "topicTag": "二次函数",
      "humanVerified": false,
      "japanese": "这里写中文题干（保留 $公式$ 和 \\fbox{X} 填空框）",
      "answer_match": true,
      "needs_review": true,
      "questionDiagram": {
        "svg": "<svg>...</svg>"
      },
      "solution": {
        "translation": "题目的简短中文概括",
        "analysis": "一句话解题思路",
        "steps": [
          {
            "title": "步骤标题",
            "content": "步骤内容，支持 $LaTeX$ 公式",
            "why": "可选的补充说明（显示为「为什么？」按钮）",
            "diagram": {
              "svg": "<svg>可选的步骤配图</svg>"
            }
          }
        ],
        "finalAnswer": "最终答案"
      }
    }
  ]
}
```

### 第三步：构建并部署

```bash
# 1. 构建（读取 data/ 下所有 JSON → 生成 dist/eju-math.jsx）
node build.js

# 2. 推送到 GitHub（Vercel 会自动部署）
git add .
git commit -m "添加 2012 R1 数学1"
git push
```

## 本地开发

```bash
npm install
npm run dev        # 启动开发服务器（含热更新）
npm run build      # 构建生产版本
```

## 注意事项

- `japanese` 字段虽然叫这个名字（历史原因），实际内容必须是**中文**
- `questionDiagram` 和步骤中的 `diagram` 是可选的，只有几何题需要
- `color`: 数学1 用 `#2563eb`（蓝），数学2 用 `#dc2626`（红）
- `humanVerified: true` 会显示「人工校对通过」标记
