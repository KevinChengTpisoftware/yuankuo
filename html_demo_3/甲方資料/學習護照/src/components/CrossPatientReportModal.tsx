import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  X, 
  FileText, 
  Award, 
  TrendingUp,
  ShieldCheck,
  Building2,
  Calendar,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { Patient } from '../types';
import { TASKS } from '../data';

interface CategoryStat {
  category: string;
  totalPossible: number;
  totalDone: number;
  rate: number;
  tasksCount: number;
  averagePerPatient: string;
}

interface TierStat {
  tier: string;
  label: string;
  subLabel: string;
  rate: number;
  totalTasks: number;
  totalDone: number;
}

interface CrossPatientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  analyticsData: {
    totalCount: number;
    activeCount: number;
    archivedCount: number;
    averageCompleted: string;
    averageRate: number;
    categoryAverages: Record<string, { totalDone: number; totalPossible: number }>;
    categoryStats?: CategoryStat[];
    tierStats?: TierStat[];
    highestDomain?: { category: string; rate: number };
    lowestDomain?: { category: string; rate: number };
  };
}

export const CrossPatientReportModal: React.FC<CrossPatientReportModalProps> = ({
  isOpen,
  onClose,
  patients,
  analyticsData
}) => {
  const [reportTitle, setReportTitle] = useState('日常生活功能跨個案復健成效品管報告書');
  const [departmentName, setDepartmentName] = useState('復健醫學科 • YK未來室');
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reporterName, setReporterName] = useState('復健治療團隊');
  const [clinicalConclusion, setClinicalConclusion] = useState(
    '本院復健團隊導入「日常生活功能解鎖護照」至今，全體在案個案展現顯著之自理能力復健成效。在基礎生活自理（銅盃階段）達成率良好，尤以飲食及衣物自理領域表現最為穩定；後續將針對社區戶外行動與休閒參與（金銀盃階段）深化情境式擬真演練，持續提升個案回歸居家生活之獨立性與生活品質。'
  );
  const [copied, setCopied] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const TOTAL_MAIN_TASKS = TASKS.filter(t => t.category !== '選修' && t.category !== '全部').length; // 150 核心項目 (食衣住行育樂各 25 項)
  const activePatients = patients.filter(p => p.status === 'active');
  const archivedPatients = patients.filter(p => p.status === 'archived');

  // Compute category detailed stats
  const categoryKeys = ['食', '衣', '住', '行', '育', '樂'];
  const categoryStats: CategoryStat[] = categoryKeys.map(cat => {
    const catTasks = TASKS.filter(t => t.category === cat);
    const avg = analyticsData.categoryAverages?.[cat];
    const totalDone = avg ? avg.totalDone : 0;
    const totalPossible = catTasks.length * (analyticsData.activeCount || 1);
    const rate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
    const averagePerPatient = analyticsData.activeCount > 0 
      ? (totalDone / analyticsData.activeCount).toFixed(1) 
      : '0';

    return {
      category: cat,
      tasksCount: catTasks.length,
      totalPossible,
      totalDone,
      rate,
      averagePerPatient
    };
  });

  // Compute Tier Stage stats
  const tierDefinitions = [
    { tier: 'bronze', label: '銅盃階段', subLabel: '基礎自理 • 微小幸福' },
    { tier: 'silver', label: '銀盃階段', subLabel: '進階挑戰 • 真實探索' },
    { tier: 'gold', label: '金盃階段', subLabel: '自我實現 • 社會參與' },
  ];

  const tierStats: TierStat[] = tierDefinitions.map(def => {
    const tierTasks = TASKS.filter(t => t.category !== '選修' && t.category !== '全部' && t.tier === def.tier);
    let totalDone = 0;
    activePatients.forEach(p => {
      (p.completedTasks || []).forEach(tId => {
        const t = tierTasks.find(x => x.id === tId);
        if (t) totalDone += 1;
      });
    });
    const totalPossible = tierTasks.length * (activePatients.length || 1);
    const rate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    return {
      tier: def.tier,
      label: def.label,
      subLabel: def.subLabel,
      totalTasks: tierTasks.length,
      totalDone,
      rate
    };
  });

  // Browser Print handler
  const handlePrint = () => {
    window.print();
  };

  // Word Document (.doc) Export
  const handleExportWord = () => {
    const docTitle = `${reportTitle}_${evalDate}`;
    
    // Build Table Rows for Categories
    const categoryRowsHtml = categoryStats.map(s => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center; font-weight: bold;">${s.category} 領域</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;">${s.tasksCount} 項 / 人</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center; color: #059669; font-weight: bold;">${s.totalDone} 次</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center; font-weight: bold;">${s.rate}%</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;">人均解鎖 ${s.averagePerPatient} 項</td>
      </tr>
    `).join('');

    // Build Table Rows for Tiers
    const tierRowsHtml = tierStats.map(t => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">${t.label} (${t.subLabel})</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;">${t.totalTasks} 項 / 人</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center; color: #2563eb; font-weight: bold;">${t.totalDone} 次</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center; font-weight: bold;">${t.rate}%</td>
      </tr>
    `).join('');

    // Build Patient Table Rows
    const patientRowsHtml = patients.map((p, idx) => {
      const pTasks = p.completedTasks || [];
      const rate = Math.round((pTasks.length / TOTAL_MAIN_TASKS) * 100);
      const isArchived = p.status === 'archived';
      return `
        <tr style="${isArchived ? 'background-color: #f8fafc; color: #64748b;' : 'background-color: #ffffff;'}">
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: bold;">${p.name}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-family: monospace;">${p.caseNumber || '—'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: center;">${p.primaryTherapist || '—'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: center;">${p.admissionDate || '—'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 8.5pt;">${p.targetGoal || '一般生活自理復健'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: center; font-weight: bold; color: ${isArchived ? '#b45309' : '#059669'};">
            ${pTasks.length} 項 (${rate}%)
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: center;">
            <span style="display: inline-block; padding: 1px 6px; font-size: 8pt; border-radius: 3px; ${isArchived ? 'background-color: #fef3c7; color: #92400e;' : 'background-color: #d1fae5; color: #065f46;'}">
              ${isArchived ? '已結案' : '在案中'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>${docTitle}</title>
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt; /* A4 Portrait */
            margin: 18mm 16mm 18mm 16mm;
          }
          div.WordSection1 { page: WordSection1; }
          body {
            font-family: "微軟正黑體", "Microsoft JhengHei", Arial, sans-serif;
            font-size: 9.5pt;
            line-height: 1.45;
            color: #1e293b;
          }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #f1f5f9; color: #334155; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px 8px; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <div style="text-align: center; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 14px;">
            <div style="font-size: 15pt; font-weight: bold; color: #065f46;">員郭醫院 復健醫學科 • YK未來室</div>
            <div style="font-size: 13pt; font-weight: bold; color: #1e293b; margin-top: 4px;">${reportTitle}</div>
            <div style="font-size: 8.5pt; color: #64748b; margin-top: 4px;">
              統計基準日：${evalDate} ｜ 製表單位：${departmentName} ｜ 製表主管：${reporterName}
            </div>
          </div>

          <!-- Summary Matrix -->
          <table style="margin-bottom: 14px;">
            <tr style="background-color: #f8fafc;">
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 25%;">
                <div style="font-size: 8pt; color: #64748b;">總收案人數</div>
                <div style="font-size: 14pt; font-weight: bold; color: #1e293b;">${analyticsData.totalCount} 位</div>
                <div style="font-size: 7.5pt; color: #64748b;">在案 ${analyticsData.activeCount} ｜ 結案 ${analyticsData.archivedCount}</div>
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 25%;">
                <div style="font-size: 8pt; color: #64748b;">全體平均達成任務數</div>
                <div style="font-size: 14pt; font-weight: bold; color: #059669;">${analyticsData.averageCompleted} 項</div>
                <div style="font-size: 7.5pt; color: #64748b;">總題庫 150 核心項目</div>
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 25%;">
                <div style="font-size: 8pt; color: #64748b;">全體平均生活自理率</div>
                <div style="font-size: 14pt; font-weight: bold; color: #2563eb;">${analyticsData.averageRate}%</div>
                <div style="font-size: 7.5pt; color: #64748b;">跨領域整體達成指標</div>
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 25%;">
                <div style="font-size: 8pt; color: #64748b;">已結案回歸居家率</div>
                <div style="font-size: 14pt; font-weight: bold; color: #d97706;">
                  ${analyticsData.totalCount > 0 ? Math.round((analyticsData.archivedCount / analyticsData.totalCount) * 100) : 0}%
                </div>
                <div style="font-size: 7.5pt; color: #64748b;">累計結案歸檔 ${analyticsData.archivedCount} 位</div>
              </td>
            </tr>
          </table>

          <!-- Category Breakdown -->
          <div style="font-weight: bold; font-size: 10pt; color: #0f172a; margin-bottom: 6px; border-left: 3px solid #059669; padding-left: 6px;">
            一、六大日常生活自理領域 (ADL) 達成率對照分析
          </div>
          <table style="margin-bottom: 14px;">
            <thead>
              <tr>
                <th>生活功能領域</th>
                <th>領域題數</th>
                <th>全體累計達成次數</th>
                <th>跨個案平均達成率</th>
                <th>每人平均達成指標</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRowsHtml}
            </tbody>
          </table>

          <!-- Tier Breakdown -->
          <div style="font-weight: bold; font-size: 10pt; color: #0f172a; margin-bottom: 6px; border-left: 3px solid #2563eb; padding-left: 6px;">
            二、階梯式復健能力層次 (銅盃/銀盃/金盃) 階段差異分析
          </div>
          <table style="margin-bottom: 14px;">
            <thead>
              <tr>
                <th>能力階梯劃分</th>
                <th>單人標準題數</th>
                <th>累計解鎖次數</th>
                <th>階段總達成率</th>
              </tr>
            </thead>
            <tbody>
              ${tierRowsHtml}
            </tbody>
          </table>

          <!-- Patient Roster -->
          <div style="font-weight: bold; font-size: 10pt; color: #0f172a; margin-bottom: 6px; border-left: 3px solid #64748b; padding-left: 6px;">
            三、全體個案個別復健進度總表
          </div>
          <table style="margin-bottom: 14px;">
            <thead>
              <tr>
                <th style="width: 38px;">序號</th>
                <th>個案姓名</th>
                <th>病歷號碼</th>
                <th>主責治療師</th>
                <th>入案評估日</th>
                <th>核心生活目標</th>
                <th>已達成進度</th>
                <th>在案狀態</th>
              </tr>
            </thead>
            <tbody>
              ${patientRowsHtml}
            </tbody>
          </table>

          <!-- Clinical Remarks -->
          <div style="margin-top: 10px; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 4px;">
            <div style="font-weight: bold; color: #065f46; margin-bottom: 4px;">四、臨床成效綜合評估與復健品管建議：</div>
            <div style="line-height: 1.5; white-space: pre-wrap;">${clinicalConclusion}</div>
          </div>

          <!-- Signature Block -->
          <table style="width: 100%; margin-top: 20px;">
            <tr>
              <td style="width: 32%; text-align: center; border: 1px solid #cbd5e1; padding: 10px; background-color: #f8fafc;">
                <div style="font-size: 8.5pt; font-weight: bold; color: #334155; margin-bottom: 40px;">主責物理 / 職能治療師簽章</div>
                <div style="border-top: 1px solid #94a3b8; width: 80%; margin: 0 auto 4px auto;"></div>
                <div style="font-size: 7.5pt; color: #64748b;">簽署日期與執照字號</div>
              </td>
              <td style="width: 2%;"></td>
              <td style="width: 32%; text-align: center; border: 1px solid #cbd5e1; padding: 10px; background-color: #f8fafc;">
                <div style="font-size: 8.5pt; font-weight: bold; color: #334155; margin-bottom: 40px;">復健科技術主任 / 督導核閱</div>
                <div style="border-top: 1px solid #94a3b8; width: 80%; margin: 0 auto 4px auto;"></div>
                <div style="font-size: 7.5pt; color: #64748b;">審查簽章</div>
              </td>
              <td style="width: 2%;"></td>
              <td style="width: 32%; text-align: center; border: 1px solid #cbd5e1; padding: 10px; background-color: #f8fafc;">
                <div style="font-size: 8.5pt; font-weight: bold; color: #334155; margin-bottom: 12px;">醫療品管部 / 醫務主管批示</div>
                <div style="font-size: 9pt; font-weight: bold; color: #1e293b; margin-bottom: 10px;">員郭醫院 醫療品質審議</div>
                <div style="font-size: 7.5pt; color: #64748b;">核定日期：${evalDate}</div>
              </td>
            </tr>
          </table>
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
    link.download = `跨個案成效品管報告_${evalDate}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy Summary Text for Email/Meeting Minutes
  const handleCopyText = () => {
    const textLines = [
      `【員郭醫院 復健醫學科 - 日常生活功能跨個案成效品管摘要】`,
      `統計基準日：${evalDate}`,
      `製表主管：${reporterName}（${departmentName}）`,
      `---------------------------------------------`,
      `【關鍵總體指標】`,
      `• 總收案人數：${analyticsData.totalCount} 位（在案中 ${analyticsData.activeCount} 位 / 已結案 ${analyticsData.archivedCount} 位）`,
      `• 全體平均生活自理率：${analyticsData.averageRate}%`,
      `• 在案個案平均解鎖任務：${analyticsData.averageCompleted} / ${TOTAL_MAIN_TASKS} 項`,
      `• 順利結案回歸居家率：${analyticsData.totalCount > 0 ? Math.round((analyticsData.archivedCount / analyticsData.totalCount) * 100) : 0}%`,
      `---------------------------------------------`,
      `【六大生活領域達成概況】`,
      ...categoryStats.map(s => `• [${s.category} 領域] 跨個案達成率 ${s.rate}% (人均解鎖 ${s.averagePerPatient}/${s.tasksCount} 項)`),
      `---------------------------------------------`,
      `【階段性能力進程】`,
      ...tierStats.map(t => `• ${t.label}：達成率 ${t.rate}% (${t.subLabel})`),
      `---------------------------------------------`,
      `【臨床品管建議】`,
      clinicalConclusion,
      `=============================================`
    ];

    navigator.clipboard.writeText(textLines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-2 sm:p-4 overflow-y-auto cross-patient-report-root">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > :not(#root) {
            display: none !important;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          .cross-patient-report-root {
            position: absolute !important;
            inset: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            z-index: 99999 !important;
          }
          .report-modal-dialog {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-report-sheet {
            padding: 12mm 15mm !important;
            margin: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-break {
            page-break-before: always !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="report-modal-dialog bg-stone-100 rounded-3xl shadow-2xl max-w-[1200px] w-full max-h-[94vh] overflow-hidden flex flex-col border border-stone-200"
      >
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="no-print p-4 sm:p-5 bg-white border-b border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700 text-white rounded-2xl shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-stone-900 text-base">跨個案復健成效品管報告 (A4 PDF / 列印)</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  醫療品管評鑑規格
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                格式化輸出包含指標彙整、六大生活領域達成率、階段性層次分析與在案名冊
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition shadow-xs"
              title="複製格式化文字至剪貼簿"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
              <span>{copied ? '已複製' : '複製摘要'}</span>
            </button>

            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition shadow-xs"
              title="匯出為 Word 格式檔案 (.doc)"
            >
              <Download className="w-4 h-4" />
              <span>匯出 Word</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>列印 / 存為 PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-200 rounded-full text-stone-400 hover:text-stone-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Editable Settings & A4 Preview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          {/* Custom Settings Box (Hidden on Print) */}
          <div className="no-print bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>報告輸出自訂欄位（可依品管審查需求修改）</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-stone-500 mb-1 font-semibold">報告書標題</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-500 mb-1 font-semibold">製表單位 / 部門</label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-stone-500 mb-1 font-semibold">統計基準日</label>
                <input
                  type="date"
                  value={evalDate}
                  onChange={e => setEvalDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-500 mb-1 text-xs font-semibold">臨床成效評估與品管建議（將印於報告結論處）</label>
              <textarea
                rows={2}
                value={clinicalConclusion}
                onChange={e => setClinicalConclusion(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Printable A4 Report Sheet Preview */}
          <div 
            ref={printAreaRef}
            className="printable-report-sheet bg-white max-w-4xl mx-auto p-8 sm:p-12 rounded-2xl border border-stone-300 shadow-lg text-stone-900 print:border-none print:shadow-none print:p-0"
          >
            {/* Header with Hospital Banner */}
            <div className="border-b-2 border-emerald-700 pb-4 mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-black tracking-wider text-emerald-800">員郭醫院</span>
                  <span className="text-sm font-bold text-stone-600">復健醫學科 ｜ YK未來室</span>
                </div>
                <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                  {reportTitle}
                </h1>
                <div className="text-xs text-stone-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>統計基準日：<strong className="text-stone-800 font-mono">{evalDate}</strong></span>
                  <span>製表單位：<strong className="text-stone-800">{departmentName}</strong></span>
                  <span>報告編號：<strong className="text-stone-800 font-mono">QCC-ADL-{evalDate.replace(/-/g, '')}</strong></span>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-stone-400">生活功能解鎖護照系統產製</div>
              </div>
            </div>

            {/* Key Summary Cards Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div className="text-[11px] font-bold text-stone-500">總收案人數</div>
                <div className="text-xl font-black text-stone-800 mt-0.5">{analyticsData.totalCount} <span className="text-xs font-normal">位</span></div>
                <div className="text-[10px] text-stone-400 mt-0.5">在案 {analyticsData.activeCount} ｜ 結案 {analyticsData.archivedCount}</div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center">
                <div className="text-[11px] font-bold text-emerald-800">平均達成任務數</div>
                <div className="text-xl font-black text-emerald-700 mt-0.5">{analyticsData.averageCompleted} <span className="text-xs font-normal">項</span></div>
                <div className="text-[10px] text-emerald-600 mt-0.5">全套 150 核心題庫</div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-center">
                <div className="text-[11px] font-bold text-blue-800">平均生活自理率</div>
                <div className="text-xl font-black text-blue-700 mt-0.5">{analyticsData.averageRate}%</div>
                <div className="text-[10px] text-blue-600 mt-0.5">跨領域整體達成率</div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-center">
                <div className="text-[11px] font-bold text-amber-800">結案回歸居家率</div>
                <div className="text-xl font-black text-amber-600 mt-0.5">
                  {analyticsData.totalCount > 0 ? Math.round((analyticsData.archivedCount / analyticsData.totalCount) * 100) : 0}%
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">順利結案歸檔 {analyticsData.archivedCount} 位</div>
              </div>
            </div>

            {/* Section 1: Six Domains Table */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-stone-200">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
                <h3 className="font-bold text-stone-900 text-sm">一、六大日常生活自理領域 (ADL) 達成率對照分析</h3>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-bold border border-stone-300">
                    <th className="p-2 text-left">生活領域</th>
                    <th className="p-2 text-center">單人標準題數</th>
                    <th className="p-2 text-center">在案累計解鎖次數</th>
                    <th className="p-2 text-center">全體平均達成率</th>
                    <th className="p-2 text-center">人均解鎖項數</th>
                    <th className="p-2 text-left">達成進度視覺條</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStats.map(cat => (
                    <tr key={cat.category} className="border border-stone-200 hover:bg-stone-50/50">
                      <td className="p-2 font-bold text-stone-800">
                        {cat.category} 領域
                      </td>
                      <td className="p-2 text-center text-stone-600">{cat.tasksCount} 項</td>
                      <td className="p-2 text-center font-bold text-emerald-700 font-mono">{cat.totalDone} 次</td>
                      <td className="p-2 text-center font-black text-stone-800 font-mono">{cat.rate}%</td>
                      <td className="p-2 text-center text-stone-600">{cat.averagePerPatient} 項 / 人</td>
                      <td className="p-2 w-36">
                        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${Math.min(cat.rate, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 2: Tier Stages Table */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-stone-200">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-700" />
                <h3 className="font-bold text-stone-900 text-sm">二、階梯式能力層次 (銅盃/銀盃/金盃) 階段性差異評析</h3>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-bold border border-stone-300">
                    <th className="p-2 text-left">挑戰階梯</th>
                    <th className="p-2 text-left">復健核心導向</th>
                    <th className="p-2 text-center">標準題數</th>
                    <th className="p-2 text-center">累計完成次數</th>
                    <th className="p-2 text-center">階段達成率</th>
                    <th className="p-2 text-left">階段進度視覺條</th>
                  </tr>
                </thead>
                <tbody>
                  {tierStats.map(t => (
                    <tr key={t.tier} className="border border-stone-200">
                      <td className="p-2 font-bold text-stone-800">{t.label}</td>
                      <td className="p-2 text-stone-600">{t.subLabel}</td>
                      <td className="p-2 text-center text-stone-600">{t.totalTasks} 項</td>
                      <td className="p-2 text-center font-bold text-blue-700 font-mono">{t.totalDone} 次</td>
                      <td className="p-2 text-center font-black text-stone-800 font-mono">{t.rate}%</td>
                      <td className="p-2 w-36">
                        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(t.rate, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 3: Patient Roster Overview Table */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-stone-200">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
                <h3 className="font-bold text-stone-900 text-sm">三、全體個案個別復健進度總覽表 ({patients.length} 位)</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 font-bold border border-stone-300">
                      <th className="p-1.5 text-center w-10">序號</th>
                      <th className="p-1.5 text-left">姓名</th>
                      <th className="p-1.5 text-left">病歷號碼</th>
                      <th className="p-1.5 text-left">主責治療師</th>
                      <th className="p-1.5 text-left">入案日</th>
                      <th className="p-1.5 text-left">核心生活目標</th>
                      <th className="p-1.5 text-center">已達成 / 總項</th>
                      <th className="p-1.5 text-center">達成率</th>
                      <th className="p-1.5 text-center">狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p, idx) => {
                      const pTasks = p.completedTasks || [];
                      const rate = Math.round((pTasks.length / TOTAL_MAIN_TASKS) * 100);
                      const isArchived = p.status === 'archived';

                      return (
                        <tr key={p.id} className={`border border-stone-200 ${isArchived ? 'bg-stone-50/70 text-stone-500' : 'bg-white'}`}>
                          <td className="p-1.5 text-center font-mono text-[11px] text-stone-400">{idx + 1}</td>
                          <td className="p-1.5 font-bold text-stone-800">{p.name}</td>
                          <td className="p-1.5 font-mono text-stone-600">{p.caseNumber || '—'}</td>
                          <td className="p-1.5 text-stone-700">{p.primaryTherapist || '—'}</td>
                          <td className="p-1.5 text-stone-600 font-mono text-[11px]">{p.admissionDate || '—'}</td>
                          <td className="p-1.5 text-stone-600 max-w-[160px] truncate" title={p.targetGoal}>
                            {p.targetGoal || '一般生活自理復健'}
                          </td>
                          <td className="p-1.5 text-center font-mono font-bold text-stone-700">{pTasks.length} / {TOTAL_MAIN_TASKS}</td>
                          <td className="p-1.5 text-center font-bold text-emerald-700 font-mono">{rate}%</td>
                          <td className="p-1.5 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${isArchived ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {isArchived ? '已結案' : '在案中'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Clinical Remarks */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-300 mb-6">
              <div className="font-bold text-stone-800 text-xs mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>四、臨床成效綜合評估與復健品管建議</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                {clinicalConclusion}
              </p>
            </div>

            {/* Section 5: Triple Signature Block */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="border border-stone-300 bg-stone-50/50 p-3 rounded-xl text-center">
                <div className="text-xs font-bold text-stone-700 mb-8">主責物理 / 職能治療師簽章</div>
                <div className="border-t border-stone-400 w-3/4 mx-auto mb-1" />
                <div className="text-[10px] text-stone-500">簽名與專業執照字號</div>
              </div>

              <div className="border border-stone-300 bg-stone-50/50 p-3 rounded-xl text-center">
                <div className="text-xs font-bold text-stone-700 mb-8">復健科技術主任 / 督導核閱</div>
                <div className="border-t border-stone-400 w-3/4 mx-auto mb-1" />
                <div className="text-[10px] text-stone-500">專業品管查驗簽署</div>
              </div>

              <div className="border border-stone-300 bg-stone-50/50 p-3 rounded-xl text-center">
                <div className="text-xs font-bold text-stone-700 mb-2">醫療品質部 / 醫務長批示</div>
                <div className="text-xs font-black text-emerald-900 mb-2">員郭醫院 醫療品質審議</div>
                <div className="text-[10px] text-stone-400">核定日期：{evalDate}</div>
              </div>
            </div>

            <div className="text-center text-[10px] text-stone-400 mt-6 border-t border-stone-200 pt-3">
              日常生活功能跨個案復健成效品管報告 ｜ 本報告僅供院內品管、晨會討論、個案研討及評鑑資料存檔使用
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
