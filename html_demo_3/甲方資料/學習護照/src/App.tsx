import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trophy, Music, Gamepad2, Smile, CheckCircle2, ChevronRight, Award, Copy, Check, PartyPopper, X, Medal, Calendar, Utensils, Shirt, Home, Navigation, BookOpen, Activity, Printer, Image as ImageIcon, Download, Upload, ChevronDown, Palette, Menu, Play, Volume2, VolumeX, Share2, Clock, Users, FileText, UserCheck, ShieldCheck, User, ArrowRightLeft, Lock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas-pro';
import { TASKS } from './data';
import { TrophyTier, Task, Category, Patient } from './types';
import { startBGM, stopBGM, playClickSound, toggleMute, setMasterVolume, suspendAllAudio, resumeAllAudio } from "./lib/audio";
import { TaskReportModal } from './components/TaskReportModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { WishlistModal } from './components/WishlistModal';
import { WishQuadrantModal } from './components/WishQuadrantModal';
import { subscribePatients, savePatientTasksToCloud } from './services/patientService';
import { UserRole, getStoredRole, clearStoredRole } from './services/authService';

const CATEGORIES: { id: Category; label: string; icon: string; char: string; color: string; activeBg: string; activeBorder: string; activeText: string; activeRing: string }[] = [
  { id: '食', label: '食：米其林大廚', icon: '🍳', char: '食', color: 'bg-[#d9532f]', activeBg: 'bg-[#fff5f2]', activeBorder: 'border-[#d9532f]', activeText: 'text-[#9c341b]', activeRing: 'ring-[#d9532f]/30' },
  { id: '衣', label: '衣：時尚伸展台', icon: '👕', char: '衣', color: 'bg-[#2b6cb0]', activeBg: 'bg-[#f0f7ff]', activeBorder: 'border-[#2b6cb0]', activeText: 'text-[#1a4971]', activeRing: 'ring-[#2b6cb0]/30' },
  { id: '住', label: '住：住宅改造王', icon: '🏡', char: '住', color: 'bg-[#d69e2e]', activeBg: 'bg-[#fffdf0]', activeBorder: 'border-[#d69e2e]', activeText: 'text-[#744210]', activeRing: 'ring-[#d69e2e]/30' },
  { id: '行', label: '行：拓荒者行動', icon: '🚶', char: '行', color: 'bg-[#2f855a]', activeBg: 'bg-[#f0fff4]', activeBorder: 'border-[#2f855a]', activeText: 'text-[#1c5236]', activeRing: 'ring-[#2f855a]/30' },
  { id: '育', label: '育：知性研究所', icon: '🧠', char: '育', color: 'bg-[#6b46c1]', activeBg: 'bg-[#faf5ff]', activeBorder: 'border-[#6b46c1]', activeText: 'text-[#44307d]', activeRing: 'ring-[#6b46c1]/30' },
  { id: '樂', label: '樂：開心農場', icon: '🌱', char: '樂', color: 'bg-[#b83280]', activeBg: 'bg-[#fff5f7]', activeBorder: 'border-[#b83280]', activeText: 'text-[#702452]', activeRing: 'ring-[#b83280]/30' },
  { id: '選修', label: '選修：學習徽章', icon: '🥇', char: '選', color: 'bg-[#4c51bf]', activeBg: 'bg-[#f0f3ff]', activeBorder: 'border-[#4c51bf]', activeText: 'text-[#2b2d71]', activeRing: 'ring-[#4c51bf]/30' },
  { id: '全部', label: '白金成就', icon: '👑', char: '全', color: 'bg-[#dd6b20]', activeBg: 'bg-[#fffaf0]', activeBorder: 'border-[#dd6b20]', activeText: 'text-[#7b3412]', activeRing: 'ring-[#dd6b20]/30' },
];

