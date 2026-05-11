import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Visit {
  id: string;
  patient_id: string;
  doctor_id?: string;
  department_id?: string;
  visit_type: string;
  status: string;
  chief_complaint?: string;
  admission_date: string;
  discharge_date?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  full_name: string;
  dob: string;
  gender: string;
  phone: string;
  email?: string;
  address: string;
  status: string;
  assigned_doctor_id?: string;
}

export interface TimelineItem {
  type: 'visit' | 'soap' | 'prescription' | 'lab';
  title: string;
  timestamp: string;
  created_by: string;
  metadata?: Record<string, unknown>;
}

export interface SoapNote {
  id: string;
  patient_id: string;
  visit_id: string;
  doctor_id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  status: 'draft' | 'signed';
  signed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationItem {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  visit_id: string;
  doctor_id: string;
  diagnosis_id?: string;
  medicines: MedicationItem[];
  notes: string;
  status: 'draft' | 'finalized';
  signed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationHistoryItem {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribed_at: string;
  doctor_id: string;
}

export interface MedicineMetadata {
  name: string;
  generic: string;
  dosage_variants: string[];
  category: string;
  contraindications: string[];
  interactions: string[];
}

export interface ICDCode {
  code: string;
  label: string;
}

export interface Diagnosis {
  id: string;
  patient_id: string;
  visit_id: string;
  doctor_id: string;
  primary_diagnosis: ICDCode;
  secondary_diagnoses: ICDCode[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type SoapSection = 'subjective' | 'objective' | 'assessment' | 'plan';

// ─── State interface ─────────────────────────────────────────────────────────

interface EHRState {
  currentPatient: Patient | null;
  currentVisit: Visit | null;
  visitHistory: Visit[];
  timeline: TimelineItem[];
  loading: boolean;
  selectedTab: string;

  /** SOAP Notes state */
  soapNote: SoapNote | null;
  soapLoading: boolean;

  /** Diagnosis state */
  diagnosis: Diagnosis | null;
  diagnosisLoading: boolean;

  // EHR actions
  fetchPatientEHR: (patientId: string) => Promise<void>;
  fetchActiveVisit: (patientId: string) => Promise<void>;
  createVisit: (patientId: string, doctorId: string) => Promise<void>;
  fetchTimeline: (patientId: string) => Promise<void>;
  setSelectedTab: (tab: string) => void;
  reset: () => void;

  // SOAP actions
  fetchSOAP: (visitId: string) => Promise<void>;
  createSOAP: (data: { patient_id: string; visit_id: string }) => Promise<SoapNote | null>;
  saveSOAP: (noteId: string, data: Partial<Pick<SoapNote, SoapSection>>) => Promise<SoapNote | null>;
  signSOAP: (noteId: string) => Promise<void>;

  // Diagnosis actions
  fetchDiagnosis: (visitId: string) => Promise<void>;
  saveDiagnosis: (data: {
    patient_id: string;
    visit_id: string;
    primary_diagnosis: ICDCode;
    secondary_diagnoses: ICDCode[];
    notes?: string;
  }) => Promise<void>;
  updateDiagnosis: (id: string, data: Partial<Diagnosis>) => Promise<void>;
  deleteDiagnosis: (id: string) => Promise<void>;
  searchICD: (query: string) => Promise<ICDCode[]>;

  /** Prescription state */
  prescription: Prescription | null;
  medicationHistory: MedicationHistoryItem[];
  prescriptionLoading: boolean;

  // Prescription actions
  fetchVisitPrescription: (visitId: string) => Promise<void>;
  createPrescription: (data: Partial<Prescription>) => Promise<void>;
  updatePrescription: (id: string, data: Partial<Prescription>) => Promise<void>;
  finalizePrescription: (id: string) => Promise<void>;
  fetchMedicationHistory: (patientId: string) => Promise<void>;
  searchMedicines: (query: string) => Promise<MedicineMetadata[]>;
  checkDrugInteractions: (patientId: string, medicines: MedicationItem[]) => Promise<any[]>;
  generatePrescriptionPDF: (id: string) => Promise<string | null>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useEHRStore = create<EHRState>((set, get) => ({
  currentPatient: null,
  currentVisit: null,
  visitHistory: [],
  timeline: [],
  loading: false,
  selectedTab: 'Overview',
  soapNote: null,
  soapLoading: false,
  diagnosis: null,
  diagnosisLoading: false,
  prescription: null,
  medicationHistory: [],
  prescriptionLoading: false,

  // ── EHR actions ──────────────────────────────────────────────────────────

  fetchPatientEHR: async (patientId) => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [patientRes, visitsRes] = await Promise.all([
        axios.get(`${API_URL}/patients/${patientId}`, { headers }),
        axios.get(`${API_URL}/ehr/patients/${patientId}/visits`, { headers }),
      ]);

      set({
        currentPatient: patientRes.data,
        visitHistory: visitsRes.data,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching patient EHR:', error);
      set({ loading: false });
    }
  },

  fetchActiveVisit: async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(
        `${API_URL}/ehr/patients/${patientId}/get-or-create-visit`,
        { headers }
      );
      set({ currentVisit: res.data });
    } catch (error) {
      console.error('Error fetching/creating active visit:', error);
    }
  },

  createVisit: async (patientId, doctorId) => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${API_URL}/ehr/visits/create`,
        { patient_id: patientId, doctor_id: doctorId, visit_type: 'OPD' },
        { headers }
      );
      set({ currentVisit: res.data, loading: false });
    } catch (error) {
      console.error('Error creating visit:', error);
      set({ loading: false });
    }
  },

  fetchTimeline: async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(
        `${API_URL}/ehr/patients/${patientId}/timeline`,
        { headers }
      );
      set({ timeline: res.data });
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  },

  setSelectedTab: (tab) => set({ selectedTab: tab }),

  reset: () =>
    set({
      currentPatient: null,
      currentVisit: null,
      visitHistory: [],
      timeline: [],
      selectedTab: 'Overview',
      soapNote: null,
      soapLoading: false,
      diagnosis: null,
      diagnosisLoading: false,
      prescription: null,
      medicationHistory: [],
      prescriptionLoading: false,
    }),

  // ── SOAP actions ─────────────────────────────────────────────────────────

  fetchSOAP: async (visitId) => {
    set({ soapLoading: true });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/ehr/soap/${visitId}`, { headers });
      // API returns null when no note exists yet
      set({ soapNote: res.data ?? null, soapLoading: false });
    } catch (error) {
      console.error('Error fetching SOAP note:', error);
      set({ soapLoading: false });
    }
  },

  createSOAP: async (data) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/ehr/soap`, data, { headers });
      const note: SoapNote = res.data;
      set({ soapNote: note });
      return note;
    } catch (error) {
      console.error('Error creating SOAP note:', error);
      return null;
    }
  },

  saveSOAP: async (noteId, data) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.patch(`${API_URL}/ehr/soap/${noteId}`, data, { headers });
      const note: SoapNote = res.data;
      set({ soapNote: note });
      return note;
    } catch (error) {
      console.error('Error saving SOAP note:', error);
      return null;
    }
  },

  signSOAP: async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/ehr/soap/${noteId}/sign`, {}, { headers });
      set({ soapNote: res.data });
      // Refresh timeline so signing event appears
      const { currentPatient, fetchTimeline } = get();
      if (currentPatient) fetchTimeline(currentPatient.id);
    } catch (error) {
      console.error('Error signing SOAP note:', error);
      throw error;
    }
  },

  // ── Diagnosis actions ──────────────────────────────────────────────────

  fetchDiagnosis: async (visitId) => {
    set({ diagnosisLoading: true });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/ehr/diagnosis/${visitId}`, { headers });
      set({ diagnosis: res.data, diagnosisLoading: false });
    } catch (error) {
      console.error('Error fetching diagnosis:', error);
      set({ diagnosisLoading: false });
    }
  },

  saveDiagnosis: async (data) => {
    set({ diagnosisLoading: true });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/ehr/diagnosis`, data, { headers });
      set({ diagnosis: res.data, diagnosisLoading: false });
      
      // Refresh timeline
      const { currentPatient, fetchTimeline } = get();
      if (currentPatient) fetchTimeline(currentPatient.id);
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      set({ diagnosisLoading: false });
      throw error;
    }
  },

  updateDiagnosis: async (id, data) => {
    set({ diagnosisLoading: true });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.patch(`${API_URL}/ehr/diagnosis/${id}`, data, { headers });
      set({ diagnosis: res.data, diagnosisLoading: false });
      
      // Refresh timeline
      const { currentPatient, fetchTimeline } = get();
      if (currentPatient) fetchTimeline(currentPatient.id);
    } catch (error) {
      console.error('Error updating diagnosis:', error);
      set({ diagnosisLoading: false });
      throw error;
    }
  },

  deleteDiagnosis: async (id) => {
    set({ diagnosisLoading: true });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/ehr/diagnosis/${id}`, { headers });
      set({ diagnosis: null, diagnosisLoading: false });
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
      set({ diagnosisLoading: false });
      throw error;
    }
  },

  searchICD: async (query) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/ehr/icd/search?q=${query}`, { headers });
      return res.data;
    } catch (error) {
      console.error('Error searching ICD:', error);
      return [];
    }
  },

  // ── Prescription actions ──────────────────────────────────────────────

  fetchVisitPrescription: async (visitId) => {
    set({ prescriptionLoading: true });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/ehr/prescription/visit/${visitId}`, { headers });
      set({ prescription: res.data, prescriptionLoading: false });
    } catch (error) {
      console.error('Error fetching prescription:', error);
      set({ prescriptionLoading: false });
    }
  },

  createPrescription: async (data) => {
    set({ prescriptionLoading: true });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/ehr/prescription`, data, { headers });
      set({ prescription: res.data, prescriptionLoading: false });
      
      const { currentPatient, fetchTimeline } = get();
      if (currentPatient) fetchTimeline(currentPatient.id);
    } catch (error) {
      console.error('Error creating prescription:', error);
      set({ prescriptionLoading: false });
      throw error;
    }
  },

  updatePrescription: async (id, data) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.patch(`${API_URL}/ehr/prescription/${id}`, data, { headers });
      set({ prescription: res.data });
    } catch (error) {
      console.error('Error updating prescription:', error);
      throw error;
    }
  },

  finalizePrescription: async (id) => {
    set({ prescriptionLoading: true });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/ehr/prescription/${id}/finalize`, {}, { headers });
      set({ prescription: res.data, prescriptionLoading: false });
      
      const { currentPatient, fetchTimeline } = get();
      if (currentPatient) fetchTimeline(currentPatient.id);
    } catch (error) {
      console.error('Error finalizing prescription:', error);
      set({ prescriptionLoading: false });
      throw error;
    }
  },

  fetchMedicationHistory: async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/ehr/prescription/history/${patientId}`, { headers });
      set({ medicationHistory: res.data });
    } catch (error) {
      console.error('Error fetching medication history:', error);
    }
  },

  searchMedicines: async (query) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/ehr/prescription/medicines/search?q=${query}`, { headers });
      return res.data;
    } catch (error) {
      console.error('Error searching medicines:', error);
      return [];
    }
  },

  checkDrugInteractions: async (patientId, medicines) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/ehr/prescription/check-interactions`, {
        patientId,
        medicines
      }, { headers });
      return res.data;
    } catch (error) {
      console.error('Error checking interactions:', error);
      return [];
    }
  },

  generatePrescriptionPDF: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/ehr/prescription/${id}/pdf`, {}, { headers });
      return res.data.pdf_url;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  },
}));
