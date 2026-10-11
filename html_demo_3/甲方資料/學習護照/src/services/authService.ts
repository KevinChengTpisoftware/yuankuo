import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query 
} from 'firebase/firestore';
import { db } from '../firebase';

export type UserRole = 'admin' | 'editor';

export interface StaffMember {
  id: string;
  name: string;
  title: string; // e.g. 職能治療師、護理師、物理治療師、個管師、社工師
  pin: string; // 6 位數數字 PIN 碼，預設為 000000
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  notes?: string;
}

const STORAGE_KEY_ADMIN_PWD = 'passport_admin_password';
const STORAGE_KEY_EDITOR_PIN = 'passport_editor_pin';
const STORAGE_KEY_AUTH_ROLE = 'passport_auth_role';
const STORAGE_KEY_STAFF_LIST = 'passport_staff_members_list';
const STORAGE_KEY_STAFF_INITIALIZED = 'passport_staff_initialized';
const STORAGE_KEY_CURRENT_STAFF_ID = 'passport_current_staff_id';
const STAFF_COLLECTION = 'staff';

export const DEFAULT_ADMIN_PWD = '8520';
export const DEFAULT_EDITOR_PIN = '000000';

export const DEFAULT_INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-initial-1',
    name: '林美惠',
    title: '職能治療師',
    pin: DEFAULT_EDITOR_PIN,
    createdAt: new Date().toISOString(),
    isActive: true,
    notes: '系統預設臨床評估人員'
  }
];

/**
 * 即時訂閱雲端全體臨床人員名單
 */
export function subscribeStaffMembers(
  callback: (staff: StaffMember[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(collection(db, STAFF_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const isLocallyInitialized = localStorage.getItem(STORAGE_KEY_STAFF_INITIALIZED) === 'true';

        if (snapshot.empty) {
          // 雲端尚無資料時
          if (!isLocallyInitialized) {
            // 首次啟動：將初始預設人員寫入雲端與本機
            const initialList = DEFAULT_INITIAL_STAFF;
            saveStaffMembers(initialList);
            initialList.forEach(s => {
              setDoc(doc(db, STAFF_COLLECTION, s.id), s).catch(console.error);
            });
            callback(initialList);
            return;
          }
          // 本機已有明確操作（例如使用者已全部刪除同仁，或自訂了名冊）
          const localList = getStaffMembers();
          if (localList.length > 0) {
            localList.forEach(s => {
              setDoc(doc(db, STAFF_COLLECTION, s.id), s).catch(console.error);
            });
            callback(localList);
          } else {
            callback([]);
          }
          return;
        }

        const cloudStaff: StaffMember[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || '未命名人員',
            title: data.title || '臨床人員',
            pin: data.pin || DEFAULT_EDITOR_PIN,
            createdAt: data.createdAt || new Date().toISOString(),
            lastLoginAt: data.lastLoginAt,
            isActive: data.isActive !== undefined ? data.isActive : true,
            notes: data.notes || '',
          };
        });

        // 同步更新本機快取與初始化標記
        localStorage.setItem(STORAGE_KEY_STAFF_LIST, JSON.stringify(cloudStaff));
        localStorage.setItem(STORAGE_KEY_STAFF_INITIALIZED, 'true');
        callback(cloudStaff);
      },
      (error) => {
        console.warn('即時載入人員資料提示 (使用本機快取):', error);
        if (onError) onError(error);
        callback(getStaffMembers());
      }
    );
  } catch (err) {
    console.error('初始化人員訂閱失敗:', err);
    callback(getStaffMembers());
    return () => {};
  }
}

/**
 * 取得全體編輯人員名單
 */
