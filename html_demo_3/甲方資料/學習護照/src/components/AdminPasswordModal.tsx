import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, KeyRound, X, Check, AlertCircle, Eye, EyeOff, UserCheck, ChevronDown, User } from 'lucide-react';
import { 
  UserRole, 
  StaffMember,
  verifyCredentials, 
  getAdminPassword,
  getStaffMembers,
  subscribeStaffMembers,
  getCurrentStaff,
  setCurrentStaff
} from '../services/authService';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole, staff?: StaffMember) => void;
  initialRole?: UserRole;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'editor',
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>(initialRole);
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [matchedRole, setMatchedRole] = useState<UserRole | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialRole);
      setPin('');
      setError(false);
      setErrorMessage('');
      setMatchedRole(null);

      const updateStaffData = (list: StaffMember[]) => {
        const activeStaff = list.filter(s => s.isActive);
        setStaffList(activeStaff);
        const current = getCurrentStaff();
        if (current && activeStaff.some(s => s.id === current.id)) {
          setSelectedStaffId(current.id);
        } else if (activeStaff.length > 0) {
          setSelectedStaffId(activeStaff[0].id);
        } else {
          setSelectedStaffId('');
        }
      };

      updateStaffData(getStaffMembers());
      const unsub = subscribeStaffMembers((cloudStaff) => {
        updateStaffData(cloudStaff);
      });

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => unsub();
    }
  }, [isOpen, initialRole]);

  // 切換 Tab 時清空輸入
  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setPin('');
    setError(false);
    setErrorMessage('');
    setMatchedRole(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleVerify = (candidatePin: string) => {
    const adminPwd = getAdminPassword();
    // ⭐ 最高管理員直通：免切換、免選擇人員，輸入正確直接登入最高管理員
    if (candidatePin.trim() === adminPwd) {
      setActiveTab('admin');
      setError(false);
      setMatchedRole('admin');
      setTimeout(() => {
        onSuccess('admin');
      }, 180);
      return true;
    }

    const targetStaffId = activeTab === 'editor' ? (selectedStaffId || undefined) : undefined;
    const res = verifyCredentials(candidatePin, activeTab, targetStaffId);
    if (res.valid && res.role) {
      setError(false);
      setMatchedRole(res.role);
      if (res.role === 'admin') {
        setActiveTab('admin');
      }
      if (res.staff) {
        setCurrentStaff(res.staff);
      }
      setTimeout(() => {
        onSuccess(res.role!, res.staff);
      }, 180);
      return true;
    }
    return false;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError(true);
      setErrorMessage('請輸入密碼');
      return;
    }

    // 先測試是否為管理員密碼
    if (handleVerify(pin)) {
      return;
    }

    const targetStaffId = activeTab === 'editor' ? (selectedStaffId || undefined) : undefined;
    const res = verifyCredentials(pin, activeTab, targetStaffId);
    if (res.valid && res.role) {
      setError(false);
      setMatchedRole(res.role);
      if (res.role === 'admin') {
        setActiveTab('admin');
      }
      if (res.staff) {
        setCurrentStaff(res.staff);
      }
      setTimeout(() => {
        onSuccess(res.role!, res.staff);
      }, 180);
    } else {
      setError(true);
      setErrorMessage(
        res.message || (activeTab === 'editor' 
          ? '密碼錯誤，請重新輸入（或輸入最高管理員密碼）' 
          : '最高管理員密碼錯誤，請確認後重新輸入')
      );
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  const handleKeyPress = (digit: string) => {
    const maxLen = 12;
    if (pin.length < maxLen) {
      const next = pin + digit;
      setPin(next);
      setError(false);
      setErrorMessage('');
      
      // ⭐ 自動直通：若輸入正好符合最高管理員密碼，免切換立即登入最高管理員
      if (next === getAdminPassword()) {
        handleVerify(next);
        return;
      }

      // 自動比對臨床人員 6 位數
      if (activeTab === 'editor' && next.length === 6) {
        handleVerify(next);
      } else if (activeTab === 'admin' && next.length >= 4) {
        if (next === getAdminPassword()) {
          handleVerify(next);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setError(false);
    setErrorMessage('');
  };

  if (!isOpen) return null;

  const boxCount = activeTab === 'editor' ? 6 : 4;
  const currentSelectedStaff = staffList.find(s => s.id === selectedStaffId);

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-stone-200 overflow-hidden"
      >
        {/* Top Header with Role Tabs */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner border ${
              activeTab === 'admin' 
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' 
                : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
            }`}>
              {activeTab === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-1.5">
                <span>後台權限登入</span>
              </h2>
              <p className="text-xs text-stone-300">
                請選擇同仁並輸入 PIN 碼進行身份驗證
              </p>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="flex bg-stone-900/80 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => handleTabChange('editor')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md cursor-default"
            >
              <UserCheck className="w-4 h-4" />
              <span>同仁身份驗證</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>最高管理員</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Editor Staff Selector (Specific staff members only, no smart mode) */}
            {activeTab === 'editor' && staffList.length > 0 && (
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    <span>選擇登入人員：</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    同仁專屬 6 位數 PIN
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedStaffId}
                    onChange={(e) => {
                      setSelectedStaffId(e.target.value);
                      setPin('');
                      setError(false);
                      setErrorMessage('');
                      inputRef.current?.focus();
                    }}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer pr-8 shadow-2xs"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.title || '臨床人員'})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                {currentSelectedStaff && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1.5 px-1">
                    • 請輸入【{currentSelectedStaff.name}】的 6 位數專屬密碼
                  </p>
                )}
              </div>
            )}

            {/* If no staff members exist */}
            {activeTab === 'editor' && staffList.length === 0 && (
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>目前尚未建立個別工作人員名冊</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  可直接輸入最高管理員密碼（預設 8520）登入管理後台，即可在「名冊管理」中新增同仁。
                </p>
              </div>
            )}

            <div className="text-center">
              {/* Boxed PIN Visualizer */}
              <div className="flex justify-center items-center gap-1.5 sm:gap-2 mb-3">
                {Array.from({ length: boxCount }).map((_, index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-9 sm:w-11 h-11 sm:h-12 rounded-xl border-2 flex items-center justify-center text-lg sm:text-xl font-black transition-all ${
                        matchedRole === 'admin'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 scale-105'
                          : matchedRole
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 scale-105'
                          : error
                          ? 'border-red-400 bg-red-50 text-red-600'
                          : isFilled
                          ? activeTab === 'admin'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                            : 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-stone-200 bg-stone-50 text-stone-300'
                      }`}
                    >
                      {matchedRole ? (
                        <Check className={`w-5 h-5 animate-bounce ${matchedRole === 'admin' ? 'text-indigo-600' : 'text-emerald-600'}`} />
                      ) : isFilled ? (
                        showPassword ? pin[index] : '•'
                      ) : (
                        ''
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Native Input for physical keyboard */}
              <div className="relative mb-2">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPin(val);
                    setError(false);
                    setErrorMessage('');
                    // ⭐ 若輸入正好符合最高管理員密碼，免切換立即登入最高管理員
                    if (val === getAdminPassword()) {
                      handleVerify(val);
                      return;
                    }
                    if (activeTab === 'editor' && val.length === 6) {
                      handleVerify(val);
                    }
                  }}
                  maxLength={12}
                  placeholder="請輸入 6 位數 PIN 碼"
                  className="w-full text-center px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-800 font-mono tracking-widest text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  title={showPassword ? '隱藏密碼' : '顯示密碼'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Security Hint */}
              <div className="flex items-center justify-center px-1 text-xs">
                <span className="text-stone-500 text-[11px] text-center">
                  請輸入同仁專屬 6 位數 PIN 碼進行身份驗證
                </span>
              </div>

              {error && (
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-red-600 font-semibold bg-red-50 py-1.5 px-3 rounded-lg border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Quick Digital Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="py-2.5 sm:py-3 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 border border-stone-200/80 rounded-xl text-stone-800 font-bold text-lg transition active:scale-95 shadow-2xs cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 sm:py-3 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                清除
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="py-2.5 sm:py-3 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 border border-stone-200/80 rounded-xl text-stone-800 font-bold text-lg transition active:scale-95 shadow-2xs cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="py-2.5 sm:py-3 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                ⌫
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 sm:py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className={`flex-1 py-2.5 sm:py-3 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>以{activeTab === 'admin' ? '最高管理員' : (currentSelectedStaff?.name ? currentSelectedStaff.name : '臨床人員')}登入</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
