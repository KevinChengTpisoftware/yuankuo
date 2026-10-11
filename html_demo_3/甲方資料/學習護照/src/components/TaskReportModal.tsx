import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  X, 
  FileText, 
  CheckSquare, 
  Square, 
  Filter, 
  Award, 
  ShieldCheck, 
  UserCheck, 
  Stethoscope,
  ArrowLeft,
  Users,
  Clock
} from 'lucide-react';
import { Task, Category } from '../types';
import { TASKS } from '../data';

interface TaskReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToAdmin?: () => void;
  completedTasks: Set<number>;
  taskPartners?: Record<number, string[]>;
  taskCompletedAt?: Record<number, string>;
  patientName: string;
  onUpdatePatientName: (name: string) => void;
  totalProgress: number;
  overallCompleted: number;
  mainTasksCount: number;
}

const CATEGORY_NAMES: { id: Category; label: string; icon: string }[] = [
  { id: '食', label: '食：米其林大廚', icon: '🍳' },
  { id: '衣', label: '衣：時尚伸展台', icon: '👕' },
  { id: '住', label: '住：住宅改造王', icon: '🏡' },
  { id: '行', label: '行：拓荒者行動', icon: '🚶' },
  { id: '育', label: '育：知性研究所', icon: '🧠' },
  { id: '樂', label: '樂：開心農場', icon: '🌱' },
  { id: '選修', label: '選修：學習徽章', icon: '🥇' },
];

const TIER_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  bronze: { label: '銅盃階段目標', bg: 'bg-amber-100', text: 'text-amber-900' },
  silver: { label: '銀盃進階挑戰', bg: 'bg-slate-200', text: 'text-slate-800' },
  gold: { label: '金盃真實社會', bg: 'bg-yellow-100', text: 'text-yellow-900' },
  platinum: { label: '白金光榮退役', bg: 'bg-stone-800', text: 'text-white' },
};

