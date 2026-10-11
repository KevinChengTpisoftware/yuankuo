import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  Sparkles,
  ArrowRight,
  ArrowUp,
  X,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Save,
  CheckCircle2,
  Users,
  Compass,
  FileText,
  Clock,
  Layers,
  Award,
  Move,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { WishCard, Category } from '../types';
import { WISH_CARDS } from '../wishlistData';
import { playClickSound, playSuccessSound } from '../lib/audio';

export type QuadrantType = 'short-term' | 'long-term' | 'support' | 'leisure';

interface QuadrantInfo {
  id: QuadrantType;
  title: string;
  tag: string;
  quadrantName: string;
  subtitle: string;
  criteria: string;
  clinicalRole: string;
  headerBg: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  suggestedPartner: string;
  defaultPos: { x: number; y: number };
}

const QUADRANTS: QuadrantInfo[] = [
  {
    id: 'short-term',
    quadrantName: '第一象限（右上）',
    tag: '短期衝刺目標',
    title: '第一象限：短期衝刺目標（1~4 週）',
    subtitle: '核心自立 ＋ 迫切需攻堅',
    criteria: '最攸關日常生活自尊與居家安全，返家立即面臨的迫切生活自理關鍵節點。',
    clinicalRole: '建議納為當前復健計畫第一優先攻堅項目，密集訓練軀幹平衡與患側功能。',
    headerBg: 'bg-emerald-50 text-emerald-950 border-emerald-300',
    borderColor: 'border-emerald-300 bg-emerald-50/20',
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-800',
    accentColor: 'text-emerald-700',
    suggestedPartner: '自己完成（自立攻堅）',
    defaultPos: { x: 75, y: 75 },
  },
  {
    id: 'long-term',
    quadrantName: '第二象限（左上）',
    tag: '長期核心願景',
    title: '第二象限：長期核心自立願景（1~6 個月）',
    subtitle: '深遠願景 ＋ 階段漸進鍛鍊',
    criteria: '代表個案深刻的人生角色回歸、深層自我價值與尊嚴（如回歸職場、獨立烹飪或獨自外出）。',
    clinicalRole: '建議拆解為階段性微里程碑，作為激勵個案度過復健撞牆期的遠程心理燈塔。',
    headerBg: 'bg-blue-50 text-blue-950 border-blue-300',
    borderColor: 'border-blue-300 bg-blue-50/20',
    badgeBg: 'bg-blue-100 border-blue-300',
    badgeText: 'text-blue-800',
    accentColor: 'text-blue-700',
    suggestedPartner: '醫療團隊 ＋ 漸進自主',
    defaultPos: { x: 25, y: 75 },
  },
  {
    id: 'support',
    quadrantName: '第四象限（右下）',
    tag: '協同支持與代償',
    title: '第四象限：家庭協同與輔具代償目標',
    subtitle: '生活必備 ＋ 家屬照服協作',
    criteria: '生活日常需立即解決但當前身體功能過渡期尚難完全獨立，可由照護夥伴共同協作。',
    clinicalRole: '導入無障礙環境改造、省力代償技巧，賦能「家屬夥伴」與「多功能照服員」協調代償。',
    headerBg: 'bg-amber-50 text-amber-950 border-amber-300',
    borderColor: 'border-amber-300 bg-amber-50/20',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-800',
    accentColor: 'text-amber-700',
    suggestedPartner: '家屬夥伴 / 多功能型照服員',
    defaultPos: { x: 75, y: 25 },
  },
  {
    id: 'leisure',
    quadrantName: '第三象限（左下）',
    tag: '後續生活品質擴展',
    title: '第三象限：後續生活品質擴展',
    subtitle: '興趣嗜好 ＋ 社區休閒參與',
    criteria: '進階休閒嗜好、文藝社交與自我實現項目，非當前生存急需但有益身心平衡。',
    clinicalRole: '於中後期作為自我訓練或病友團體活動主題，待核心生活自理穩定後持續深化。',
    headerBg: 'bg-purple-50 text-purple-950 border-purple-300',
    borderColor: 'border-purple-300 bg-purple-50/20',
    badgeBg: 'bg-purple-100 border-purple-300',
    badgeText: 'text-purple-800',
    accentColor: 'text-purple-700',
    suggestedPartner: '家庭休閒 ＋ 社區資源',
    defaultPos: { x: 25, y: 25 },
  },
];

