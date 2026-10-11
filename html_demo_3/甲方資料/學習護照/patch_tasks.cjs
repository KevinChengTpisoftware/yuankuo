const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

const newTasks = `,
  {
    "id": 151,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "復能與功能促進",
    "description": "參與復能與功能促進相關之健康教育或照護訓練活動。"
  },
  {
    "id": 152,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "口腔健康照護",
    "description": "參與口腔健康照護相關之健康教育或照護訓練活動。"
  },
  {
    "id": 153,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "吞嚥與飲食安全",
    "description": "參與吞嚥與飲食安全相關之健康教育或照護訓練活動。"
  },
  {
    "id": 154,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "營養照護",
    "description": "參與營養照護相關之健康教育或照護訓練活動。"
  },
  {
    "id": 155,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "用藥安全",
    "description": "參與用藥安全相關之健康教育或照護訓練活動。"
  },
  {
    "id": 156,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "跌倒預防",
    "description": "參與跌倒預防相關之健康教育或照護訓練活動。"
  },
  {
    "id": 157,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "失智照護",
    "description": "參與失智照護相關之健康教育或照護訓練活動。"
  },
  {
    "id": 158,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "安寧與善終照護",
    "description": "參與安寧與善終照護相關之健康教育或照護訓練活動。"
  },
  {
    "id": 159,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "慢性病自我管理",
    "description": "參與慢性病自我管理相關之健康教育或照護訓練活動。"
  },
  {
    "id": 160,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "輔具與居家安全",
    "description": "參與輔具與居家安全相關之健康教育或照護訓練活動。"
  },
  {
    "id": 161,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "健康促進或社區活動",
    "description": "參與健康促進或社區相關之活動。"
  },
  {
    "id": 162,
    "category": "選修",
    "tier": "bronze",
    "phase": "健康學習徽章",
    "title": "其他特色課程",
    "description": "參與其他特色課程或相關健康學習活動。"
  }
];`;

code = code.replace(/\];[\s]*$/, newTasks);
fs.writeFileSync('src/data.ts', code);