export const TaskReportModal: React.FC<TaskReportModalProps> = ({
  isOpen,
  onClose,
  onBackToAdmin,
  completedTasks,
  taskPartners = {},
  taskCompletedAt = {},
  patientName,
  onUpdatePatientName,
  totalProgress,
  overallCompleted,
  mainTasksCount,
}) => {
  const [onlyCompleted, setOnlyCompleted] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('all');
  const [therapistName, setTherapistName] = useState('復健治療團隊');
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [clinicalRemarks, setClinicalRemarks] = useState(
    '個案於本次檢核中展現積極動機，已達成各階段指定功能性訓練項目。建請維持居家常態性自理活動，並定期追蹤功能性進展。'
  );
  const [copied, setCopied] = useState(false);

  const modalRootRef = useRef<HTMLDivElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);

  // Helper to normalize and retrieve partners for a specific task
  const getTaskPartners = (taskId: number): string[] => {
    const raw = taskPartners[taskId] || [];
    return raw.map(p => (p === '家屬陪伴' ? '家屬夥伴' : p));
  };

  // Support partner statistics across completed tasks
  const partnerStats = useMemo(() => {
    let selfCount = 0;
    let familyCount = 0;
    let attendantCount = 0;
    let medicalCount = 0;
    let unassignedCount = 0;

    completedTasks.forEach(taskId => {
      const partners = getTaskPartners(taskId);
      if (partners.length === 0) {
        unassignedCount += 1;
      } else {
        if (partners.includes('自己完成')) selfCount += 1;
        if (partners.includes('家屬夥伴')) familyCount += 1;
        if (partners.includes('多功能型照顧服務員')) attendantCount += 1;
        if (partners.includes('醫療團隊')) medicalCount += 1;
      }
    });

    const completedCount = completedTasks.size;
    const selfIndependenceRate = completedCount > 0 ? Math.round((selfCount / completedCount) * 100) : 0;

    return {
      selfCount,
      familyCount,
      attendantCount,
      medicalCount,
      unassignedCount,
      selfIndependenceRate,
    };
  }, [completedTasks, taskPartners]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return TASKS.filter(task => {
      if (task.category === '全部' || task.tier === 'platinum' || task.id === 200) return false;
      const isDone = completedTasks.has(task.id);
      if (onlyCompleted && !isDone) return false;
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;

      if (selectedPartnerFilter !== 'all') {
        const partners = getTaskPartners(task.id);
        if (selectedPartnerFilter === '未指定') {
          if (!isDone || partners.length > 0) return false;
        } else {
          if (!isDone || !partners.includes(selectedPartnerFilter)) return false;
        }
      }

      return true;
    });
  }, [completedTasks, onlyCompleted, selectedCategory, selectedPartnerFilter, taskPartners]);

  // Group tasks by category and tier
  const groupedTasks = useMemo(() => {
    const groups: { category: Category; tasks: Task[] }[] = [];
    const categories: Category[] = ['食', '衣', '住', '行', '育', '樂', '選修'];

    categories.forEach(cat => {
      const tasksInCat = filteredTasks.filter(t => t.category === cat);
      if (tasksInCat.length > 0) {
        groups.push({ category: cat, tasks: tasksInCat });
      }
    });

    return groups;
  }, [filteredTasks]);

  // Statistics per category
  const categoryStats = useMemo(() => {
    const cats: Category[] = ['食', '衣', '住', '行', '育', '樂'];
    return cats.map(c => {
      const catTasks = TASKS.filter(t => t.category === c);
      const doneCount = catTasks.filter(t => completedTasks.has(t.id)).length;
      return {
        category: c,
        done: doneCount,
        total: catTasks.length,
        rate: catTasks.length > 0 ? Math.round((doneCount / catTasks.length) * 100) : 0,
      };
    });
  }, [completedTasks]);

  // Reset scroll before printing to ensure page 1 (items 1+) is captured cleanly
  useEffect(() => {
    const onBeforePrint = () => {
      if (modalCardRef.current) modalCardRef.current.scrollTop = 0;
      if (modalRootRef.current) modalRootRef.current.scrollTop = 0;
      window.scrollTo(0, 0);
    };
    window.addEventListener('beforeprint', onBeforePrint);
    return () => window.removeEventListener('beforeprint', onBeforePrint);
  }, []);

  // Print trigger
  const handlePrint = () => {
    if (modalCardRef.current) {
      modalCardRef.current.scrollTop = 0;
    }
    if (modalRootRef.current) {
      modalRootRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Word Export (.doc format compatible with Word, WPS, Google Docs, Pages)
  const handleExportWord = () => {
    const docTitle = `日常生活功能檢核報告_${patientName || '個案'}_${evalDate}`;

    // Category stats cells
    const statsCellsHtml = categoryStats
      .map(
        s => `
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; vertical-align: middle; background-color: #f8fafc;">
          <div style="font-weight: bold; font-size: 10pt; color: #1e293b;">${s.category}</div>
          <div style="font-size: 9pt; color: #059669; font-weight: bold; margin-top: 2px;">${s.done} / ${s.total}</div>
          <div style="font-size: 8pt; color: #64748b;">(${s.rate}%)</div>
        </td>`
      )
      .join('');

    // Tasks grouped
    const tasksHtml = groupedTasks
      .map(group => {
        const catMeta = CATEGORY_NAMES.find(c => c.id === group.category);
        const rows = group.tasks
          .map(task => {
            const isDone = completedTasks.has(task.id);
            const tierBadge = TIER_LABELS[task.tier] || { label: task.tier };
            const checkSymbol = isDone ? '☑' : '☐';
            const statusColor = isDone ? '#059669' : '#94a3b8';
            const statusLabel = isDone ? '已完成' : '未完成';
            const completedTimeStr = isDone && taskCompletedAt[task.id] 
              ? new Date(taskCompletedAt[task.id]).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) 
              : '';
            const partners = getTaskPartners(task.id);

            const partnerBadgesHtml = isDone ? (
              partners.length > 0 ? partners.map(p => {
                if (p === '自己完成') return `<span style="background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 1px 5px; border-radius: 3px; font-size: 7.5pt; margin-right: 2px; display: inline-block;">自己完成</span>`;
                if (p === '家屬夥伴') return `<span style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 1px 5px; border-radius: 3px; font-size: 7.5pt; margin-right: 2px; display: inline-block;">家屬夥伴</span>`;
                if (p === '多功能型照顧服務員') return `<span style="background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 1px 5px; border-radius: 3px; font-size: 7.5pt; margin-right: 2px; display: inline-block;">照服員</span>`;
                if (p === '醫療團隊') return `<span style="background-color: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; padding: 1px 5px; border-radius: 3px; font-size: 7.5pt; margin-right: 2px; display: inline-block;">醫療團隊</span>`;
                return `<span style="background-color: #f1f5f9; color: #475569; padding: 1px 5px; border-radius: 3px; font-size: 7.5pt; margin-right: 2px; display: inline-block;">${p}</span>`;
              }).join(' ') : `<span style="color: #94a3b8; font-size: 8pt; font-style: italic;">未指定</span>`
            ) : `<span style="color: #cbd5e1; font-size: 8pt;">—</span>`;

            return `
            <tr style="${isDone ? 'background-color: #ffffff;' : 'background-color: #f8fafc; color: #64748b;'}">
              <td style="border: 1px solid #cbd5e1; padding: 6px 4px; text-align: center; vertical-align: top; width: 44px;">
                <span style="color: ${statusColor}; font-weight: bold; font-size: 12pt;">${checkSymbol}</span>
                <div style="font-size: 7.5pt; color: ${statusColor}; font-weight: bold;">${statusLabel}</div>
                ${completedTimeStr ? `<div style="font-size: 6.5pt; color: #059669; margin-top: 3px; line-height: 1.1;">${completedTimeStr}</div>` : ''}
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 4px; text-align: center; vertical-align: top; font-family: monospace, Consolas; font-size: 9pt; color: #475569; width: 42px;">
                ${String(task.id).padStart(3, '0')}
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 6px; vertical-align: top; width: 88px;">
                <div style="display: inline-block; padding: 2px 6px; font-size: 8pt; font-weight: bold; background-color: #f1f5f9; border-radius: 3px; color: #334155; border: 1px solid #e2e8f0;">
                  ${tierBadge.label}
                </div>
                ${task.phase ? `<div style="font-size: 7.5pt; color: #64748b; margin-top: 3px; line-height: 1.2;">${task.phase}</div>` : ''}
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; font-weight: bold; font-size: 9.5pt; color: #0f172a; width: 120px;">
                ${task.title}
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 6px; vertical-align: top; width: 130px;">
                ${partnerBadgesHtml}
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; font-size: 9pt; color: #334155; line-height: 1.45;">
                ${task.description}
              </td>
            </tr>`;
          })
          .join('');

        return `
        <div style="margin-top: 14px; margin-bottom: 6px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
            <tr>
              <td style="background-color: #059669; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 10.5pt; border-radius: 3px;">
                ${catMeta?.icon || ''} ${catMeta?.label || group.category} (共 ${group.tasks.length} 項)
              </td>
            </tr>
          </table>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9pt;" border="1" cellpadding="5">
            <thead>
              <tr style="background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: center;">
                <th style="border: 1px solid #cbd5e1; width: 44px; padding: 5px;">狀態</th>
                <th style="border: 1px solid #cbd5e1; width: 42px; padding: 5px;">編號</th>
                <th style="border: 1px solid #cbd5e1; width: 88px; padding: 5px; text-align: left;">等級 / 階段</th>
                <th style="border: 1px solid #cbd5e1; width: 120px; padding: 5px; text-align: left;">任務名稱</th>
                <th style="border: 1px solid #cbd5e1; width: 130px; padding: 5px; text-align: left;">共學夥伴</th>
                <th style="border: 1px solid #cbd5e1; padding: 5px; text-align: left;">達成標準與訓練要點</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>`;
      })
      .join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>${docTitle}</title>
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt; /* A4 Portrait */
            margin: 18mm 16mm 18mm 16mm;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.WordSection1 {
            page: WordSection1;
          }
          body {
            font-family: "微軟正黑體", "Microsoft JhengHei", "PingFang TC", Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.45;
            color: #1e293b;
          }
          table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <!-- Header Banner -->
          <table style="width: 100%; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 12px;">
            <tr>
              <td>
                <h1 style="font-size: 17pt; color: #065f46; margin: 0; padding: 0;">日常生活功能檢核報告</h1>
                <div style="font-size: 9.5pt; color: #475569; margin-top: 3px;">生活功能解鎖護照 (Functional ADL Passport) • 臨床能力評估與賦能驗證記錄</div>
              </td>
              <td style="text-align: right; vertical-align: bottom;">
                <div style="font-size: 9pt; color: #64748b;">製表日期：${evalDate}</div>
              </td>
            </tr>
          </table>

          <!-- Patient & Evaluation Info Card -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; background-color: #f8fafc;" border="1" cellpadding="6">
            <tr>
              <td style="border: 1px solid #cbd5e1; width: 20%; font-weight: bold; background-color: #f1f5f9; color: #334155;">個案姓名</td>
              <td style="border: 1px solid #cbd5e1; width: 30%; font-weight: bold; color: #0f172a;">${patientName || '未填寫'}</td>
              <td style="border: 1px solid #cbd5e1; width: 25%; font-weight: bold; background-color: #f1f5f9; color: #334155;">物理/職能治療師</td>
              <td style="border: 1px solid #cbd5e1; width: 25%; font-weight: bold; color: #0f172a;">${therapistName || '復健治療團隊'}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; font-weight: bold; background-color: #f1f5f9; color: #334155;">評估日期</td>
              <td style="border: 1px solid #cbd5e1; color: #334155;">${evalDate}</td>
              <td style="border: 1px solid #cbd5e1; font-weight: bold; background-color: #f1f5f9; color: #334155;">總體達成進度</td>
              <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">
                ${overallCompleted} / ${mainTasksCount} 項 (${totalProgress}%)
              </td>
            </tr>
          </table>

          <!-- Category Progress Table -->
          <div style="font-weight: bold; font-size: 10pt; color: #1e293b; margin-bottom: 4px;">各生活領域達成進度統計</div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; background-color: #ffffff;" border="1" cellpadding="6">
            <thead>
              <tr style="background-color: #ecfdf5;">
                <th colspan="6" style="border: 1px solid #a7f3d0; padding: 4px; text-align: center; color: #065f46; font-size: 8.5pt;">
                  六大核心生活自理領域達成率概況
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                ${statsCellsHtml}
              </tr>
            </tbody>
          </table>

          <!-- Support Partner Analytics Table in Word -->
          <div style="font-weight: bold; font-size: 10pt; color: #1e293b; margin-bottom: 4px;">
            共學夥伴支援型態分佈（自立與照護賦能分析）
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; background-color: #ffffff;" border="1" cellpadding="6">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="border: 1px solid #cbd5e1; text-align: center; color: #065f46; font-size: 8.5pt; width: 25%;">
                  自己完成 (完全自主)
                </th>
                <th style="border: 1px solid #cbd5e1; text-align: center; color: #92400e; font-size: 8.5pt; width: 25%;">
                  家屬夥伴 (賦能協同)
                </th>
                <th style="border: 1px solid #cbd5e1; text-align: center; color: #0369a1; font-size: 8.5pt; width: 25%;">
                  多功能型照服員 (生活支持)
                </th>
                <th style="border: 1px solid #cbd5e1; text-align: center; color: #6b21a8; font-size: 8.5pt; width: 25%;">
                  醫療團隊 (專業介入)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; background-color: #f8fafc;">
                  <div style="font-size: 11pt; font-weight: bold; color: #059669;">${partnerStats.selfCount} 項</div>
                  <div style="font-size: 8pt; color: #64748b;">自主獨立率 ${partnerStats.selfIndependenceRate}%</div>
                </td>
                <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; background-color: #f8fafc;">
                  <div style="font-size: 11pt; font-weight: bold; color: #d97706;">${partnerStats.familyCount} 項</div>
                  <div style="font-size: 8pt; color: #64748b;">家屬引導支持</div>
                </td>
                <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; background-color: #f8fafc;">
                  <div style="font-size: 11pt; font-weight: bold; color: #0284c7;">${partnerStats.attendantCount} 項</div>
                  <div style="font-size: 8pt; color: #64748b;">照服照護陪伴</div>
                </td>
                <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; background-color: #f8fafc;">
                  <div style="font-size: 11pt; font-weight: bold; color: #7c3aed;">${partnerStats.medicalCount} 項</div>
                  <div style="font-size: 8pt; color: #64748b;">專業技術指導</div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Task List Heading -->
          <div style="font-size: 9pt; color: #475569; margin-bottom: 4px;">
            檢核清單顯示範圍：<strong>${onlyCompleted ? '僅顯示已勾選達成項目' : '顯示全部任務項目'}</strong>（共 ${filteredTasks.length} 項）
          </div>

          <!-- Tasks Content -->
          ${tasksHtml}

          <!-- Clinical Remarks Box -->
          <div style="margin-top: 16px; padding: 10px; border: 1px solid #10b981; background-color: #f0fdf4; border-radius: 4px;">
            <div style="font-weight: bold; font-size: 10pt; color: #065f46; margin-bottom: 5px;">
              臨床功能表現綜合評語與居家訓練建議
            </div>
            <div style="font-size: 9pt; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">
              ${clinicalRemarks || '（無特殊臨床備註）'}
            </div>
          </div>

          <!-- Signature Table -->
          <table style="width: 100%; margin-top: 22px; border-collapse: collapse;">
            <tr>
              <td style="width: 32%; text-align: center; vertical-align: top; border: 1px solid #cbd5e1; padding: 10px; background-color: #f8fafc;">
                <div style="font-size: 9pt; font-weight: bold; color: #334155; margin-bottom: 38px;">
                  物理治療師 / 職能治療師簽章
                </div>
                <div style="border-top: 1px solid #94a3b8; width: 80%; margin: 0 auto 4px auto;"></div>
                <div style="font-size: 8pt; color: #64748b;">簽名與執照字號</div>
              </td>
              <td style="width: 2%;"></td>
              <td style="width: 32%; text-align: center; vertical-align: top; border: 1px solid #cbd5e1; padding: 10px; background-color: #f8fafc;">
                <div style="font-size: 9pt; font-weight: bold; color: #334155; margin-bottom: 38px;">
                  個案 / 家屬確認簽署
                </div>
                <div style="border-top: 1px solid #94a3b8; width: 80%; margin: 0 auto 4px auto;"></div>
                <div style="font-size: 8pt; color: #64748b;">本人或主要照顧者簽名</div>
              </td>
              <td style="width: 2%;"></td>
              <td style="width: 32%; text-align: center; vertical-align: top; border: 1px solid #cbd5e1; padding: 10px; background-color: #f8fafc;">
                <div style="font-size: 9pt; font-weight: bold; color: #334155; margin-bottom: 12px;">
                  復健科評估認證戳章
                </div>
                <div style="font-size: 9.5pt; font-weight: bold; color: #1e293b; margin-bottom: 10px;">員郭醫院 復健團隊</div>
                <div style="font-size: 8pt; color: #64748b;">印發日期：${evalDate}</div>
              </td>
            </tr>
          </table>

          <div style="text-align: center; font-size: 8pt; color: #94a3b8; margin-top: 18px;">
            生活功能解鎖護照 (Functional ADL Passport) • 本報告供臨床復健評估、個案自主管理及家屬居家照護參考使用
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `生活功能護照_檢核報告_${patientName || '個案'}_${evalDate}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      '任務編號',
      '生活領域',
      '挑戰階級',
      '階段劃分',
      '任務名稱',
      '共學夥伴',
      '達成標準說明',
      '完成狀態',
      '登錄時間',
    ];

    const rows = filteredTasks.map(t => {
      const isDone = completedTasks.has(t.id);
      const tierInfo = TIER_LABELS[t.tier]?.label || t.tier;
      const partners = getTaskPartners(t.id);
      const partnerText = isDone ? (partners.length > 0 ? partners.join('、') : '未指定') : '-';
      const completedTimeStr = isDone && taskCompletedAt[t.id]
        ? new Date(taskCompletedAt[t.id]).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '-';
      return [
        `${String(t.id).padStart(3, '0')}`,
        t.category,
        tierInfo,
        t.phase || '-',
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${partnerText.replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        isDone ? '已完成' : '未完成',
        `"${completedTimeStr}"`,
      ];
    });

    const csvString = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `生活功能護照_檢核報告_${patientName || '個案'}_${evalDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy Plain Text
  const handleCopyText = () => {
    const lines = [
      `【日常生活功能護照 - 臨床能力檢核報告】`,
      `個案姓名：${patientName || '未填寫'}`,
      `物理治療師/職能治療師：${therapistName || '未填寫'}`,
      `評估日期：${evalDate}`,
      `總體達成率：${overallCompleted} / ${mainTasksCount} 項 (${totalProgress}%)`,
      `====================================`,
      `共學夥伴支援模式分析：`,
      `  • [自己完成]：${partnerStats.selfCount} 項 (自主獨立率 ${partnerStats.selfIndependenceRate}%)`,
      `  • [家屬夥伴]：${partnerStats.familyCount} 項`,
      `  • [多功能型照顧服務員]：${partnerStats.attendantCount} 項`,
      `  • [醫療團隊]：${partnerStats.medicalCount} 項`,
      `====================================`,
      `各領域達成率：`,
      ...categoryStats.map(s => `  • [${s.category}]：${s.done}/${s.total} (${s.rate}%)`),
      `====================================`,
      `已勾選完成之任務清單 (${filteredTasks.filter(t => completedTasks.has(t.id)).length} 項)：`,
    ];

    groupedTasks.forEach(g => {
      lines.push(`\n【${g.category} 領域】`);
      g.tasks.forEach(t => {
        const isDone = completedTasks.has(t.id);
        const mark = isDone ? '[✓]' : '[ ]';
        const partners = getTaskPartners(t.id);
        const partnerStr = isDone ? (partners.length > 0 ? ` 【共學夥伴: ${partners.join('、')}】` : ' 【共學夥伴: 未指定】') : '';
        lines.push(`  ${mark} ${String(t.id).padStart(3, '0')} ${t.title}${partnerStr} - ${t.description}`);
      });
    });

    lines.push(`\n====================================`);
    lines.push(`臨床備註與衛教建議：`);
    lines.push(clinicalRemarks);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRootRef}
      className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[80] flex items-center justify-center p-2 sm:p-4 overflow-y-auto task-report-modal-root"
    >
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          /* Force exact print color reproduction for badges and checkmarks */
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body > :not(#root) {
            display: none !important;
          }

          html, body {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #root {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .task-report-modal-root {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            z-index: auto !important;
            inset: auto !important;
          }

          .report-page-card {
            display: block !important;
            position: static !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important; /* Critical: motion.div transform cancels multi-page pagination */
          }

          .report-table-wrapper {
            overflow: visible !important;
            border-radius: 0 !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          @page {
            size: portrait;
            margin: 10mm 12mm;
          }

          table {
            width: 100% !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          thead {
            display: table-header-group !important; /* Repeats table column headers on every printed page */
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .category-title-header {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <motion.div
        ref={modalCardRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[1200px] max-h-[92vh] overflow-y-auto flex flex-col report-page-card print:shadow-none print:w-full print:max-w-none print:h-auto print:max-h-none print:overflow-visible print:block"
      >
        {/* Top Control Bar (Hidden in Print) */}
        <div className="p-4 sm:p-6 border-b border-stone-200 bg-stone-50/90 backdrop-blur sticky top-0 z-20 print:hidden flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
                  日常生活功能檢核報告
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    A4 列印 / PDF / Word / CSV
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  可直接列印紙本供病歷留存、匯出 Word 編輯補充，或下載 Excel (CSV)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onBackToAdmin && (
                <button
                  type="button"
                  onClick={onBackToAdmin}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs hover:border-emerald-500"
                  title="返回個案管理後台系統視窗"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-700" />
                  <Users className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
                  <span>返回個案管理後台</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500 hover:text-stone-800"
                title="關閉"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOnlyCompleted(!onlyCompleted)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  onlyCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {onlyCompleted ? (
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-stone-400" />
                )}
                僅顯示已勾選項目 ({completedTasks.size} 項)
              </button>

              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-transparent font-medium text-stone-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">所有領域 (全部)</option>
                  {CATEGORY_NAMES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={selectedPartnerFilter}
                  onChange={e => setSelectedPartnerFilter(e.target.value)}
                  className="bg-transparent font-medium text-stone-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">所有夥伴 (全部)</option>
                  <option value="自己完成">自己完成 ({partnerStats.selfCount}項)</option>
                  <option value="家屬夥伴">家屬夥伴 ({partnerStats.familyCount}項)</option>
                  <option value="多功能型照顧服務員">照服員 ({partnerStats.attendantCount}項)</option>
                  <option value="醫療團隊">醫療團隊 ({partnerStats.medicalCount}項)</option>
                  <option value="未指定">未指定夥伴 ({partnerStats.unassignedCount}項)</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {onBackToAdmin && (
                <button
                  type="button"
                  onClick={onBackToAdmin}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 rounded-lg text-xs font-bold transition border border-stone-200 hover:border-emerald-300 shadow-2xs"
                  title="返回個案管理後台系統視窗"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" />
                  <span>返回後台</span>
                </button>
              )}

              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition"
                title="複製純文字摘要"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已複製' : '複製文字'}
              </button>

              <button
                onClick={handleExportWord}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition shadow-sm"
                title="匯出 Word (.doc) 檔，可用 Microsoft Word / WPS / Google 文件開啟與編輯"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                匯出 Word
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition shadow-sm"
                title="匯出 Excel / CSV 表格"
              >
                <Download className="w-3.5 h-3.5" />
                匯出 CSV
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-md hover:shadow-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                列印 / 存為 PDF
              </button>
            </div>
          </div>

          {/* Quick Info Form for Print Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-stone-200 text-xs">
            <div>
              <label className="block text-stone-500 font-semibold mb-1">個案姓名</label>
              <input
                type="text"
                value={patientName}
                onChange={e => onUpdatePatientName(e.target.value)}
                placeholder="請輸入個案姓名..."
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 font-medium focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-semibold mb-1">物理治療師 / 職能治療師</label>
              <input
                type="text"
                value={therapistName}
                onChange={e => setTherapistName(e.target.value)}
                placeholder="請輸入物理/職能治療師姓名..."
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 font-medium focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-stone-500 font-semibold mb-1">檢核評估日期</label>
              <input
                type="date"
                value={evalDate}
                onChange={e => setEvalDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 font-medium focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 bg-white text-stone-900 print:p-0">
          {/* Document Header */}
          <div className="border-b-2 border-stone-800 pb-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-stone-500 tracking-widest uppercase mb-1">
                  員郭醫院復健科 • 生活功能解鎖護照
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-wide">
                  日常生活自理能力 (ADL) 檢核評估報告
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Activities of Daily Living (ADL) Functional Milestone Checklist
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                  <Award className="w-3.5 h-3.5 text-yellow-400" />
                  達成率 {totalProgress}%
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  已完成 {overallCompleted} / {mainTasksCount} 項核心任務
                </div>
              </div>
            </div>

            {/* Meta Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs">
              <div>
                <span className="text-stone-500 block font-medium">個案姓名</span>
                <span className="text-stone-900 font-bold text-sm">
                  {patientName || '未指定個案'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block font-medium">物理治療師 / 職能治療師</span>
                <span className="text-stone-900 font-bold text-sm">{therapistName || '未填寫'}</span>
              </div>
              <div>
                <span className="text-stone-500 block font-medium">評估日期</span>
                <span className="text-stone-900 font-bold text-sm">{evalDate}</span>
              </div>
              <div>
                <span className="text-stone-500 block font-medium">白金達成狀況</span>
                <span className="text-emerald-700 font-bold text-sm">
                  {overallCompleted >= 120 ? '榮譽解鎖 (已退役)' : `尚需 ${Math.max(0, 120 - overallCompleted)} 項`}
                </span>
              </div>
            </div>

            {/* Category Statistics Ribbon */}
            <div className="mt-4 pt-3 border-t border-stone-200 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {categoryStats.map(s => (
                <div key={s.category} className="bg-white p-2 rounded-lg border border-stone-200 text-center">
                  <div className="text-xs font-bold text-stone-700">【{s.category}】領域</div>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">
                    {s.done} <span className="text-[10px] text-stone-400 font-normal">/ {s.total}</span>
                  </div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${s.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Support Partners Analytics Ribbon */}
            <div className="mt-3 pt-3 border-t border-stone-200">
              <div className="text-[11px] font-bold text-stone-600 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-stone-500" />
                  共學夥伴支援型態分佈（賦能與照護支持模式）
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  自主獨立完成率：{partnerStats.selfIndependenceRate}%
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 text-center">
                  <div className="text-[11px] font-bold text-emerald-800">自己完成</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    {partnerStats.selfCount} <span className="text-[10px] text-emerald-600 font-normal">項</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">完全自主自理</div>
                </div>

                <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200 text-center">
                  <div className="text-[11px] font-bold text-amber-800">家屬夥伴</div>
                  <div className="text-base font-black text-amber-700 mt-0.5">
                    {partnerStats.familyCount} <span className="text-[10px] text-amber-600 font-normal">項</span>
                  </div>
                  <div className="text-[10px] text-amber-600 font-medium">家屬賦能協同</div>
                </div>

                <div className="bg-sky-50/70 p-2 rounded-lg border border-sky-200 text-center">
                  <div className="text-[11px] font-bold text-sky-800">多功能型照顧服務員</div>
                  <div className="text-base font-black text-sky-700 mt-0.5">
                    {partnerStats.attendantCount} <span className="text-[10px] text-sky-600 font-normal">項</span>
                  </div>
                  <div className="text-[10px] text-sky-600 font-medium">照服生活支持</div>
                </div>

                <div className="bg-purple-50/70 p-2 rounded-lg border border-purple-200 text-center">
                  <div className="text-[11px] font-bold text-purple-800">醫療團隊</div>
                  <div className="text-base font-black text-purple-700 mt-0.5">
                    {partnerStats.medicalCount} <span className="text-[10px] text-purple-600 font-normal">項</span>
                  </div>
                  <div className="text-[10px] text-purple-600 font-medium">專業技術指導</div>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Content */}
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-stone-500 pb-1">
              <span>
                顯示清單：
                <strong className="text-stone-800 ml-1">
                  {onlyCompleted ? '僅顯示已勾選達成項目' : '顯示全部任務項目'}
                </strong>
                （共 {filteredTasks.length} 項）
              </span>
              <span className="print:hidden text-[11px] text-stone-400">
                可點擊上方「列印」、「匯出 Word」或「匯出 CSV」
              </span>
            </div>

            {groupedTasks.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-500 font-medium text-sm">目前尚無符合篩選條件的任務項目</p>
                <p className="text-xs text-stone-400 mt-1">
                  請確認護照中是否已勾選任務，或切換上方「僅顯示已勾選」開關
                </p>
              </div>
            ) : (
              groupedTasks.map(group => {
                const catMeta = CATEGORY_NAMES.find(c => c.id === group.category);
                return (
                  <div key={group.category} className="space-y-2 category-group-section">
                    <div className="flex items-center justify-between bg-stone-100 px-3 py-2 rounded-lg border-l-4 border-emerald-600 category-title-header">
                      <h3 className="font-black text-sm text-stone-800 flex items-center gap-1.5">
                        <span>{catMeta?.icon}</span>
                        <span>{catMeta?.label || group.category}</span>
                      </h3>
                      <span className="text-xs text-stone-500 font-medium">
                        共 {group.tasks.length} 項
                      </span>
                    </div>

                    <div className="border border-stone-200 rounded-xl overflow-hidden report-table-wrapper print:overflow-visible print:border-stone-300 print:rounded-none">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                            <th className="py-2 px-3 w-12 text-center">狀態</th>
                            <th className="py-2 px-2 w-14 text-center">編號</th>
                            <th className="py-2 px-3 w-24">等級 / 階段</th>
                            <th className="py-2 px-3 w-36 font-bold">任務名稱</th>
                            <th className="py-2 px-3 w-40">共學夥伴</th>
                            <th className="py-2 px-3">達成標準與訓練要點</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {group.tasks.map(task => {
                            const isDone = completedTasks.has(task.id);
                            const tierBadge = TIER_LABELS[task.tier] || {
                              label: task.tier,
                              bg: 'bg-stone-100',
                              text: 'text-stone-700',
                            };
                            const partners = getTaskPartners(task.id);

                            return (
                              <tr
                                key={task.id}
                                className={`hover:bg-stone-50/80 transition-colors ${
                                  isDone ? 'bg-white' : 'bg-stone-50/50 text-stone-400'
                                }`}
                              >
                                <td className="py-2.5 px-3 text-center align-top">
                                  {isDone ? (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-600 text-white font-bold text-xs shadow-xs">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-stone-300 text-transparent text-xs">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-center align-top font-mono text-stone-500">
                                  {String(task.id).padStart(3, '0')}
                                </td>
                                <td className="py-2.5 px-3 align-top">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${tierBadge.bg} ${tierBadge.text}`}
                                  >
                                    {tierBadge.label}
                                  </span>
                                  {task.phase && (
                                    <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                                      {task.phase}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 align-top font-bold text-stone-900">
                                  <div>{task.title}</div>
                                  {isDone && taskCompletedAt[task.id] && (
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 mt-1">
                                      <Clock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                      <span>登錄時間：{new Date(taskCompletedAt[task.id]).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 align-top">
                                  {isDone ? (
                                    partners.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {partners.map(p => {
                                          let badgeClass = 'bg-stone-100 text-stone-700 border-stone-200';
                                          let label = p;
                                          if (p === '自己完成') {
                                            badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                                          } else if (p === '家屬夥伴') {
                                            badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
                                          } else if (p === '多功能型照顧服務員') {
                                            badgeClass = 'bg-sky-50 text-sky-800 border-sky-300';
                                            label = '照服員';
                                          } else if (p === '醫療團隊') {
                                            badgeClass = 'bg-purple-50 text-purple-800 border-purple-300';
                                          }
                                          return (
                                            <span
                                              key={p}
                                              title={p}
                                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeClass}`}
                                            >
                                              {label}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-stone-400 italic">未指定</span>
                                    )
                                  ) : (
                                    <span className="text-[11px] text-stone-300">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 align-top text-stone-700 leading-relaxed">
                                  {task.description}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Clinical Assessment & Signatures Block (Essential for Print/Record) */}
          <div className="mt-8 pt-6 border-t-2 border-stone-300 avoid-break space-y-6">
            <div>
              <h4 className="text-xs font-bold text-stone-700 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                臨床功能表現綜合評語與居家訓練建議
              </h4>
              <textarea
                value={clinicalRemarks}
                onChange={e => setClinicalRemarks(e.target.value)}
                rows={3}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 leading-relaxed focus:ring-1 focus:ring-emerald-500 resize-none print:border-none print:p-0 print:bg-transparent"
                placeholder="請輸入治療評語與居家練習備註..."
              />
            </div>

            {/* Signature Lines */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-dashed border-stone-300">
              <div className="border border-stone-200 p-4 rounded-xl text-center bg-stone-50/50">
                <div className="text-xs font-bold text-stone-600 mb-6 flex items-center justify-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-stone-500" />
                  物理治療師 / 職能治療師簽章
                </div>
                <div className="border-b border-stone-400 w-3/4 mx-auto mb-1"></div>
                <div className="text-[10px] text-stone-400">簽名與執照字號</div>
              </div>

              <div className="border border-stone-200 p-4 rounded-xl text-center bg-stone-50/50">
                <div className="text-xs font-bold text-stone-600 mb-6 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                  個案 / 家屬確認簽署
                </div>
                <div className="border-b border-stone-400 w-3/4 mx-auto mb-1"></div>
                <div className="text-[10px] text-stone-400">本人或主要照顧者簽名</div>
              </div>

              <div className="border border-stone-200 p-4 rounded-xl text-center bg-stone-50/50 flex flex-col justify-between">
                <div className="text-xs font-bold text-stone-600 flex items-center justify-center gap-1">
                  <Award className="w-3.5 h-3.5 text-stone-500" />
                  復健科評估認證戳章
                </div>
                <div className="text-[11px] font-bold text-stone-700 py-4">員郭醫院 復健團隊</div>
                <div className="text-[10px] text-stone-400">印發日期：{evalDate}</div>
              </div>
            </div>

            <div className="text-center text-[10px] text-stone-400 pt-2">
              生活功能解鎖護照 (Functional ADL Passport) • 本報告供臨床復健評估、個案自主管理及家屬居家照護參考使用
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
