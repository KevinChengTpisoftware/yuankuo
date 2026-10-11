import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  BarChart3, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  FolderArchive, 
  ArrowRight, 
  Trash2, 
  Edit3, 
  X, 
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  Printer,
  Copy,
  Download,
  Upload,
  Check,
  HardDrive,
  Share2,
  FileCheck,
  AlertTriangle,
  ArrowRightLeft,
  Image as ImageIcon,
  Award,
  Sparkles,
  Layers,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  KeyRound,
  Lock,
  RotateCcw,
  UserCheck,
  AlertCircle,
  LogOut,
  Target,
  Eye,
  HeartHandshake
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  Tooltip as RechartsTooltip
} from 'recharts';
import html2canvas from 'html2canvas-pro';
import { Patient, Category } from '../types';
import { TASKS } from '../data';
import { 
  createPatientInCloud, 
  updatePatientInfo, 
  deletePatientFromCloud 
} from '../services/patientService';
import { CrossPatientReportModal } from './CrossPatientReportModal';
import { 
  UserRole, 
  StaffMember,
  getEditorPin, 
  setEditorPin, 
  isEditorPinDefault, 
  getAdminPassword, 
  setAdminPassword, 
  isAdminPasswordDefault,
  DEFAULT_EDITOR_PIN,
  DEFAULT_ADMIN_PWD,
  getStaffMembers,
  subscribeStaffMembers,
  saveStaffMember,
  deleteStaffMember,
  resetStaffPinToDefault,
  updateStaffPin,
  getCurrentStaff
} from '../services/authService';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  activePatientId: string | null;
  onSelectPatient: (patient: Patient, closeModal?: boolean) => void;
  onOpenReportModal?: () => void;
  onExportSummary?: () => void;
  onExportJSON?: () => void;
  onImportJSON?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  patientName?: string;
  completedTasksCount?: number;
  userRole?: UserRole;
  currentStaff?: StaffMember | null;
  onLogout?: () => void;
  onOpenQuadrant?: () => void;
}

const CATEGORY_KEYS: Category[] = ['食', '衣', '住', '行', '育', '樂'];
const TOTAL_MAIN_TASKS = TASKS.filter(t => t.category !== '選修' && t.category !== '全部').length; // 150 核心項目 (食衣住行育樂各 25 項)