export function getStaffMembers(): StaffMember[] {
  try {
    const isInitialized = localStorage.getItem(STORAGE_KEY_STAFF_INITIALIZED) === 'true';
    const raw = localStorage.getItem(STORAGE_KEY_STAFF_LIST);
    if (!raw) {
      if (isInitialized) {
        return [];
      }
      // 首次初始化預設人員
      localStorage.setItem(STORAGE_KEY_STAFF_LIST, JSON.stringify(DEFAULT_INITIAL_STAFF));
      localStorage.setItem(STORAGE_KEY_STAFF_INITIALIZED, 'true');
      return DEFAULT_INITIAL_STAFF;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0 && !isInitialized) {
        localStorage.setItem(STORAGE_KEY_STAFF_LIST, JSON.stringify(DEFAULT_INITIAL_STAFF));
        localStorage.setItem(STORAGE_KEY_STAFF_INITIALIZED, 'true');
        return DEFAULT_INITIAL_STAFF;
      }
      return parsed;
    }
    return isInitialized ? [] : DEFAULT_INITIAL_STAFF;
  } catch {
    return DEFAULT_INITIAL_STAFF;
  }
}

/**
 * 儲存全體編輯人員名冊
 */
export function saveStaffMembers(list: StaffMember[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_STAFF_LIST, JSON.stringify(list));
    localStorage.setItem(STORAGE_KEY_STAFF_INITIALIZED, 'true');
    return true;
  } catch {
    return false;
  }
}

/**
 * 最高管理員新增或修改編輯人員（同步寫入雲端 Firestore 與本機快取）
 */