const CATEGORY_STYLES: Record<string, { ring: string; bg: string; text: string; glow: string }> = {
  食: { ring: 'ring-orange-400', bg: 'bg-gradient-to-br from-orange-400 to-rose-500', text: 'text-orange-950', glow: 'shadow-orange-300' },
  衣: { ring: 'ring-blue-400', bg: 'bg-gradient-to-br from-blue-400 to-indigo-600', text: 'text-blue-950', glow: 'shadow-blue-300' },
  住: { ring: 'ring-amber-400', bg: 'bg-gradient-to-br from-amber-400 to-yellow-600', text: 'text-amber-950', glow: 'shadow-amber-300' },
  行: { ring: 'ring-emerald-400', bg: 'bg-gradient-to-br from-emerald-400 to-teal-600', text: 'text-emerald-950', glow: 'shadow-emerald-300' },
  育: { ring: 'ring-purple-400', bg: 'bg-gradient-to-br from-purple-400 to-violet-600', text: 'text-purple-950', glow: 'shadow-purple-300' },
  樂: { ring: 'ring-pink-400', bg: 'bg-gradient-to-br from-pink-400 to-rose-600', text: 'text-pink-950', glow: 'shadow-pink-300' },
};

interface WishCoordinate {
  x: number; // 0 to 100% (Urgency, from left to right)
  y: number; // 0 to 100% (Importance, from bottom to top)
}

interface WishQuadrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  patientCaseNumber?: string;
  completedTasks: Set<number>;
  onNavigateToTask?: (taskId: number, category: Category) => void;
  selectedWishIds?: string[];
  onUpdateSelectedWishIds?: (ids: string[]) => void;
}

// Convert coordinate (x: 0~100%, y: 0~100% from bottom) to Quadrant
function coordToQuadrant(x: number, y: number): QuadrantType {
  if (x >= 50 && y >= 50) return 'short-term';
  if (x < 50 && y >= 50) return 'long-term';
  if (x >= 50 && y < 50) return 'support';
  return 'leisure';
}

