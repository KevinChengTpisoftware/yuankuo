import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Check,
  CheckCircle2,
  Star,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
  Filter,
  Layers,
  HeartHandshake,
  Video,
  Activity,
  Repeat
} from 'lucide-react';
import { WishCard, Category } from '../types';
import { WISH_CARDS } from '../wishlistData';
import { WishActionAnimation } from './WishActionAnimation';
import { getAdminPassword, setStoredRole, UserRole } from '../services/authService';
import { playClickSound, playSuccessSound } from '../lib/audio';

const CATEGORY_TABS: { id: string; label: string; icon: string }[] = [
  { id: '全部', label: '全部領域 (28)', icon: '✨' },
  { id: '食', label: '食領域', icon: '🍳' },
  { id: '衣', label: '衣領域', icon: '👕' },
  { id: '住', label: '住領域', icon: '🏡' },
  { id: '行', label: '行領域', icon: '🚶' },
  { id: '育', label: '育領域', icon: '🧠' },
  { id: '樂', label: '樂領域', icon: '🌱' },
];

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  completedTasks: Set<number>;
  onNavigateToTask?: (taskId: number, category: Category) => void;
  isAdmin?: boolean;
  onAdminAuthSuccess?: (role: UserRole) => void;
  onOpenQuadrant?: (selectedIds?: string[]) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  patientName,
  completedTasks,
  onNavigateToTask,
  isAdmin = false,
  onAdminAuthSuccess,
  onOpenQuadrant,
}) => {
  // Category tabs & filter
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [activeFilter, setActiveFilter] = useState<'all' | 'selected' | 'unselected'>('all');
  
  // Expanded card IDs for detailed breakdown view
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  // Wish selections state (persisted per patient or locally)
  const storageKey = useMemo(() => {
    return `passport_wishes_${patientName ? patientName.trim() : 'default'}`;
  }, [patientName]);

  const [selectedWishIds, setSelectedWishIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [primaryWishId, setPrimaryWishId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${storageKey}_primary`) || null;
    } catch {
      return null;
    }
  });

  // Illustration visual mode: 'animation' (動態動畫/影片模式, 預設) | 'text' (精簡文字模式)
  const [visualMode, setVisualMode] = useState<'animation' | 'text'>('animation');
  
  // Custom video URLs persisted locally per card (supports YouTube, MP4, WebM, /videos/xxx.mp4)
  const [customVideos, setCustomVideos] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('passport_wish_custom_videos');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal state for configuring custom video for a card
  const [editingVideoCard, setEditingVideoCard] = useState<WishCard | null>(null);
  const [tempVideoUrl, setTempVideoUrl] = useState('');
  const [showVideoLookupTable, setShowVideoLookupTable] = useState(false);

  // Admin authentication state (Only administrators have permission to click and edit videos)
  const [isAdminLocal, setIsAdminLocal] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('passport_admin_auth') === 'true' && 
        (sessionStorage.getItem('passport_auth_role') === 'admin' || !sessionStorage.getItem('passport_auth_role'));
    } catch {
      return false;
    }
  });

  const effectiveIsAdmin = Boolean(isAdmin || isAdminLocal);

  // Admin verification prompt state
  const [showAdminVerifyPrompt, setShowAdminVerifyPrompt] = useState(false);
  const [pendingCardForAdminAuth, setPendingCardForAdminAuth] = useState<WishCard | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminVerifyError, setAdminVerifyError] = useState('');

  const handleOpenVideoEditor = (card: WishCard) => {
    playClickSound();
    if (effectiveIsAdmin) {
      setEditingVideoCard(card);
      setTempVideoUrl(customVideos[card.id] || card.videoUrl || '');
    } else {
      setPendingCardForAdminAuth(card);
      setAdminPasswordInput('');
      setAdminVerifyError('');
      setShowAdminVerifyPrompt(true);
    }
  };

  const handleVerifyAdminPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = adminPasswordInput.trim();
    const adminPwd = getAdminPassword();
    if (clean === adminPwd) {
      playSuccessSound();
      setIsAdminLocal(true);
      setStoredRole('admin');
      try {
        sessionStorage.setItem('passport_admin_auth', 'true');
      } catch {}
      if (onAdminAuthSuccess) {
        onAdminAuthSuccess('admin');
      }
      setShowAdminVerifyPrompt(false);
      setAdminVerifyError('');
      if (pendingCardForAdminAuth) {
        setEditingVideoCard(pendingCardForAdminAuth);
        setTempVideoUrl(customVideos[pendingCardForAdminAuth.id] || pendingCardForAdminAuth.videoUrl || '');
        setPendingCardForAdminAuth(null);
      }
    } else {
      setAdminVerifyError('管理員密碼錯誤，僅限最高管理員取得編輯權限');
    }
  };

  // Sync state when patientName or storageKey changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setSelectedWishIds(saved ? JSON.parse(saved) : []);
      const savedPrimary = localStorage.getItem(`${storageKey}_primary`);
      setPrimaryWishId(savedPrimary || null);
    } catch {
      setSelectedWishIds([]);
      setPrimaryWishId(null);
    }
  }, [storageKey]);

  // Persist selections
  const toggleSelectWish = (id: string) => {
    const isCurrentlySelected = selectedWishIds.includes(id);
    if (isCurrentlySelected) {
      playClickSound();
    } else {
      playSuccessSound();
    }

    setSelectedWishIds((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter((item) => item !== id);
        // If removing the primary wish, clear primary
        if (primaryWishId === id) {
          setPrimaryWishId(null);
          try {
            localStorage.removeItem(`${storageKey}_primary`);
          } catch {}
        }
      } else {
        next = [...prev, id];
        // If this is the first wish selected, auto-set as primary
        if (!primaryWishId) {
          setPrimaryWishId(id);
          try {
            localStorage.setItem(`${storageKey}_primary`, id);
          } catch {}
        }
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSetPrimaryWish = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSuccessSound();
    if (!selectedWishIds.includes(id)) {
      toggleSelectWish(id);
    }
    setPrimaryWishId(id);
    try {
      localStorage.setItem(`${storageKey}_primary`, id);
    } catch {}
  };

  const toggleExpandCard = (id: string) => {
    playClickSound();
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered wish list
  const filteredWishes = useMemo(() => {
    return WISH_CARDS.filter((card) => {
      // Category filter
      if (selectedCategory !== '全部' && card.category !== selectedCategory) {
        return false;
      }
      // Status filter
      const isSelected = selectedWishIds.includes(card.id);
      if (activeFilter === 'selected' && !isSelected) return false;
      if (activeFilter === 'unselected' && isSelected) return false;

      return true;
    });
  }, [selectedCategory, activeFilter, selectedWishIds]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-[#F4F0E6] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[1200px] h-[95vh] sm:h-[92vh] overflow-hidden flex flex-col border border-stone-300"
        >
          {/* Top Header */}
          <div className="p-4 sm:p-6 border-b border-stone-200 bg-[#FCFAF5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                    我的生活願望清單
                  </h2>
                  {patientName && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
                      學員：{patientName}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  精選 28 張生活願望圖卡。選定您的生活目標，清楚看見所需鍛鍊的基本能力！
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              {/* 5 Wishes Quadrant Dashboard Button */}
              {onOpenQuadrant && (
                <button
                  onClick={() => {
                    playClickSound();
                    onOpenQuadrant(selectedWishIds);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                  title="開啟 5 大願望對照 150 項任務之四象限分析儀"
                >
                  <Target className="w-4 h-4" />
                  <span>🎯 5大願望</span>
                </button>
              )}

              {/* Selected stats chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-100/70 border border-rose-200 rounded-xl text-rose-900 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>已挑選 {selectedWishIds.length} 個願望</span>
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="p-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition-colors cursor-pointer"
                title="關閉視窗"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter & Navigation Bar */}
          <div className="px-4 sm:px-6 py-3 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Category selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
              {CATEGORY_TABS.map((catTab) => {
                const isActive = selectedCategory === catTab.id;
                return (
                  <button
                    key={catTab.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedCategory(catTab.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                    }`}
                  >
                    <span>{catTab.icon}</span>
                    <span>{catTab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right side: filter tabs + view mode toggle */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Selection state filter */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => {
                    playClickSound();
                    setActiveFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-white text-stone-800 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setActiveFilter('selected');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    activeFilter === 'selected'
                      ? 'bg-white text-rose-700 shadow-2xs'
                      : 'text-stone-500 hover:text-rose-600'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>已選 ({selectedWishIds.length})</span>
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setActiveFilter('unselected');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'unselected'
                      ? 'bg-white text-stone-800 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  未選
                </button>
              </div>

              {/* Visual Mode Segmented Controls: Video vs Compact Text */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0 border border-stone-200">
                <button
                  onClick={() => {
                    playClickSound();
                    setVisualMode('animation');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    visualMode === 'animation'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="自動展開有設定示範影片之願望卡片"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>顯示影片</span>
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setVisualMode('text');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    visualMode === 'text'
                      ? 'bg-white text-stone-800 shadow-2xs font-extrabold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="收合所有影片，以純文字圖示精簡呈現"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>精簡</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards Scroll Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F4F0E6]">
            <div className="max-w-[1200px] mx-auto w-full space-y-6">
              
              {/* Encouragement Banner */}
              <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200/70 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      「生病只是一時的停頓，生活才是我們的終點站」
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      挑選 3 ~ 5 個您最期待重拾的生活畫面。我們會為您將護照任務串聯成通往夢想的階梯！
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  {primaryWishId && (
                    <div className="bg-white/90 px-3.5 py-2 rounded-xl border border-amber-300 shadow-2xs flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <div className="text-xs">
                        <span className="text-stone-400 font-medium">第一首要目標：</span>
                        <strong className="text-stone-800 font-bold ml-1">
                          {WISH_CARDS.find((c) => c.id === primaryWishId)?.title || '未指定'}
                        </strong>
                      </div>
                    </div>
                  )}

                  {onOpenQuadrant && (
                    <button
                      type="button"
                      onClick={() => {
                        playSuccessSound();
                        onOpenQuadrant(selectedWishIds);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Target className="w-4 h-4" />
                      <span>前往 5大願望四象限拖曳分析</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredWishes.map((card) => {
                  const isSelected = selectedWishIds.includes(card.id);
                  const isPrimary = primaryWishId === card.id;
                  const isExpanded = expandedCardIds.has(card.id);

                  // Calculate task completion readiness
                  const completedRelatedCount = card.relatedTaskIds.filter((tId) =>
                    completedTasks.has(tId)
                  ).length;
                  const totalRelatedCount = card.relatedTaskIds.length;
                  const rawProgressPct = totalRelatedCount > 0
                    ? (completedRelatedCount / totalRelatedCount) * 100
                    : 0;

                  // 依長輩友善與簡約需求：概略以 10%、20%、30%... 整數十進位表示，避免零碎數字
                  let progressPct = Math.round(rawProgressPct / 10) * 10;
                  if (completedRelatedCount > 0 && progressPct === 0) {
                    progressPct = 10;
                  }
                  if (completedRelatedCount < totalRelatedCount && progressPct === 100) {
                    progressPct = 90;
                  }

                  const currentVideoUrl = (customVideos[card.id] || card.videoUrl || '').trim();
                  const hasVideo = Boolean(currentVideoUrl);

                  // 做法 A：僅在有設定自訂或實拍影片且非純文字模式時展開影片；若無影片則自動收合頂部媒體框（完全不佔位）
                  const cardVisual = visualMode === 'text' || !hasVideo ? 'none' : 'animation';

                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl transition-all border-2 overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? isPrimary
                            ? 'bg-[#FCFAF5] border-amber-400 shadow-md ring-2 ring-amber-300/40'
                            : 'bg-[#FCFAF5] border-rose-400/90 shadow-md ring-2 ring-rose-200/30'
                          : 'bg-[#FCFAF5] border-stone-200 hover:border-stone-300 shadow-xs'
                      }`}
                    >
                      {/* Card Top Action Bar (Only shown when video player is expanded) */}
                      {cardVisual === 'animation' && (
                        <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2 flex-wrap shrink-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-stone-900 border border-stone-200 shadow-xs flex items-center gap-1">
                              <span>{card.icon}</span>
                              <span>【{card.category}】{card.badgeText}</span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${
                                card.difficultyLevel === '入門基礎'
                                  ? 'bg-emerald-600 text-white'
                                  : card.difficultyLevel === '生活自立'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-purple-600 text-white'
                              }`}
                            >
                              {card.difficultyLevel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Set / Replace Custom Video Button (Only displayed for Admin) */}
                            {effectiveIsAdmin && (
                              <button
                                id={`wish-video-btn-${card.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenVideoEditor(card);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                                  currentVideoUrl
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                }`}
                                title={currentVideoUrl ? '【管理員模式】管理/更換此願望示範影片' : '【管理員模式】點擊設定示範影片'}
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="text-[11px]">
                                  {currentVideoUrl ? '管理影片' : '放自己影片'}
                                </span>
                              </button>
                            )}

                            {isPrimary && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-400 text-amber-950 shadow-xs flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
                                首要
                              </span>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectWish(card.id);
                              }}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-xs cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                              }`}
                              title={isSelected ? '取消挑選此願望' : '挑選此願望'}
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Video Player (Only rendered when video URL exists and not collapsed) */}
                      {cardVisual === 'animation' && (
                        <div className="relative w-full overflow-hidden bg-black shrink-0">
                          <WishActionAnimation
                            animationType={card.animationType || 'default'}
                            actionVerb={card.actionVerb}
                            actionVerbFull={card.actionVerbFull}
                            category={card.category}
                            videoUrl={currentVideoUrl}
                          />
                        </div>
                      )}

                      {/* Card Content Top */}
                      <div className="p-5">
                        {cardVisual === 'none' && (
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
                                {card.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                                    【{card.category}】{card.badgeText}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      card.difficultyLevel === '入門基礎'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : card.difficultyLevel === '生活自立'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                                    }`}
                                  >
                                    {card.difficultyLevel}
                                  </span>
                                  {isPrimary && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 shadow-xs flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-amber-950 text-amber-950" />
                                      首要
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-1.5 leading-snug">
                                  {card.title}
                                </h3>
                              </div>
                            </div>

                            {/* Header action controls: Admin Video button & Wish Select Checkmark */}
                            <div className="flex items-center gap-2 shrink-0">
                              {effectiveIsAdmin && (
                                <button
                                  id={`wish-video-btn-${card.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenVideoEditor(card);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 border transition-all cursor-pointer ${
                                    currentVideoUrl
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                  }`}
                                  title={currentVideoUrl ? '【管理員模式】管理/更換此願望示範影片' : '【管理員模式】點擊設定示範影片'}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span className="text-[11px]">
                                    {currentVideoUrl ? '管理影片' : '放自己影片'}
                                  </span>
                                </button>
                              )}

                              <button
                                onClick={() => toggleSelectWish(card.id)}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border cursor-pointer ${
                                  isSelected
                                    ? 'bg-rose-500 border-rose-600 text-white shadow-xs hover:bg-rose-600'
                                    : 'bg-white border-stone-300 text-stone-400 hover:border-rose-400 hover:text-rose-500'
                                }`}
                                title={isSelected ? '取消挑選此願望' : '挑選此願望'}
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Title if in expanded video mode */}
                        {cardVisual === 'animation' && (
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                              {card.title}
                            </h3>
                          </div>
                        )}

                        {/* Daily Life Action Goal Box */}
                        <div className="mb-3 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-xs font-bold text-stone-800 truncate">
                              {card.actionVerbFull}
                            </span>
                          </div>
                          {hasVideo && cardVisual === 'none' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playClickSound();
                                setVisualMode('animation');
                              }}
                              className="text-[11px] font-bold text-rose-800 hover:text-rose-950 bg-white hover:bg-rose-100/60 px-2 py-1 rounded-lg border border-rose-300 flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs transition-all"
                              title="展開此願望示範影片"
                            >
                              <Video className="w-3 h-3 text-rose-600" />
                              <span>影片</span>
                            </button>
                          )}
                        </div>

                        {/* Subtitle / Scenario description */}
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pl-1 mb-4">
                          {card.subtitle}
                        </p>

                        {/* Passport Progress Bar */}
                        <div className="bg-white/80 p-3 rounded-xl border border-stone-200/80 mb-3">
                          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                            <span className="text-stone-500 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-rose-500" />
                              <span>護照對應關卡掌握度</span>
                            </span>
                            <span
                              className={`font-bold ${
                                progressPct === 100
                                  ? 'text-emerald-700'
                                  : 'text-stone-700'
                              }`}
                            >
                              {completedRelatedCount} / {totalRelatedCount} 項完成 ({progressPct}%)
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                progressPct === 100
                                  ? 'bg-emerald-500'
                                  : progressPct > 0
                                  ? 'bg-rose-500'
                                  : 'bg-stone-300'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Expandable Abilities & Strategies Section */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden pt-2 border-t border-stone-200/70 space-y-3.5"
                            >
                              {/* 1. Postural Motor */}
                              <div className="bg-white/90 p-3 rounded-xl border border-stone-200/80">
                                <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                                  <span>🏃‍♂️ 姿勢平衡與大動作控制</span>
                                </div>
                                <ul className="text-xs text-stone-700 space-y-1 pl-4 list-disc marker:text-emerald-500">
                                  {card.requiredAbilities.posturalMotor.map((item, idx) => (
                                    <li key={idx} className="leading-relaxed">
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* 2. Hand Function */}
                              <div className="bg-white/90 p-3 rounded-xl border border-stone-200/80">
                                <div className="text-xs font-bold text-blue-800 flex items-center gap-1.5 mb-2">
                                  <span>✋ 手部操作與患側/健側協調</span>
                                </div>
                                <ul className="text-xs text-stone-700 space-y-1 pl-4 list-disc marker:text-blue-500">
                                  {card.requiredAbilities.handFunction.map((item, idx) => (
                                    <li key={idx} className="leading-relaxed">
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* 3. Cognitive & Sensory */}
                              <div className="bg-white/90 p-3 rounded-xl border border-stone-200/80">
                                <div className="text-xs font-bold text-purple-800 flex items-center gap-1.5 mb-2">
                                  <span>🧠 認知、知覺與安全警覺</span>
                                </div>
                                <ul className="text-xs text-stone-700 space-y-1 pl-4 list-disc marker:text-purple-500">
                                  {card.requiredAbilities.cognitiveSensory.map((item, idx) => (
                                    <li key={idx} className="leading-relaxed">
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* 4. Adaptive Strategies */}
                              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-2">
                                  <span>💡 生活小撇步與友善輔具</span>
                                </div>
                                <ul className="text-xs text-amber-950 space-y-1 pl-4 list-disc marker:text-amber-500">
                                  {card.adaptiveStrategies.map((item, idx) => (
                                    <li key={idx} className="leading-relaxed">
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Related Tasks Tag Cloud */}
                              <div className="pt-1">
                                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                                  護照對應關卡編號
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {card.relatedTaskIds.map((tId) => {
                                    const isDone = completedTasks.has(tId);
                                    const isMilestone = tId === card.milestoneTaskId;
                                    return (
                                      <button
                                        key={tId}
                                        onClick={() => {
                                          playClickSound();
                                          if (onNavigateToTask) {
                                            onNavigateToTask(tId, card.category);
                                            onClose();
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                          isDone
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            : isMilestone
                                            ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                            : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                                        }`}
                                        title={isDone ? '此任務已在護照中完成' : '點擊前往護照任務'}
                                      >
                                        {isDone && <Check className="w-3 h-3 text-emerald-600" />}
                                        {isMilestone && <Star className="w-3 h-3 text-amber-600 fill-amber-500" />}
                                        <span>任務 {tId}</span>
                                        <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-3 bg-stone-100/60 border-t border-stone-200/80 flex items-center justify-between gap-2">
                        {/* Toggle expand details */}
                        <button
                          onClick={() => toggleExpandCard(card.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 transition-all flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              <span>收合能力說明</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              <span>查看所需基本能力 ({card.requiredAbilities.posturalMotor.length + card.requiredAbilities.handFunction.length + card.requiredAbilities.cognitiveSensory.length})</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <button
                              onClick={(e) => handleSetPrimaryWish(card.id, e)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                isPrimary
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-white text-stone-600 border border-stone-300 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                              }`}
                              title="設為近期最想達成的第一首要目標"
                            >
                              <Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-white' : 'text-amber-500'}`} />
                              <span>{isPrimary ? '首要目標' : '設為首要'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => toggleSelectWish(card.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                : 'bg-stone-800 text-white hover:bg-stone-900 shadow-xs'
                            }`}
                          >
                            {isSelected ? '取消選擇' : '選定此願望'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filteredWishes.length === 0 && (
                <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-500">
                  <Sparkles className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-base font-bold text-stone-700">目前分類下沒有符合條件的願望圖卡</p>
                  <p className="text-xs text-stone-400 mt-1">您可以切換上方領域分頁或調整篩選狀態</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 sm:p-5 bg-white border-t border-stone-200 flex items-center justify-end shrink-0">
            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              完成並返回護照
            </button>
          </div>
        </motion.div>

        {/* Custom Demonstration Video Configuration Modal */}
        {editingVideoCard && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0">
                    {editingVideoCard.icon}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                      設定自訂示範影片：【{editingVideoCard.category}】{editingVideoCard.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                        管理員授權編輯模式
                      </span>
                      <p className="text-xs text-stone-500">
                        核心動作目標：<span className="font-bold text-rose-600">【{editingVideoCard.actionVerb}】</span>{editingVideoCard.actionVerbFull}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playClickSound();
                    setEditingVideoCard(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="font-bold text-stone-800">
                      影片網址或本機路徑 (YouTube / MP4 / WebM / 專案檔案)：
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setTempVideoUrl(`/videos/${editingVideoCard.id}.mp4`);
                      }}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="點擊帶入此卡標準檔名"
                    >
                      <span>👉 帶入標準檔名:</span>
                      <code className="font-mono">/videos/{editingVideoCard.id}.mp4</code>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={tempVideoUrl}
                    onChange={(e) => setTempVideoUrl(e.target.value)}
                    placeholder={`例如：https://youtu.be/... 或 /videos/${editingVideoCard.id}.mp4`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-mono text-stone-800 bg-stone-50"
                  />
                </div>

                {/* Helpful Instruction Box */}
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2 text-stone-700">
                  <div className="flex items-center justify-between gap-1.5 font-bold text-amber-950 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>如何放置影片與對照？</span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      不必一次做齊 28 部！
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    <strong>提示：</strong>您只要替已經有錄製好的願望設定影片即可；其餘沒有放影片的卡片，系統會<strong>自動持續播放向量動作動畫</strong>，完全互不衝突！
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-[11px] text-stone-700 leading-relaxed pt-1 border-t border-amber-200/60">
                    <li>
                      <strong className="text-stone-900">方式一【最方便 YouTube 連結】</strong>：
                      把影片上傳至 YouTube（設為不公開亦可），直接貼上網址，免佔本機容量。
                    </li>
                    <li>
                      <strong className="text-stone-900">方式二【放在本專案資料夾】</strong>：
                      把 MP4 檔案放入專案的 <code className="bg-amber-100/90 text-amber-900 px-1 py-0.5 rounded font-mono">public/videos/</code> 資料夾，並將檔名命名為 <code className="bg-amber-100/90 text-amber-900 px-1 py-0.5 rounded font-mono">{editingVideoCard.id}.mp4</code> 即可！
                    </li>
                  </ul>

                  {/* 28-card filename lookup button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setShowVideoLookupTable(!showVideoLookupTable);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-950 text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        <span>📋 查看全部 28 張生活願望影片檔名對照總表</span>
                      </span>
                      <span className="text-stone-400 text-xs">
                        {showVideoLookupTable ? '▲ 收合清單' : '▼ 展開對照表'}
                      </span>
                    </button>

                    {showVideoLookupTable && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-amber-200 bg-white p-2 space-y-1 divide-y divide-stone-100">
                        {WISH_CARDS.map((wc, idx) => (
                          <div
                            key={wc.id}
                            className={`pt-1.5 pb-1 flex items-center justify-between gap-2 text-[11px] ${
                              wc.id === editingVideoCard.id ? 'bg-amber-50/90 font-bold px-1.5 rounded-lg' : ''
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-stone-400 font-mono w-5 text-right shrink-0">{idx + 1}.</span>
                              <span className="shrink-0">{wc.icon}</span>
                              <span className="px-1.5 py-0.2 bg-stone-100 text-stone-700 rounded text-[10px] shrink-0 font-bold">
                                {wc.category}
                              </span>
                              <span className="truncate text-stone-800 font-medium">
                                【{wc.actionVerb}】{wc.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <code className="text-[10px] font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-600">
                                {wc.id}.mp4
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  playClickSound();
                                  setTempVideoUrl(`/videos/${wc.id}.mp4`);
                                }}
                                className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold transition-colors cursor-pointer"
                                title="套用此檔名"
                              >
                                套用
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <button
                  onClick={() => {
                    playClickSound();
                    const next = { ...customVideos };
                    delete next[editingVideoCard.id];
                    setCustomVideos(next);
                    try {
                      localStorage.setItem('passport_wish_custom_videos', JSON.stringify(next));
                    } catch {}
                    setEditingVideoCard(null);
                  }}
                  className="px-3 py-2 text-xs font-bold text-stone-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  清除自訂（還原手繪動畫）
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playClickSound();
                      setEditingVideoCard(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      playSuccessSound();
                      if (tempVideoUrl.trim()) {
                        const next = { ...customVideos, [editingVideoCard.id]: tempVideoUrl.trim() };
                        setCustomVideos(next);
                        try {
                          localStorage.setItem('passport_wish_custom_videos', JSON.stringify(next));
                        } catch {}
                      } else {
                        const next = { ...customVideos };
                        delete next[editingVideoCard.id];
                        setCustomVideos(next);
                        try {
                          localStorage.setItem('passport_wish_custom_videos', JSON.stringify(next));
                        } catch {}
                      }
                      setEditingVideoCard(null);
                    }}
                    className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    儲存並套用影片
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* Admin Password Verification Modal */}
        {showAdminVerifyPrompt && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0 border border-amber-200">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 leading-snug">
                      管理員權限驗證
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      示範影片設定與路徑管理僅限最高管理員操作
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playClickSound();
                    setShowAdminVerifyPrompt(false);
                    setPendingCardForAdminAuth(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleVerifyAdminPassword} className="space-y-4">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-600 leading-relaxed">
                  為確保示範動作與臨床引導的正確性，<strong>願望示範影片設定與更換</strong>功能僅開放予最高管理員。
                  {pendingCardForAdminAuth && (
                    <div className="mt-2 pt-2 border-t border-stone-200 flex items-center gap-1.5 font-bold text-stone-800">
                      <span>欲編輯項目：</span>
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-[11px]">
                        {pendingCardForAdminAuth.category}
                      </span>
                      <span>{pendingCardForAdminAuth.title}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    請輸入最高管理員密碼：
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      if (adminVerifyError) setAdminVerifyError('');
                    }}
                    placeholder="請輸入最高管理員密碼"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-stone-900 bg-white"
                  />
                  {adminVerifyError && (
                    <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      {adminVerifyError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setShowAdminVerifyPrompt(false);
                      setPendingCardForAdminAuth(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>驗證並解鎖編輯</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