const BADGES = [
  { id: 'first_step', name: '初試啼聲', description: '完成第一項任務', condition: (completed: number, _counts: any) => completed > 0, icon: '🌟' },
  { id: 'rehab_star', name: '復健之星', description: '完成 10 項任務', condition: (completed: number, _counts: any) => completed >= 10, icon: '⭐' },
  { id: 'bronze_master', name: '銅盃大師', description: '收集全套銅盃(任一領域)', condition: (_completed: number, counts: any) => counts.bronze > 0 && counts.bronze === counts.bronzeTotal, icon: '🥉' },
  { id: 'silver_master', name: '銀盃達人', description: '收集全套銀盃(任一領域)', condition: (_completed: number, counts: any) => counts.silver > 0 && counts.silver === counts.silverTotal, icon: '🥈' },
  { id: 'gold_master', name: '金盃王者', description: '收集全套金盃(任一領域)', condition: (_completed: number, counts: any) => counts.gold > 0 && counts.gold === counts.goldTotal, icon: '🥇' },
  { id: 'grand_slam', name: '完美大滿貫', description: '完成所有 150 項任務', condition: (completed: number, counts: any) => completed === 150, icon: '🏆' },
];

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [taskPartners, setTaskPartners] = useState<Record<number, string[]>>({});
  const [taskCompletedAt, setTaskCompletedAt] = useState<Record<number, string>>({});
  const [activeTier, setActiveTier] = useState<TrophyTier>('bronze');
  const [copied, setCopied] = useState(false);
  const [showTrophyCabinet, setShowTrophyCabinet] = useState(false);
  const [trophyFilter, setTrophyFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [showStats, setShowStats] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [showCertificate, setShowCertificate] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [certificateTemplate, setCertificateTemplate] = useState<'classic' | 'elegant' | 'vibrant'>('classic');
  const [patientName, setPatientName] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('passport_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [userRole, setUserRole] = useState<UserRole>(() => getStoredRole() || 'admin');
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const isCloudSyncingRef = useRef(false);

  // Active patient object lookup
  const activePatient = useMemo(() => {
    if (activePatientId) {
      return patients.find(p => p.id === activePatientId) || null;
    }
    return null;
  }, [activePatientId, patients]);
  
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showWishQuadrantModal, setShowWishQuadrantModal] = useState(false);
  const [selectedWishCount, setSelectedWishCount] = useState(0);
  const [activeWishlistIds, setActiveWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const effName = patientName || activePatient?.name || '';
      const key = `passport_wishes_${effName ? effName.trim() : 'default'}`;
      const saved = localStorage.getItem(key);
      setSelectedWishCount(saved ? JSON.parse(saved).length : 0);
    } catch {
      setSelectedWishCount(0);
    }
  }, [patientName, activePatient, showWishlistModal]);
  
  const [showPrologue, setShowPrologue] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [milestoneStory, setMilestoneStory] = useState<33 | 66 | 100 | null>(null);
  const [seenMilestones, setSeenMilestones] = useState<Set<number>>(new Set());
  
  const [celebrateTier, setCelebrateTier] = useState<TrophyTier | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState<Record<string, string>>({});
  const [shareData, setShareData] = useState<{name: string, icon: string, date: string, desc: string} | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const prevCompletedRef = useRef({ bronze: false, silver: false, gold: false, platinum: false });
  const prevCategoryRef = useRef<Category>('食');
  const [cheatClicks, setCheatClicks] = useState(0);
  const cheatTimeoutRef = useRef<any>(null);

  const handleCheatClick = () => {
    setCheatClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        // Prevent rapid double triggering
        if ((window as any)._lastCheatTime && Date.now() - (window as any)._lastCheatTime < 2000) {
          return 0;
        }
        (window as any)._lastCheatTime = Date.now();

        // Trigger cheat
        setCompletedTasks(currentTasks => {
          const mainTasks = TASKS.filter(t => t.category !== '選修' && t.category !== '全部');
          const currentMainCount = Array.from(currentTasks).filter(id => {
            const t = TASKS.find(x => x.id === id);
            return t && t.category !== '選修' && t.category !== '全部';
          }).length;
          
          let targetCount = 0;
          if (currentMainCount < 50) {
            targetCount = 50;
          } else if (currentMainCount >= 50 && currentMainCount < 100) {
            targetCount = 100;
          } else if (currentMainCount >= 100 && currentMainCount < 150) {
            targetCount = 150;
          } else {
            targetCount = 0;
          }
          console.log("Cheat triggered! current:", currentMainCount, "target:", targetCount);
          

          if (targetCount === 0) {
            setSeenMilestones(new Set());
            localStorage.removeItem('passport_seen_milestones');
            return new Set(Array.from(currentTasks).filter(id => {
              const t = TASKS.find(x => x.id === id);
              return t && t.category === '選修';
            })); // Keep elective tasks only
          } else {
            const nextTasks = new Set(currentTasks);
            // clear main tasks
            for (const t of mainTasks) {
              nextTasks.delete(t.id);
            }
            // add up to targetCount
            for (let i = 0; i < targetCount; i++) {
              nextTasks.add(mainTasks[i].id);
            }
            return nextTasks;
          }
        });
        return 0;
      }
      return next;
    });

    if (cheatTimeoutRef.current) clearTimeout(cheatTimeoutRef.current);
    cheatTimeoutRef.current = setTimeout(() => {
      setCheatClicks(0);
    }, 1000);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        suspendAllAudio();
      } else {
        resumeAllAudio();
      }
    };
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Call suspendAllAudio on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      suspendAllAudio();
    };
  }, []);

  // Load unlocked badges
  useEffect(() => {
    const saved = localStorage.getItem('passport_unlocked_badges');
    if (saved) {
      try {
        setUnlockedBadges(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Update unlocked badges based on completedTasks
  useEffect(() => {
    if (!isLoaded) return;
    setUnlockedBadges(prev => {
      let changed = false;
      const next = { ...prev };
      
      BADGES.forEach(badge => {
        if (!next[badge.id]) {
          let isUnlocked = false;
          if (badge.id === 'first_step') {
            isUnlocked = completedTasks.size > 0;
          } else if (badge.id === 'rehab_star') {
            isUnlocked = completedTasks.size >= 10;
          } else if (badge.id === 'grand_slam') {
            isUnlocked = completedTasks.size === 150;
          } else {
            const categories: Category[] = ['食', '衣', '住', '行', '育', '樂'];
            isUnlocked = categories.some(cat => {
              const catTasks = TASKS.filter(t => t.category === cat);
              if (badge.id === 'bronze_master') {
                const tierTasks = catTasks.filter(t => t.tier === 'bronze');
                return tierTasks.length > 0 && tierTasks.every(t => completedTasks.has(t.id));
              }
              if (badge.id === 'silver_master') {
                const tierTasks = catTasks.filter(t => t.tier === 'silver');
                return tierTasks.length > 0 && tierTasks.every(t => completedTasks.has(t.id));
              }
              if (badge.id === 'gold_master') {
                const tierTasks = catTasks.filter(t => t.tier === 'gold');
                return tierTasks.length > 0 && tierTasks.every(t => completedTasks.has(t.id));
              }
              return false;
            });
          }
          
          if (isUnlocked) {
            next[badge.id] = new Date().toISOString();
            changed = true;
          }
        }
      });
      
      if (changed) {
        localStorage.setItem('passport_unlocked_badges', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, [completedTasks, isLoaded]);

  const handleShareBadge = async (badge: typeof BADGES[0], dateStr: string) => {
    setShareData({
      name: badge.name,
      icon: badge.icon,
      date: dateStr,
      desc: badge.description
    });
    
    // Wait for React to render the hidden card
    setTimeout(async () => {
      if (shareCardRef.current) {
        try {
          const canvas = await html2canvas(shareCardRef.current, { backgroundColor: null, scale: 2 });
          const dataUrl = canvas.toDataURL('image/png');
          
          if (navigator.share) {
             try {
                // Convert base64 to blob
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], `成就達成_${badge.name}.png`, { type: 'image/png' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  await navigator.share({
                    title: '生活大師解鎖成就！',
                    text: `我在「生活功能解鎖護照」獲得了「${badge.name}」成就！`,
                    files: [file]
                  });
                } else {
                  // Fallback to download if cannot share file
                  const a = document.createElement('a');
                  a.href = dataUrl;
                  a.download = `成就達成_${badge.name}.png`;
                  a.click();
                }
             } catch (err) {
                console.error("Share failed", err);
                // Fallback to download
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `成就達成_${badge.name}.png`;
                a.click();
             }
          } else {
             const a = document.createElement('a');
             a.href = dataUrl;
             a.download = `成就達成_${badge.name}.png`;
             a.click();
          }
          setShareData(null);
        } catch (e) {
          console.error("Generate image failed", e);
          setShareData(null);
        }
      }
    }, 100);
  };

  useEffect(() => {
    if (!isBookOpen) {
      startBGM('cover');
    } else if (showPrologue) {
      startBGM('prologue');
    } else if (milestoneStory) {
      startBGM('milestone');
    } else {
      startBGM('main');
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      stopBGM(true);
    };
  }, [showPrologue, milestoneStory, isBookOpen]);

  // 首次互動觸發封面音樂，確保行動裝置與平板能夠順利播放
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!isBookOpen) {
         startBGM('cover');
      }
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    window.addEventListener('click', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
    };
  }, [isBookOpen]);

  useEffect(() => {
    if (showPrologue || milestoneStory) {
      let text = '';
      if (showPrologue) {
        text = `歡迎來到「靈魂之心」。

這裡曾經是充滿歡笑的地方，但一場名為「失能」的風暴席捲了這裡。

在神秘光芒的引領下，來到了「YK未來室」，專為勇者們重建力量的庇護所。

堅韌的勇者【${patientName || '冒險者'}】啊，
導師將這本《生活功能解鎖護照》交給了你。

唯有通過「食、衣、住、行、育、樂」六大試煉，
才能點亮被封印的技能樹，找回曾經的自由與榮耀。

準備好迎接挑戰了嗎？`;
      } else if (milestoneStory === 33) {
        text = `【第一樂章：破曉的曙光】

親愛的勇者【${patientName || '冒險者'}】：

你已經完成了超過三分之一的挑戰！

一開始或許有些艱難，但你的每一次努力，都在為自己點亮新的可能。
「員郭村」的風貌正因為你的堅持而逐漸改變。

繼續保持這份勇氣，未來的風景將更加耀眼！`;
      } else if (milestoneStory === 66) {
        text = `【第二樂章：堅定的步伐】

親愛的勇者【${patientName || '冒險者'}】：

太棒了！你已經走過了超過三分之二的旅程。

那些曾經看似遙不可及的目標，如今都已成為你身後的足跡。
你已經具備了強大的力量與自信，距離完全解鎖技能樹只剩最後的衝刺。

帶上這份榮耀，繼續前進吧！`;
      } else if (milestoneStory === 100) {
        text = `【最終章：重獲自由的新生】

親愛的勇者【${patientName || '冒險者'}】：

恭喜你！完成了所有的試煉，成功解鎖了生活功能護照的最高成就。

回首來時路，每一步都充滿了汗水與毅力。
現在的你，已經找回了曾經的自由與榮耀，準備好展翅高飛了。

「員郭村」以你為榮，去迎接屬於你的嶄新人生吧！`;
      }
      
      let i = 0;
      setDisplayedText('');
      setIsTypingComplete(false);
      
      const timer = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(timer);
          setIsTypingComplete(true);
        }
      }, 50);
      
      return () => clearInterval(timer);
    }
  }, [showPrologue, milestoneStory, patientName]);

  // Load from local storage on mount
  useEffect(() => {
    const savedMilestones = localStorage.getItem('passport_seen_milestones');
    if (savedMilestones) {
      try {
        setSeenMilestones(new Set(JSON.parse(savedMilestones)));
      } catch (e) {
      }
    }
    const savedPartners = localStorage.getItem('passport_task_partners');
    if (savedPartners) {
      try {
        const parsed = JSON.parse(savedPartners);
        let migrated: Record<number, string[]> = {};
        for (const key in parsed) {
          if (Array.isArray(parsed[key])) {
            migrated[key] = parsed[key].map((p: string) => p === '家屬陪伴' ? '家屬夥伴' : p);
          } else if (typeof parsed[key] === 'string') {
            migrated[key] = [parsed[key] === '家屬陪伴' ? '家屬夥伴' : parsed[key]];
          }
        }
        const isPartnersMigrated = localStorage.getItem('passport_v2_partners_migrated');
        if (!isPartnersMigrated) {
          const nextPartners: Record<number, string[]> = {};
          for (const key of Object.keys(migrated)) {
            const numKey = Number(key);
            let targetKey = numKey;
            if (numKey === 150) targetKey = 200;
            else if (numKey >= 134 && numKey <= 149) targetKey = numKey + 1;
            nextPartners[targetKey] = migrated[numKey];
          }
          migrated = nextPartners;
          localStorage.setItem('passport_task_partners', JSON.stringify(migrated));
          localStorage.setItem('passport_v2_partners_migrated', 'true');
        }
        setTaskPartners(migrated);
      } catch (e) {
      }
    }
    const savedCompletedAt = localStorage.getItem('passport_task_completed_at');
    if (savedCompletedAt) {
      try {
        const parsed = JSON.parse(savedCompletedAt);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setTaskCompletedAt(parsed);
        }
      } catch (e) {}
    }
    const saved = localStorage.getItem('passport_completed_tasks');
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const isMigrated = localStorage.getItem('passport_v2_tasks_migrated');
          if (!isMigrated) {
            parsed = parsed.map((id: number) => {
              if (id === 150) return 200;
              if (id >= 134 && id <= 149) return id + 1;
              return id;
            });
            localStorage.setItem('passport_completed_tasks', JSON.stringify(parsed));
            localStorage.setItem('passport_v2_tasks_migrated', 'true');
          }
          setCompletedTasks(new Set(parsed));
        }
      } catch (e) {
        console.error('Failed to parse saved tasks', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Subscribe to Firebase Cloud Patients
  useEffect(() => {
    const unsubscribe = subscribePatients((cloudPatients) => {
      setPatients(cloudPatients);

      // If active patient exists, sync updates
      if (activePatientId) {
        const found = cloudPatients.find(p => p.id === activePatientId);
        if (found) {
          setPatientName(found.name);
          // If tasks differ and not actively syncing from local, update
          if (!isCloudSyncingRef.current) {
            setCompletedTasks(new Set(found.completedTasks || []));
            if (found.taskPartners) {
              setTaskPartners(found.taskPartners);
            }
            if (found.taskCompletedAt) {
              setTaskCompletedAt(found.taskCompletedAt);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [activePatientId]);

  // Handle switching to a specific patient
  const handleSelectPatient = (patient: Patient) => {
    setIsAdminAuthenticated(true);
    try {
      sessionStorage.setItem('passport_admin_auth', 'true');
    } catch {}
    setActivePatientId(patient.id);
    setPatientName(patient.name);
    setCompletedTasks(new Set(patient.completedTasks || []));
    setTaskPartners(patient.taskPartners || {});
    setTaskCompletedAt(patient.taskCompletedAt || {});
    setIsBookOpen(true);
  };

  // Save to local storage and sync with active Cloud patient when completedTasks, taskPartners or taskCompletedAt change
  useEffect(() => {
    localStorage.setItem('passport_completed_tasks', JSON.stringify(Array.from(completedTasks)));
    localStorage.setItem('passport_task_partners', JSON.stringify(taskPartners));
    localStorage.setItem('passport_task_completed_at', JSON.stringify(taskCompletedAt));

    // If an active cloud patient is selected, auto-sync to cloud only when authenticated as admin
    if (activePatientId && isLoaded && isAdminAuthenticated) {
      isCloudSyncingRef.current = true;
      setIsSavingToCloud(true);
      const taskArray = Array.from(completedTasks) as number[];
      savePatientTasksToCloud(activePatientId, taskArray, undefined, taskPartners, taskCompletedAt)
        .catch(err => console.error('雲端同步失敗:', err))
        .finally(() => {
          setTimeout(() => {
            isCloudSyncingRef.current = false;
            setIsSavingToCloud(false);
          }, 450);
        });
    }
  }, [completedTasks, taskPartners, taskCompletedAt, activePatientId, isLoaded, isAdminAuthenticated]);

  const togglePartner = (taskId: number, partner: string) => {
    setTaskPartners(prev => {
      const currentPartners = prev[taskId] || [];
      const isFamilyPartner = partner === '家屬夥伴' || partner === '家屬陪伴';
      const isSelected = isFamilyPartner 
        ? currentPartners.some(p => p === '家屬夥伴' || p === '家屬陪伴')
        : currentPartners.includes(partner);

      let newPartners: string[];
      if (isSelected) {
        newPartners = isFamilyPartner
          ? currentPartners.filter(p => p !== '家屬夥伴' && p !== '家屬陪伴')
          : currentPartners.filter(p => p !== partner);
      } else {
        const canonicalPartner = isFamilyPartner ? '家屬夥伴' : partner;
        newPartners = [...currentPartners.filter(p => p !== '家屬陪伴'), canonicalPartner];
      }
      
      if (newPartners.length === 0) {
        const next = { ...prev };
        delete next[taskId];
        return next;
      }
      
      return {
        ...prev,
        [taskId]: newPartners
      };
    });
  };

  const toggleTask = (taskId: number) => {
    const isNowCompleted = !completedTasks.has(taskId);
    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });

    setTaskCompletedAt((prev) => {
      if (isNowCompleted) {
        return {
          ...prev,
          [taskId]: new Date().toISOString()
        };
      } else {
        const next = { ...prev };
        delete next[taskId];
        return next;
      }
    });

    if (isNowCompleted) {
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
          osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // A6
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch (e) {
        console.error('Audio playback failed', e);
      }

      const task = TASKS.find(t => t.id === taskId);
      const isHighTier = task?.tier === 'gold' || task?.tier === 'platinum';

      if (isHighTier) {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FF8C00', '#ffffff'],
          shapes: ['star', 'circle'],
          ticks: 300,
          gravity: 0.7,
          scalar: 1.2
        });
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.7 },
            colors: ['#FFD700', '#FFA500', '#ffffff'],
            ticks: 250
          });
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.7 },
            colors: ['#FFD700', '#FFA500', '#ffffff'],
            ticks: 250
          });
        }, 150);
      } else {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#34d399', '#f59e0b', '#ec4899', '#3b82f6', '#f43f5e']
        });
      }
    }
  };

  const [activeCategory, setActiveCategory] = useState<Category>('食');

  const categoryTasks = TASKS.filter(t => activeCategory === '全部' ? (t.id === 200 || t.category === '全部') : t.category === activeCategory);
  
  // Reset to bronze when switching categories
  useEffect(() => {
    if (activeCategory === '全部') {
      setActiveTier('platinum');
    } else {
      setActiveTier('bronze');
    }
  }, [activeCategory]);

  const filteredTasks = categoryTasks.filter((t) => t.tier === activeTier);
  
  const bronzeCount = categoryTasks.filter(t => t.tier === 'bronze').length;
  const silverCount = categoryTasks.filter(t => t.tier === 'silver').length;
  const goldCount = categoryTasks.filter(t => t.tier === 'gold').length;
  const platinumCount = TASKS.filter(t => t.tier === 'platinum').length;

  const bronzeCompleted = categoryTasks.filter(t => t.tier === 'bronze' && completedTasks.has(t.id)).length;
  const silverCompleted = categoryTasks.filter(t => t.tier === 'silver' && completedTasks.has(t.id)).length;
  const goldCompleted = categoryTasks.filter(t => t.tier === 'gold' && completedTasks.has(t.id)).length;
  const platinumCompleted = TASKS.filter(t => t.tier === 'platinum' && completedTasks.has(t.id)).length;

  const mainTasks = TASKS.filter(t => t.category !== '選修' && t.category !== '全部');
  const mainCompleted = Array.from(completedTasks).filter(id => {
    const task = TASKS.find(t => t.id === id);
    return task && task.category !== '選修' && task.category !== '全部';
  });
  const electiveCompleted = Array.from(completedTasks).filter(id => {
    const task = TASKS.find(t => t.id === id);
    return task && task.category === '選修';
  }).length;

  const totalProgress = Math.round((mainCompleted.length / mainTasks.length) * 100);

  useEffect(() => {
    const isBronzeComplete = bronzeCount > 0 && bronzeCompleted === bronzeCount;
    const isSilverComplete = silverCount > 0 && silverCompleted === silverCount;
    const isGoldComplete = goldCount > 0 && goldCompleted === goldCount;
    const isPlatinumComplete = platinumCount > 0 && platinumCompleted === platinumCount;

    // Do not show celebration if it's not loaded, or if the category just changed
    const categoryChanged = prevCategoryRef.current !== activeCategory;
    
    if (!isLoaded || categoryChanged) {
      prevCompletedRef.current = {
        bronze: isBronzeComplete,
        silver: isSilverComplete,
        gold: isGoldComplete,
        platinum: isPlatinumComplete
      };
      prevCategoryRef.current = activeCategory;
      return;
    }

    const prev = prevCompletedRef.current;

    if (activeCategory === '全部') {
      if (isPlatinumComplete && !prev.platinum) {
        setCelebrateTier('platinum');
      }
    } else if (activeCategory !== '選修') {
      if (isBronzeComplete && !prev.bronze) {
        setCelebrateTier('bronze');
      } else if (isSilverComplete && !prev.silver) {
        setCelebrateTier('silver');
      } else if (isGoldComplete && !prev.gold) {
        setCelebrateTier('gold');
      }
    }

    prevCompletedRef.current = {
      bronze: isBronzeComplete,
      silver: isSilverComplete,
      gold: isGoldComplete,
      platinum: isPlatinumComplete
    };
    prevCategoryRef.current = activeCategory;
  }, [bronzeCompleted, bronzeCount, silverCompleted, silverCount, goldCompleted, goldCount, platinumCompleted, platinumCount, isLoaded, activeCategory]);

  const overallCompleted = mainCompleted.length;
  const overallRemaining = mainTasks.length - overallCompleted;
  const totalProgressPercentage = Math.round((overallCompleted / mainTasks.length) * 100);

  useEffect(() => {
    if (!isLoaded || !isBookOpen || showPrologue) return;
    
    let newMilestone: 33 | 66 | 100 | null = null;
    
    if (totalProgressPercentage >= 100 && !seenMilestones.has(100)) {
      newMilestone = 100;
    } else if (totalProgressPercentage >= 66 && totalProgressPercentage < 100 && !seenMilestones.has(66)) {
      newMilestone = 66;
    } else if (totalProgressPercentage >= 33 && totalProgressPercentage < 66 && !seenMilestones.has(33)) {
      newMilestone = 33;
    }

    if (newMilestone) {
      setMilestoneStory(newMilestone);
      setSeenMilestones(prev => {
        const next = new Set(prev);
        next.add(newMilestone!);
        localStorage.setItem('passport_seen_milestones', JSON.stringify(Array.from(next)));
        return next;
      });
    }
  }, [totalProgressPercentage, isLoaded, isBookOpen, showPrologue, seenMilestones]);

  const chartData = activeCategory === '全部' ? [
    {
      name: '總任務進度 (白金需 120 項)',
      completed: overallCompleted,
      remaining: Math.max(0, 120 - overallCompleted),
    }
  ] : [
    {
      name: '銅盃 (微小幸福)',
      completed: bronzeCompleted,
      remaining: bronzeCount - bronzeCompleted,
    },
    {
      name: '銀盃 (真實探索)',
      completed: silverCompleted,
      remaining: silverCount - silverCompleted,
    },
    {
      name: '金盃 (自我實現)',
      completed: goldCompleted,
      remaining: goldCount - goldCompleted,
    },
  ];

  const radarData = useMemo(() => {
    return ['食', '衣', '住', '行', '育', '樂'].map(cat => {
      const catTasks = TASKS.filter(t => t.category === cat);
      const total = catTasks.length;
      const completed = catTasks.filter(t => completedTasks.has(t.id)).length;
      const score = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        subject: cat,
        score,
        completed,
        total,
        fullMark: 100
      };
    });
  }, [completedTasks]);

  // 共學夥伴參與分佈與自立賦能統計
  const partnerStats = useMemo(() => {
    let selfCount = 0; // 自己完成
    let familyCount = 0; // 家屬夥伴 (含相容家屬陪伴)
    let attendantCount = 0; // 多功能型照顧服務員
    let medicalCount = 0; // 醫療團隊
    let taggedTasksCount = 0;

    completedTasks.forEach(taskId => {
      const partners = taskPartners[taskId];
      if (partners && partners.length > 0) {
        taggedTasksCount += 1;
        if (partners.includes('自己完成')) selfCount += 1;
        if (partners.includes('家屬夥伴') || partners.includes('家屬陪伴')) familyCount += 1;
        if (partners.includes('多功能型照顧服務員')) attendantCount += 1;
        if (partners.includes('醫療團隊')) medicalCount += 1;
      }
    });

    const totalSelections = selfCount + familyCount + attendantCount + medicalCount;
    const selfRate = totalSelections > 0 ? Math.round((selfCount / totalSelections) * 100) : 0;
    const familyRate = totalSelections > 0 ? Math.round((familyCount / totalSelections) * 100) : 0;
    const attendantRate = totalSelections > 0 ? Math.round((attendantCount / totalSelections) * 100) : 0;
    const medicalRate = totalSelections > 0 ? Math.round((medicalCount / totalSelections) * 100) : 0;

    return {
      selfCount,
      familyCount,
      attendantCount,
      medicalCount,
      taggedTasksCount,
      totalSelections,
      selfRate,
      familyRate,
      attendantRate,
      medicalRate,
    };
  }, [completedTasks, taskPartners]);

  const handleExport = () => {
    const completedList = TASKS.filter(t => completedTasks.has(t.id));
    
    let statsText = '';
    if (activeCategory === '全部') {
      const overallBronze = TASKS.filter(t => t.tier === 'bronze' && t.category !== '選修' && t.category !== '全部');
      const overallSilver = TASKS.filter(t => t.tier === 'silver' && t.category !== '選修' && t.category !== '全部');
      const overallGold = TASKS.filter(t => t.tier === 'gold' && t.category !== '選修' && t.category !== '全部');
      
      statsText = `[整體進度摘要]
🏆 銅盃總計：${overallBronze.filter(t => completedTasks.has(t.id)).length}/${overallBronze.length}
🏆 銀盃總計：${overallSilver.filter(t => completedTasks.has(t.id)).length}/${overallSilver.length}
🏆 金盃總計：${overallGold.filter(t => completedTasks.has(t.id)).length}/${overallGold.length}
👑 白金任務：${(completedTasks.has(200) || completedTasks.has(150)) ? '1/1 (已達成)' : '0/1 (未達成)'}`;
    } else if (activeCategory === '選修') {
      statsText = `[進度摘要 (目前領域: ${activeCategory})]
🥇 健康學習徽章：${electiveCompleted} 枚`;
    } else {
      statsText = `[進度摘要 (目前領域: ${activeCategory})]
🏆 銅盃：${bronzeCompleted}/${bronzeCount}
🏆 銀盃：${silverCompleted}/${silverCount}
🏆 金盃：${goldCompleted}/${goldCount}`;
    }

    const text = `【生活功能解鎖護照】進度回報
總達成率：${totalProgressPercentage}% (${overallCompleted}/${mainTasks.length})
🥇 健康學習徽章：${electiveCompleted} 枚

${statsText}

[已完成所有任務]
${completedList.length > 0 ? completedList.map(t => `- [${t.category}] ${String(t.id).padStart(3, '0')} ${t.title} (${
      t.tier === 'bronze' ? '銅盃' : t.tier === 'silver' ? '銀盃' : t.tier === 'gold' ? '金盃' : '白金'
    })`).join('\n') : '尚未完成任何任務'}
`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setShowExportMenu(false);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportJSON = () => {
    const data = {
      completedTasks: Array.from(completedTasks),
      taskPartners: taskPartners,
      taskCompletedAt: taskCompletedAt,
      exportDate: new Date().toISOString(),
      patientName: patientName
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `復健進度_${patientName || '個案'}_${dateStr}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error('無效的檔案格式');
        }

        // Support array directly or object with completedTasks
        let tasks: number[] = [];
        if (Array.isArray(parsed)) {
          tasks = parsed;
        } else if (Array.isArray(parsed.completedTasks)) {
          tasks = parsed.completedTasks;
        } else {
          throw new Error('未找到完成任務清單');
        }

        // Validate task IDs as numbers
        const validTaskIds = tasks.filter((id): id is number => typeof id === 'number' && !isNaN(id));
        setCompletedTasks(new Set(validTaskIds));

        // Restore taskPartners if available
        if (parsed.taskPartners && typeof parsed.taskPartners === 'object' && !Array.isArray(parsed.taskPartners)) {
          setTaskPartners(parsed.taskPartners);
        }

        // Restore taskCompletedAt if available
        if (parsed.taskCompletedAt && typeof parsed.taskCompletedAt === 'object' && !Array.isArray(parsed.taskCompletedAt)) {
          setTaskCompletedAt(parsed.taskCompletedAt);
        }

        // Restore patientName if provided
        if (typeof parsed.patientName === 'string' && parsed.patientName.trim()) {
          setPatientName(parsed.patientName.trim());
        }

        playClickSound();
        alert(`成功匯入 ${validTaskIds.length} 項進度！`);
      } catch (err: any) {
        console.error('Import failed', err);
        alert('匯入失敗：請確認選取的是正確的 JSON 存檔檔案。');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <button
        onClick={() => {
          const newMute = !isMuted;
          setIsMuted(newMute);
          toggleMute(newMute);
        }}
        className={`absolute top-4 right-4 z-50 p-3 rounded-full transition-all active:scale-95 print:hidden ${
          (showPrologue || milestoneStory) 
            ? "text-stone-500 hover:text-stone-300 hover:bg-white/10" 
            : "text-stone-400 hover:text-emerald-600 hover:bg-black/5"
        }`}
        title={isMuted ? "開啟音效" : "靜音"}
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>
    <AnimatePresence mode="wait">
      {!isBookOpen ? (
        <motion.div 
          key="cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeIn" }}
          className="min-h-screen bg-[#F4F0E6] flex items-center justify-center p-4 md:p-8 perspective-[1500px]"
          onClick={() => startBGM('cover')}
          onTouchStart={() => startBGM('cover')}
        >
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            exit={{ 
              rotateY: -140, 
              rotateZ: -5,
              skewY: 15,
              x: "-40%", 
              scale: 1.1, 
              opacity: 0,
              filter: "blur(4px)"
            }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "left center" }}
            className="max-w-md w-full bg-emerald-900 rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-950 relative"
          >
            {/* Book Spine Simulation */}
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-emerald-950/40 border-r border-emerald-950/60 shadow-inner z-10" />
            <div className="absolute left-8 top-0 bottom-0 w-px bg-white/10 z-10" />
            <div className="absolute left-9 top-0 bottom-0 w-px bg-white/10 z-10" />

            <div className="p-8 md:p-12 pl-14 md:pl-16 flex flex-col items-center text-center relative z-20">
              <div className="w-40 h-40 md:w-56 md:h-56 mb-6 flex items-center justify-center drop-shadow-xl hover:scale-105 transition-transform duration-500">
                <img 
                  src="/logo.png" 
                  alt="員郭醫院 Logo" 
                  className="w-full h-full object-contain"
                  style={{ mixBlendMode: 'multiply', filter: 'brightness(1.1)' }}
                />
              </div>
              
              <h2 className="text-sm font-bold tracking-[0.2em] text-emerald-200/80 uppercase mb-4">
                Yuan Kuo Hospital
              </h2>
              
              <h1 className="text-4xl md:text-5xl font-black text-[#F4F0E6] mb-8 tracking-wider">
                生活功能<br/><span className="text-yellow-500">解鎖護照</span>
              </h1>
              
              <div className="w-16 h-1 bg-yellow-500/80 rounded-full mb-10" />

              <div className="w-full mb-10 text-left relative z-20">
                <label className="block text-sm font-bold text-emerald-200/80 mb-2 tracking-widest text-center">護照持有人</label>
                <input 
                  type="text" 
                  value={patientName} 
                  onChange={e => setPatientName(e.target.value)} 
                  className="w-full text-center px-4 py-3 bg-emerald-800/50 border border-emerald-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg font-bold text-white placeholder:text-emerald-300/50 transition-all shadow-inner" 
                  placeholder="請輸入姓名" 
                />
              </div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-full"
              >
                <button
                  onClick={() => { playClickSound(); setIsBookOpen(true); setShowPrologue(true); startBGM('prologue'); }}
                  className="w-full group bg-yellow-600 hover:bg-yellow-500 text-yellow-950 font-bold py-4 px-8 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 relative z-20"
                >
                  <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>開啟護照</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      ) : showPrologue || milestoneStory ? (
        <motion.div
          key={showPrologue ? "prologue" : `milestone-${milestoneStory}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 relative overflow-hidden"
        >
          {/* RPG Vibe Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-800 via-stone-950 to-black opacity-80"></div>
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
          
          <div className="max-w-3xl w-full relative z-10 flex flex-col items-center">
            {/* Typing text container */}
            <div className="bg-stone-900/80 backdrop-blur-md border-2 border-stone-700/50 rounded-lg p-8 md:p-12 w-full min-h-[300px] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <p className="text-xl md:text-2xl text-stone-200 leading-loose font-serif whitespace-pre-wrap">
                {displayedText}
                <span className="inline-block w-3 h-6 bg-stone-400 ml-1 animate-pulse align-middle"></span>
              </p>
            </div>
            
            {/* Action Button */}
            <AnimatePresence>
              {isTypingComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="mt-12"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <button
                      onClick={() => {
                        stopBGM(true);
                        if (showPrologue) setShowPrologue(false);
                        else setMilestoneStory(null);
                        startBGM('main');
                      }}
                      className="group bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-yellow-50 font-bold py-4 px-12 rounded-full shadow-[0_0_20px_rgba(202,138,4,0.4)] hover:shadow-[0_0_30px_rgba(202,138,4,0.6)] border border-yellow-500/50 transition-all active:scale-95 flex items-center gap-3 text-lg tracking-widest"
                    >
                      <Gamepad2 className="w-6 h-6" />
                      <span>{showPrologue ? '接受挑戰' : '繼續前進'}</span>
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Skip button if typing is not complete */}
            {!isTypingComplete && (
              <button 
                onClick={() => {
                  let text = '';
                  if (showPrologue) {
                    text = `歡迎來到「靈魂之心」。

這裡曾經是充滿歡笑的地方，但一場名為「失能」的風暴席捲了這裡。

在神秘光芒的引領下，來到了「YK未來室」，專為勇者們重建力量的庇護所。

堅韌的勇者【${patientName || '冒險者'}】啊，
導師將這本《生活功能解鎖護照》交給了你。

唯有通過「食、衣、住、行、育、樂」六大試煉，
才能點亮被封印的技能樹，找回曾經的自由與榮耀。

準備好迎接挑戰了嗎？`;
                  } else if (milestoneStory === 33) {
                    text = `【第一樂章：破曉的曙光】

親愛的勇者【${patientName || '冒險者'}】：

你已經完成了超過三分之一的挑戰！

一開始或許有些艱難，但你的每一次努力，都在為自己點亮新的可能。
「員郭村」的風貌正因為你的堅持而逐漸改變。

繼續保持這份勇氣，未來的風景將更加耀眼！`;
                  } else if (milestoneStory === 66) {
                    text = `【第二樂章：堅定的步伐】

親愛的勇者【${patientName || '冒險者'}】：

太棒了！你已經走過了超過三分之二的旅程。

那些曾經看似遙不可及的目標，如今都已成為你身後的足跡。
你已經具備了強大的力量與自信，距離完全解鎖技能樹只剩最後的衝刺。

帶上這份榮耀，繼續前進吧！`;
                  } else if (milestoneStory === 100) {
                    text = `【最終章：重獲自由的新生】

親愛的勇者【${patientName || '冒險者'}】：

恭喜你！完成了所有的試煉，成功解鎖了生活功能護照的最高成就。

回首來時路，每一步都充滿了汗水與毅力。
現在的你，已經找回了曾經的自由與榮耀，準備好展翅高飛了。

「員郭村」以你為榮，去迎接屬於你的嶄新人生吧！`;
                  }
                  setDisplayedText(text);
                  setIsTypingComplete(true);
                }}
                className="absolute -bottom-16 text-stone-500 hover:text-stone-300 text-sm tracking-widest transition-colors"
              >
                [ SKIP ]
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, rotateY: 20, scale: 0.95 }}
          animate={{ opacity: 1, rotateY: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`min-h-screen bg-[#F4F0E6] text-stone-800 font-sans selection:bg-orange-200 ${(showCertificate || showReportModal) ? 'print:hidden' : ''}`}
        >
          {/* Sticky Active Patient Status Bar (Only visible when logged in as Admin/Therapist) */}
          {isAdminAuthenticated && (
            <div className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md text-stone-100 border-b border-stone-800 shadow-md py-2.5 px-4 transition-all print:hidden">
              <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs border border-indigo-400/30">
                    {patientName ? patientName.trim().charAt(0) : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      {userRole === 'admin' ? (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-300 font-bold text-[10px] border border-indigo-700/50 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-indigo-400" />
                          <span>最高管理員</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-bold text-[10px] border border-emerald-700/50 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>臨床編輯人員</span>
                        </span>
                      )}
                      <span className="text-stone-400 text-[11px] font-normal">正在編輯：</span>
                      <span className="text-emerald-300 text-sm tracking-wide font-black bg-emerald-950/90 px-2.5 py-0.5 rounded-lg border border-emerald-700/60 shadow-2xs">
                        {patientName || (activePatient?.name) || '未指定個案'}
                      </span>
                    </div>
                    {activePatient?.caseNumber && (
                      <span className="text-stone-300 bg-stone-800/90 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-stone-700">
                        病歷號: {activePatient.caseNumber}
                      </span>
                    )}
                    {activePatient?.therapist && (
                      <span className="text-stone-400 hidden sm:inline text-[11px]">
                        • 主責: {activePatient.therapist}
                      </span>
                    )}
                    <span className="text-emerald-400 text-[11px] font-semibold hidden md:inline-flex items-center gap-1.5 bg-stone-800/80 px-2 py-0.5 rounded-md border border-stone-700">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSavingToCloud ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
                      {isSavingToCloud ? '雲端同步中...' : `完成 ${overallCompleted}/${mainTasks.length} 項 (${totalProgress}%)`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {activePatient && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setShowReportModal(true);
                      }}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 hover:text-white rounded-xl text-xs font-bold transition border border-stone-700 shadow-xs cursor-pointer"
                      title="檢視目前個案的生活功能評鑑報表"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>個案報表</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setShowAdminModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow cursor-pointer"
                    title="開啟個案管理系統名冊，切換其他個案"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">切換個案 / 名冊</span>
                    <span className="xs:hidden">切換</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsAdminAuthenticated(false);
                      clearStoredRole();
                      try {
                        sessionStorage.removeItem('passport_admin_auth');
                      } catch {}
                      setActivePatientId(null);
                    }}
                    className="flex items-center gap-1 px-2 py-1.5 bg-stone-800 hover:bg-red-950/70 hover:text-red-300 active:scale-95 text-stone-400 rounded-xl text-xs font-medium transition border border-stone-700 shadow-xs cursor-pointer"
                    title="退出管理員模式並鎖定"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">登出</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header Section */}
          <header 
          className="bg-[#FCFAF5] shadow-sm border-b border-stone-200 transition-colors"
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName !== 'BUTTON') {
              handleCheatClick();
            }
          }}
          style={{ backgroundColor: cheatClicks > 0 ? `rgba(252, 250, 245, ${1 - cheatClicks * 0.15})` : undefined }}
        >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
            <div className="pt-2 md:pt-4 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-stone-900">
                  {CATEGORIES.find(c => c.id === activeCategory)?.label || '學習護照'}
                </h1>
                {isAdminAuthenticated && (patientName || activePatient) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300/90 rounded-full text-xs font-bold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>個案：<strong className="text-emerald-950 font-black">{patientName || activePatient?.name}</strong></span>
                    {activePatient?.caseNumber && (
                      <span className="text-emerald-700 font-normal">({activePatient.caseNumber})</span>
                    )}
                  </span>
                ) : patientName ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-700 border border-stone-300/80 rounded-full text-xs font-semibold shadow-2xs">
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    <span>護照學員：<strong className="text-stone-900 font-bold">{patientName}</strong></span>
                  </span>
                ) : null}
              </div>
              <p className="text-stone-500 text-sm md:text-base leading-relaxed max-w-xl">
                {activeCategory === '食' ? '從「床上/坐姿」到「站姿」，從「被動進食」到「主動備餐」，找回大飽口福的尊嚴。' :
                 activeCategory === '衣' ? '穿脫衣物的空間認知與軀幹平衡，人要衣裝的自信重建。' :
                 activeCategory === '住' ? '從床邊自理到客廳浴室的高風險環境轉位，打造安全的居家堡壘。' :
                 activeCategory === '行' ? '從室內平地走到真實馬路，克服各種環境地形，重獲自由的雙腳。' :
                 activeCategory === '育' ? '大腦認知功能、注意力與應變能力，科技融入生活的知性研究所。' :
                 activeCategory === '樂' ? '休閒職能的重建。最重要的不是永無止境的運動，而是「找回快樂的能力」。' :
                 '累積完成 120 項以上任務，解鎖最終白金成就，光榮退役！'}
              </p>

            </div>
            
            <div className="flex items-stretch gap-1.5 sm:gap-2 md:gap-3 shrink-0 mt-1 sm:mt-2 md:mt-0 w-full sm:w-auto justify-between sm:justify-end">
              <motion.button
                id="passport-top-menu-btn"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClickSound(); setShowMenuModal(true); }}
                className="group relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-stone-50 to-stone-100/50 hover:from-white hover:to-stone-50 rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 border-2 border-stone-200/80 hover:border-emerald-400 flex-1 sm:flex-initial min-w-[72px] sm:min-w-[80px] md:w-[120px] transition-all shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0 cursor-pointer"
                title="打開工具選單"
              >
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-stone-500 mb-0.5 sm:mb-1 group-hover:text-emerald-500 transition-colors" />
                </motion.div>
                <div className="text-[10px] sm:text-[11px] md:text-xs font-bold text-stone-700 tracking-wider md:tracking-widest relative z-10 group-hover:text-emerald-700 whitespace-nowrap">工具選單</div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[pulse_1.5s_ease-in-out_infinite] pointer-events-none" />
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/60 to-transparent -translate-y-1/2 translate-x-1/2 rotate-45 pointer-events-none" />
              </motion.button>

              {/* 常駐生活願望清單按鈕：支援手機、平板與桌機所有尺寸直接點擊 */}
              <motion.button
                id="passport-top-wishlist-btn"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClickSound(); setShowWishlistModal(true); }}
                className="group relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-rose-100/50 hover:from-rose-50 hover:to-rose-100 rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 border-2 border-rose-200/80 hover:border-rose-400 flex-1 sm:flex-initial min-w-[72px] sm:min-w-[80px] md:w-[120px] transition-all shadow-sm hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] shrink-0 cursor-pointer"
                title="開啟生活願望清單"
              >
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-rose-500 mb-0.5 sm:mb-1 group-hover:text-rose-600 transition-colors" />
                </motion.div>
                <div className="text-[10px] sm:text-[11px] md:text-xs font-bold text-rose-700 tracking-wider md:tracking-widest relative z-10 whitespace-nowrap">
                  <span className="hidden sm:inline">生活</span>願望清單
                </div>
                {selectedWishCount > 0 && (
                  <div className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[9px] md:text-[10px] font-bold shadow-xs">
                    {selectedWishCount}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[pulse_1.5s_ease-in-out_infinite] pointer-events-none" />
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/60 to-transparent -translate-y-1/2 translate-x-1/2 rotate-45 pointer-events-none" />
              </motion.button>

              <motion.button
                id="passport-top-trophy-btn"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClickSound(); setShowTrophyCabinet(true); }}
                className="hidden md:flex group relative overflow-hidden flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-yellow-100/50 hover:from-yellow-50 hover:to-yellow-100 rounded-xl md:rounded-2xl p-3 md:p-4 border-2 border-yellow-200/80 hover:border-yellow-400 min-w-[80px] md:w-[120px] transition-all shadow-sm hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] shrink-0 cursor-pointer"
                title="查看成就獎盃櫃"
              >
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                  <Medal className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 mb-1 group-hover:text-yellow-600 transition-colors" />
                </motion.div>
                <div className="text-[10px] md:text-xs font-bold text-yellow-700 tracking-widest relative z-10 whitespace-nowrap">成就獎盃</div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[pulse_1.5s_ease-in-out_infinite] pointer-events-none" />
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/60 to-transparent -translate-y-1/2 translate-x-1/2 rotate-45 pointer-events-none" />
              </motion.button>

              <motion.button
                id="passport-top-progress-btn"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClickSound(); setShowStats(!showStats); }}
                className="group relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-emerald-100/50 hover:from-emerald-50 hover:to-emerald-100 rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 border-2 border-emerald-200/80 hover:border-emerald-400 flex-1 sm:flex-initial min-w-[72px] sm:min-w-[80px] md:w-[120px] transition-all shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0 cursor-pointer"
                title="切換進度圖表"
              >
                <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 text-emerald-500 mb-0.5 sm:mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-base sm:text-lg md:text-2xl font-black text-emerald-700 leading-none mb-0.5 sm:mb-1 drop-shadow-sm">{overallCompleted}/{mainTasks.length}</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-emerald-600 font-bold whitespace-nowrap tracking-wider">達成率 {totalProgress}%</div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[pulse_1.5s_ease-in-out_infinite] pointer-events-none" />
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/60 to-transparent -translate-y-1/2 translate-x-1/2 rotate-45 pointer-events-none" />
              </motion.button>
            </div>
          </div>
          
          {/* Category Tabs */}
          <div className="mt-6 flex items-center gap-3.5 overflow-x-auto scrollbar-hide pt-3 pb-5 px-3 -mx-3">
            {CATEGORIES.map(category => {
              const isActive = activeCategory === category.id;
              const isSpecial = category.id === '選修' || category.id === '全部';
              
              return (
                <React.Fragment key={category.id}>
                  {category.id === '選修' && (
                    <div className="w-0.5 h-10 bg-stone-300 rounded-full mx-1 shrink-0 hidden md:block"></div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => { playClickSound(); setActiveCategory(category.id); }}
                    className={`relative flex items-center gap-2.5 ${isSpecial ? 'py-2 px-3 pr-4 rounded-xl' : 'py-2.5 px-4 pr-5 rounded-full'} whitespace-nowrap transition-all font-bold text-sm overflow-hidden group border-2 shrink-0 ${
                      isActive 
                        ? `${category.activeBg} ${category.activeText} ${category.activeBorder} shadow-md ring-2 ${category.activeRing}` 
                        : 'bg-white/90 text-stone-700 hover:text-stone-900 border-stone-200/90 hover:border-stone-400 hover:bg-white hover:shadow-md'
                    } ${isSpecial && !isActive ? 'border-dashed bg-gradient-to-r from-stone-50 to-white' : ''}`}
                  >
                    {/* Icon Badge */}
                    <motion.div 
                      className={`flex items-center justify-center font-black text-white text-base md:text-lg shadow-sm transition-all shrink-0 ${category.color} ${
                        isSpecial ? 'w-8 h-8 md:w-9 md:h-9 rounded-lg shadow-inner' : 'w-9 h-9 md:w-10 md:h-10 rounded-full'
                      } ${
                        isActive ? 'ring-2 ring-white/70 shadow-md scale-105' : 'group-hover:scale-110'
                      }`}
                      animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <span className={`${isSpecial ? 'text-xl' : ''} drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]`}>
                        {isSpecial ? category.icon : category.char}
                      </span>
                    </motion.div>
                    <span className={`tracking-wide relative z-10 ${isSpecial && !isActive ? 'text-stone-600' : ''}`}>{category.label}</span>

                    {/* Shiny sweep effect on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent z-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                  </motion.button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence initial={false}>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pb-8">
                {/* Progress Chart */}
                <div className="bg-[#FCFAF5] p-5 md:p-6 rounded-3xl border border-stone-200 shadow-sm mb-8">
                  <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span>{patientName ? `【${patientName}】各階段復健成就進度` : '各階段復健成就進度'}</span>
                  </h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} maxBarSize={60}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 13, fontWeight: 500 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12 }} />
                        <Tooltip 
                          cursor={{ fill: '#f5f5f4' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                          itemStyle={{ fontWeight: 600 }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#78716c', paddingTop: '20px' }} />
                        <Bar dataKey="completed" name="已完成" stackId="a" fill="#10b981" radius={[0, 0, 8, 8]} />
                        <Bar dataKey="remaining" name="未完成" stackId="a" fill="#e7e5e4" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-[#FCFAF5] p-5 md:p-6 rounded-3xl border border-stone-200 shadow-sm mb-8">
                  <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <span>{patientName ? `【${patientName}】六大生活能力雷達圖` : '六大生活能力值'}</span>
                  </h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#57534e', fontSize: 14, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="能力值" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                        <Tooltip 
                          formatter={(value, name, props) => [`${props.payload.completed} / ${props.payload.total} 項`, name]}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                          itemStyle={{ fontWeight: 600 }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Co-Learning Partners & Independence Empowerment Statistics */}
                <div className="bg-[#FCFAF5] p-5 md:p-6 rounded-3xl border border-stone-200 shadow-sm mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span>{patientName ? `【${patientName}】共學夥伴協同與自立成效分析` : '共學夥伴協同與自立成效分析'}</span>
                    </h2>
                    <span className="text-xs font-bold px-3 py-1 bg-emerald-100/70 text-emerald-800 rounded-full border border-emerald-300 w-fit">
                      四類夥伴賦能網絡
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 mb-5 leading-relaxed">
                    追蹤任務由各角色協同陪伴之歷程：<strong>自己完成</strong>（獨立自立）、<strong>家屬夥伴</strong>（家庭賦能）、<strong>多功能型照顧服務員</strong>（生活照護支持）與<strong>醫療團隊</strong>（專業介入）。
                  </p>

                  {/* 4 Partner Indicator Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
                    {/* 自己完成 */}
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-emerald-800">自己完成</span>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {partnerStats.selfRate}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-emerald-950 font-mono">
                          {partnerStats.selfCount} <span className="text-xs font-normal text-emerald-700">項</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-2 font-medium">
                        完全獨立自主能力
                      </div>
                    </div>

                    {/* 家屬夥伴 */}
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-800">家屬夥伴</span>
                          <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                            {partnerStats.familyRate}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-amber-950 font-mono">
                          {partnerStats.familyCount} <span className="text-xs font-normal text-amber-700">項</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-amber-700 mt-2 font-medium">
                        家庭賦能與親友陪伴
                      </div>
                    </div>

                    {/* 多功能型照顧服務員 */}
                    <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-sky-800">多功能型照顧服務員</span>
                          <span className="text-xs font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                            {partnerStats.attendantRate}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-sky-950 font-mono">
                          {partnerStats.attendantCount} <span className="text-xs font-normal text-sky-700">項</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-sky-700 mt-2 font-medium">
                        多元照顧人力輔助
                      </div>
                    </div>

                    {/* 醫療團隊 */}
                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-purple-800">醫療團隊</span>
                          <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                            {partnerStats.medicalRate}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-purple-950 font-mono">
                          {partnerStats.medicalCount} <span className="text-xs font-normal text-purple-700">項</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-purple-700 mt-2 font-medium">
                        治療師與專業團隊指導
                      </div>
                    </div>
                  </div>

                  {/* Distribution Progress Bar */}
                  {partnerStats.totalSelections > 0 ? (
                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <div className="flex justify-between text-xs font-bold text-stone-700 mb-2">
                        <span>協同夥伴組成佔比</span>
                        <span className="text-stone-500 font-normal">
                          共標記 {partnerStats.taggedTasksCount} 項任務 (累計 {partnerStats.totalSelections} 標記人次)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-3.5 rounded-full overflow-hidden flex shadow-inner">
                        {partnerStats.selfRate > 0 && (
                          <div 
                            className="bg-emerald-500 h-full transition-all" 
                            style={{ width: `${partnerStats.selfRate}%` }} 
                            title={`自己完成: ${partnerStats.selfRate}%`}
                          />
                        )}
                        {partnerStats.familyRate > 0 && (
                          <div 
                            className="bg-amber-500 h-full transition-all" 
                            style={{ width: `${partnerStats.familyRate}%` }} 
                            title={`家屬夥伴: ${partnerStats.familyRate}%`}
                          />
                        )}
                        {partnerStats.attendantRate > 0 && (
                          <div 
                            className="bg-sky-500 h-full transition-all" 
                            style={{ width: `${partnerStats.attendantRate}%` }} 
                            title={`多功能型照顧服務員: ${partnerStats.attendantRate}%`}
                          />
                        )}
                        {partnerStats.medicalRate > 0 && (
                          <div 
                            className="bg-purple-500 h-full transition-all" 
                            style={{ width: `${partnerStats.medicalRate}%` }} 
                            title={`醫療團隊: ${partnerStats.medicalRate}%`}
                          />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-stone-600 justify-between">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 自己完成 ({partnerStats.selfRate}%)</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 家屬夥伴 ({partnerStats.familyRate}%)</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> 多功能型照服員 ({partnerStats.attendantRate}%)</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> 醫療團隊 ({partnerStats.medicalRate}%)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-stone-50 border border-dashed border-stone-300 rounded-2xl text-center text-xs text-stone-500 leading-relaxed">
                      💡 提示：在達成任務卡片下方點選<strong>「共學夥伴」</strong>（自己完成、家屬夥伴、多功能型照顧服務員、醫療團隊），即可在此即時看見賦能與協同自立成效統計！
                    </div>
                  )}
                </div>

                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => { playClickSound(); setShowStats(false); }}
                    className="flex items-center gap-2 px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full font-bold transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 rotate-180" />
                    收起圖表
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tier Navigation */}
        {activeCategory !== '選修' && (
          <nav className="flex gap-3 mb-8 overflow-x-auto p-2 -mx-2 px-2 scrollbar-hide">
            {activeCategory !== '全部' ? (
              <>
                <TierTab 
                  tier="bronze" 
                  label="銅盃任務" 
                  subLabel="階段目標"
                  active={activeTier === 'bronze'} 
                  onClick={() => { playClickSound(); setActiveTier('bronze'); }}
                  progress={`${bronzeCompleted}/${bronzeCount}`}
                  colorClass="bg-orange-100 text-orange-800 border-orange-300"
                  activeClass="ring-2 ring-orange-500 ring-offset-2"
                />
                <TierTab 
                  tier="silver" 
                  label="銀盃任務" 
                  subLabel="進階挑戰"
                  active={activeTier === 'silver'} 
                  onClick={() => { playClickSound(); setActiveTier('silver'); }}
                  progress={`${silverCompleted}/${silverCount}`}
                  colorClass="bg-slate-100 text-slate-700 border-slate-300"
                  activeClass="ring-2 ring-slate-400 ring-offset-2"
                />
                <TierTab 
                  tier="gold" 
                  label="金盃任務" 
                  subLabel="真實社會"
                  active={activeTier === 'gold'} 
                  onClick={() => { playClickSound(); setActiveTier('gold'); }}
                  progress={`${goldCompleted}/${goldCount}`}
                  colorClass="bg-yellow-100 text-yellow-800 border-yellow-400"
                  activeClass="ring-2 ring-yellow-500 ring-offset-2"
                />
              </>
            ) : (
              <TierTab 
                tier="platinum" 
                label="白金任務" 
                subLabel="光榮退役"
                active={activeTier === 'platinum'} 
                onClick={() => { playClickSound(); setActiveTier('platinum'); }}
                progress={`${platinumCompleted}/${platinumCount}`}
                colorClass="bg-stone-800 text-white border-stone-600"
                activeClass="ring-2 ring-stone-900 ring-offset-2"
              />
            )}
          </nav>
        )}

        {/* Task List */}
        {activeCategory === '選修' && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold text-amber-900 mb-2 flex items-center justify-center gap-2">
              <span className="text-2xl">🥇</span>
              健康學習徽章 (選修)
            </h3>
            <p className="text-amber-800 font-medium text-lg">
              健康學習徽章： <span className="text-2xl ml-1 text-amber-600">⭐ x {electiveCompleted} 枚</span>
            </p>
          </div>
        )}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, index) => {
              const isCompleted = completedTasks.has(task.id);
              
              // Group headers
              const showPhaseHeader = index === 0 || filteredTasks[index - 1].phase !== task.phase;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex flex-col"
                >
                  {showPhaseHeader && task.phase && (
                    <div className="flex items-center gap-2 mt-6 mb-3 first:mt-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                      <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                        {task.phase}
                      </h3>
                    </div>
                  )}
                  
                  <div
                    onClick={() => toggleTask(task.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTask(task.id); } }}
                    role="button"
                    tabIndex={0}
                    className={`
                      relative cursor-pointer text-left w-full group overflow-hidden rounded-2xl border p-5 transition-all duration-300
                      ${isCompleted 
                        ? 'bg-stone-50 border-stone-200' 
                        : 'bg-[#FCFAF5] border-stone-200 hover:border-emerald-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox / Stamp */}
                      <div className={`
                        flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300 mt-0.5
                        ${isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-stone-300 text-transparent group-hover:border-emerald-400'
                        }
                      `}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-grow">
                        {task.location && (
                          <div className="mb-2">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 inline-block">
                              {task.location}
                            </span>
                          </div>
                        )}
                        <h4 className={`text-lg font-bold mb-1 transition-colors ${isCompleted ? 'text-stone-400' : 'text-stone-800'}`}>
                          {task.title}
                        </h4>
                        <p className={`text-sm leading-relaxed transition-colors ${isCompleted ? 'text-stone-400' : 'text-stone-600'}`}>
                          {task.description}
                        </p>
                        {isCompleted && taskCompletedAt[task.id] && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-700/80 bg-emerald-50/80 border border-emerald-200/60 rounded-lg px-2.5 py-1 w-fit">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>登錄時間：{new Date(taskCompletedAt[task.id]).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isCompleted && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-emerald-100/50 relative z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-800">共學夥伴</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {['自己完成', '家屬夥伴', '多功能型照顧服務員', '醫療團隊'].map(partner => {
                            const isSelected = taskPartners[task.id]?.includes(partner) || 
                              (partner === '家屬夥伴' && taskPartners[task.id]?.includes('家屬陪伴'));
                            return (
                              <button
                                key={partner}
                                onClick={(e) => { e.stopPropagation(); playClickSound(); togglePartner(task.id, partner); }}
                                className={`w-full py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center text-center ${
                                  isSelected 
                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400 shadow-sm' 
                                    : 'bg-stone-50 text-stone-500 border-2 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                                }`}
                              >
                                {partner}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Completion Overlay effect */}
                    <AnimatePresence>
                      {isCompleted && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 3, rotate: -25 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            rotate: -15,
                            ...( (task.tier === 'gold' || task.tier === 'platinum') ? {
                              x: [0, -3, 3, -3, 3, 0],
                              y: [0, 3, -3, 3, -3, 0]
                            } : {})
                          }}
                          exit={{ opacity: 0, scale: 0.8, rotate: 0 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 25,
                            ...( (task.tier === 'gold' || task.tier === 'platinum') ? {
                              x: { duration: 0.3, delay: 0.2, repeat: 1 },
                              y: { duration: 0.3, delay: 0.2, repeat: 1 }
                            } : {})
                          }}
                          className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"
                        >
                          <div className="px-4 py-1.5 border-4 rounded-lg font-black text-2xl tracking-widest transform shadow-sm backdrop-blur-sm text-orange-600/80 border-orange-600/80 bg-orange-100/30">
                            達成
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {celebrateTier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
            onClick={() => setCelebrateTier(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FCFAF5] rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setCelebrateTier(null)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <PartyPopper className="w-10 h-10 text-emerald-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-stone-800 mb-2">
                恭喜達成！
              </h3>
              <p className="text-stone-600 mb-8 leading-relaxed">
                你已經完成了所有的
                <span className={`font-bold mx-1 ${
                  celebrateTier === 'bronze' ? 'text-orange-600' :
                  celebrateTier === 'silver' ? 'text-slate-600' :
                  celebrateTier === 'gold' ? 'text-yellow-600' :
                  'text-stone-800'
                }`}>
                  {celebrateTier === 'bronze' ? '銅盃' : celebrateTier === 'silver' ? '銀盃' : celebrateTier === 'gold' ? '金盃' : '白金'}
                </span>
                任務，太棒了！
              </p>

              <button
                onClick={() => setCelebrateTier(null)}
                className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                繼續挑戰
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Modal */}
      <AnimatePresence>
        {showMenuModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FCFAF5] rounded-3xl shadow-2xl w-full max-w-sm border border-stone-200 overflow-hidden"
            >
              <div className="bg-[#FCFAF5] p-6 border-b border-stone-200 flex items-start justify-between">
                <div className="flex flex-col items-start gap-1">

                  <h2 className="text-sm font-bold tracking-wider text-emerald-700">生活功能解鎖護照</h2>
                  <div className="text-stone-500 font-bold mt-1 flex items-center gap-2">
                    <Menu className="w-4 h-4" />
                    工具選單
                  </div>
                  {patientName && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/80 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold shadow-2xs">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      <span>目前個案：{patientName}</span>
                      {activePatient?.caseNumber && (
                        <span className="text-emerald-700 font-normal">({activePatient.caseNumber})</span>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => setShowMenuModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { playClickSound(); setShowMenuModal(false); setIsBookOpen(false); startBGM('cover'); }}
                  className="group relative overflow-hidden flex flex-col items-center justify-center gap-3 p-4 bg-gradient-to-b from-stone-50 to-stone-100 rounded-2xl border-2 border-stone-200 text-stone-700 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:border-stone-400 cursor-pointer"
                >
                  <BookOpen className="w-8 h-8 text-stone-500 group-hover:scale-110 group-hover:text-stone-700 transition-all" />
                  <span className="font-bold text-sm tracking-wide">合上護照</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { playClickSound(); setShowMenuModal(false); setShowStats(!showStats); }}
                  className={`group relative overflow-hidden flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all shadow-sm cursor-pointer ${showStats ? 'bg-gradient-to-b from-blue-100 to-blue-200 border-blue-400 text-blue-900 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gradient-to-b from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-400 text-blue-700 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'}`}
                >
                  <Activity className={`w-8 h-8 transition-transform group-hover:scale-110 ${showStats ? 'text-blue-700' : 'text-blue-500 group-hover:text-blue-600'}`} />
                  <span className="font-bold text-sm tracking-wide">{showStats ? '收起圖表' : '展開圖表'}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { playClickSound(); setShowMenuModal(false); setShowTrophyCabinet(true); }}
                  className="group relative overflow-hidden flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-b from-yellow-50 to-yellow-100/50 rounded-2xl border-2 border-yellow-200 hover:border-yellow-400 text-yellow-800 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer"
                >
                  <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                    <Medal className="w-8 h-8 text-yellow-500 group-hover:text-yellow-600" />
                  </motion.div>
                  <span className="font-bold text-sm tracking-wide">成就獎盃櫃</span>
                  <span className="text-[10px] text-yellow-700/80 font-medium">查看榮譽徽章</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { playClickSound(); setShowMenuModal(false); setShowCertificate(true); }}
                  className="group relative overflow-hidden flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-b from-amber-50 to-amber-100/50 rounded-2xl border-2 border-amber-200 hover:border-amber-400 text-amber-800 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                >
                  <Award className="w-8 h-8 text-amber-500 group-hover:scale-110 group-hover:text-amber-600 transition-all" />
                  <span className="font-bold text-sm tracking-wide">榮譽證書</span>
                  <span className="text-[10px] text-amber-700/80 font-medium">自訂與列印證書</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { playClickSound(); setShowMenuModal(false); setShowPrologue(true); startBGM('prologue'); }}
                  className="col-span-2 group relative overflow-hidden flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-50 via-purple-100/40 to-indigo-50 rounded-2xl border-2 border-purple-200 hover:border-purple-400 text-purple-800 transition-all shadow-2xs hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm tracking-wide text-purple-900">重溫冒險序章</div>
                      <div className="text-[11px] text-purple-700/80 font-medium">靈魂之心故事與任務指引</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none" />
                </motion.button>

                {/* 後台個案管理按鈕 (需密碼保護) */}
                <motion.button
                  id="admin-dashboard-menu-btn"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    playClickSound();
                    setShowMenuModal(false);
                    if (isAdminAuthenticated) {
                      setShowAdminModal(true);
                    } else {
                      setShowAdminPasswordModal(true);
                    }
                  }}
                  className="col-span-2 group relative overflow-hidden flex items-center justify-between p-4 bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-800 rounded-2xl text-white shadow-md hover:shadow-xl transition-all border border-indigo-500/40 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
                      <ShieldCheck className="w-6 h-6 text-indigo-200" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm md:text-base">後台管理系統</span>
                        {isAdminAuthenticated && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                            已登入
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-indigo-200/80 font-normal">
                        {isAdminAuthenticated ? '個案名冊、評鑑報表與進度管理' : '治療師 / 管理員登入 (需密碼)'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              </div>

              <div className="px-6 pb-6 space-y-6">
                <div>
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">系統設定</div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-3">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-stone-400" /> : <Volume2 className="w-5 h-5 text-stone-500" />}
                      <span className="font-bold text-sm text-stone-700 w-12">音量</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setVolume(v);
                          setMasterVolume(v);
                          if (v > 0 && isMuted) {
                             setIsMuted(false);
                             toggleMute(false);
                          } else if (v === 0 && !isMuted) {
                             setIsMuted(true);
                             toggleMute(true);
                          }
                        }}
                        className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trophy Cabinet Modal */}
      <AnimatePresence>
        {showTrophyCabinet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
            onClick={() => setShowTrophyCabinet(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#FCFAF5] rounded-3xl p-6 md:p-8 max-w-3xl w-full relative shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-0 bg-[#FCFAF5] z-10 py-2">
                <div className="flex items-center justify-between w-full md:w-auto">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-stone-800">
                    <Medal className="w-6 h-6 text-yellow-500" />
                    <span>{patientName ? `【${patientName}】成就獎盃櫃` : '成就獎盃櫃'}</span>
                  </h2>
                  <button 
                    onClick={() => setShowTrophyCabinet(false)}
                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors md:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl flex-shrink-0">
                  <button 
                    onClick={() => { playClickSound(); setTrophyFilter('all'); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${trophyFilter === 'all' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    全部
                  </button>
                  <button 
                    onClick={() => { playClickSound(); setTrophyFilter('unlocked'); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${trophyFilter === 'unlocked' ? 'bg-white shadow-sm text-yellow-700' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    已解鎖
                  </button>
                  <button 
                    onClick={() => { playClickSound(); setTrophyFilter('locked'); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${trophyFilter === 'locked' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    待解鎖
                  </button>
                </div>

                <button 
                  onClick={() => setShowTrophyCabinet(false)}
                  className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors hidden md:block"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {BADGES.filter(badge => {
                  const isUnlocked = !!unlockedBadges[badge.id];
                  if (trophyFilter === 'unlocked') return isUnlocked;
                  if (trophyFilter === 'locked') return !isUnlocked;
                  return true;
                }).map((badge, idx) => {
                  const isUnlocked = !!unlockedBadges[badge.id];

                  return (
                    <motion.div
                      key={badge.id}
                      initial={isUnlocked ? { rotateY: 180, opacity: 0 } : { opacity: 0 }}
                      animate={isUnlocked ? { rotateY: 0, opacity: 1 } : { opacity: 1 }}
                      transition={{ duration: 0.6, delay: idx * 0.1, type: "spring" }}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 text-center transition-all ${
                        isUnlocked 
                          ? 'bg-yellow-50/50 border-yellow-200 shadow-sm' 
                          : 'bg-stone-50 border-stone-200 grayscale opacity-50'
                      }`}
                    >
                      <div className="text-4xl mb-3">{badge.icon}</div>
                      <div className={`font-bold mb-1 ${isUnlocked ? 'text-yellow-800' : 'text-stone-500'}`}>
                        {badge.name}
                      </div>
                      <div className="text-xs text-stone-500 leading-relaxed mb-1">
                        {badge.description}
                      </div>
                      {!isUnlocked && (
                        <div className="mt-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider bg-stone-200 px-2 py-1 rounded-full">
                          未解鎖
                        </div>
                      )}
                      {isUnlocked && (
                        <div className="mt-2 flex flex-wrap gap-2 justify-center">
                          <div className="text-[10px] font-semibold text-yellow-700 bg-yellow-200/50 px-2 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(unlockedBadges[badge.id]).toLocaleDateString()}
                          </div>
                          {['bronze_master', 'silver_master', 'gold_master', 'grand_slam'].includes(badge.id) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShareBadge(badge, new Date(unlockedBadges[badge.id]).toLocaleDateString()); }}
                              className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-full transition-colors flex items-center gap-1"
                              title="分享成就"
                            >
                              <Share2 className="w-3 h-3" /> 分享
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {Object.keys(unlockedBadges).length > 0 && (
                <div className="mt-8 pt-8 border-t border-stone-200">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-stone-800 mb-6">
                    <Clock className="w-5 h-5 text-stone-500" />
                    成就動態牆
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(unlockedBadges)
                      .sort(([, dateA], [, dateB]) => new Date(dateB as string).getTime() - new Date(dateA as string).getTime())
                      .map(([id, dateStr]) => {
                        const badge = BADGES.find(b => b.id === id);
                        if (!badge) return null;
                        return (
                          <div key={id} className="flex items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
                            <div className="text-3xl bg-white p-2 rounded-lg shadow-sm">{badge.icon}</div>
                            <div className="flex-grow">
                              <h4 className="font-bold text-stone-800">{badge.name}</h4>
                              <p className="text-xs text-stone-500">{badge.description}</p>
                            </div>
                            <div className="text-xs font-semibold text-stone-400">
                              {new Date(dateStr as string).toLocaleString('zh-TW')}
                            </div>
                          </div>
                        );
                      })}                  </div>
                </div>
              )}

              {/* Share Card (Hidden) */}
              {shareData && (
                <div className="absolute -left-[9999px] top-0">
                  <div ref={shareCardRef} className="w-[400px] p-8 flex flex-col items-center justify-center text-center" style={{ background: 'linear-gradient(to bottom right, #fefce8, #fff7ed)', borderRadius: '1.5rem', border: '1px solid rgba(254, 240, 138, 0.5)' }}>
                    <div className="text-6xl mb-6" style={{ filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.07))' }}>{shareData.icon}</div>
                    <div className="text-2xl font-black tracking-wider mb-2" style={{ color: '#713f12' }}>{shareData.name}</div>
                    <div className="text-sm font-medium mb-6" style={{ color: 'rgba(161, 98, 7, 0.8)' }}>{shareData.desc}</div>
                    
                    <div className="w-full h-px mb-6" style={{ background: 'linear-gradient(to right, transparent, #fde047, transparent)' }}></div>
                    
                    <div className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(202, 138, 4, 0.6)' }}>
                      生活大師 • {shareData.date}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}      </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Honor Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto certificate-modal-root">
            <style>{`
              @page { 
                size: A4 landscape; 
                margin: 0; 
              }
              @media print {
                *, *::before, *::after {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  box-sizing: border-box !important;
                }
                body > :not(#root) {
                  display: none !important;
                }
                html, body {
                  width: 297mm !important;
                  height: 210mm !important;
                  min-width: 297mm !important;
                  min-height: 210mm !important;
                  max-width: 297mm !important;
                  max-height: 210mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  overflow: hidden !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #root {
                  width: 297mm !important;
                  height: 210mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  position: static !important;
                  overflow: hidden !important;
                }
                .certificate-modal-root {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 297mm !important;
                  height: 210mm !important;
                  max-width: 297mm !important;
                  max-height: 210mm !important;
                  background: white !important;
                  padding: 10mm 14mm !important;
                  margin: 0 !important;
                  overflow: hidden !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  z-index: 99999 !important;
                  box-sizing: border-box !important;
                }
                .certificate-page-card {
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  width: 100% !important;
                  height: 100% !important;
                  max-width: 100% !important;
                  max-height: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  border-radius: 0 !important;
                  background: transparent !important;
                  overflow: hidden !important;
                  transform: none !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  page-break-after: avoid !important;
                }
                .certificate-content-container {
                  padding: 0 !important;
                  margin: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                }
                .certificate-print-wrapper {
                  width: 100% !important;
                  height: 100% !important;
                  max-width: 100% !important;
                  max-height: 100% !important;
                  box-sizing: border-box !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  page-break-after: avoid !important;
                  border-radius: 16px !important;
                  padding: 2.8rem 3.5rem 2.2rem !important;
                }
                .certificate-no-break {
                  white-space: nowrap !important;
                  word-break: keep-all !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
              }
            `}</style>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="certificate-page-card bg-[#FCFAF5] rounded-3xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col print:shadow-none print:w-full print:max-w-none print:h-full print:max-h-none print:overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-[#FCFAF5] z-10 print:hidden">
                <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <Award className="w-6 h-6 text-emerald-500" />
                  生活功能解鎖 榮譽證書
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    列印 / 存為 PDF
                  </button>
                  <button onClick={() => setShowCertificate(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="certificate-content-container p-8 bg-stone-50 print:bg-[#FCFAF5] print:p-0">
                {/* Settings for generating (hidden in print) */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden bg-[#FCFAF5] p-6 rounded-2xl border border-stone-200">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">證書風格</label>
                    <div className="relative">
                      <select 
                        value={certificateTemplate} 
                        onChange={e => setCertificateTemplate(e.target.value as any)}
                        className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-stone-50"
                      >
                        <option value="classic">經典雅致 (Classic)</option>
                        <option value="elegant">皇家尊榮 (Elegant)</option>
                        <option value="vibrant">活力繽紛 (Vibrant)</option>
                      </select>
                      <Palette className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">個案姓名</label>
                    <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50" placeholder="輸入姓名..." />
                  </div>
                </div>

                {/* Actual Certificate Area */}
                {(() => {
                  const t = {
                    classic: {
                      wrapper: "certificate-print-wrapper bg-[#FCFAF5] p-8 md:p-12 rounded-2xl shadow-sm border-[12px] border-double border-emerald-100 relative overflow-hidden text-center min-h-[580px] flex flex-col justify-between font-serif print:shadow-none print:border-[10px] print:min-h-0 print:h-full",
                      icon: "text-emerald-50",
                      title: "text-emerald-800",
                      subtitle: "text-stone-500",
                      text: "text-stone-700",
                      photoBg: "bg-stone-50 border-stone-100",
                      badge1Bg: "bg-stone-50/90",
                      badge1Text: "text-stone-800",
                      badge1Sub: "text-stone-500",
                      badge2Bg: "bg-emerald-50/90",
                      badge2Text: "text-emerald-600",
                      badge2Sub: "text-emerald-600/70",
                      badge3Bg: "bg-yellow-50/90",
                      badge3Text: "text-yellow-600",
                      badge3Sub: "text-yellow-600/70",
                      footerBorder: "border-stone-100",
                      footerText: "text-stone-400",
                      footerValue: "text-stone-700",
                      afterLabelBg: "bg-emerald-50",
                      afterLabelText: "text-emerald-700",
                      beforeLabelBg: "bg-stone-100",
                      beforeLabelText: "text-stone-500",
                      arrow: "text-stone-200"
                    },
                    elegant: {
                      wrapper: "certificate-print-wrapper bg-[#FAFAFA] p-8 md:p-12 rounded-2xl shadow-md border-[8px] border-slate-800 relative overflow-hidden text-center min-h-[580px] flex flex-col justify-between font-serif print:shadow-none print:border-6 print:border-slate-800 print:min-h-0 print:h-full",
                      icon: "text-slate-200/50",
                      title: "text-slate-900 font-serif",
                      subtitle: "text-slate-500 font-serif",
                      text: "text-slate-800 font-serif",
                      photoBg: "bg-[#FCFAF5] border-slate-200",
                      badge1Bg: "bg-[#FCFAF5] border border-slate-200 shadow-sm",
                      badge1Text: "text-slate-800 font-serif",
                      badge1Sub: "text-slate-500 font-serif",
                      badge2Bg: "bg-slate-800 shadow-sm",
                      badge2Text: "text-white font-serif",
                      badge2Sub: "text-slate-300 font-serif",
                      badge3Bg: "bg-amber-100 border border-amber-200 shadow-sm",
                      badge3Text: "text-amber-900 font-serif",
                      badge3Sub: "text-amber-700 font-serif",
                      footerBorder: "border-slate-300",
                      footerText: "text-slate-400 font-serif",
                      footerValue: "text-slate-800 font-serif",
                      afterLabelBg: "bg-slate-800",
                      afterLabelText: "text-white font-serif",
                      beforeLabelBg: "bg-slate-200",
                      beforeLabelText: "text-slate-700 font-serif",
                      arrow: "text-slate-300"
                    },
                    vibrant: {
                      wrapper: "certificate-print-wrapper bg-gradient-to-br from-orange-50 to-rose-50 p-8 md:p-12 rounded-2xl shadow-lg border-[6px] border-orange-300 relative overflow-hidden text-center min-h-[580px] flex flex-col justify-between print:shadow-none print:border-4 print:border-orange-300 print:min-h-0 print:h-full",
                      icon: "text-orange-500/5",
                      title: "text-rose-600 font-black",
                      subtitle: "text-orange-600/80",
                      text: "text-stone-800",
                      photoBg: "bg-white/60 border-white shadow-sm backdrop-blur-sm",
                      badge1Bg: "bg-white/80 shadow-sm backdrop-blur-sm",
                      badge1Text: "text-stone-800",
                      badge1Sub: "text-stone-500",
                      badge2Bg: "bg-gradient-to-br from-orange-400 to-rose-400 shadow-md",
                      badge2Text: "text-white",
                      badge2Sub: "text-white/80",
                      badge3Bg: "bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md",
                      badge3Text: "text-yellow-950",
                      badge3Sub: "text-yellow-900/70",
                      footerBorder: "border-orange-200",
                      footerText: "text-orange-800/60",
                      footerValue: "text-rose-900 font-bold",
                      afterLabelBg: "bg-rose-100",
                      afterLabelText: "text-rose-700",
                      beforeLabelBg: "bg-white/80",
                      beforeLabelText: "text-stone-500",
                      arrow: "text-orange-300"
                    }
                  }[certificateTemplate];

                  return (
                    <div className={t.wrapper}>
                      
                      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center ${t.icon}`}>
                        <Award className="w-[420px] h-[420px] md:w-[480px] md:h-[480px] print:w-[380px] print:h-[380px]" />
                      </div>

                      <div className="relative z-10 flex flex-col justify-between h-full">
                        {/* Header Section */}
                        <div className="pt-4 md:pt-6 print:pt-4">
                          <h1 className={`text-4xl md:text-5xl print:text-5xl mb-2 md:mb-3 print:mb-3 tracking-widest certificate-no-break ${t.title}`}>生活大師榮譽證書</h1>
                          <p className={`text-base md:text-lg print:text-base font-medium tracking-widest mb-6 md:mb-8 print:mb-7 certificate-no-break ${t.subtitle}`}>復健旅程結業證明</p>
                          
                          <div className={`text-xl md:text-2xl print:text-2xl mb-4 md:mb-6 print:mb-5 leading-relaxed font-medium ${t.text}`}>
                            <div className="certificate-no-break">
                              茲證明 <span className="text-3xl print:text-3xl font-bold border-b-2 border-current px-6 pb-1 mx-2">{patientName || 'ＯＯＯ'}</span>
                            </div>
                            <div className="h-4 md:h-6 print:h-5"></div>
                            <div className="certificate-no-break">
                              在 180 天的復健旅程中，展現了無比的毅力與勇氣。
                            </div>
                          </div>
                        </div>

                        {/* Badges Section - Horizontal 3 columns with exact ratio as preview modal */}
                        <div className="grid grid-cols-3 gap-6 md:gap-8 print:gap-8 max-w-3xl mx-auto my-auto w-full px-4 print:my-6">
                          <div className={`rounded-2xl p-5 md:p-6 print:p-6 shadow-xs ${t.badge1Bg}`}>
                              <div className={`text-3xl md:text-4xl print:text-4xl font-black mb-2 print:mb-1.5 certificate-no-break ${t.badge1Text}`}>{overallCompleted}</div>
                              <div className={`text-xs md:text-sm print:text-sm font-bold tracking-wider certificate-no-break ${t.badge1Sub}`}>解鎖任務數</div>
                          </div>
                          <div className={`rounded-2xl p-5 md:p-6 print:p-6 shadow-xs ${t.badge2Bg}`}>
                              <div className={`text-3xl md:text-4xl print:text-4xl font-black mb-2 print:mb-1.5 certificate-no-break ${t.badge2Text}`}>{totalProgress}%</div>
                              <div className={`text-xs md:text-sm print:text-sm font-bold tracking-wider certificate-no-break ${t.badge2Sub}`}>總達成率</div>
                          </div>
                          <div className={`rounded-2xl p-5 md:p-6 shadow-xs ${t.badge3Bg}`}>
                              <div className={`text-3xl md:text-4xl print:text-4xl font-black mb-2 print:mb-1.5 certificate-no-break ${t.badge3Text}`}>
                                {(completedTasks.has(200) || completedTasks.has(150)) ? '白金' : (overallCompleted >= 80 ? '金盃' : '卓越')}
                              </div>
                              <div className={`text-xs md:text-sm print:text-sm font-bold tracking-wider certificate-no-break ${t.badge3Sub}`}>最高榮譽</div>
                          </div>
                        </div>

                        {/* Footer Section */}
                        <div className={`flex justify-between items-end px-8 md:px-20 print:px-14 pt-6 print:pt-5 pb-2 print:pb-3 border-t-2 max-w-4xl mx-auto w-full ${t.footerBorder}`}>
                          <div className="text-left">
                            <div className={`text-xs md:text-sm print:text-xs mb-1.5 tracking-wider certificate-no-break ${t.footerText}`}>頒發單位</div>
                            <div className={`text-lg md:text-xl print:text-lg font-bold tracking-wider certificate-no-break ${t.footerValue}`}>員郭醫院 復健團隊</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs md:text-sm print:text-xs mb-1.5 tracking-wider certificate-no-break ${t.footerText}`}>頒發日期</div>
                            <div className={`text-lg md:text-xl print:text-lg font-bold tracking-wider certificate-no-break ${t.footerValue}`}>{new Date().toLocaleDateString('zh-TW')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    {/* ADL Task Report & Print Modal */}
    <TaskReportModal
      isOpen={showReportModal}
      onClose={() => setShowReportModal(false)}
      onBackToAdmin={() => {
        setShowReportModal(false);
        if (isAdminAuthenticated) {
          setShowAdminModal(true);
        } else {
          setShowAdminPasswordModal(true);
        }
      }}
      completedTasks={completedTasks}
      taskPartners={taskPartners}
      taskCompletedAt={taskCompletedAt}
      patientName={patientName}
      onUpdatePatientName={setPatientName}
      totalProgress={totalProgress}
      overallCompleted={overallCompleted}
      mainTasksCount={mainTasks.length}
    />

    {/* Admin / Editor Role Password Verification Modal */}
    <AdminPasswordModal
      isOpen={showAdminPasswordModal}
      onClose={() => setShowAdminPasswordModal(false)}
      onSuccess={(role) => {
        setShowAdminPasswordModal(false);
        setIsAdminAuthenticated(true);
        setUserRole(role);
        try {
          sessionStorage.setItem('passport_admin_auth', 'true');
        } catch (e) {}
        setShowAdminModal(true);
      }}
    />

    {/* Admin Case Management, Reports & Analytics Modal */}
    <AdminDashboardModal
      isOpen={showAdminModal}
      onClose={() => setShowAdminModal(false)}
      patients={patients}
      activePatientId={activePatientId}
      onSelectPatient={(patient, closeModal = true) => {
        handleSelectPatient(patient);
        if (closeModal) {
          setShowAdminModal(false);
        }
      }}
      onOpenReportModal={() => {
        setShowAdminModal(false);
        setShowReportModal(true);
      }}
      onExportSummary={handleExport}
      onExportJSON={handleExportJSON}
      onImportJSON={handleImportJSON}
      patientName={patientName}
      completedTasksCount={completedTasks.size}
      userRole={userRole}
      onOpenQuadrant={() => {
        setShowAdminModal(false);
        setShowWishQuadrantModal(true);
      }}
      onLogout={() => {
        clearStoredRole();
        setIsAdminAuthenticated(false);
        setShowAdminModal(false);
        setShowAdminPasswordModal(true);
      }}
    />

    {/* Life Wishlist Modal */}
    <WishlistModal
      isOpen={showWishlistModal}
      onClose={() => setShowWishlistModal(false)}
      patientName={patientName || activePatient?.name || ''}
      completedTasks={completedTasks}
      isAdmin={isAdminAuthenticated && userRole === 'admin'}
      onOpenQuadrant={(ids) => {
        if (ids && ids.length > 0) {
          setActiveWishlistIds(ids);
        }
        setShowWishlistModal(false);
        setShowWishQuadrantModal(true);
      }}
      onAdminAuthSuccess={(role) => {
        setIsAdminAuthenticated(true);
        setUserRole(role);
        try {
          sessionStorage.setItem('passport_admin_auth', 'true');
        } catch (e) {}
      }}
      onNavigateToTask={(taskId, category) => {
        setIsBookOpen(true);
        setActiveCategory(category);
        const targetTask = TASKS.find(t => t.id === taskId);
        if (targetTask) {
          setActiveTier(targetTask.tier);
        }
      }}
    />

    {/* 5 Wishes x Quadrant Priority Matrix Modal */}
    <WishQuadrantModal
      isOpen={showWishQuadrantModal}
      onClose={() => setShowWishQuadrantModal(false)}
      patientName={patientName || activePatient?.name || ''}
      patientCaseNumber={activePatient?.caseNumber}
      completedTasks={completedTasks}
      selectedWishIds={activeWishlistIds.length > 0 ? activeWishlistIds : undefined}
      onNavigateToTask={(taskId, category) => {
        setShowWishQuadrantModal(false);
        setIsBookOpen(true);
        setActiveCategory(category);
        const targetTask = TASKS.find(t => t.id === taskId);
        if (targetTask) {
          setActiveTier(targetTask.tier);
        }
      }}
    />
    </>
  );
}

// Subcomponents

function TierTab({ 
  tier, 
  label, 
  subLabel,
  active, 
  onClick, 
  progress,
  colorClass,
  activeClass
}: { 
  tier: TrophyTier; 
  label: string; 
  subLabel: string;
  active: boolean; 
  onClick: () => void;
  progress: string;
  colorClass: string;
  activeClass: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative flex items-center shrink-0 gap-3 px-5 py-3 rounded-2xl border transition-all duration-200 min-w-[160px] text-left overflow-hidden group
        ${active ? `${colorClass} ${activeClass} shadow-[0_0_15px_rgba(0,0,0,0.1)] ring-1 ring-current` : 'bg-[#FCFAF5] border-stone-200 hover:bg-stone-50 text-stone-600 hover:border-stone-300 hover:shadow-sm'}
      `}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 animate-[pulse_2s_ease-in-out_infinite] pointer-events-none" />
      )}
      <motion.div
        animate={active ? { rotate: [0, -15, 15, -15, 0], scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        <Trophy className={`w-6 h-6 flex-shrink-0 relative z-10 ${
          tier === 'bronze' ? 'text-orange-500' :
          tier === 'silver' ? 'text-slate-500' :
          tier === 'gold' ? 'text-yellow-500' :
          'text-stone-700'
        } ${!active && 'opacity-50'}`} />
      </motion.div>
      <div className="relative z-10">
        <div className={`font-bold text-sm tracking-wide ${active ? '' : 'text-stone-700'}`}>{label}</div>
        <div className={`text-xs mt-0.5 font-medium tracking-wide ${active ? 'opacity-90' : 'text-stone-500'}`}>
          {subLabel} • {progress}
        </div>
      </div>
    </motion.button>
  );
}
