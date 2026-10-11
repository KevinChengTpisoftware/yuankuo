export type TrophyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type Category = '食' | '衣' | '住' | '行' | '育' | '樂' | '選修' | '全部';

export type PartnerType = '自己完成' | '家屬夥伴' | '多功能型照顧服務員' | '醫療團隊';

export const PARTNER_OPTIONS: { id: PartnerType; label: string; shortDesc: string; color: string; bg: string }[] = [
  { id: '自己完成', label: '自己完成', shortDesc: '完全獨立生活', color: 'text-emerald-700', bg: 'bg-emerald-500' },
  { id: '家屬夥伴', label: '家屬夥伴', shortDesc: '家屬賦能參與', color: 'text-amber-700', bg: 'bg-amber-500' },
  { id: '多功能型照顧服務員', label: '多功能型照顧服務員', shortDesc: '照服員生活支持', color: 'text-sky-700', bg: 'bg-sky-500' },
  { id: '醫療團隊', label: '醫療團隊', shortDesc: '專業團隊介入', color: 'text-purple-700', bg: 'bg-purple-500' },
];

export interface Task {
  id: number;
  category: Category;
  tier: TrophyTier;
  phase?: string;
  title: string;
  description: string;
  location?: string;
}

export interface Patient {
  id: string;
  name: string;
  caseNumber: string;
  bedNumber?: string;                       // 床號
  age?: string;                             // 年紀
  upstreamHospital?: string;                // 上游醫院
  caregiver?: string;                       // 照顧者
  homeLocation?: string;                    // 個案家在哪
  primaryMedicalDecisionMaker?: string;     // 主要醫療決定者

  // 社會心理/生活/環境社會心理暨家庭功能評估
  familyMarriage?: string;                  // 家庭/婚姻
  economicStatus?: string;                  // 經濟
  preMorbidOccupation?: string;             // 病前職業生活
  interestsSpecialties?: string;            // 興趣/特殊專長
  educationLevel?: string;                  // 教育程度
  livingEnvironment?: string;               // 居住環境
  cohabitingFamily?: string;                // 同住家人
  preMorbidPersonality?: string;            // 病前性格
  postMorbidPersonality?: string;           // 病後個性

  primaryTherapist?: string;
  admissionDate?: string;
  diagnosis?: string;
  targetGoal?: string;
  status: 'active' | 'archived';
  completedTasks: number[];
  taskPartners?: Record<number, string[]>;
  taskCompletedAt?: Record<number, string>;
  clinicalRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WishCard {
  id: string;
  category: Category;
  title: string;
  subtitle: string;
  icon: string;
  badgeText: string;
  difficultyLevel: '入門基礎' | '生活自立' | '活躍回歸';
  actionVerb?: string;            // 核心動作動詞 (如: 舀起、夾取、扣合、邁步、翻坐、視訊、澆水)
  actionVerbFull?: string;        // 完整動作動詞片語 (如: 用湯匙舀進嘴裡、雙手對準扣合鈕釦)
  animationType?: string;         // 動態日常生活動作類型
  videoUrl?: string;              // 自訂示範動作影片 URL (MP4、WebM 或 YouTube 連結)
  imageUrl?: string;             // 生活情境插圖 / 相片 URL
  imageAlt?: string;             // 圖片替代描述
  requiredAbilities: {
    posturalMotor: string[];     // 姿勢平衡與大動作控制
    handFunction: string[];      // 患側/健側手部操作與協調
    cognitiveSensory: string[];  // 認知、空間與安全知覺
  };
  adaptiveStrategies: string[];  // 友善代償技巧與輔具應用
  relatedTaskIds: number[];      // 對應 150 項護照任務 ID
  milestoneTaskId: number;       // 核心里程碑任務 ID
}