export const WishQuadrantModal: React.FC<WishQuadrantModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientCaseNumber,
  completedTasks,
  onNavigateToTask,
  selectedWishIds: externalSelectedWishIds,
  onUpdateSelectedWishIds,
}) => {
  const patientKey = useMemo(() => {
    return patientName ? patientName.trim() : 'default';
  }, [patientName]);

  const storageKey = useMemo(() => `passport_wishes_${patientKey}`, [patientKey]);
  const coordinateStorageKey = useMemo(() => `passport_quadrant_coords_${patientKey}`, [patientKey]);

  // Robust loader ensuring only valid WISH_CARDS IDs are loaded
  const loadValidSelectedIds = (): string[] => {
    // 1. If external selected wish IDs were passed
    if (externalSelectedWishIds && externalSelectedWishIds.length > 0) {
      const valid = externalSelectedWishIds.filter(id => WISH_CARDS.some(w => w.id === id));
      if (valid.length > 0) return valid.slice(0, 5);
    }

    // 2. Try loading from storageKey or default key
    try {
      let saved = localStorage.getItem(storageKey);
      if (!saved && patientKey !== 'default') {
        saved = localStorage.getItem('passport_wishes_default');
      }
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(id => WISH_CARDS.some(w => w.id === id));
          if (valid.length > 0) return valid.slice(0, 5);
        }
      }
    } catch {}

    // 3. Fallback: 5 valid default wish IDs (one from each of 5 core categories)
    return ['wish-food-01', 'wish-cloth-01', 'wish-home-01', 'wish-move-01', 'wish-joy-01'];
  };

  // Selected wish IDs (guaranteed up to 5)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return loadValidSelectedIds();
  });

  // Coordinates on 2D matrix: Record<wishId, { x: number, y: number }>
  // 預設為空（未放置），讓個案與家屬親手拖曳定位更具賦能感與參與感；若先前已有儲存定位則恢復
  const [coordinates, setCoordinates] = useState<Record<string, WishCoordinate>>(() => {
    try {
      const saved = localStorage.getItem(coordinateStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Active dragging state
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Copy feedback state
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Re-synchronize selected wishes whenever modal opens or props change
  useEffect(() => {
    if (!isOpen) return;

    const freshIds = loadValidSelectedIds();
    setSelectedIds(freshIds);

    // Load saved coordinates if any (only keep coordinates for wishes the user previously placed)
    try {
      let savedCoords: Record<string, WishCoordinate> = {};
      const saved = localStorage.getItem(coordinateStorageKey);
      if (saved) {
        savedCoords = JSON.parse(saved);
      } else if (patientKey !== 'default') {
        const defaultSaved = localStorage.getItem('passport_quadrant_coords_default');
        if (defaultSaved) {
          savedCoords = JSON.parse(defaultSaved);
        }
      }

      const nextCoords: Record<string, WishCoordinate> = {};
      freshIds.forEach((id) => {
        if (savedCoords[id]) {
          nextCoords[id] = savedCoords[id];
        }
      });

      setCoordinates(nextCoords);
    } catch {}
  }, [isOpen, storageKey, coordinateStorageKey, externalSelectedWishIds]);

  // Canvas container reference
  const canvasRef = useRef<HTMLDivElement>(null);

  // Available wish cards based on selectedIds
  const currentWishCards = useMemo(() => {
    return selectedIds
      .map(id => WISH_CARDS.find(w => w.id === id))
      .filter((w): w is WishCard => Boolean(w));
  }, [selectedIds]);

  // Derived quadrant placements
  const placements = useMemo(() => {
    const result: Record<string, QuadrantType> = {};
    currentWishCards.forEach(c => {
      const coord = coordinates[c.id];
      if (coord) {
        result[c.id] = coordToQuadrant(coord.x, coord.y);
      }
    });
    return result;
  }, [currentWishCards, coordinates]);

  // Save coordinates to local storage
  const saveCoordinates = (newCoords: Record<string, WishCoordinate>) => {
    setCoordinates(newCoords);
    try {
      localStorage.setItem(coordinateStorageKey, JSON.stringify(newCoords));
    } catch {}
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Move card to specific coordinate
  const handleUpdatePosition = (wishId: string, x: number, y: number) => {
    const clampedX = Math.max(7, Math.min(93, x));
    const clampedY = Math.max(7, Math.min(93, y));
    const next = {
      ...coordinates,
      [wishId]: { x: Math.round(clampedX), y: Math.round(clampedY) },
    };
    saveCoordinates(next);
  };

  // Tablet-friendly: Unplace single card (取消單項拖曳放置，收回至上方)
  const handleUnplaceCard = (wishId: string) => {
    playClickSound();
    const next = { ...coordinates };
    delete next[wishId];
    saveCoordinates(next);
  };

  // Tablet-friendly: Cancel all placed tokens (取消所有拖曳，一鍵全部收回至上方)
  const handleResetAllToPool = () => {
    playClickSound();
    saveCoordinates({});
  };

  // Tablet-friendly: Single tap to place an unplaced wish into suggested quadrant
  const handlePlaceDefault = (wishId: string, idx: number) => {
    playSuccessSound();
    const presets: WishCoordinate[] = [
      { x: 78, y: 82 }, // Top-Right (短期)
      { x: 64, y: 68 }, // Top-Right (短期)
      { x: 26, y: 78 }, // Top-Left (長期)
      { x: 76, y: 28 }, // Bottom-Right (協同)
      { x: 24, y: 26 }, // Bottom-Left (休閒)
    ];
    const target = presets[idx % presets.length];
    const next = {
      ...coordinates,
      [wishId]: target,
    };
    saveCoordinates(next);
  };

  // Reset all to clean layout
  const handleAutoArrange = () => {
    playSuccessSound();
    const presets: WishCoordinate[] = [
      { x: 78, y: 82 }, // Top-Right (短期)
      { x: 64, y: 68 }, // Top-Right (短期)
      { x: 26, y: 78 }, // Top-Left (長期)
      { x: 76, y: 28 }, // Bottom-Right (協同)
      { x: 24, y: 26 }, // Bottom-Left (休閒)
    ];
    const next: Record<string, WishCoordinate> = {};
    currentWishCards.forEach((c, idx) => {
      next[c.id] = presets[idx % presets.length];
    });
    saveCoordinates(next);
  };

  // Pointer drag events for canvas tokens (smooth 60fps interaction)
  const handlePointerDown = (e: React.PointerEvent, wishId: string) => {
    e.stopPropagation();
    e.preventDefault();
    playClickSound();
    setActiveDraggingId(wishId);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = moveEvent.clientX;
      const clientY = moveEvent.clientY;

      const xPct = ((clientX - rect.left) / rect.width) * 100;
      const yPct = ((rect.bottom - clientY) / rect.height) * 100;

      const clampedX = Math.max(7, Math.min(93, xPct));
      const clampedY = Math.max(7, Math.min(93, yPct));

      setCoordinates(prev => ({
        ...prev,
        [wishId]: { x: Math.round(clampedX), y: Math.round(clampedY) },
      }));
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      playSuccessSound();
      setActiveDraggingId(null);

      const rect = canvas.getBoundingClientRect();
      const xPct = ((upEvent.clientX - rect.left) / rect.width) * 100;
      const yPct = ((rect.bottom - upEvent.clientY) / rect.height) * 100;
      handleUpdatePosition(wishId, xPct, yPct);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Drag from top 5 wishes row directly into canvas
  const handleDockDragStart = (e: React.DragEvent, wishId: string) => {
    e.dataTransfer.setData('text/plain', wishId);
    e.dataTransfer.effectAllowed = 'move';
    setActiveDraggingId(wishId);
  };

  const handleDockDragEnd = () => {
    setActiveDraggingId(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const wishId = e.dataTransfer.getData('text/plain');
    const canvas = canvasRef.current;
    if (wishId && canvas) {
      const rect = canvas.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((rect.bottom - e.clientY) / rect.height) * 100;
      handleUpdatePosition(wishId, xPct, yPct);
      playSuccessSound();
    }
    setActiveDraggingId(null);
  };

  // Format clinical text summary for copying into EMR / ISP notes
  const clinicalText = useMemo(() => {
    const pName = patientName || '未指定個案';
    const pCase = patientCaseNumber ? ` (${patientCaseNumber})` : '';
    const dateStr = new Date().toLocaleDateString('zh-TW');

    let text = `【個案日常生活功能願景：四象限長短期復健目標規劃書】\n`;
    text += `個案姓名：${pName}${pCase}\n評估基準日：${dateStr}\n分析方式：方式一（圓形氣泡珠光感徽章 × 投影座標直覺化定位）\n\n`;

    QUADRANTS.forEach(q => {
      const cardsInQ = currentWishCards.filter(c => placements[c.id] === q.id);
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `▶ ${q.title} [${q.subtitle}]\n`;
      text += `臨床意義：${q.criteria}\n`;
      text += `建議協同角色：${q.suggestedPartner}\n`;
      if (cardsInQ.length === 0) {
        text += `• 目前此象限尚未排入願望項目。\n`;
      } else {
        cardsInQ.forEach((c, idx) => {
          const coord = coordinates[c.id];
          const coordStr = coord ? ` (急迫性 ${Math.round(coord.x / 10) * 10}% / 重要性 ${Math.round(coord.y / 10) * 10}%)` : '';
          text += `  ${idx + 1}. 【${c.category}】${c.title}${coordStr}\n`;
          text += `     - 動作核心：${c.actionVerbFull || c.actionVerb || '生活自理操作'}\n`;
          text += `     - 關鍵能力需求：${c.requiredAbilities?.posturalMotor?.[0] || '維持坐/站平衡'}、${c.requiredAbilities?.handFunction?.[0] || '健側/患側手操作'}\n`;
          text += `     - 護照建議連動題號：${c.relatedTaskIds?.map(id => `#${id}`).join(', ') || '無'}\n`;
          if (c.adaptiveStrategies?.length > 0) {
            text += `     - 建議代償技巧/輔具：${c.adaptiveStrategies[0]}\n`;
          }
        });
      }
      text += `\n`;
    });

    text += `\n【治療師簽署與評估摘要】\n主責治療師：___________________  日期：__________\n`;
    return text;
  }, [patientName, patientCaseNumber, currentWishCards, placements, coordinates]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(clinicalText);
      playSuccessSound();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      alert('複製失敗，請手動選取');
    }
  };

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-[65] flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto">
      {/* Print-specific style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-quadrant-area, .printable-quadrant-area * {
            visibility: visible;
          }
          .printable-quadrant-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        className="bg-[#FAF8F2] rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full h-[98vh] sm:h-[95vh] overflow-hidden flex flex-col border border-stone-300 print:border-none print:shadow-none print:h-auto print:max-h-none print:rounded-none"
      >
        {/* Top Header & Quick Action Bar */}
        <div className="no-print px-4 py-3 sm:px-6 sm:py-3.5 bg-white border-b border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-rose-500 via-amber-500 to-emerald-600 text-white rounded-xl shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-stone-900 text-sm sm:text-base">
                  生活願望象線圖
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {savedNotice && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 animate-pulse">
                <Check className="w-3.5 h-3.5" />
                已自動存檔
              </span>
            )}

            {/* Tablet-Friendly Cancel All Button (平板超實用：一鍵取消所有放置，全部收回) */}
            {Object.keys(coordinates).length > 0 && (
              <button
                type="button"
                onClick={handleResetAllToPool}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs touch-manipulation"
                title="取消所有已拖曳之徽章，全部收回至上方"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>取消所有拖曳 (全部收回)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAutoArrange}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs touch-manipulation"
              title="一鍵推薦分佈至四個象限"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>智慧分佈</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 touch-manipulation"
              title="複製臨床長短期目標評估摘要至剪貼簿"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copied ? '已複製臨床摘要' : '複製臨床摘要'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95 touch-manipulation"
              title="列印為 A4 目標規劃評估單"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>列印 / 存為 PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSuccessSound();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition cursor-pointer active:scale-95 touch-manipulation"
              title="完成願望象限定位並返回護照"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>完成並返回</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:bg-stone-200 rounded-xl transition cursor-pointer touch-manipulation"
              title="關閉"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Modal Content Container (平板一屏全覽流，無需滾動即可完成操作) */}
        <div className="flex-1 overflow-hidden p-2 sm:p-3.5 printable-quadrant-area flex flex-col min-h-0 print:overflow-visible print:p-0">
          
          {/* Printable Header for A4 PDF (visible only on print) */}
          <div className="hidden print:block border-b-2 border-stone-800 pb-3 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-stone-900">員郭醫院 復健醫學科 ｜ 生活功能願景四象限目標規劃書</h1>
                <div className="text-xs text-stone-600 mt-1 flex gap-6">
                  <span>個案姓名：<strong>{patientName || '未指定'}</strong></span>
                  <span>病歷號碼：<strong>{patientCaseNumber || '無紀錄'}</strong></span>
                  <span>評估基準日：<strong>{new Date().toLocaleDateString('zh-TW')}</strong></span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold px-2.5 py-1 bg-stone-100 border border-stone-300 rounded">
                  臨床目標導引 (GAS/SMART)
                </span>
              </div>
            </div>
          </div>

          {/* Unified Quadrant Matrix Board (純淨畫布，上方 5 個願望整齊排開，可直接拖曳至象限圖) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            
            {/* Top 5 Wishes Clean Horizontal Row (整齊排列的 5 大願望圓形徽章，支援拖曳至下方) */}
            <div className="no-print bg-stone-50/90 border-b border-stone-200 p-2 sm:p-3 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <h3 className="text-xs sm:text-sm font-black text-stone-800">
                    個案選定之 5 大生活功能願景徽章
                  </h3>
                </div>
                <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
                  可按住上方圓形徽章直接拖曳放置至下方象限中定位
                </span>
              </div>

              {/* Dynamic Equal Columns Grid - Perfectly Aligned */}
              <div 
                className="grid gap-2 sm:gap-3"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(1, Math.min(5, currentWishCards.length))}, minmax(0, 1fr))`
                }}
              >
                {currentWishCards.map((card, idx) => {
                  const coord = coordinates[card.id];
                  const quadId = coord ? coordToQuadrant(coord.x, coord.y) : null;
                  const quadInfo = quadId ? QUADRANTS.find(q => q.id === quadId) : null;
                  const catStyle = CATEGORY_STYLES[card.category] || CATEGORY_STYLES['食'];
                  const isDragging = activeDraggingId === card.id;
                  const isHovered = hoveredCardId === card.id;

                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDockDragStart(e, card.id)}
                      onDragEnd={handleDockDragEnd}
                      onMouseEnter={() => setHoveredCardId(card.id)}
                      onMouseLeave={() => setHoveredCardId(null)}
                      className={`flex flex-col items-center text-center p-2 rounded-2xl bg-white border transition-all duration-150 select-none cursor-grab active:cursor-grabbing group shadow-2xs ${
                        isDragging
                          ? 'ring-2 ring-emerald-500 scale-105 shadow-md border-emerald-300'
                          : isHovered
                          ? 'border-emerald-300 shadow-sm scale-102 bg-emerald-50/20'
                          : 'border-stone-200 hover:border-stone-300 hover:shadow-xs'
                      }`}
                      title="按住此徽章直接拖曳至下方象限圖任意位置"
                    >
                      {/* Circular Token with Category Glow */}
                      <div
                        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-xs transition-transform ${
                          catStyle.bg
                        } ${isDragging ? 'scale-110' : 'group-hover:scale-105'}`}
                      >
                        <span className="filter drop-shadow-sm pointer-events-none">{card.icon}</span>
                      </div>

                      {/* Wish Title (Neat, Truncated) */}
                      <div className="mt-1.5 font-bold text-stone-900 text-[11px] sm:text-xs truncate w-full px-1">
                        {card.title}
                      </div>

                      {/* Quadrant Placement Tag & Tablet Action Buttons */}
                      <div className="mt-1 w-full space-y-1">
                        {quadInfo ? (
                          <>
                            <span className={`inline-block w-full text-[9px] sm:text-[10px] font-bold py-0.5 px-1 rounded-md border truncate ${quadInfo.badgeBg} ${quadInfo.badgeText}`}>
                              {quadInfo.tag}
                            </span>
                            {/* Tablet-friendly Cancel Button on Card */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnplaceCard(card.id);
                              }}
                              className="w-full py-1 px-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-md flex items-center justify-center gap-1 transition cursor-pointer touch-manipulation"
                              title="取消此項拖曳，收回至未放置狀態"
                            >
                              <X className="w-2.5 h-2.5 stroke-[2.5]" />
                              <span>取消拖曳</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="inline-block w-full text-[9px] sm:text-[10px] font-semibold py-0.5 px-1 rounded-md bg-stone-100 text-stone-500 border border-stone-200">
                              未放置
                            </span>
                            {/* Tablet-friendly Tap-to-Place Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaceDefault(card.id, idx);
                              }}
                              className="w-full py-1 px-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 rounded-md flex items-center justify-center gap-1 transition cursor-pointer touch-manipulation"
                              title="平板點擊直接排入象限"
                            >
                              <span>+ 點擊排入</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coordinate Axis Header Labels */}
            <div className="px-3 py-1.5 sm:px-5 sm:py-2 bg-white border-b border-stone-200 flex items-center justify-between text-xs font-bold shrink-0">
              <div className="flex items-center gap-2 text-emerald-900">
                <div className="p-1 bg-emerald-100 rounded-lg text-emerald-700">
                  <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-xs sm:text-sm font-black">縱軸：重要性（Importance）</span>
              </div>

              <div className="flex items-center gap-2 text-rose-800">
                <span className="text-xs sm:text-sm font-black">橫軸：急迫性（Urgency）</span>
                <div className="p-1 bg-rose-100 rounded-lg text-rose-700">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            {/* Matrix 2D Drag Canvas Container */}
            <div
              ref={canvasRef}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleCanvasDrop}
              className="relative w-full flex-1 min-h-0 bg-gradient-to-br from-stone-50 via-white to-stone-50 overflow-hidden select-none touch-none shadow-inner"
            >
              {/* Background Subtle Grid Pattern */}
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle, #000 1.5px, transparent 1.5px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* 4 Quadrants Background Labels */}
              {/* Top-Left: Second Quadrant (長期核心願景) */}
              <div className="absolute left-0 top-0 w-1/2 h-1/2 bg-blue-500/[0.03] border-r border-b border-stone-200/80 p-3 sm:p-4 flex flex-col justify-start pointer-events-none">
                <div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    第二象限：長期核心自立願景
                  </span>
                  <p className="text-[10px] text-blue-900/60 mt-1">深遠願景 ＋ 階段漸進鍛鍊（1~6 個月）</p>
                </div>
              </div>

              {/* Top-Right: First Quadrant (短期衝刺目標) */}
              <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-emerald-500/[0.04] border-b border-stone-200/80 p-3 sm:p-4 flex flex-col justify-start items-end pointer-events-none">
                <div className="text-right">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    第一象限：短期衝刺目標 ★
                  </span>
                  <p className="text-[10px] text-emerald-900/60 mt-1">核心自立 ＋ 迫切需攻堅（1~4 週）</p>
                </div>
              </div>

              {/* Bottom-Left: Third Quadrant (後續生活品質擴展) */}
              <div className="absolute left-0 bottom-0 w-1/2 h-1/2 bg-purple-500/[0.03] border-r border-stone-200/80 p-3 sm:p-4 flex flex-col justify-end pointer-events-none">
                <div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    第三象限：後續品質擴展
                  </span>
                  <p className="text-[10px] text-purple-900/60 mt-1">休閒嗜好 ＋ 社區回歸參與</p>
                </div>
              </div>

              {/* Bottom-Right: Fourth Quadrant (家庭協同與輔具代償) */}
              <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-amber-500/[0.04] p-3 sm:p-4 flex flex-col justify-end items-end pointer-events-none">
                <div className="text-right">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    第四象限：家庭協同與代償
                  </span>
                  <p className="text-[10px] text-amber-900/60 mt-1">生活日常 ＋ 照服員家屬協同</p>
                </div>
              </div>

              {/* Central Axes Lines */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-stone-400/70 -translate-x-1/2 pointer-events-none z-10" />
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-stone-400/70 -translate-y-1/2 pointer-events-none z-10" />

              {/* Center Dot (50, 50) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-stone-800 border-2 border-white shadow-md z-15 pointer-events-none" />

              {/* Placed Circular Badges on Canvas */}
              {currentWishCards.map((card, idx) => {
                const coord = coordinates[card.id];
                if (!coord) return null;

                const isDragging = activeDraggingId === card.id;
                const isHovered = hoveredCardId === card.id;
                const catStyle = CATEGORY_STYLES[card.category] || CATEGORY_STYLES['食'];
                const quadId = coordToQuadrant(coord.x, coord.y);
                const quadInfo = QUADRANTS.find(q => q.id === quadId);

                return (
                  <div
                    key={card.id}
                    onPointerDown={(e) => handlePointerDown(e, card.id)}
                    onMouseEnter={() => setHoveredCardId(card.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    style={{
                      left: `${coord.x}%`,
                      bottom: `${coord.y}%`,
                    }}
                    className={`absolute -translate-x-1/2 translate-y-1/2 z-20 cursor-grab active:cursor-grabbing transition-transform ${
                      isDragging ? 'scale-125 z-40' : isHovered ? 'scale-115 z-30' : 'hover:scale-110'
                    }`}
                  >
                    {/* Glowing Circular Bubble Badge */}
                    <div className="relative group">
                      <div
                        className={`w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-xl transition-shadow ${
                          catStyle.bg
                        } ${
                          isDragging
                            ? 'ring-4 ring-white shadow-2xl ring-offset-2'
                            : 'ring-2 ring-white/90 shadow-lg'
                        }`}
                      >
                        <span className="filter drop-shadow-sm pointer-events-none">{card.icon}</span>

                        {/* Tablet-friendly Cancel / Unplace Button (點擊即可取消此項放置，收回上方) */}
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnplaceCard(card.id);
                          }}
                          className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-90 transition z-35 touch-manipulation"
                          title="取消拖曳，收回至上方"
                        >
                          <X className="w-3 h-3 stroke-[3]" />
                        </button>

                        {/* Drag Handle Icon inside */}
                        <div className="absolute top-1 left-1 bg-black/30 rounded-full p-0.5 text-white/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                          <Move className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      {/* Underneath Mini Pill with Title */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap pointer-events-none z-30">
                        <div className="bg-stone-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1">
                          <span>{card.title}</span>
                        </div>
                      </div>

                      {/* Active Dragging Floating HUD - Clean quadrant tag without math percentages */}
                      {isDragging && quadInfo && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap pointer-events-none z-40 bg-stone-900/90 text-white border border-white/20 rounded-full px-3 py-1 shadow-2xl text-[11px] font-bold backdrop-blur-xs flex items-center gap-1.5">
                          <span className={quadInfo.accentColor}>{quadInfo.tag}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Section 2: Clinical Rehabilitation Target Recommendations for Therapists (螢幕模式隱藏以保持平板純淨全覽；列印 A4/PDF 時自動完整輸出供專業團隊核定) */}
          <div className="hidden print:block bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden mt-6">
            <div className="p-4 sm:p-5 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-sm sm:text-base flex items-center gap-2 flex-wrap">
                    <span>個別化長短期復健目標建議書</span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      供治療師 / 團隊參考
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    依據圓形徽章即時拖曳座標自動產製之目標與任務對應表
                  </p>
                </div>
              </div>
            </div>

            {/* Inner Content: Always included on print */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <span className="text-xs text-stone-500 font-medium">
                  依據圓形徽章即時拖曳座標自動產製
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Short-term Goals Detail Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>短期優先訓練目標（1 ~ 4 週）</span>
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    第一象限項目
                  </span>
                </div>

                {(() => {
                  const shortCards = currentWishCards.filter(c => placements[c.id] === 'short-term');
                  if (shortCards.length === 0) {
                    return (
                      <p className="text-xs text-stone-500 italic py-2">
                        尚無排入短期目標之願望，可將最急需之生活自理項目拖入第一象限。
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2.5 text-xs">
                      {shortCards.map((c, i) => {
                        const coord = coordinates[c.id];
                        return (
                          <div key={c.id} className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-stone-900">
                              <span className="flex items-center gap-1.5">
                                <span>{c.icon}</span>
                                <span>{i + 1}. 【{c.category}】{c.title}</span>
                              </span>
                              {coord && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                                  急迫{Math.round(coord.x / 10) * 10}% / 重要{Math.round(coord.y / 10) * 10}%
                                </span>
                              )}
                            </div>
                            <div className="text-stone-600 text-[11px] leading-relaxed">
                              <strong>動作核心：</strong>{c.actionVerbFull || c.actionVerb}；<strong>軀幹能力：</strong>{c.requiredAbilities?.posturalMotor?.[0] || '維持坐姿動態平衡'}
                            </div>
                            <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 pt-1 border-t border-stone-100">
                              <Target className="w-3 h-3 text-emerald-600" />
                              <span>建議連動護照任務：</span>
                              <div className="flex gap-1 flex-wrap">
                                {c.relatedTaskIds.map(tid => (
                                  <button
                                    key={tid}
                                    type="button"
                                    onClick={() => onNavigateToTask && onNavigateToTask(tid, c.category)}
                                    className="underline font-bold hover:text-emerald-950 cursor-pointer"
                                  >
                                    第 {tid} 題
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Long-term Goals Detail Box */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-950 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>長期自立願景目標（3 ~ 6 個月）</span>
                  </h4>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-300">
                    第二象限項目
                  </span>
                </div>

                {(() => {
                  const longCards = currentWishCards.filter(c => placements[c.id] === 'long-term');
                  if (longCards.length === 0) {
                    return (
                      <p className="text-xs text-stone-500 italic py-2">
                        尚無排入長期願景之願望，可將深層自立或自我實現項目拖入第二象限。
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2.5 text-xs">
                      {longCards.map((c, i) => {
                        const coord = coordinates[c.id];
                        return (
                          <div key={c.id} className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-stone-900">
                              <span className="flex items-center gap-1.5">
                                <span>{c.icon}</span>
                                <span>{i + 1}. 【{c.category}】{c.title}</span>
                              </span>
                              {coord && (
                                <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-mono">
                                  重要{Math.round(coord.y / 10) * 10}%
                                </span>
                              )}
                            </div>
                            <div className="text-stone-600 text-[11px] leading-relaxed">
                              <strong>長程目標拆解策略：</strong>{c.subtitle}
                            </div>
                            {c.adaptiveStrategies?.length > 0 && (
                              <div className="text-[11px] text-stone-500">
                                <strong>建議代償與演練：</strong>{c.adaptiveStrategies[0]}
                              </div>
                            )}
                            <div className="text-[11px] text-blue-800 flex items-center gap-1.5 pt-1 border-t border-stone-100">
                              <Compass className="w-3 h-3 text-blue-600" />
                              <span>核心里程碑任務：</span>
                              <button
                                type="button"
                                onClick={() => onNavigateToTask && onNavigateToTask(c.milestoneTaskId, c.category)}
                                className="underline font-bold hover:text-blue-950 cursor-pointer"
                              >
                                第 {c.milestoneTaskId} 題（大關卡）
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Support & Adaptive Compensation Goals */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <span>家屬協同與輔具代償指引</span>
                  </h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    第四象限項目
                  </span>
                </div>

                {(() => {
                  const supportCards = currentWishCards.filter(c => placements[c.id] === 'support');
                  if (supportCards.length === 0) {
                    return (
                      <p className="text-xs text-stone-500 italic py-2">
                        尚無排入協同代償之項目，可將需家屬/照服員協助之急迫項目拖入第四象限。
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2 text-xs">
                      {supportCards.map((c, i) => (
                        <div key={c.id} className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{c.icon}</span>
                            <span>{i + 1}. 【{c.category}】{c.title}</span>
                          </div>
                          <div className="text-stone-600 text-[11px]">
                            <strong>賦能照護重點：</strong>
                            {c.adaptiveStrategies?.[0] || '以輔具搭配家屬口語提示，保留個案殘存肌力自主參與。'}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Leisure & Quality of Life Goals */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-purple-950 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span>後續休閒擴展與心理激勵</span>
                  </h4>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-300">
                    第三象限項目
                  </span>
                </div>

                {(() => {
                  const leisureCards = currentWishCards.filter(c => placements[c.id] === 'leisure');
                  if (leisureCards.length === 0) {
                    return (
                      <p className="text-xs text-stone-500 italic py-2">
                        尚無排入休閒擴展之項目，可將進階休閒與社區社交項目拖入第三象限。
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2 text-xs">
                      {leisureCards.map((c, i) => (
                        <div key={c.id} className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs space-y-1">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{c.icon}</span>
                            <span>{i + 1}. 【{c.category}】{c.title}</span>
                          </div>
                          <div className="text-stone-600 text-[11px]">
                            <strong>心理激勵意義：</strong>待基礎自立穩固後，作為返家後參與社區與家庭聚會之延伸動力。
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

              {/* Print Sign-off Block for Therapists */}
              <div className="hidden print:grid grid-cols-3 gap-6 pt-6 mt-6 border-t-2 border-stone-300 text-xs">
                <div className="p-3 border border-stone-300 rounded-lg text-center">
                  <div className="font-bold mb-8">個案 / 家屬共同討論簽章</div>
                  <div className="border-t border-stone-400 w-3/4 mx-auto pt-1 text-[10px] text-stone-500">日期：____年__月__日</div>
                </div>
                <div className="p-3 border border-stone-300 rounded-lg text-center">
                  <div className="font-bold mb-8">主責物理 / 職能治療師核定</div>
                  <div className="border-t border-stone-400 w-3/4 mx-auto pt-1 text-[10px] text-stone-500">簽章與執照號碼</div>
                </div>
                <div className="p-3 border border-stone-300 rounded-lg text-center">
                  <div className="font-bold mb-8">復健醫學科 主任督導審核</div>
                  <div className="border-t border-stone-400 w-3/4 mx-auto pt-1 text-[10px] text-stone-500">員郭醫院 復健醫學科</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