export const ECONOMIC_STATUS_OPTIONS = ['富裕', '小康', '普通', '清寒', '貧窮'];
export const EDUCATION_LEVEL_OPTIONS = ['國小及以下', '國中', '高中', '高職', '專科', '大學', '碩士', '博士'];
export const PERSONALITY_OPTIONS = ['溫和隨和', '外向活潑', '內向孤僻', '剛烈暴躁', '固執硬脾氣', '悲觀消極'];
export const OCCUPATION_OPTIONS = ['家管', '務農', '退休待業 / 無業', '其他'];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  patients,
  activePatientId,
  onSelectPatient,
  onOpenReportModal,
  onExportSummary,
  onExportJSON,
  onImportJSON,
  patientName,
  completedTasksCount = 0,
  userRole = 'admin',
  currentStaff = null,
  onLogout,
  onOpenQuadrant,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewDetailPatient, setViewDetailPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'analytics' | 'reports' | 'security'>('roster');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [confirmingSwitchPatient, setConfirmingSwitchPatient] = useState<Patient | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [showCrossPatientReport, setShowCrossPatientReport] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [imageExportSuccess, setImageExportSuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [newlyCreatedPatientId, setNewlyCreatedPatientId] = useState<string | null>(null);
  const [createSuccessNotice, setCreateSuccessNotice] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'progress'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Staff members directory state
  const [staffList, setStaffList] = useState<StaffMember[]>(() => getStaffMembers());
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffNameInput, setStaffNameInput] = useState('');
  const [staffTitleInput, setStaffTitleInput] = useState('職能治療師');
  const [staffPinInput, setStaffPinInput] = useState('000000');
  const [staffNotesInput, setStaffNotesInput] = useState('');
  const [staffModalError, setStaffModalError] = useState('');
  const [confirmResetStaffId, setConfirmResetStaffId] = useState<string | null>(null);
  const [confirmDeleteStaffId, setConfirmDeleteStaffId] = useState<string | null>(null);

  // Security & Password states
  const [editorPinInput, setEditorPinInput] = useState('');
  const [editorConfirmPin, setEditorConfirmPin] = useState('');
  const [adminPwdInput, setAdminPwdInput] = useState('');
  const [adminConfirmPwd, setAdminConfirmPwd] = useState('');
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState('');
  const [securityErrorMsg, setSecurityErrorMsg] = useState('');
  const [showResetAdminConfirm, setShowResetAdminConfirm] = useState(false);
  const [currentEditorPinVal, setCurrentEditorPinVal] = useState(getEditorPin());
  const [currentAdminPwdVal, setCurrentAdminPwdVal] = useState(getAdminPassword());

  // Reload staff members whenever modal opens or switching to security tab
  useEffect(() => {
    if (isOpen) {
      setStaffList(getStaffMembers());
      const unsub = subscribeStaffMembers((cloudStaff) => {
        setStaffList(cloudStaff);
      });
      return () => unsub();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyticsImageCardRef = useRef<HTMLDivElement>(null);
  const staffTitleInputRef = useRef<HTMLInputElement>(null);

  const currentPatient = useMemo(() => {
    return patients.find(p => p.id === activePatientId) || null;
  }, [patients, activePatientId]);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCaseNumber, setFormCaseNumber] = useState('');
  const [formBedNumber, setFormBedNumber] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formUpstreamHospital, setFormUpstreamHospital] = useState('');
  const [formCaregiver, setFormCaregiver] = useState('');
  const [formHomeLocation, setFormHomeLocation] = useState('');
  const [formPrimaryMedicalDecisionMaker, setFormPrimaryMedicalDecisionMaker] = useState('');

  // 社會心理/生活/環境社會心理暨家庭功能評估 Form states
  const [formFamilyMarriage, setFormFamilyMarriage] = useState('');
  const [formEconomicStatus, setFormEconomicStatus] = useState('');
  const [formPreMorbidOccupation, setFormPreMorbidOccupation] = useState('');
  const [formInterestsSpecialties, setFormInterestsSpecialties] = useState('');
  const [formEducationLevel, setFormEducationLevel] = useState('');
  const [formLivingEnvironment, setFormLivingEnvironment] = useState('');
  const [formCohabitingFamily, setFormCohabitingFamily] = useState('');
  const [formPreMorbidPersonality, setFormPreMorbidPersonality] = useState('');
  const [formPostMorbidPersonality, setFormPostMorbidPersonality] = useState('');
  const [isCustomPreMorbid, setIsCustomPreMorbid] = useState(false);
  const [isCustomPostMorbid, setIsCustomPostMorbid] = useState(false);
  const [isCustomOccupation, setIsCustomOccupation] = useState(false);

  const [formTherapist, setFormTherapist] = useState('');
  const [formAdmissionDate, setFormAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTargetGoal, setFormTargetGoal] = useState('');

  // Reset form
  const resetForm = () => {
    setFormName('');
    setFormCaseNumber('');
    setFormBedNumber('');
    setFormAge('');
    setFormUpstreamHospital('');
    setFormCaregiver('');
    setFormHomeLocation('');
    setFormPrimaryMedicalDecisionMaker('');

    setFormFamilyMarriage('');
    setFormEconomicStatus('');
    setFormPreMorbidOccupation('');
    setFormInterestsSpecialties('');
    setFormEducationLevel('');
    setFormLivingEnvironment('');
    setFormCohabitingFamily('');
    setFormPreMorbidPersonality('');
    setFormPostMorbidPersonality('');
    setIsCustomPreMorbid(false);
    setIsCustomPostMorbid(false);
    setIsCustomOccupation(false);

    setFormTherapist('');
    setFormAdmissionDate(new Date().toISOString().split('T')[0]);
    setFormTargetGoal('');
    setEditingPatient(null);
  };

  // Open edit modal
  const handleStartEdit = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPatient(patient);
    setFormName(patient.name);
    setFormCaseNumber(patient.caseNumber);
    setFormBedNumber(patient.bedNumber || '');
    setFormAge(patient.age || '');
    setFormUpstreamHospital(patient.upstreamHospital || '');
    setFormCaregiver(patient.caregiver || '');
    setFormHomeLocation(patient.homeLocation || '');
    setFormPrimaryMedicalDecisionMaker(patient.primaryMedicalDecisionMaker || '');

    setFormFamilyMarriage(patient.familyMarriage || '');
    setFormEconomicStatus(patient.economicStatus || '');
    setFormPreMorbidOccupation(patient.preMorbidOccupation || '');
    setFormInterestsSpecialties(patient.interestsSpecialties || '');
    setFormEducationLevel(patient.educationLevel || '');
    setFormLivingEnvironment(patient.livingEnvironment || '');
    setFormCohabitingFamily(patient.cohabitingFamily || '');
    setFormPreMorbidPersonality(patient.preMorbidPersonality || '');
    setFormPostMorbidPersonality(patient.postMorbidPersonality || '');
    setIsCustomPreMorbid(Boolean(patient.preMorbidPersonality && !PERSONALITY_OPTIONS.includes(patient.preMorbidPersonality)));
    setIsCustomPostMorbid(Boolean(patient.postMorbidPersonality && !PERSONALITY_OPTIONS.includes(patient.postMorbidPersonality)));
    setIsCustomOccupation(Boolean(patient.preMorbidOccupation && !OCCUPATION_OPTIONS.includes(patient.preMorbidOccupation)));

    setFormTherapist(patient.primaryTherapist || '');
    setFormAdmissionDate(patient.admissionDate || new Date().toISOString().split('T')[0]);
    setFormTargetGoal(patient.targetGoal || '');
    setShowAddModal(true);
  };

  // Submit create or edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const patientPayload = {
        name: formName.trim(),
        caseNumber: formCaseNumber.trim() || `P-${Date.now().toString().slice(-4)}`,
        bedNumber: formBedNumber.trim(),
        age: formAge.trim(),
        upstreamHospital: formUpstreamHospital.trim(),
        caregiver: formCaregiver.trim(),
        homeLocation: formHomeLocation.trim(),
        primaryMedicalDecisionMaker: formPrimaryMedicalDecisionMaker.trim(),
        familyMarriage: formFamilyMarriage.trim(),
        economicStatus: formEconomicStatus.trim(),
        preMorbidOccupation: formPreMorbidOccupation.trim(),
        interestsSpecialties: formInterestsSpecialties.trim(),
        educationLevel: formEducationLevel.trim(),
        livingEnvironment: formLivingEnvironment.trim(),
        cohabitingFamily: formCohabitingFamily.trim(),
        preMorbidPersonality: formPreMorbidPersonality.trim(),
        postMorbidPersonality: formPostMorbidPersonality.trim(),
        primaryTherapist: formTherapist.trim(),
        admissionDate: formAdmissionDate,
        targetGoal: formTargetGoal.trim(),
      };

      if (editingPatient) {
        await updatePatientInfo(editingPatient.id, patientPayload);
      } else {
        const newId = await createPatientInCloud({
          ...patientPayload,
          status: 'active',
          completedTasks: [],
          clinicalRemarks: '',
        });
        // Select the newly created patient in background without closing the admin modal
        const created: Patient = {
          id: newId,
          ...patientPayload,
          status: 'active',
          completedTasks: [],
        };
        onSelectPatient(created, false);
        setActiveTab('roster');
        setSearchTerm('');
        setStatusFilter('active');
        setSortBy('date');
        setSortOrder('desc');
        setNewlyCreatedPatientId(newId);
        setCreateSuccessNotice(`個案【${created.name}】已成功建立！已載入並列於下方個案名冊中，請確認資料。`);
        setTimeout(() => {
          setNewlyCreatedPatientId(null);
        }, 8000);
      }
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error('儲存個案資料失敗:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle archive status with safeguard
  const handleToggleArchive = async (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    if (archivingId === patient.id) {
      const nextStatus = patient.status === 'active' ? 'archived' : 'active';
      try {
        await updatePatientInfo(patient.id, { status: nextStatus });
        setArchivingId(null);
      } catch (err) {
        console.error('更新個案狀態失敗:', err);
      }
    } else {
      setArchivingId(patient.id);
      setTimeout(() => {
        setArchivingId(prev => prev === patient.id ? null : prev);
      }, 4000);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Delete patient
  const handleDelete = async (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === patientId) {
      try {
        await deletePatientFromCloud(patientId);
        setDeletingId(null);
      } catch (err) {
        console.error('刪除個案失敗:', err);
      }
    } else {
      setDeletingId(patientId);
      setTimeout(() => {
        setDeletingId(prev => prev === patientId ? null : prev);
      }, 4000);
    }
  };

  // Filtered & Sorted patients
  const filteredPatients = useMemo(() => {
    const list = patients.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.caseNumber && p.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.primaryTherapist && p.primaryTherapist.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });

    return list.sort((a, b) => {
      if (sortBy === 'progress') {
        const countA = (a.completedTasks || []).length;
        const countB = (b.completedTasks || []).length;
        if (countA !== countB) {
          return sortOrder === 'desc' ? countB - countA : countA - countB;
        }
        // Tie-breaker: newest date first
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.admissionDate ? new Date(a.admissionDate).getTime() : 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.admissionDate ? new Date(b.admissionDate).getTime() : 0);
        return timeB - timeA;
      } else {
        // sortBy === 'date'
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.admissionDate ? new Date(a.admissionDate).getTime() : 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.admissionDate ? new Date(b.admissionDate).getTime() : 0);
        
        if (timeA !== timeB) {
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        }
        return a.name.localeCompare(b.name, 'zh-Hant');
      }
    });
  }, [patients, searchTerm, statusFilter, sortBy, sortOrder]);

  // Overall statistics
  const analyticsData = useMemo(() => {
    const totalCount = patients.length;
    const activeCount = patients.filter(p => p.status === 'active').length;
    const archivedCount = patients.filter(p => p.status === 'archived').length;

    let totalCompletedTasksSum = 0;
    const categoryAverages: Record<string, { totalDone: number; totalPossible: number }> = {};

    CATEGORY_KEYS.forEach(cat => {
      const catTasks = TASKS.filter(t => t.category === cat);
      categoryAverages[cat] = {
        totalDone: 0,
        totalPossible: catTasks.length * (activeCount || 1),
      };
    });

    patients.forEach(p => {
      totalCompletedTasksSum += (p.completedTasks || []).length;
      if (p.status === 'active') {
        p.completedTasks?.forEach(taskId => {
          const t = TASKS.find(item => item.id === taskId);
          if (t && categoryAverages[t.category]) {
            categoryAverages[t.category].totalDone += 1;
          }
        });
      }
    });

    const averageCompleted = activeCount > 0 ? (totalCompletedTasksSum / activeCount).toFixed(1) : '0';
    const averageRate = activeCount > 0 ? Math.round((totalCompletedTasksSum / (activeCount * TOTAL_MAIN_TASKS)) * 100) : 0;

    // Detailed category breakdown
    const categoryStats = CATEGORY_KEYS.map(cat => {
      const catTasks = TASKS.filter(t => t.category === cat);
      const avg = categoryAverages[cat];
      const totalDone = avg ? avg.totalDone : 0;
      const totalPossible = catTasks.length * (activeCount || 1);
      const rate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
      const averagePerPatient = activeCount > 0 ? (totalDone / activeCount).toFixed(1) : '0';
      return {
        category: cat,
        tasksCount: catTasks.length,
        totalPossible,
        totalDone,
        rate,
        averagePerPatient,
      };
    });

    const sortedCategories = [...categoryStats].sort((a, b) => b.rate - a.rate);
    const highestDomain = sortedCategories[0] || { category: '食', rate: 0 };
    const lowestDomain = sortedCategories[sortedCategories.length - 1] || { category: '樂', rate: 0 };

    const radarData = categoryStats.map(s => ({
      subject: s.category,
      score: s.rate,
      fullMark: 100,
      done: s.totalDone,
      possible: s.totalPossible,
    }));

    // Tier stages (銅盃、銀盃、金盃)
    const tierDefs = [
      { tier: 'bronze', label: '銅盃階段', title: '基礎自理', subLabel: '床邊衛生、個人照護與微小幸福', color: 'text-amber-800', bg: 'bg-amber-500', lightBg: 'bg-amber-50', border: 'border-amber-200' },
      { tier: 'silver', label: '銀盃階段', title: '進階探索', subLabel: '環境轉位、家務料理與真實探索', color: 'text-slate-800', bg: 'bg-slate-500', lightBg: 'bg-slate-50', border: 'border-slate-200' },
      { tier: 'gold', label: '金盃階段', title: '社會參與', subLabel: '社區適應、科技互動與自我實現', color: 'text-yellow-800', bg: 'bg-yellow-500', lightBg: 'bg-yellow-50', border: 'border-yellow-200' },
    ];

    const tierStats = tierDefs.map(def => {
      const tierTasks = TASKS.filter(t => t.category !== '選修' && t.category !== '全部' && t.tier === def.tier);
      let totalDone = 0;
      patients.forEach(p => {
        if (p.status === 'active') {
          (p.completedTasks || []).forEach(tId => {
            const t = tierTasks.find(x => x.id === tId);
            if (t) totalDone += 1;
          });
        }
      });
      const totalPossible = tierTasks.length * (activeCount || 1);
      const rate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
      const averagePerPatient = activeCount > 0 ? (totalDone / activeCount).toFixed(1) : '0';
      return {
        ...def,
        totalTasks: tierTasks.length,
        totalDone,
        rate,
        averagePerPatient,
      };
    });

    // Co-learning partner statistics across active patients
    let totalSelf = 0;
    let totalFamily = 0;
    let totalAttendant = 0;
    let totalMedical = 0;
    let totalTaggedTasks = 0;
    let activePatientsWithPartnerData = 0;

    patients.forEach(p => {
      if (p.status === 'active') {
        const pPartners = p.taskPartners || {};
        let pHasTags = false;
        Object.entries(pPartners).forEach(([, partners]) => {
          if (Array.isArray(partners) && partners.length > 0) {
            pHasTags = true;
            totalTaggedTasks += 1;
            if (partners.includes('自己完成')) totalSelf += 1;
            if (partners.includes('家屬夥伴') || partners.includes('家屬陪伴')) totalFamily += 1;
            if (partners.includes('多功能型照顧服務員')) totalAttendant += 1;
            if (partners.includes('醫療團隊')) totalMedical += 1;
          }
        });
        if (pHasTags) activePatientsWithPartnerData += 1;
      }
    });

    const totalPartnerSelections = totalSelf + totalFamily + totalAttendant + totalMedical;
    const partnerStats = {
      totalSelf,
      totalFamily,
      totalAttendant,
      totalMedical,
      totalTaggedTasks,
      totalPartnerSelections,
      activePatientsWithPartnerData,
      selfRate: totalPartnerSelections > 0 ? Math.round((totalSelf / totalPartnerSelections) * 100) : 0,
      familyRate: totalPartnerSelections > 0 ? Math.round((totalFamily / totalPartnerSelections) * 100) : 0,
      attendantRate: totalPartnerSelections > 0 ? Math.round((totalAttendant / totalPartnerSelections) * 100) : 0,
      medicalRate: totalPartnerSelections > 0 ? Math.round((totalMedical / totalPartnerSelections) * 100) : 0,
    };

    return {
      totalCount,
      activeCount,
      archivedCount,
      averageCompleted,
      averageRate,
      categoryAverages,
      categoryStats,
      sortedCategories,
      highestDomain,
      lowestDomain,
      radarData,
      tierStats,
      partnerStats,
    };
  }, [patients]);

  // Export Analytics Image Card (PNG) with 4K Ultra-HD
  const handleExportAnalyticsImage = async () => {
    if (!analyticsImageCardRef.current) return;
    setIsExportingImage(true);
    // Directly output 4K resolution (scale 3.5, 300 DPI print-ready high clarity)
    const targetScale = 3.5;
    try {
      const canvas = await html2canvas(analyticsImageCardRef.current, {
        scale: targetScale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
      });
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `全院個案成效分析圖卡_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setImageExportSuccess(true);
      setTimeout(() => setImageExportSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  // Batch Export all patients to CSV
  const handleExportAllPatientsCSV = () => {
    const headers = [
      '個案識別碼',
      '個案姓名',
      '床號',
      '年紀',
      '病歷號碼',
      '上游醫院',
      '照顧者',
      '個案家在哪',
      '主要醫療決定者',
      '家庭/婚姻',
      '經濟',
      '病前職業生活',
      '興趣/特殊專長',
      '教育程度',
      '居住環境',
      '同住家人',
      '病前性格',
      '病後個性',
      '主責治療師',
      '評估/入案日期',
      '核心生活目標',
      '在案狀態',
      '總達成任務數',
      '達成率(%)',
      '食(達成數)',
      '衣(達成數)',
      '住(達成數)',
      '行(達成數)',
      '育(達成數)',
      '樂(達成數)',
      '自己完成數',
      '家屬夥伴數',
      '照服員協助數',
      '醫療團隊數',
      '自主自立率(%)',
      '最後更新時間'
    ];

    const rows = patients.map(p => {
      const pTasks = p.completedTasks || [];
      const rate = Math.round((pTasks.length / TOTAL_MAIN_TASKS) * 100);
      
      const counts: Record<string, number> = { '食': 0, '衣': 0, '住': 0, '行': 0, '育': 0, '樂': 0 };
      pTasks.forEach(tId => {
        const t = TASKS.find(x => x.id === tId);
        if (t && counts[t.category] !== undefined) {
          counts[t.category] += 1;
        }
      });

      // Partner counts for this patient
      const pPartners = p.taskPartners || {};
      let pSelf = 0;
      let pFamily = 0;
      let pAttendant = 0;
      let pMedical = 0;
      Object.values(pPartners).forEach(partners => {
        if (Array.isArray(partners)) {
          if (partners.includes('自己完成')) pSelf += 1;
          if (partners.includes('家屬夥伴') || partners.includes('家屬陪伴')) pFamily += 1;
          if (partners.includes('多功能型照顧服務員')) pAttendant += 1;
          if (partners.includes('醫療團隊')) pMedical += 1;
        }
      });
      const pTotalSelections = pSelf + pFamily + pAttendant + pMedical;
      const pSelfRate = pTotalSelections > 0 ? `${Math.round((pSelf / pTotalSelections) * 100)}%` : '0%';

      const sanitize = (val?: string) => `"${(val || '').replace(/"/g, '""')}"`;

      return [
        p.id,
        p.name,
        sanitize(p.bedNumber),
        sanitize(p.age),
        p.caseNumber || '',
        sanitize(p.upstreamHospital),
        sanitize(p.caregiver),
        sanitize(p.homeLocation),
        sanitize(p.primaryMedicalDecisionMaker),
        sanitize(p.familyMarriage),
        sanitize(p.economicStatus),
        sanitize(p.preMorbidOccupation),
        sanitize(p.interestsSpecialties),
        sanitize(p.educationLevel),
        sanitize(p.livingEnvironment),
        sanitize(p.cohabitingFamily),
        sanitize(p.preMorbidPersonality),
        sanitize(p.postMorbidPersonality),
        p.primaryTherapist || '',
        p.admissionDate || '',
        sanitize(p.targetGoal),
        p.status === 'active' ? '在案中' : '已結案',
        pTasks.length,
        `${rate}%`,
        counts['食'],
        counts['衣'],
        counts['住'],
        counts['行'],
        counts['育'],
        counts['樂'],
        pSelf,
        pFamily,
        pAttendant,
        pMedical,
        pSelfRate,
        p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : ''
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `全院復健個案進度總表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Staff management helper handlers
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffNameInput('');
    setStaffTitleInput('職能治療師');
    setStaffPinInput('000000');
    setStaffNotesInput('');
    setStaffModalError('');
    setShowStaffModal(true);
  };

  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setStaffNameInput(staff.name);
    setStaffTitleInput(staff.title);
    setStaffPinInput(staff.pin);
    setStaffNotesInput(staff.notes || '');
    setStaffModalError('');
    setShowStaffModal(true);
  };

  const handleSaveStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffNameInput.trim()) {
      setStaffModalError('請輸入人員姓名');
      return;
    }
    if (staffPinInput && !/^\d{6}$/.test(staffPinInput.trim())) {
      setStaffModalError('密碼必須剛好為 6 位數字');
      return;
    }
    const res = saveStaffMember({
      id: editingStaff?.id,
      name: staffNameInput,
      title: staffTitleInput,
      pin: staffPinInput,
      notes: staffNotesInput,
    });
    if (res.success) {
      setStaffList(getStaffMembers());
      setShowStaffModal(false);
      setSecuritySuccessMsg(editingStaff ? `已更新人員【${staffNameInput}】資料！` : `成功新增編輯人員【${staffNameInput}】！`);
      setSecurityErrorMsg('');
      setTimeout(() => setSecuritySuccessMsg(''), 4000);
    } else {
      setStaffModalError(res.error || '儲存失敗');
    }
  };

  const handleResetStaffPinConfirm = (id: string, name: string) => {
    const res = resetStaffPinToDefault(id);
    if (res.success) {
      setStaffList(getStaffMembers());
      setConfirmResetStaffId(null);
      setSecuritySuccessMsg(`已將人員【${name}】的密碼還原為系統預設值！`);
      setSecurityErrorMsg('');
      setTimeout(() => setSecuritySuccessMsg(''), 4000);
    } else {
      setSecurityErrorMsg(res.error || '重設失敗');
    }
  };

  const handleDeleteStaffConfirm = (id: string, name: string) => {
    const res = deleteStaffMember(id);
    if (res.success) {
      setStaffList(getStaffMembers());
      setConfirmDeleteStaffId(null);
      setSecuritySuccessMsg(`已移除編輯人員【${name}】！`);
      setSecurityErrorMsg('');
      setTimeout(() => setSecuritySuccessMsg(''), 4000);
    } else {
      setSecurityErrorMsg(res.error || '刪除失敗');
      setConfirmDeleteStaffId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-[#F4F0E6] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[1200px] h-[95vh] sm:h-[92vh] overflow-hidden flex flex-col border border-stone-300"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 bg-[#FCFAF5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700 text-white rounded-2xl shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-stone-900">個案管理後台系統</h2>
                {userRole === 'admin' ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>最高管理員</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>臨床編輯人員</span>
                  </span>
                )}
                {isOnline ? (
                  <div 
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs cursor-default"
                    title="雲端資料庫連線正常，所有異動已自動即時同步"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>雲端即時同步</span>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs cursor-default"
                    title="目前處於離線狀態，所有操作將自動暫存於本機，待連線後會自動回傳同步"
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span>本機暫存 (離線模式)</span>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-500">
                管理全體個案之日常生活功能解鎖進度、多案統計與批次報表匯出
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-200 rounded-full text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              title="關閉返回護照頁面"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar - Unified & Symmetrical */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-stone-200 bg-[#FCFAF5] flex items-center justify-between gap-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'roster' 
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/20' 
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>個案名冊列表</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                activeTab === 'roster' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {patients.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'analytics' 
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/20' 
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>跨個案成效統計</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'reports' 
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/20' 
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>報表與資料中心</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'security' 
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/20' 
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>權限與密碼管理</span>
              {userRole === 'admin' && !isEditorPinDefault() && (
                <span className="w-2 h-2 rounded-full bg-amber-400" title="編輯人員密碼非預設值"></span>
              )}
            </button>
          </div>
        </div>

        {/* Content Body - Unified Parchment Container matching Passport view */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F4F0E6]">
          {activeTab === 'roster' ? (
            /* Patient Roster View */
            <div className="max-w-[1200px] mx-auto w-full space-y-6">
              {/* Unified Hero Banner for Roster */}
              <div className="bg-[#FCFAF5] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-sm shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-stone-900">個案名冊列表</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        共 {patients.length} 位在冊學員
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                      檢視全體個案復健任務解鎖狀況、快速切換編輯目標或建立新學員
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                  <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>新增個案</span>
                  </button>
                </div>
              </div>

              {/* Search, Filter & Sorting Bar */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜尋姓名、病歷號或負責治療師..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="active">在案中學員</option>
                    <option value="archived">已結案學員</option>
                    <option value="all">全部狀態</option>
                  </select>

                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl p-0.5">
                    <div className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs text-stone-600 font-medium">
                      <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                      <span className="text-[11px] text-stone-400 hidden sm:inline">排序:</span>
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as 'date' | 'progress')}
                        className="bg-transparent text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
                      >
                        <option value="date">新增日期</option>
                        <option value="progress">達成率</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        sortOrder === 'desc' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {sortOrder === 'desc' ? (
                        <>
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{sortBy === 'date' ? '新→舊' : '高→低'}</span>
                        </>
                      ) : (
                        <>
                          <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                          <span>{sortBy === 'date' ? '舊→新' : '低→高'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {createSuccessNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{createSuccessNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreateSuccessNotice(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 hover:bg-emerald-100 rounded-lg transition shrink-0 cursor-pointer"
                  >
                    我知道了
                  </button>
                </motion.div>
              )}

              {filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-stone-700 text-base mb-1">
                  {patients.length === 0 ? '目前雲端資料庫尚無個案' : '找不到符合條件的個案'}
                </h3>
                <p className="text-stone-400 text-xs max-w-xs mb-4">
                  {patients.length === 0 
                    ? '點擊右上角「新增個案」，為您的第一位病人建立專屬生活功能解鎖護照！' 
                    : '請嘗試更換搜尋關鍵字或狀態篩選。'}
                </p>
                {patients.length === 0 && (
                  <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition"
                  >
                    立即新增第一位個案
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-700">共 {filteredPatients.length} 位個案</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-600">
                      依「<span className="font-bold text-emerald-800">{sortBy === 'date' ? '新增日期' : '生活功能達成率'}</span>」
                      {sortOrder === 'desc' 
                        ? (sortBy === 'date' ? '由新至舊 (降冪)' : '由高至低 (降冪)') 
                        : (sortBy === 'date' ? '由舊至新 (升冪)' : '由低至高 (升冪)')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-stone-400">快速切換:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (sortBy === 'date') {
                          setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                        } else {
                          setSortBy('date');
                          setSortOrder('desc');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                        sortBy === 'date'
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-stone-200/80 text-stone-600 hover:bg-stone-300'
                      }`}
                      title="依新增日期排序 (點擊切換升降冪)"
                    >
                      <span>📅 新增日期</span>
                      {sortBy === 'date' && (
                        <span>{sortOrder === 'desc' ? '↓降' : '↑升'}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (sortBy === 'progress') {
                          setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                        } else {
                          setSortBy('progress');
                          setSortOrder('desc');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                        sortBy === 'progress'
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-stone-200/80 text-stone-600 hover:bg-stone-300'
                      }`}
                      title="依達成率排序 (點擊切換升降冪)"
                    >
                      <span>🎯 達成率</span>
                      {sortBy === 'progress' && (
                        <span>{sortOrder === 'desc' ? '↓降' : '↑升'}</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPatients.map(patient => {
                  const tasksCount = (patient.completedTasks || []).length;
                  const progressRate = Math.round((tasksCount / TOTAL_MAIN_TASKS) * 100);
                  const isCurrent = activePatientId === patient.id;
                  const isNewlyCreated = newlyCreatedPatientId === patient.id;

                  return (
                    <motion.div
                      key={patient.id}
                      whileHover={{ y: -2 }}
                      onClick={() => {
                        if (isCurrent) {
                          onSelectPatient(patient);
                          onClose();
                        } else {
                          setConfirmingSwitchPatient(patient);
                        }
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative bg-white ${
                        isNewlyCreated
                          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-md bg-emerald-50/10'
                          : isCurrent 
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md' 
                            : 'border-stone-200 hover:border-emerald-300 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                            isCurrent ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
                          }`}>
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-stone-900 text-base">{patient.name}</h4>
                              {isNewlyCreated && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                                  剛建立
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                  使用中
                                </span>
                              )}
                              {patient.status === 'archived' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-stone-100 text-stone-500">
                                  已結案
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-stone-400 font-mono flex items-center gap-1.5 flex-wrap">
                              <span>編號: {patient.caseNumber || '無編號'}</span>
                              {patient.bedNumber && (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-sans font-bold text-[10px]">
                                  🛏️ {patient.bedNumber} 床
                                </span>
                              )}
                              {patient.age && (
                                <span className="bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-sans font-bold text-[10px]">
                                  {patient.age} 歲
                                </span>
                              )}
                              <span>• 主責: {patient.primaryTherapist || '未指定'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => handleStartEdit(patient, e)}
                            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition"
                            title="編輯基本資料"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => handleToggleArchive(patient, e)}
                            className={`p-1.5 rounded-lg transition flex items-center gap-1 ${
                              archivingId === patient.id
                                ? 'bg-amber-500 text-white px-2 text-xs font-bold'
                                : 'hover:bg-stone-100 text-stone-400 hover:text-stone-700'
                            }`}
                            title={
                              archivingId === patient.id
                                ? '點擊確認變更狀態'
                                : (patient.status === 'active' ? '標記為結案歸檔' : '恢復為在案')
                            }
                          >
                            <FolderArchive className="w-3.5 h-3.5" />
                            {archivingId === patient.id && (
                              <span className="text-[11px]">{patient.status === 'active' ? '確定結案?' : '確定重啟?'}</span>
                            )}
                          </button>
                          <button
                            onClick={e => handleDelete(patient.id, e)}
                            className={`p-1.5 rounded-lg transition flex items-center gap-1 ${
                              deletingId === patient.id
                                ? 'bg-red-600 text-white px-2 text-xs font-bold'
                                : 'hover:bg-red-50 text-stone-300 hover:text-red-600'
                            }`}
                            title={deletingId === patient.id ? '點擊確認刪除' : '刪除個案'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deletingId === patient.id && <span>確定刪除?</span>}
                          </button>
                        </div>
                      </div>

                      {/* Goal */}
                      {patient.targetGoal && (
                        <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-lg mb-3 border border-emerald-100">
                          <span className="font-bold">目標:</span> {patient.targetGoal}
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-500">解鎖進度</span>
                          <span className="font-bold text-emerald-700">{tasksCount} / {TOTAL_MAIN_TASKS} ({progressRate}%)</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progressRate, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-stone-400">
                          <span>評估: {patient.admissionDate || '未填寫'}</span>
                          {patient.createdAt && (
                            <span className="text-[11px] text-stone-400">
                              • 建檔: {new Date(patient.createdAt).toLocaleDateString('zh-TW')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewDetailPatient(patient);
                            }}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold flex items-center gap-1 transition text-xs border border-stone-200 cursor-pointer"
                            title="檢視個案基本資料與社會心理評估"
                          >
                            <Eye className="w-3.5 h-3.5 text-stone-600" />
                            <span>個案資料</span>
                          </button>
                          {onOpenQuadrant && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPatient(patient);
                                onClose();
                                onOpenQuadrant();
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center gap-1 transition text-xs border border-amber-200"
                              title="開啟此個案之 5大願望分析儀"
                            >
                              <Target className="w-3.5 h-3.5 text-amber-600" />
                              <span>願望象限儀</span>
                            </button>
                          )}
                          {onOpenReportModal && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPatient(patient);
                                onOpenReportModal();
                              }}
                              className="px-2 py-1 bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 rounded-lg font-bold flex items-center gap-1 transition"
                              title="開啟此個案臨床檢核報表"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" />
                              <span>報表/列印</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCurrent) {
                                onSelectPatient(patient);
                                onClose();
                              } else {
                                setConfirmingSwitchPatient(patient);
                              }
                            }}
                            className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 group-hover:translate-x-0.5 transition"
                          >
                            <span>{isCurrent ? '繼續護照' : '進入護照'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              </div>
            )}
            </div>
          ) : activeTab === 'analytics' ? (
            /* Analytics View */
            <div className="max-w-[1200px] mx-auto w-full space-y-6">
              {/* Unified Hero Banner for Analytics */}
              <div className="bg-[#FCFAF5] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-700 text-white flex items-center justify-center shadow-sm shrink-0">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-stone-900">跨個案成效統計</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                        樣本共 {analyticsData.totalCount} 案
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                      即時彙整全院六大生活領域達成率、金銀銅盃突破率與臨床品質指標
                    </p>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
                  {/* Export Image PNG Button (Direct 4K Output) */}
                  <button
                    onClick={() => handleExportAnalyticsImage()}
                    disabled={isExportingImage}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="匯出高解析度長圖卡 (PNG)"
                  >
                    {isExportingImage ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : imageExportSuccess ? (
                      <Check className="w-4 h-4 text-emerald-200" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    <span>
                      {isExportingImage 
                        ? '圖片產製中...' 
                        : imageExportSuccess 
                        ? '圖片已下載！' 
                        : '繪出圖片'}
                    </span>
                  </button>

                  {/* Export Clinical Report PDF / Print */}
                  <button
                    onClick={() => setShowCrossPatientReport(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition active:scale-95 cursor-pointer"
                    title="開啟跨個案醫療品管評鑑正式報表 (100% 向量超高解析度，A4 PDF / 列印)"
                  >
                    <Printer className="w-4 h-4" />
                    <span>列印 / 向量 PDF 品管報表</span>
                  </button>

                  {/* Batch CSV */}
                  <button
                    onClick={handleExportAllPatientsCSV}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    title="匯出全體個案明細 Excel (CSV)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                    <span>匯出 CSV</span>
                  </button>
                </div>
              </div>

              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
                  <div className="text-xs font-bold text-stone-400">在案總人數</div>
                  <div className="text-2xl font-black text-stone-800 mt-1">{analyticsData.activeCount} <span className="text-xs font-normal text-stone-400">位</span></div>
                  <div className="text-[11px] text-stone-400 mt-1">累計總收案 {analyticsData.totalCount} 位</div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
                  <div className="text-xs font-bold text-stone-400">平均達成任務數</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{analyticsData.averageCompleted} <span className="text-xs font-normal text-stone-400">項</span></div>
                  <div className="text-[11px] text-stone-400 mt-1">總題庫共 {TOTAL_MAIN_TASKS} 核心項</div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
                  <div className="text-xs font-bold text-stone-400">全體平均生活自理率</div>
                  <div className="text-2xl font-black text-blue-700 mt-1">{analyticsData.averageRate}%</div>
                  <div className="text-[11px] text-stone-400 mt-1">跨領域平均指標</div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
                  <div className="text-xs font-bold text-stone-400">已光榮結案歸檔</div>
                  <div className="text-2xl font-black text-amber-600 mt-1">{analyticsData.archivedCount} <span className="text-xs font-normal text-stone-400">位</span></div>
                  <div className="text-[11px] text-stone-400 mt-1">已順利回歸居家生活</div>
                </div>
              </div>

              {/* Domain Breakdown: Radar Chart + Progress Bars */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Radar Chart (5 cols) */}
                <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        六大生活領域能力雷達圖
                      </h3>
                      <span className="text-[11px] font-semibold text-stone-400">100% 標竿對照</span>
                    </div>
                    <p className="text-xs text-stone-500 mb-2">
                      直觀比對「食、衣、住、行、育、樂」各向度功能發展均衡度
                    </p>

                    <div className="w-full h-56 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={analyticsData.radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} 
                          />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                          <Radar 
                            name="全院平均達成率" 
                            dataKey="score" 
                            stroke="#059669" 
                            fill="#10b981" 
                            fillOpacity={0.4} 
                          />
                          <RechartsTooltip 
                            formatter={(value: any) => [`${value}%`, '達成率']}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Domain Extremes Callouts */}
                  <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-stone-100 mt-2">
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-[10px] font-bold text-emerald-700">🥇 達成率最高領域</div>
                      <div className="text-sm font-black text-emerald-900 mt-0.5">
                        【{analyticsData.highestDomain.category}】領域 ({analyticsData.highestDomain.rate}%)
                      </div>
                      <div className="text-[10px] text-emerald-600 mt-0.5">全院個案普遍掌握良好</div>
                    </div>

                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="text-[10px] font-bold text-amber-800">⚠️ 最需強化領域</div>
                      <div className="text-sm font-black text-amber-900 mt-0.5">
                        【{analyticsData.lowestDomain.category}】領域 ({analyticsData.lowestDomain.rate}%)
                      </div>
                      <div className="text-[10px] text-amber-700 mt-0.5">建議列入下階段治療重點</div>
                    </div>
                  </div>
                </div>

                {/* Progress Bars (7 cols) */}
                <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-stone-800 text-sm mb-1 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      各生活領域在案達成率與人均解鎖項數
                    </h3>
                    <p className="text-xs text-stone-500 mb-4">
                      依各領域核心題庫與在案個案完成狀況計算
                    </p>

                    <div className="space-y-3.5">
                      {analyticsData.categoryStats.map(cat => {
                        return (
                          <div key={cat.category} className="space-y-1.5 p-2 rounded-xl hover:bg-stone-50/70 transition">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-stone-800 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                                <span>{cat.category} 領域</span>
                                <span className="text-[11px] text-stone-400 font-normal">（題庫共 {cat.tasksCount} 項）</span>
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] text-stone-500">人均解鎖 <strong className="text-stone-700">{cat.averagePerPatient}</strong> 項</span>
                                <span className="font-black text-stone-800 text-xs w-10 text-right">{cat.rate}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(cat.rate, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-400 pt-3 border-t border-stone-100 mt-3 flex items-center justify-between">
                    <span>各領域標準題數：食 (25) • 衣 (25) • 住 (25) • 行 (25) • 育 (25) • 樂 (25)</span>
                    <span className="text-emerald-700 font-bold">總核心 150 項</span>
                  </div>
                </div>
              </div>

              {/* Tier Stages Progression: Bronze, Silver, Gold (階段性差異分析) */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 text-sm">
                        階梯式復健能力層次 (銅盃/銀盃/金盃) 階段性進度分析
                      </h3>
                      <p className="text-xs text-stone-500">
                        由基礎床邊自理（銅盃）、進階居家探索（銀盃）至真實社會參與（金盃）之能力階梯差異
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg">
                    階段落差分析
                  </span>
                </div>

                {/* 3 Stage Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {analyticsData.tierStats.map(stage => (
                    <div 
                      key={stage.tier} 
                      className={`p-4 rounded-2xl border ${stage.border} ${stage.lightBg} flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${stage.color} bg-white/80 border border-current`}>
                            {stage.label}
                          </span>
                          <span className="text-base font-black text-stone-800 font-mono">
                            {stage.rate}%
                          </span>
                        </div>
                        <div className="font-bold text-stone-800 text-sm mt-1">{stage.title}</div>
                        <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">{stage.subLabel}</div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-200/60">
                        <div className="flex justify-between text-xs text-stone-600 mb-1.5">
                          <span>人均完成項數</span>
                          <span className="font-bold text-stone-800">{stage.averagePerPatient} / {stage.totalTasks} 項</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-stone-200">
                          <div
                            className={`${stage.bg} h-2 rounded-full`}
                            style={{ width: `${Math.min(stage.rate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clinical Phase Progression Advice Box */}
                <div className="mt-4 p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>💡 臨床階段突破指引：</strong>
                    全院在案個案於<strong>【銅盃基礎自理】</strong>達成率達 <strong className="text-emerald-800">{analyticsData.tierStats[0]?.rate}%</strong>，已建立穩固的個人照護能力；
                    進階探索（銀盃：{analyticsData.tierStats[1]?.rate}%）與真實社會參與（金盃：{analyticsData.tierStats[2]?.rate}%）呈現典型的階梯遞減，建議治療團隊針對達標銅盃之個案，及早規劃戶外社區模擬演練與科技輔具導入。
                  </div>
                </div>
              </div>

              {/* Co-learning Partners Distribution (共學夥伴協同支持與自立賦能結構) */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 text-sm">
                        共學夥伴協同支持與自立賦能結構 (Co-Learning Partners Distribution)
                      </h3>
                      <p className="text-xs text-stone-500">
                        四項目協同分佈：自己完成（完全自立）、家屬夥伴（家庭陪伴）、多功能型照顧服務員（照服人力）與醫療團隊（專業介入）
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100/80 text-emerald-800 rounded-lg border border-emerald-200 w-fit">
                    賦能網絡監測
                  </span>
                </div>

                {/* 4 Partner Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
                  {/* 自己完成 */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-800">自己完成</span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {analyticsData.partnerStats.selfRate}%
                        </span>
                      </div>
                      <div className="text-2xl font-black text-emerald-950 font-mono">
                        {analyticsData.partnerStats.totalSelf} <span className="text-xs font-normal text-emerald-700">次標記</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-2 font-medium">
                      🏆 獨立自主成效指標
                    </div>
                  </div>

                  {/* 家屬夥伴 */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-amber-800">家屬夥伴</span>
                        <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          {analyticsData.partnerStats.familyRate}%
                        </span>
                      </div>
                      <div className="text-2xl font-black text-amber-950 font-mono">
                        {analyticsData.partnerStats.totalFamily} <span className="text-xs font-normal text-amber-700">次標記</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-amber-700 mt-2 font-medium">
                      👨‍👩‍👧 家庭賦能親友陪伴
                    </div>
                  </div>

                  {/* 多功能型照顧服務員 */}
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-sky-800">多功能型照顧服務員</span>
                        <span className="text-xs font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                          {analyticsData.partnerStats.attendantRate}%
                        </span>
                      </div>
                      <div className="text-2xl font-black text-sky-950 font-mono">
                        {analyticsData.partnerStats.totalAttendant} <span className="text-xs font-normal text-sky-700">次標記</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-sky-700 mt-2 font-medium">
                      🤝 照服多元生活輔助
                    </div>
                  </div>

                  {/* 醫療團隊 */}
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-purple-800">醫療團隊</span>
                        <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                          {analyticsData.partnerStats.medicalRate}%
                        </span>
                      </div>
                      <div className="text-2xl font-black text-purple-950 font-mono">
                        {analyticsData.partnerStats.totalMedical} <span className="text-xs font-normal text-purple-700">次標記</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-purple-700 mt-2 font-medium">
                      🩺 專業技術指導介入
                    </div>
                  </div>
                </div>

                {/* Distribution Progress Bar */}
                {analyticsData.partnerStats.totalPartnerSelections > 0 ? (
                  <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="flex justify-between text-xs font-bold text-stone-700 mb-2">
                      <span>全院共學夥伴整體分佈比率</span>
                      <span className="text-stone-500 font-normal">
                        全院累計 {analyticsData.partnerStats.totalTaggedTasks} 項已標記任務 (總計 {analyticsData.partnerStats.totalPartnerSelections} 標記人次)
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-3.5 rounded-full overflow-hidden flex shadow-inner">
                      {analyticsData.partnerStats.selfRate > 0 && (
                        <div 
                          className="bg-emerald-500 h-full transition-all" 
                          style={{ width: `${analyticsData.partnerStats.selfRate}%` }} 
                          title={`自己完成: ${analyticsData.partnerStats.selfRate}%`}
                        />
                      )}
                      {analyticsData.partnerStats.familyRate > 0 && (
                        <div 
                          className="bg-amber-500 h-full transition-all" 
                          style={{ width: `${analyticsData.partnerStats.familyRate}%` }} 
                          title={`家屬夥伴: ${analyticsData.partnerStats.familyRate}%`}
                        />
                      )}
                      {analyticsData.partnerStats.attendantRate > 0 && (
                        <div 
                          className="bg-sky-500 h-full transition-all" 
                          style={{ width: `${analyticsData.partnerStats.attendantRate}%` }} 
                          title={`多功能型照顧服務員: ${analyticsData.partnerStats.attendantRate}%`}
                        />
                      )}
                      {analyticsData.partnerStats.medicalRate > 0 && (
                        <div 
                          className="bg-purple-500 h-full transition-all" 
                          style={{ width: `${analyticsData.partnerStats.medicalRate}%` }} 
                          title={`醫療團隊: ${analyticsData.partnerStats.medicalRate}%`}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-stone-600 justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 自己完成 ({analyticsData.partnerStats.selfRate}%)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 家屬夥伴 ({analyticsData.partnerStats.familyRate}%)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> 多功能型照服員 ({analyticsData.partnerStats.attendantRate}%)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> 醫療團隊 ({analyticsData.partnerStats.medicalRate}%)</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-stone-50 border border-dashed border-stone-200 rounded-xl text-center text-xs text-stone-500">
                    目前尚未有個案標記共學夥伴。當治療師與個案在護照任務中標記「自己完成、家屬夥伴、多功能型照顧服務員、醫療團隊」後，此處將自動產生全院協同與自立賦能結構分析。
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'reports' ? (
            /* Reports & Data Center View */
            <div className="max-w-[1200px] mx-auto w-full space-y-6">
              {/* Unified Hero Banner for Reports */}
              <div className="bg-[#FCFAF5] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-sm shrink-0">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-stone-900">報表與資料中心</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        支援 A4 • PDF • Word • CSV
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                      臨床生活功能評鑑檢核表生成、A4/PDF 列印、Word 臨床檔與全院備份匯出
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                  <span className="text-xs text-stone-500 bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-xs">
                    當前選定個案：<strong className="text-stone-800 font-bold">{patientName || '未命名'}</strong> ({completedTasksCount} 項完成)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Clinical Report Export Card */}
                <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                        <Printer className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800 text-base">臨床檢核報表匯出與列印</h4>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          A4 • PDF • Word • CSV
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed mb-4">
                      產生符合臨床評估規範的完整任務勾選清單。支援直接列印為 A4 / PDF 格式、下載 Word (.docx) 臨床編輯檔，以及匯出 Excel 專用 CSV 檔案。
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      當前個案：<strong className="text-stone-700">{patientName || '未命名'}</strong> ({completedTasksCount} 項完成)
                    </span>
                    <button
                      onClick={() => {
                        if (onOpenReportModal) {
                          onOpenReportModal();
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      開啟報表生成器
                    </button>
                  </div>
                </div>

                {/* Text Summary Card */}
                <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                        <Copy className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800 text-base">文字摘要快速複製</h4>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                          剪貼簿 • 病歷交班 • 通訊回報
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed mb-4">
                      快速將目前個案的復健進度、總達成率、金銀銅盃統計以及已完成項目名稱格式化為精簡文字，方便直接貼至病歷系統或與家屬回報。
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      {copiedSummary ? <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> 已複製到剪貼簿</span> : '隨時一鍵複製'}
                    </span>
                    <button
                      onClick={() => {
                        if (onExportSummary) {
                          onExportSummary();
                          setCopiedSummary(true);
                          setTimeout(() => setCopiedSummary(false), 2000);
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Copy className="w-4 h-4" />
                      複製文字摘要
                    </button>
                  </div>
                </div>

                {/* JSON Backup and Restore Card */}
                <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
                        <HardDrive className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800 text-base">JSON 檔案備份與還原</h4>
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                          結構化備份檔 • 離線封存
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed mb-4">
                      匯出包含所有已勾選任務 ID、協同人員、時間標記的 JSON 結構化檔案；亦可上傳過往備份檔案進行完整還原。
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (onImportJSON) {
                          onImportJSON(e);
                        }
                      }}
                      accept=".json,application/json"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
                    >
                      <Upload className="w-4 h-4" />
                      匯入 JSON
                    </button>
                    <button
                      onClick={() => {
                        if (onExportJSON) {
                          onExportJSON();
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      匯出 JSON
                    </button>
                  </div>
                </div>

                {/* All Patients CSV Export Card */}
                <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800 text-base">全體個案統計總表 CSV</h4>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          院內品管 • Excel 批次分析
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed mb-4">
                      批次匯出所有在案與結案個案的名冊、病歷號、主責治療師、收案日、核心生活目標、各生活領域達成率及總達成指標。
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      全院共 {patients.length} 位個案紀錄
                    </span>
                    <button
                      onClick={handleExportAllPatientsCSV}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      匯出全體總表 (CSV)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'security' ? (
            /* Security & Password Management Tab */
            <div className="max-w-[1200px] mx-auto w-full space-y-6">
              {/* Alert Feedback Messages */}
              {securitySuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-xs font-bold shadow-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{securitySuccessMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecuritySuccessMsg('')}
                    className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {securityErrorMsg && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center justify-between gap-3 text-red-800 text-xs font-bold shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>{securityErrorMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityErrorMsg('')}
                    className="p-1 hover:bg-red-100 rounded-lg text-red-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Unified Hero Banner for Security */}
              <div className="bg-[#FCFAF5] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-sm shrink-0 ${
                    userRole === 'admin' ? 'bg-indigo-700' : 'bg-emerald-700'
                  }`}>
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-stone-900">權限與密碼管理</h3>
                      {userRole === 'admin' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                          最高管理員 (Super Admin)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          臨床工作人員 (Clinical Staff)
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                      {userRole === 'admin'
                        ? '維護全院臨床工作人員名冊、重設同仁登入 PIN 碼'
                        : '維護個人 6 位數安全登入 PIN 碼、檢視臨床作業權限與帳號身分證件'}
                    </p>
                  </div>
                </div>

                {onLogout && (
                  <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>切換身分 / 登出</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Staff Members Directory (具名編輯人員名冊) - 僅最高管理員可見 */}
              {userRole === 'admin' && (
                <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-xl border border-emerald-200">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                        <span>臨床工作人員名冊</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                          共 {staffList.length} 人
                        </span>
                      </h4>
                      <span className="text-[11px] text-stone-500">
                        由最高管理員指派並為其取名；同仁登入時可直接選取自己的名字與輸入專屬 6 位數 PIN 碼
                      </span>
                    </div>
                  </div>

                  {userRole === 'admin' ? (
                    <button
                      type="button"
                      onClick={handleOpenAddStaff}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>新增編輯人員</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                      🔒 人員名冊由最高管理員統一維護
                    </span>
                  )}
                </div>

                {/* Staff Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {staffList.length === 0 ? (
                    <div className="col-span-full py-8 px-6 text-center bg-stone-50/80 rounded-2xl border border-dashed border-stone-300 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-stone-200/70 flex items-center justify-center text-stone-500 mb-2.5">
                        <Users className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-stone-800 text-sm mb-1">目前名冊中尚無工作人員</h5>
                      <p className="text-xs text-stone-500 max-w-sm mb-4">
                        您已移除所有人員帳號。臨床同仁可使用最高管理員帳號登入，或由最高管理員點擊下方按鈕隨時新增同仁。
                      </p>
                      {userRole === 'admin' && (
                        <button
                          type="button"
                          onClick={handleOpenAddStaff}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>新增第一位臨床工作人員</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    staffList.map((staff) => {
                      const isDefault = staff.pin === DEFAULT_EDITOR_PIN;
                      const isCurrentLoggedIn = currentStaff?.id === staff.id;
                      return (
                        <div 
                          key={staff.id} 
                          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                            isCurrentLoggedIn 
                              ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30' 
                              : 'bg-stone-50/70 border-stone-200 hover:bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                                {staff.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-stone-800 text-sm">{staff.name}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                                    {staff.title || '臨床人員'}
                                  </span>
                                  {isCurrentLoggedIn && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-emerald-600 text-white">
                                      當前登入
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                                  <span>建立: {staff.createdAt ? staff.createdAt.split('T')[0] : '系統預設'}</span>
                                  {staff.notes && <span className="truncate max-w-[140px] text-stone-500">• {staff.notes}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Password status badge */}
                            <div>
                              {isDefault ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <Check className="w-3 h-3" /> 系統預設密碼
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  <Lock className="w-3 h-3" /> 已自訂專屬密碼
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions for Admin */}
                          {userRole === 'admin' && (
                            <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-xs gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditStaff(staff)}
                                  className="px-2.5 py-1 bg-stone-200/70 hover:bg-stone-300 text-stone-700 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>編輯姓名/職稱</span>
                                </button>
                                {confirmResetStaffId === staff.id ? (
                                  <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmResetStaffId(null)}
                                      className="px-1.5 py-0.5 text-stone-500 text-[10px]"
                                    >
                                      取消
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleResetStaffPinConfirm(staff.id, staff.name)}
                                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold"
                                    >
                                      確認還原
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmResetStaffId(staff.id)}
                                    className="px-2 py-1 text-amber-700 hover:bg-amber-100 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                    title="將此人員密碼還原為系統預設值"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>還原預設密碼</span>
                                  </button>
                                )}
                              </div>

                              {/* 刪除人員按鈕：隨時均可刪除，並具備防誤觸二次確認 */}
                              <div>
                                {confirmDeleteStaffId === staff.id ? (
                                  <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-200">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteStaffId(null)}
                                      className="px-1.5 py-0.5 text-stone-500 hover:bg-stone-200 rounded text-[10px]"
                                    >
                                      取消
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteStaffConfirm(staff.id, staff.name)}
                                      className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                                    >
                                      確認刪除
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteStaffId(staff.id)}
                                    className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                    title="刪除此人員"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>刪除人員</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Password Management Cards Section - 管理員密碼修改暫時隱藏，避免測試時遭改動導致無法登入 */}
            {userRole === 'admin' ? null : (
              /* Clinical Staff View - Balanced 2-Column Layout matching Passport View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {/* Column 1: Staff Identity Card */}
                <div className="p-5 sm:p-6 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-xl flex items-center justify-center shadow-xs shrink-0">
                        {currentStaff ? currentStaff.name.charAt(0) : <UserCheck className="w-7 h-7" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-black text-stone-900">
                            {currentStaff ? currentStaff.name : '臨床工作人員'}
                          </h4>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {currentStaff?.title || '臨床同仁'}
                          </span>
                        </div>
                        <span className="text-xs text-stone-500 mt-0.5 block">
                          負責臨床功能評鑑、任務解鎖進度維護與個別報表輸出
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-stone-700">臨床作業授權範圍：</div>
                      <div className="grid grid-cols-1 gap-2 text-xs text-stone-600">
                        <div className="flex items-center gap-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>各個案日常生活六大生活領域任務進度解鎖</span>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>各個案生活功能評估紀錄、備註與治療目標編輯</span>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>產製並列印單一個案完整臨床檢核報表 (A4 / PDF / Word)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span className="flex items-center gap-1.5 text-[11px] text-stone-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      帳號權限：具名臨床編輯同仁
                    </span>
                    {onLogout && (
                      <button
                        type="button"
                        onClick={onLogout}
                        className="text-stone-500 hover:text-red-600 font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>切換身分</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Column 2: Clinical Staff PIN Management Card */}
                <div className="p-5 sm:p-6 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-800 text-sm">修改個人 6 位數 PIN 碼</h4>
                          <span className="text-[11px] text-stone-500">
                            登入同仁：{currentStaff?.name || '臨床同仁'} • 此密碼僅供本人登入
                          </span>
                        </div>
                      </div>

                      <div>
                        {currentStaff?.pin === DEFAULT_EDITOR_PIN ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> 系統預設密碼
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <Lock className="w-3.5 h-3.5 text-amber-600" /> 已自訂專屬密碼
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-bold text-stone-700 text-xs mb-1.5">
                          輸入新 6 位數密碼
                        </label>
                        <input
                          type="password"
                          maxLength={6}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editorPinInput}
                          onChange={e => setEditorPinInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="請輸入 6 位數字"
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono tracking-widest text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-stone-700 text-xs mb-1.5">
                          再次確認新密碼
                        </label>
                        <input
                          type="password"
                          maxLength={6}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editorConfirmPin}
                          onChange={e => setEditorConfirmPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="請再次輸入 6 位數字"
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono tracking-widest text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (editorPinInput.length !== 6) {
                            setSecurityErrorMsg('密碼長度必須剛好為 6 位數字');
                            return;
                          }
                          if (editorPinInput !== editorConfirmPin) {
                            setSecurityErrorMsg('兩次輸入的新密碼不一致，請重新確認');
                            return;
                          }
                          if (currentStaff?.id) {
                            const res = updateStaffPin(currentStaff.id, editorPinInput);
                            if (res.success) {
                              setStaffList(getStaffMembers());
                              setEditorPinInput('');
                              setEditorConfirmPin('');
                              setSecuritySuccessMsg(`【${currentStaff.name}】您的 6 位數密碼已成功更新！`);
                              setSecurityErrorMsg('');
                              setTimeout(() => setSecuritySuccessMsg(''), 4000);
                            } else {
                              setSecurityErrorMsg(res.error || '變更失敗');
                            }
                          } else {
                            const res = setEditorPin(editorPinInput);
                            if (res.success) {
                              setCurrentEditorPinVal(getEditorPin());
                              setEditorPinInput('');
                              setEditorConfirmPin('');
                              setSecuritySuccessMsg('您的 6 位數密碼已成功更新！');
                              setSecurityErrorMsg('');
                              setTimeout(() => setSecuritySuccessMsg(''), 4000);
                            } else {
                              setSecurityErrorMsg(res.error || '變更失敗');
                            }
                          }
                        }}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>更新我的 6 位數密碼</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-[11px] leading-relaxed">
                      <span className="font-bold text-stone-700">忘記密碼提示：</span>
                      <span className="text-stone-500">
                        若不慎遺忘自訂密碼，可隨時洽詢最高管理員，管理員可於後台名冊中為您一鍵還原為預設密碼。
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <div>
              當前操作個案：
              <span className="font-bold text-emerald-800 ml-1">
                {patients.find(p => p.id === activePatientId)?.name || '未選擇個案'}
              </span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="hidden sm:inline-flex items-center gap-1 text-stone-400 hover:text-red-600 transition underline underline-offset-2 cursor-pointer font-medium"
              >
                切換身分/登出
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl transition cursor-pointer"
          >
            返回護照頁面
          </button>
        </div>
      </motion.div>

      {/* Add / Edit Patient Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-stone-900/60 z-60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-[#F4F0E6] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[1200px] h-[95vh] sm:h-[92vh] overflow-hidden flex flex-col border border-stone-300"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                    <UserPlus className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                      {editingPatient ? '編輯個案資料' : '新增個案資料'}
                    </h3>
                    <p className="text-xs text-emerald-100/80">
                      填寫個案基本人口學資料與社會心理暨家庭功能評估
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-white/20 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body - Scrollable */}
              <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-stone-800">
                {/* 區塊 1: 基本資料 */}
                <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200/80 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <h4 className="font-bold text-stone-900 text-sm">基本資料</h4>
                    </div>
                  </div>

                  {/* 姓名、床號、年紀、病歷號碼 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        姓名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">床號</label>
                      <input
                        type="text"
                        value={formBedNumber}
                        onChange={e => setFormBedNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">年紀</label>
                      <input
                        type="text"
                        placeholder="例：68"
                        value={formAge}
                        onChange={e => setFormAge(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">病歷號碼</label>
                      <input
                        type="text"
                        value={formCaseNumber}
                        onChange={e => setFormCaseNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* 主責治療師、入案日期、上游醫院、照顧者 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">主責治療師</label>
                      <input
                        type="text"
                        value={formTherapist}
                        onChange={e => setFormTherapist(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">入案/評估日期</label>
                      <input
                        type="date"
                        value={formAdmissionDate}
                        onChange={e => setFormAdmissionDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">上游醫院</label>
                      <input
                        type="text"
                        value={formUpstreamHospital}
                        onChange={e => setFormUpstreamHospital(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">照顧者</label>
                      <input
                        type="text"
                        value={formCaregiver}
                        onChange={e => setFormCaregiver(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* 個案家在哪、主要醫療決定者 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">個案家在哪</label>
                      <input
                        type="text"
                        value={formHomeLocation}
                        onChange={e => setFormHomeLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">主要醫療決定者</label>
                      <input
                        type="text"
                        placeholder="例：大兒子（陳先生，電話: 0912-xxx-xxx）"
                        value={formPrimaryMedicalDecisionMaker}
                        onChange={e => setFormPrimaryMedicalDecisionMaker(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* 核心生活目標 */}
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">核心生活目標</label>
                    <input
                      type="text"
                      placeholder="例：能自行站立穿褲、去附近超商買豆漿、回歸社區合唱團"
                      value={formTargetGoal}
                      onChange={e => setFormTargetGoal(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 區塊 2: 社會心理/生活/環境社會心理暨家庭功能評估 */}
                <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-200/80 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                        2
                      </span>
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-teal-700" />
                        <span>社會心理 / 生活 / 環境社會心理暨家庭功能評估</span>
                      </h4>
                    </div>
                  </div>

                  {/* 家庭/婚姻、經濟、病前職業生活、教育程度 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        家庭 / 婚姻
                      </label>
                      <input
                        type="text"
                        placeholder="例：已婚，育有二子一女，家庭關係緊密支持"
                        value={formFamilyMarriage}
                        onChange={e => setFormFamilyMarriage(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        經濟
                      </label>
                      <select
                        value={formEconomicStatus}
                        onChange={e => setFormEconomicStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="">請選擇經濟狀況...</option>
                        {ECONOMIC_STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        {formEconomicStatus && !ECONOMIC_STATUS_OPTIONS.includes(formEconomicStatus) && (
                          <option value={formEconomicStatus}>{formEconomicStatus} (自訂)</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        病前職業生活
                      </label>
                      <select
                        value={isCustomOccupation ? '其他' : (OCCUPATION_OPTIONS.includes(formPreMorbidOccupation) ? formPreMorbidOccupation : (formPreMorbidOccupation ? '其他' : ''))}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '其他') {
                            setIsCustomOccupation(true);
                            if (OCCUPATION_OPTIONS.includes(formPreMorbidOccupation) && formPreMorbidOccupation !== '其他') {
                              setFormPreMorbidOccupation('');
                            }
                          } else {
                            setIsCustomOccupation(false);
                            setFormPreMorbidOccupation(val);
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="">請選擇病前職業生活...</option>
                        {OCCUPATION_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {isCustomOccupation && (
                        <input
                          type="text"
                          autoFocus
                          placeholder="請輸入其他職業/工作生活說明..."
                          value={formPreMorbidOccupation}
                          onChange={e => setFormPreMorbidOccupation(e.target.value)}
                          className="w-full mt-1.5 px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        教育程度
                      </label>
                      <select
                        value={formEducationLevel}
                        onChange={e => setFormEducationLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="">請選擇教育程度...</option>
                        {EDUCATION_LEVEL_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        {formEducationLevel && !EDUCATION_LEVEL_OPTIONS.includes(formEducationLevel) && (
                          <option value={formEducationLevel}>{formEducationLevel} (自訂)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* 興趣/特殊專長、居住環境、同住家人 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        興趣 / 特殊專長
                      </label>
                      <input
                        type="text"
                        placeholder="例：書法、種植盆栽、看日劇、下象棋"
                        value={formInterestsSpecialties}
                        onChange={e => setFormInterestsSpecialties(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        居住環境
                      </label>
                      <input
                        type="text"
                        placeholder="例：公寓3樓有電梯、門檻皆已平整化、浴室設有扶手"
                        value={formLivingEnvironment}
                        onChange={e => setFormLivingEnvironment(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        同住家人
                      </label>
                      <input
                        type="text"
                        placeholder="例：配偶與次子同住，平日白天次子上班由外籍看護照應"
                        value={formCohabitingFamily}
                        onChange={e => setFormCohabitingFamily(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* 病前性格、病後個性 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        病前性格
                      </label>
                      <select
                        value={isCustomPreMorbid ? '__custom' : formPreMorbidPersonality}
                        onChange={e => {
                          if (e.target.value === '__custom') {
                            setIsCustomPreMorbid(true);
                            if (PERSONALITY_OPTIONS.includes(formPreMorbidPersonality)) {
                              setFormPreMorbidPersonality('');
                            }
                          } else {
                            setIsCustomPreMorbid(false);
                            setFormPreMorbidPersonality(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="">請選擇病前性格...</option>
                        {PERSONALITY_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="__custom">自填選項...</option>
                      </select>
                      {isCustomPreMorbid && (
                        <input
                          type="text"
                          autoFocus
                          placeholder="請輸入自填病前性格..."
                          value={formPreMorbidPersonality}
                          onChange={e => setFormPreMorbidPersonality(e.target.value)}
                          className="w-full mt-1.5 px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        病後個性
                      </label>
                      <select
                        value={isCustomPostMorbid ? '__custom' : formPostMorbidPersonality}
                        onChange={e => {
                          if (e.target.value === '__custom') {
                            setIsCustomPostMorbid(true);
                            if (PERSONALITY_OPTIONS.includes(formPostMorbidPersonality)) {
                              setFormPostMorbidPersonality('');
                            }
                          } else {
                            setIsCustomPostMorbid(false);
                            setFormPostMorbidPersonality(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="">請選擇病後個性...</option>
                        {PERSONALITY_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="__custom">自填選項...</option>
                      </select>
                      {isCustomPostMorbid && (
                        <input
                          type="text"
                          autoFocus
                          placeholder="請輸入自填病後個性..."
                          value={formPostMorbidPersonality}
                          onChange={e => setFormPostMorbidPersonality(e.target.value)}
                          className="w-full mt-1.5 px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 text-stone-600 hover:bg-stone-100 rounded-xl font-bold transition cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? '儲存中...' : (editingPatient ? '更新個案資料' : '確認新增個案')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Patient Detail View Modal (個案資料檢視卡) */}
      <AnimatePresence>
        {viewDetailPatient && (
          <div className="fixed inset-0 bg-stone-900/60 z-60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-[#F4F0E6] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[1200px] h-[95vh] sm:h-[92vh] flex flex-col overflow-hidden border border-stone-300"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-800 to-stone-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                    {viewDetailPatient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{viewDetailPatient.name}</h3>
                      {viewDetailPatient.bedNumber && (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2 py-0.5 rounded-full font-bold">
                          🛏️ {viewDetailPatient.bedNumber} 床
                        </span>
                      )}
                      {viewDetailPatient.age && (
                        <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs px-2 py-0.5 rounded-full font-bold">
                          {viewDetailPatient.age} 歲
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-300 font-mono mt-0.5">
                      病歷號: {viewDetailPatient.caseNumber || '無病歷號'} • 主責治療師: {viewDetailPatient.primaryTherapist || '未指定'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewDetailPatient(null)}
                  className="p-1.5 hover:bg-white/10 rounded-xl text-stone-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-stone-800">
                {/* 區塊 1: 基本資料 */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                        1
                      </span>
                      <span>基本資料</span>
                    </h4>
                    <span className="text-[11px] text-stone-500">
                      入案日期: {viewDetailPatient.admissionDate || '未填寫'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">姓名 / 床號</span>
                      <span className="font-bold text-stone-800">
                        {viewDetailPatient.name} {viewDetailPatient.bedNumber ? `(${viewDetailPatient.bedNumber}床)` : ''}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">年紀</span>
                      <span className="font-bold text-stone-800">
                        {viewDetailPatient.age ? `${viewDetailPatient.age} 歲` : '未填寫'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">上游醫院</span>
                      <span className="font-bold text-stone-800">
                        {viewDetailPatient.upstreamHospital || '未填寫'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">照顧者</span>
                      <span className="font-bold text-stone-800">
                        {viewDetailPatient.caregiver || '未填寫'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">主要醫療決定者</span>
                      <span className="font-bold text-stone-800">
                        {viewDetailPatient.primaryMedicalDecisionMaker || '未填寫'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">在案狀態</span>
                      <span className="font-bold text-stone-800">
                        {viewDetailPatient.status === 'active' ? '🟢 在案中' : '⚪ 已結案'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-400 font-bold block mb-0.5">個案家在哪</span>
                    <span className="font-medium text-stone-800">
                      {viewDetailPatient.homeLocation || '未填寫'}
                    </span>
                  </div>

                  {viewDetailPatient.targetGoal && (
                    <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-emerald-900">
                      <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">核心生活目標</span>
                      <span className="font-bold text-xs">{viewDetailPatient.targetGoal}</span>
                    </div>
                  )}
                </div>

                {/* 區塊 2: 社會心理/生活/環境社會心理暨家庭功能評估 */}
                <div className="bg-teal-50/50 rounded-2xl p-4 border border-teal-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-teal-200/80">
                    <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-teal-700 text-white flex items-center justify-center font-bold text-[10px]">
                        2
                      </span>
                      <span>社會心理 / 生活 / 環境社會心理暨家庭功能評估</span>
                    </h4>
                    <span className="text-[10px] text-teal-800 bg-teal-100 font-bold px-2 py-0.5 rounded-full">
                      全人生活史
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">家庭 / 婚姻</span>
                      <p className="text-stone-800 leading-relaxed font-medium">
                        {viewDetailPatient.familyMarriage || '尚無紀錄'}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">經濟</span>
                      {viewDetailPatient.economicStatus ? (
                        <div className="mt-0.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                            viewDetailPatient.economicStatus === '富裕' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            viewDetailPatient.economicStatus === '小康' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                            viewDetailPatient.economicStatus === '普通' ? 'bg-stone-100 text-stone-800 border border-stone-300' :
                            viewDetailPatient.economicStatus === '清寒' ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                            viewDetailPatient.economicStatus === '貧窮' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                            'bg-stone-100 text-stone-800 border border-stone-200'
                          }`}>
                            {viewDetailPatient.economicStatus}
                          </span>
                        </div>
                      ) : (
                        <p className="text-stone-400 leading-relaxed font-medium">尚無紀錄</p>
                      )}
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">病前職業生活</span>
                      <p className="text-stone-800 leading-relaxed font-medium">
                        {viewDetailPatient.preMorbidOccupation || '尚無紀錄'}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">教育程度</span>
                      {viewDetailPatient.educationLevel ? (
                        <div className="mt-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-sky-50 text-sky-900 border border-sky-300">
                            <span>🎓</span>
                            <span>{viewDetailPatient.educationLevel}</span>
                          </span>
                        </div>
                      ) : (
                        <p className="text-stone-400 leading-relaxed font-medium">尚無紀錄</p>
                      )}
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">興趣 / 特殊專長</span>
                      <p className="text-stone-800 leading-relaxed font-medium">
                        {viewDetailPatient.interestsSpecialties || '尚無紀錄'}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">居住環境</span>
                      <p className="text-stone-800 leading-relaxed font-medium">
                        {viewDetailPatient.livingEnvironment || '尚無紀錄'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-400 font-bold block mb-0.5">同住家人</span>
                    <p className="text-stone-800 leading-relaxed font-medium">
                      {viewDetailPatient.cohabitingFamily || '尚無紀錄'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">病前性格</span>
                      <p className="text-stone-800 leading-relaxed font-medium">
                        {viewDetailPatient.preMorbidPersonality || '尚無紀錄'}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block mb-0.5">病後個性</span>
                      <p className="text-stone-800 leading-relaxed font-medium">
                        {viewDetailPatient.postMorbidPersonality || '尚無紀錄'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewDetailPatient;
                    setViewDetailPatient(null);
                    handleStartEdit(target, { stopPropagation: () => {} } as any);
                  }}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold transition flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>編輯此個案資料</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewDetailPatient(null)}
                  className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl transition cursor-pointer"
                >
                  關閉
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Staff Member Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-stone-200 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">
                      {editingStaff ? '編輯工作人員資料' : '新增臨床編輯人員'}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {editingStaff ? '更新同仁姓名與職稱標籤' : '為新進臨床人員建立帳號與專屬 6 位數 PIN 碼'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {staffModalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{staffModalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveStaffSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    人員姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={staffNameInput}
                    onChange={e => setStaffNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Professional Title Section: Quick Tags + Dedicated Custom Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-700">
                      專業職稱 / 職級角色
                    </label>
                  </div>

                  {/* 預設職稱快捷標籤 */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {['職能治療師', '物理治療師', '語言治療師', '臨床護理師', '個案管理師', '社工師'].map(t => {
                      const isSelected = staffTitleInput === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setStaffTitleInput(t)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
                            isSelected 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs' 
                              : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                    {/* 快捷切換自訂按鈕 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (['職能治療師', '物理治療師', '語言治療師', '臨床護理師', '個案管理師', '社工師'].includes(staffTitleInput)) {
                          setStaffTitleInput('');
                        }
                        staffTitleInputRef.current?.focus();
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border flex items-center gap-1 ${
                        !['職能治療師', '物理治療師', '語言治療師', '臨床護理師', '個案管理師', '社工師'].includes(staffTitleInput) && staffTitleInput.trim() !== ''
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>自訂職稱</span>
                    </button>
                  </div>

                  {/* 自訂填寫職稱欄位 */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-stone-600">
                        自訂填寫職稱欄位：
                      </span>
                      {staffTitleInput && !['職能治療師', '物理治療師', '語言治療師', '臨床護理師', '個案管理師', '社工師'].includes(staffTitleInput) && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          自訂職稱模式
                        </span>
                      )}
                    </div>
                    <input
                      ref={staffTitleInputRef}
                      type="text"
                      value={staffTitleInput}
                      onChange={e => setStaffTitleInput(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      登入密碼 (6 位數 PIN 碼)
                    </label>
                    <span className="text-[10px] text-stone-400">
                      {editingStaff ? '留原值即不變更' : '預設為系統初始密碼'}
                    </span>
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={staffPinInput}
                    onChange={e => setStaffPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono tracking-widest text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    備註說明 / 所屬單位 (選填)
                  </label>
                  <input
                    type="text"
                    value={staffNotesInput}
                    onChange={e => setStaffNotesInput(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {editingStaff && userRole === 'admin' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const targetStaff = editingStaff;
                        setShowStaffModal(false);
                        setConfirmDeleteStaffId(targetStaff.id);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>刪除此人員</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowStaffModal(false)}
                      className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      {editingStaff ? '更新人員資料' : '確認新增人員'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Switch Patient Safeguard Confirmation Dialog */}
      <AnimatePresence>
        {confirmingSwitchPatient && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-stone-200 overflow-hidden"
            >
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    切換個案護照防呆確認
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    即將切換生活功能護照的操作對象，請核對個案資訊
                  </p>
                </div>
              </div>

              {/* Current vs Target Comparison */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 mb-4 space-y-3">
                {/* Current */}
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-stone-200">
                  <span className="text-stone-400 font-medium">目前護照個案</span>
                  <div className="text-right">
                    <span className="font-bold text-stone-700">
                      {currentPatient?.name || patientName || '目前個案'}
                    </span>
                    <span className="text-[11px] text-stone-400 ml-1.5 font-mono">
                      ({currentPatient?.caseNumber || '無病歷號'})
                    </span>
                  </div>
                </div>

                {/* Target */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span>即將切換為</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <div className="text-right">
                    <div className="font-black text-emerald-800 text-sm">
                      {confirmingSwitchPatient.name}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                      病歷號: {confirmingSwitchPatient.caseNumber || '無編號'} • 已解鎖 {(confirmingSwitchPatient.completedTasks || []).length} 項
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning badge if target is archived */}
              {confirmingSwitchPatient.status === 'archived' && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 mb-4 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>注意：</strong> 此個案已被標記為<strong>「已結案歸檔」</strong>。切換進入後若有重新勾選任務或修改資料，將直接同步更新該個案之雲端歷史存檔。
                  </div>
                </div>
              )}

              <div className="text-xs text-stone-500 mb-5 leading-relaxed bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                💡 確認切換後，系統將載入<strong>【{confirmingSwitchPatient.name}】</strong>專屬的 150 項生活功能護照與評估進度，避免記錄錯置。
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmingSwitchPatient(null)}
                  className="px-4 py-2.5 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition"
                >
                  取消返回
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = confirmingSwitchPatient;
                    setConfirmingSwitchPatient(null);
                    onSelectPatient(target);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>確認切換並進入護照</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dual-Track Track 2: Cross Patient Clinical Quality Report Modal (PDF / Print) */}
      <CrossPatientReportModal
        isOpen={showCrossPatientReport}
        onClose={() => setShowCrossPatientReport(false)}
        patients={patients}
        analyticsData={analyticsData}
      />

      {/* Dual-Track Track 1: Off-screen High-Resolution Image Card for PNG Generation */}
      <div 
        style={{ 
          position: 'fixed', 
          left: '-9999px', 
          top: '0', 
          width: '940px',
          zIndex: -1,
          pointerEvents: 'none'
        }}
      >
        <div 
          ref={analyticsImageCardRef}
          className="bg-white p-9 text-stone-900 border border-stone-200 rounded-3xl"
          style={{ 
            fontFamily: '"微軟正黑體", "Microsoft JhengHei", "PingFang TC", system-ui, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
          }}
        >
          {/* Card Top Banner */}
          <div className="border-b-2 border-emerald-700 pb-5 mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black tracking-wider text-emerald-800">員郭醫院</span>
                <span className="text-sm font-bold text-stone-600">復健醫學科 ｜ YK未來室</span>
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                全院日常生活功能 (ADL) 跨個案成效分析圖卡
              </h2>
              <div className="text-xs text-stone-500 mt-1 flex items-center gap-4">
                <span>統計基準日：<strong className="text-stone-800 font-mono">{new Date().toISOString().split('T')[0]}</strong></span>
                <span>總收案：<strong className="text-stone-800">{analyticsData.totalCount} 位</strong></span>
                <span>在案治療：<strong className="text-emerald-700">{analyticsData.activeCount} 位</strong></span>
                <span>結案歸檔：<strong className="text-amber-700">{analyticsData.archivedCount} 位</strong></span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-full border border-emerald-300">
                品管監測成果報告
              </span>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">ADL-PASSPORT-QCC</div>
            </div>
          </div>

          {/* 4 Key Summary Matrix */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-center">
              <div className="text-xs font-bold text-stone-500">在案總人數</div>
              <div className="text-2xl font-black text-stone-800 mt-1">{analyticsData.activeCount} <span className="text-xs font-normal">位</span></div>
              <div className="text-[10px] text-stone-400 mt-0.5">累計收案 {analyticsData.totalCount} 位</div>
            </div>

            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-center">
              <div className="text-xs font-bold text-emerald-800">平均達成任務數</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{analyticsData.averageCompleted} <span className="text-xs font-normal">項</span></div>
              <div className="text-[10px] text-emerald-600 mt-0.5">全套 150 核心題庫</div>
            </div>

            <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-center">
              <div className="text-xs font-bold text-blue-800">全體生活自理率</div>
              <div className="text-2xl font-black text-blue-700 mt-1">{analyticsData.averageRate}%</div>
              <div className="text-[10px] text-blue-600 mt-0.5">跨領域整體達成指標</div>
            </div>

            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-center">
              <div className="text-xs font-bold text-amber-800">結案回歸居家率</div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {analyticsData.totalCount > 0 ? Math.round((analyticsData.archivedCount / analyticsData.totalCount) * 100) : 0}%
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">順利結案 {analyticsData.archivedCount} 位</div>
            </div>
          </div>

          {/* Six Domains Grid */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-stone-200">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
              <h3 className="font-bold text-stone-900 text-sm">六大生活自理領域 (ADL) 達成率一覽</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {analyticsData.categoryStats.map(cat => (
                <div key={cat.category} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-stone-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      {cat.category} 領域
                    </span>
                    <span className="font-mono font-black text-emerald-800 text-sm">{cat.rate}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${Math.min(cat.rate, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>累計達成：{cat.totalDone} 次</span>
                    <span>人均解鎖：{cat.averagePerPatient} / {cat.tasksCount} 項</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Stages Progression Grid */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-stone-200">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-700" />
              <h3 className="font-bold text-stone-900 text-sm">階梯式能力層次 (銅盃/銀盃/金盃) 階段差異分析</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {analyticsData.tierStats.map(stage => (
                <div key={stage.tier} className={`p-3.5 rounded-xl border ${stage.border} ${stage.lightBg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${stage.color} bg-white border border-current`}>
                      {stage.label}
                    </span>
                    <span className="font-black text-stone-800 font-mono text-sm">{stage.rate}%</span>
                  </div>
                  <div className="font-bold text-stone-800 text-xs mt-1">{stage.title}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{stage.subLabel}</div>
                  <div className="mt-2 text-[10px] text-stone-600 font-medium">
                    人均解鎖：<strong>{stage.averagePerPatient}</strong> / {stage.totalTasks} 項
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Co-Learning Partners Distribution (共學夥伴協同支持與自立賦能分佈) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 pb-1 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h3 className="font-bold text-stone-900 text-sm">共學夥伴協同支持與自立賦能分佈 (Co-Learning Partners Distribution)</h3>
              </div>
              <span className="text-[10px] text-stone-500">
                累計 {analyticsData.partnerStats.totalTaggedTasks} 項標記任務 • {analyticsData.partnerStats.totalPartnerSelections} 標記人次
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-3">
              {/* 自己完成 */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-800">自己完成 (自主獨立)</span>
                  <span className="font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded text-[11px] border border-emerald-300">
                    {analyticsData.partnerStats.selfRate}%
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-950 font-mono">
                  {analyticsData.partnerStats.totalSelf} <span className="text-[10px] font-normal text-emerald-700">次標記</span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-1">完全獨立自理指標</div>
              </div>

              {/* 家屬夥伴 */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-amber-800">家屬夥伴 (家庭賦能)</span>
                  <span className="font-black text-amber-700 bg-white px-1.5 py-0.5 rounded text-[11px] border border-amber-300">
                    {analyticsData.partnerStats.familyRate}%
                  </span>
                </div>
                <div className="text-xl font-black text-amber-950 font-mono">
                  {analyticsData.partnerStats.totalFamily} <span className="text-[10px] font-normal text-amber-700">次標記</span>
                </div>
                <div className="text-[9px] text-amber-700 mt-1">家庭參與親友陪伴</div>
              </div>

              {/* 多功能型照顧服務員 */}
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-sky-800">多功能型照顧服務員</span>
                  <span className="font-black text-sky-700 bg-white px-1.5 py-0.5 rounded text-[11px] border border-sky-300">
                    {analyticsData.partnerStats.attendantRate}%
                  </span>
                </div>
                <div className="text-xl font-black text-sky-950 font-mono">
                  {analyticsData.partnerStats.totalAttendant} <span className="text-[10px] font-normal text-sky-700">次標記</span>
                </div>
                <div className="text-[9px] text-sky-700 mt-1">照服多元生活輔助</div>
              </div>

              {/* 醫療團隊 */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-purple-800">醫療團隊 (專業介入)</span>
                  <span className="font-black text-purple-700 bg-white px-1.5 py-0.5 rounded text-[11px] border border-purple-300">
                    {analyticsData.partnerStats.medicalRate}%
                  </span>
                </div>
                <div className="text-xl font-black text-purple-950 font-mono">
                  {analyticsData.partnerStats.totalMedical} <span className="text-[10px] font-normal text-purple-700">次標記</span>
                </div>
                <div className="text-[9px] text-purple-700 mt-1">治療師專業指導</div>
              </div>
            </div>

            {/* Combined Proportion Bar */}
            {analyticsData.partnerStats.totalPartnerSelections > 0 && (
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden flex border border-stone-200">
                {analyticsData.partnerStats.selfRate > 0 && (
                  <div className="bg-emerald-500 h-full" style={{ width: `${analyticsData.partnerStats.selfRate}%` }} />
                )}
                {analyticsData.partnerStats.familyRate > 0 && (
                  <div className="bg-amber-500 h-full" style={{ width: `${analyticsData.partnerStats.familyRate}%` }} />
                )}
                {analyticsData.partnerStats.attendantRate > 0 && (
                  <div className="bg-sky-500 h-full" style={{ width: `${analyticsData.partnerStats.attendantRate}%` }} />
                )}
                {analyticsData.partnerStats.medicalRate > 0 && (
                  <div className="bg-purple-500 h-full" style={{ width: `${analyticsData.partnerStats.medicalRate}%` }} />
                )}
              </div>
            )}
          </div>

          {/* Clinical Insights Summary Box */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 mb-4">
            <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
              <span>💡 臨床品管與成效亮點分析</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                • <strong>最高突破領域：</strong>【{analyticsData.highestDomain.category}】領域 ({analyticsData.highestDomain.rate}%)，全院個案飲食自理建立健全。
              </div>
              <div>
                • <strong>最需加強領域：</strong>【{analyticsData.lowestDomain.category}】領域 ({analyticsData.lowestDomain.rate}%)，建議持續加強生活情境拓展。
              </div>
            </div>
          </div>

          {/* Watermark and Footer */}
          <div className="flex items-center justify-between text-[10px] text-stone-400 pt-3 border-t border-stone-200">
            <span>員郭醫院 復健醫學科 • 生活功能解鎖護照系統產製</span>
            <span>報告查驗條碼：QCC-{new Date().toISOString().split('T')[0].replace(/-/g, '')} ｜ 供內部晨會與品管研討使用</span>
          </div>
        </div>
      </div>
    </div>
  );
};