export function saveStaffMember(data: {
  id?: string;
  name: string;
  title: string;
  pin?: string;
  notes?: string;
  isActive?: boolean;
}): { success: boolean; staff?: StaffMember; error?: string } {
  const trimmedName = data.name.trim();
  const trimmedTitle = (data.title || '臨床人員').trim();
  
  if (!trimmedName) {
    return { success: false, error: '請填寫人員姓名' };
  }

  let pinVal = (data.pin || '').trim();
  if (pinVal) {
    if (!/^\d{6}$/.test(pinVal)) {
      return { success: false, error: '密碼必須為 6 位數字' };
    }
  } else {
    pinVal = DEFAULT_EDITOR_PIN;
  }

  const list = getStaffMembers();

  if (data.id) {
    // 編輯現有人員
    const idx = list.findIndex(s => s.id === data.id);
    if (idx === -1) {
      return { success: false, error: '找不到該人員紀錄' };
    }
    const updated: StaffMember = {
      ...list[idx],
      name: trimmedName,
      title: trimmedTitle,
      pin: data.pin ? pinVal : list[idx].pin,
      notes: data.notes?.trim() || '',
      isActive: data.isActive !== undefined ? data.isActive : list[idx].isActive
    };
    list[idx] = updated;
    saveStaffMembers(list);

    // 同步更新至雲端 Firestore
    setDoc(doc(db, STAFF_COLLECTION, updated.id), updated, { merge: true }).catch(err => {
      console.error('人員更新雲端寫入失敗:', err);
    });

    // 若為當前登入者，同步更新其狀態
    const curr = getCurrentStaff();
    if (curr?.id === updated.id) {
      setCurrentStaff(updated);
    }

    return { success: true, staff: updated };
  } else {
    // 新增人員
    const newStaff: StaffMember = {
      id: `staff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      title: trimmedTitle,
      pin: pinVal,
      createdAt: new Date().toISOString(),
      isActive: true,
      notes: data.notes?.trim() || ''
    };
    list.push(newStaff);
    saveStaffMembers(list);

    // 同步新增至雲端 Firestore
    setDoc(doc(db, STAFF_COLLECTION, newStaff.id), newStaff).catch(err => {
      console.error('新增人員雲端寫入失敗:', err);
    });

    return { success: true, staff: newStaff };
  }
}

/**
 * 最高管理員刪除人員（可刪除任何人員，同步雲端資料庫並標記已修改）
 */
export function deleteStaffMember(id: string): { success: boolean; error?: string } {
  const list = getStaffMembers();
  const filtered = list.filter(s => s.id !== id);
  if (filtered.length === list.length) {
    return { success: false, error: '找不到欲刪除的人員' };
  }
  saveStaffMembers(filtered);

  // 同步自雲端 Firestore 移除文檔
  deleteDoc(doc(db, STAFF_COLLECTION, id)).catch(err => {
    console.error('刪除人員雲端同步失敗:', err);
  });

  // 若當前登入者正好是被刪除的人員，清除當前登入
  const curr = getCurrentStaff();
  if (curr?.id === id) {
    setCurrentStaff(null);
  }
  return { success: true };
}

/**
 * 最高管理員一鍵將特定人員密碼還原為預設 000000
 */
export function resetStaffPinToDefault(id: string): { success: boolean; error?: string } {
  const list = getStaffMembers();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) {
    return { success: false, error: '找不到該人員' };
  }
  list[idx].pin = DEFAULT_EDITOR_PIN;
  saveStaffMembers(list);

  // 同步更新至雲端 Firestore
  updateDoc(doc(db, STAFF_COLLECTION, id), { pin: DEFAULT_EDITOR_PIN }).catch(err => {
    console.error('密碼還原雲端寫入失敗:', err);
  });

  return { success: true };
}

/**
 * 編輯人員自行修改專屬 6 位數密碼
 */
export function updateStaffPin(id: string, newPin: string): { success: boolean; error?: string } {
  const cleanPin = newPin.trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    return { success: false, error: '密碼必須為剛好 6 位數字' };
  }
  const list = getStaffMembers();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) {
    return { success: false, error: '找不到該人員' };
  }
  list[idx].pin = cleanPin;
  saveStaffMembers(list);

  // 同步更新至雲端 Firestore
  updateDoc(doc(db, STAFF_COLLECTION, id), { pin: cleanPin }).catch(err => {
    console.error('密碼更新雲端寫入失敗:', err);
  });

  // 同步更新當前登入狀態
  const curr = getCurrentStaff();
  if (curr?.id === id) {
    setCurrentStaff(list[idx]);
  }
  return { success: true };
}

/**
 * 取得當前會話登入的特定工作人員
 */
export function getCurrentStaff(): StaffMember | null {
  try {
    const rawId = sessionStorage.getItem(STORAGE_KEY_CURRENT_STAFF_ID);
    if (!rawId) return null;
    const list = getStaffMembers();
    return list.find(s => s.id === rawId && s.isActive) || null;
  } catch {
    return null;
  }
}

/**
 * 設定當前會話登入的工作人員
 */
export function setCurrentStaff(staff: StaffMember | null) {
  try {
    if (staff) {
      sessionStorage.setItem(STORAGE_KEY_CURRENT_STAFF_ID, staff.id);
      // 更新其 lastLoginAt
      const list = getStaffMembers();
      const idx = list.findIndex(s => s.id === staff.id);
      if (idx !== -1) {
        list[idx].lastLoginAt = new Date().toISOString();
        saveStaffMembers(list);
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEY_CURRENT_STAFF_ID);
    }
  } catch {}
}

/**
 * 取得當前最高管理員密碼（預設為 8520）
 */
export function getAdminPassword(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_PWD) || DEFAULT_ADMIN_PWD;
  } catch {
    return DEFAULT_ADMIN_PWD;
  }
}

/**
 * 設定最高管理員新密碼
 */
export function setAdminPassword(newPwd: string): { success: boolean; error?: string } {
  const trimmed = newPwd.trim();
  if (!trimmed || trimmed.length < 4) {
    return { success: false, error: '管理員密碼長度至少需 4 碼' };
  }
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_PWD, trimmed);
    return { success: true };
  } catch {
    return { success: false, error: '儲存失敗，請確認瀏覽器儲存權限' };
  }
}

/**
 * 取得全域通用編輯人員 6 位數 PIN 碼（預設 000000，向後相容）
 */
export function getEditorPin(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_EDITOR_PIN) || DEFAULT_EDITOR_PIN;
  } catch {
    return DEFAULT_EDITOR_PIN;
  }
}

/**
 * 設定全域通用編輯人員 6 位數 PIN 碼
 */
export function setEditorPin(newPin: string): { success: boolean; error?: string } {
  const trimmed = newPin.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return { success: false, error: '編輯人員密碼必須剛好為 6 位數字' };
  }
  try {
    localStorage.setItem(STORAGE_KEY_EDITOR_PIN, trimmed);
    return { success: true };
  } catch {
    return { success: false, error: '儲存失敗，請確認瀏覽器儲存權限' };
  }
}

/**
 * 管理員將通用編輯人員密碼一鍵重設回預設值 (000000)
 */
export function resetEditorPinToDefault(): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_EDITOR_PIN, DEFAULT_EDITOR_PIN);
    return true;
  } catch {
    return false;
  }
}

/**
 * 檢查目前通用編輯人員密碼是否為預設值 (000000)
 */
export function isEditorPinDefault(): boolean {
  return getEditorPin() === DEFAULT_EDITOR_PIN;
}

/**
 * 檢查目前管理員密碼是否為預設值 (8520)
 */
export function isAdminPasswordDefault(): boolean {
  return getAdminPassword() === DEFAULT_ADMIN_PWD;
}

/**
 * 驗證輸入之密碼或 PIN 碼，支援指定特定工作人員或全域比對
 */
export function verifyCredentials(
  input: string, 
  expectedRole?: UserRole, 
  specificStaffId?: string
): { 
  valid: boolean; 
  role?: UserRole; 
  staff?: StaffMember;
  message?: string 
} {
  const cleanInput = input.trim();
  const adminPwd = getAdminPassword();
  const staffList = getStaffMembers().filter(s => s.isActive);

  // ⭐【最高管理員特權通道】：無論目前選擇哪種身分或同仁，只要輸入密碼與最高管理員密碼完全相符，
  // 一律免切換身分、直接以最高管理員 (admin) 登入！
  if (cleanInput === adminPwd) {
    return { valid: true, role: 'admin' };
  }

  // 1. 若指定驗證最高管理員
  if (expectedRole === 'admin') {
    return { valid: false, message: '管理員密碼錯誤' };
  }

  // 2. 若指定特定編輯人員驗證
  if (specificStaffId) {
    const targetStaff = staffList.find(s => s.id === specificStaffId);
    if (targetStaff) {
      if (cleanInput === targetStaff.pin) {
        return { valid: true, role: 'editor', staff: targetStaff };
      }
      return { valid: false, message: `${targetStaff.name} 的 6 位數密碼錯誤` };
    }
  }

  // 3. 若指定角色為編輯人員（未指定特定人員），比對全部活躍人員的 PIN
  if (expectedRole === 'editor') {
    const matchedStaff = staffList.find(s => s.pin === cleanInput);
    if (matchedStaff) {
      return { valid: true, role: 'editor', staff: matchedStaff };
    }
    // 向後相容通用 editor PIN
    if (cleanInput === getEditorPin()) {
      return { valid: true, role: 'editor', staff: staffList[0] };
    }
    return { valid: false, message: '編輯人員 6 位數密碼錯誤' };
  }

  // 4. 自動判斷模式：優先比對最高管理員，再比對工作人員
  if (cleanInput === adminPwd) {
    return { valid: true, role: 'admin' };
  }

  const matchedStaff = staffList.find(s => s.pin === cleanInput);
  if (matchedStaff) {
    return { valid: true, role: 'editor', staff: matchedStaff };
  }

  if (cleanInput === getEditorPin() && staffList.length > 0) {
    return { valid: true, role: 'editor', staff: staffList[0] };
  }

  return { valid: false, message: '密碼錯誤，請確認後重新輸入' };
}

/**
 * 取得當前會話 (Session) 中保存的登入角色
 */
export function getStoredRole(): UserRole | null {
  try {
    const role = sessionStorage.getItem(STORAGE_KEY_AUTH_ROLE);
    if (role === 'admin' || role === 'editor') {
      return role;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 儲存或更新當前會話角色
 */
export function setStoredRole(role: UserRole | null) {
  try {
    if (role) {
      sessionStorage.setItem(STORAGE_KEY_AUTH_ROLE, role);
      sessionStorage.setItem('passport_admin_auth', 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY_AUTH_ROLE);
      sessionStorage.removeItem('passport_admin_auth');
      sessionStorage.removeItem(STORAGE_KEY_CURRENT_STAFF_ID);
    }
  } catch {}
}

/**
 * 登出並清除身分驗證會話
 */
export function clearAuth() {
  setStoredRole(null);
  setCurrentStaff(null);
}

export const clearStoredRole = clearAuth;
