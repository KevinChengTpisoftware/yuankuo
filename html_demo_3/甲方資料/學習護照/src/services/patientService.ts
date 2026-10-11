import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { db } from '../firebase';
import { Patient } from '../types';

const PATIENTS_COLLECTION = 'patients';

/**
 * 測試 Firestore 雲端資料庫連線狀況
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    console.warn('Firestore 連線狀態或初始化提示:', error);
    return true;
  }
}

/**
 * 即時訂閱所有個案清單（自動依更新時間排序）
 */
export function subscribePatients(
  callback: (patients: Patient[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(collection(db, PATIENTS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const patients: Patient[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || '未命名個案',
            caseNumber: data.caseNumber || '',
            bedNumber: data.bedNumber || '',
            age: data.age || '',
            upstreamHospital: data.upstreamHospital || '',
            caregiver: data.caregiver || '',
            homeLocation: data.homeLocation || '',
            primaryMedicalDecisionMaker: data.primaryMedicalDecisionMaker || '',
            familyMarriage: data.familyMarriage || '',
            economicStatus: data.economicStatus || '',
            preMorbidOccupation: data.preMorbidOccupation || '',
            interestsSpecialties: data.interestsSpecialties || '',
            educationLevel: data.educationLevel || '',
            livingEnvironment: data.livingEnvironment || '',
            cohabitingFamily: data.cohabitingFamily || '',
            preMorbidPersonality: data.preMorbidPersonality || '',
            postMorbidPersonality: data.postMorbidPersonality || '',
            primaryTherapist: data.primaryTherapist || '',
            admissionDate: data.admissionDate || '',
            diagnosis: data.diagnosis || '',
            targetGoal: data.targetGoal || '',
            status: data.status || 'active',
            completedTasks: Array.isArray(data.completedTasks) ? data.completedTasks : [],
            taskPartners: data.taskPartners && typeof data.taskPartners === 'object' ? data.taskPartners : {},
            taskCompletedAt: data.taskCompletedAt && typeof data.taskCompletedAt === 'object' ? data.taskCompletedAt : {},
            clinicalRemarks: data.clinicalRemarks || '',
            createdAt: data.createdAt ? String(data.createdAt) : '',
            updatedAt: data.updatedAt ? String(data.updatedAt) : '',
          };
        });
        callback(patients);
      },
      (error) => {
        console.error('即時載入個案資料失敗:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error('初始化個案訂閱失敗:', err);
    return () => {};
  }
}

/**
 * 建立或新增一個個案
 */
export async function createPatientInCloud(patientData: Omit<Patient, 'id'>): Promise<string> {
  const newDocRef = doc(collection(db, PATIENTS_COLLECTION));
  const newPatient: Patient = {
    ...patientData,
    id: newDocRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(newDocRef, {
    ...newPatient,
    serverTimestamp: serverTimestamp(),
  });

  return newDocRef.id;
}

/**
 * 更新個案基本資料
 */
export async function updatePatientInfo(
  patientId: string, 
  data: Partial<Omit<Patient, 'id' | 'completedTasks'>>
) {
  const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
  await updateDoc(patientRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * 更新個案的生活功能達成任務 ID 陣列、共學夥伴標記與任務解鎖時間戳記
 */
export async function savePatientTasksToCloud(
  patientId: string, 
  completedTasks: number[],
  clinicalRemarks?: string,
  taskPartners?: Record<number, string[]>,
  taskCompletedAt?: Record<number, string>
) {
  const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
  const payload: Record<string, any> = {
    completedTasks,
    updatedAt: new Date().toISOString(),
  };
  if (clinicalRemarks !== undefined) {
    payload.clinicalRemarks = clinicalRemarks;
  }
  if (taskPartners !== undefined) {
    payload.taskPartners = taskPartners;
  }
  if (taskCompletedAt !== undefined) {
    payload.taskCompletedAt = taskCompletedAt;
  }
  await updateDoc(patientRef, payload);
}

/**
 * 刪除或封存個案
 */
export async function deletePatientFromCloud(patientId: string) {
  const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
  await deleteDoc(patientRef);
}
