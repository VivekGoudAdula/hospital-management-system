import { create } from 'zustand';
import { Department, Doctor, Patient, Document, Note, AvailabilitySlot, Prescription } from '../types';
import { 
  departments as initialDepartments, 
  doctors as initialDoctors, 
  patients as initialPatients, 
  documents as initialDocuments, 
  notes as initialNotes,
  appointments as initialAppointments
} from '../lib/mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';

const mapAppointment = (app: any) => ({
  id: app.id,
  patientId: app.patient_id,
  doctorId: app.doctor_id,
  patientName: app.patient_name || 'Unknown Patient',
  doctorName: app.doctor_name || 'Unknown Doctor',
  departmentName: app.department_name || '',
  date: app.appointment_date,
  time: app.appointment_time,
  status: app.status,
  type: app.type,
  token: app.token,
  reason: app.cancellation_reason || ''
});

const mapOTBooking = (b: any) => ({
  id: b.id,
  patientName: b.patient_name || 'Unknown Patient',
  surgeonName: b.surgeon_name || 'Unknown Surgeon',
  theatreId: b.theatre_id,
  surgeryName: b.surgery_name,
  surgeryDate: b.surgery_date,
  startTime: b.start_time,
  endTime: b.end_time,
  type: b.type,
  status: b.status,
  notes: b.notes || ''
});

interface HospitalState {
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  documents: Document[];
  notes: Note[];
  appointments: Appointment[];
  otBookings: OTBooking[];
  otStats: OTStats | null;
  prescriptions: Prescription[];
  timeline: any[];
  isLoading: boolean;
  stats: {
    total_patients: number;
    total_doctors: number;
    total_departments: number;
    total_documents: number;
    admitted_now: number;
    critical_care: number;
    out_patient: number;
    discharged: number;
    trends: {
      patients: string;
      doctors: string;
      services: string;
      records: string;
    };
  } | null;
  reports: {
    workload: { doctor: string, patients: number }[];
    volume: { date: string, count: number }[];
    summary: { total_appointments: number, unique_doctors: number };
  } | null;
  
  // Stats Actions
  fetchStats: () => Promise<void>;
  fetchReports: (startDate: string, endDate: string) => Promise<void>;
  
  // Department Actions
  fetchDepartments: () => Promise<void>;
  addDepartment: (dept: Department) => void;
  updateDepartment: (dept: Department) => void;
  deleteDepartment: (id: string) => void;
  
  // Doctor Actions
  fetchDoctors: (filters?: { name?: string, specialization?: string, department_id?: string }) => Promise<void>;
  addDoctor: (doctorData: any) => Promise<void>;
  updateDoctor: (id: string, doctorData: any) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  
  // Availability Actions
  fetchAvailability: (doctorId: string) => Promise<AvailabilitySlot[]>;
  addAvailability: (doctorId: string, slot: any) => Promise<void>;
  deleteAvailability: (slotId: string) => Promise<void>;
  
  // Patient Actions
  fetchPatients: (filters?: any) => Promise<void>;
  addPatient: (patientData: any) => Promise<any>;
  fetchPatientById: (id: string) => Promise<Patient>;
  updatePatient: (id: string, patientData: any) => Promise<void>;
  updatePatientStatus: (id: string, status: string) => Promise<void>;
  
  // Document Actions
  documentRepository: {
    data: any[];
    total: number;
  };
  fetchDocumentRepository: (filters?: { search?: string, file_type?: string, start_date?: string, end_date?: string }) => Promise<void>;
  fetchPatientDocuments: (patientId: string) => Promise<any[]>;
  fetchAllDocuments: () => Promise<void>;
  uploadDocument: (formData: FormData) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  
  // Study Actions
  studies: DocumentStudy[];
  studyRepository: DocumentStudy[];
  fetchPatientStudies: (patientId: string) => Promise<DocumentStudy[]>;
  uploadStudy: (formData: FormData) => Promise<void>;
  fetchAllStudies: (filters?: { search?: string, study_type?: string }) => Promise<void>;
  fetchStudyById: (id: string) => Promise<DocumentStudy | null>;
  deleteStudy: (id: string) => Promise<void>;
  
  // Note Actions
  addNote: (note: Note) => void;
  
  // Prescription Actions
  fetchPatientPrescriptions: (patientId: string) => Promise<Prescription[]>;
  createPrescription: (data: Partial<Prescription>) => Promise<Prescription>;
  
  // Timeline Actions
  fetchPatientTimeline: (patientId: string) => Promise<any[]>;

  // Appointment Actions
  fetchAppointments: () => Promise<void>;
  bookAppointment: (data: any) => Promise<void>;
  cancelAppointment: (id: string, reason: string) => Promise<void>;
  rescheduleAppointment: (id: string, date: string, time: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: string) => Promise<void>;

  // OT Actions
  fetchOTBookings: (filters?: any) => Promise<void>;
  bookOT: (data: any) => Promise<void>;
  updateOTStatus: (id: string, status: string) => Promise<void>;
  fetchOTStats: () => Promise<void>;
}

export const useHospitalStore = create<HospitalState>((set, get) => ({
  departments: [],
  doctors: [],
  patients: [],
  documents: [],
  documentRepository: { data: [], total: 0 },
  studies: [],
  studyRepository: [],
  notes: initialNotes,
  appointments: [],
  otBookings: [],
  otStats: null,
  prescriptions: [],
  timeline: [],
  isLoading: false,
  stats: null,
  reports: null,

  fetchStats: async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/stats/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ stats: data });
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  },

  fetchReports: async (startDate: string, endDate: string) => {
    set({ isLoading: true });
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/stats/reports?start_date=${startDate}&end_date=${endDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ reports: data });
      }
    } catch (error) {
      console.error('Fetch reports error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDepartments: async () => {
    try {
      const response = await fetch(`${API_URL}/departments/`);
      if (response.ok) {
        const data = await response.json();
        set({ departments: data });
      }
    } catch (error) {
      console.error('Fetch departments error:', error);
    }
  },

  addDepartment: (dept) => set((state) => ({ departments: [...state.departments, dept] })),
  updateDepartment: (dept) => set((state) => ({
    departments: state.departments.map((d) => d.id === dept.id ? dept : d)
  })),
  deleteDepartment: (id) => set((state) => ({
    departments: state.departments.filter((d) => d.id !== id)
  })),

  fetchDoctors: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters.name) params.append('name', filters.name);
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.department_id) params.append('department_id', filters.department_id);
      
      const response = await fetch(`${API_URL}/doctors/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // Add random status for UI since backend doesn't track it yet
        const doctorsWithStatus = data.map((d: any) => ({
          ...d,
          status: ['Available', 'On Break', 'Busy', 'Offline'][Math.floor(Math.random() * 4)]
        }));
        set({ doctors: doctorsWithStatus });
      }
    } catch (error) {
      console.error('Fetch doctors error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addDoctor: async (doctorData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/doctors/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(doctorData),
      });
      if (response.ok) {
        await get().fetchDoctors();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create doctor');
      }
    } catch (error) {
      console.error('Add doctor error:', error);
      throw error;
    }
  },

  updateDoctor: async (id, doctorData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/doctors/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(doctorData),
      });
      if (response.ok) {
        await get().fetchDoctors();
      }
    } catch (error) {
      console.error('Update doctor error:', error);
    }
  },

  deleteDoctor: async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/doctors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        set((state) => ({ doctors: state.doctors.filter((d) => d.id !== id) }));
      }
    } catch (error) {
      console.error('Delete doctor error:', error);
    }
  },

  fetchAvailability: async (doctorId) => {
    try {
      const response = await fetch(`${API_URL}/doctors/${doctorId}/availability`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Fetch availability error:', error);
    }
    return [];
  },

  addAvailability: async (doctorId, slot) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/doctors/${doctorId}/availability`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(slot),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add availability');
      }
    } catch (error) {
      console.error('Add availability error:', error);
      throw error;
    }
  },

  deleteAvailability: async (slotId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/doctors/availability/${slotId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to delete availability slot');
      }
    } catch (error) {
      console.error('Delete availability error:', error);
      throw error;
    }
  },

  fetchPatients: async (filters = {}) => {
    set({ isLoading: true });
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (filters.name) params.append('name', filters.name);
      if (filters.mrn) params.append('mrn', filters.mrn);
      if (filters.phone) params.append('phone', filters.phone);
      if (filters.status) params.append('status', filters.status);
      if (filters.doctor_id) params.append('doctor_id', filters.doctor_id);
      
      const response = await fetch(`${API_URL}/patients/?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend fields to frontend fields
        const mappedPatients = data.map((p: any, idx: number) => ({
          id: p.id || `temp-p-${idx}`,
          mrn: p.mrn,
          name: p.full_name,
          dob: p.dob,
          gender: p.gender.charAt(0).toUpperCase() + p.gender.slice(1),
          bloodGroup: p.blood_group,
          phone: p.phone,
          email: p.email,
          address: p.address,
          emergencyContact: p.emergency_contact,
          insuranceInfo: p.insurance_info,
          status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
          assignedDoctorId: p.assigned_doctor_id
        }));
        set({ patients: mappedPatients });
      }
    } catch (error) {
      console.error('Fetch patients error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addPatient: async (patientData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/patients/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patientData),
      });
      if (response.ok) {
        const result = await response.json();
        await get().fetchPatients();
        return result;
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create patient');
      }
    } catch (error) {
      console.error('Add patient error:', error);
      throw error;
    }
  },

  fetchPatientById: async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/patients/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const p = await response.json();
        return {
          id: p.id,
          mrn: p.mrn,
          name: p.full_name,
          dob: p.dob,
          gender: p.gender.charAt(0).toUpperCase() + p.gender.slice(1),
          bloodGroup: p.blood_group,
          phone: p.phone,
          email: p.email,
          address: p.address,
          emergencyContact: p.emergency_contact,
          insuranceInfo: p.insurance_info,
          status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
          assignedDoctorId: p.assigned_doctor_id
        } as Patient;
      }
    } catch (error) {
      console.error('Fetch patient error:', error);
    }
    throw new Error('Patient not found');
  },

  deletePatient: async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/patients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        await get().fetchPatients();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete patient');
      }
    } catch (error) {
      console.error('Delete patient error:', error);
      throw error;
    }
  },

  updatePatient: async (id, patientData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/patients/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patientData),
      });
      if (response.ok) {
        await get().fetchPatients();
      }
    } catch (error) {
      console.error('Update patient error:', error);
    }
  },

  updatePatientStatus: async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/patients/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: status.toLowerCase() }),
      });
      if (response.ok) {
        await get().fetchPatients();
      }
    } catch (error) {
      console.error('Update patient status error:', error);
    }
  },

  fetchDocumentRepository: async (filters = {}) => {
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.file_type && filters.file_type !== 'all') params.append('file_type', filters.file_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await fetch(`${API_URL}/documents/repository?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ documentRepository: data });
      }
    } catch (error) {
      console.error('Fetch document repository error:', error);
    }
  },

  fetchPatientDocuments: async (patientId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedDocs = data.map((d: any) => ({
          id: d.id,
          type: d.file_type,
          patientId: d.patient_id,
          fileUrl: `${BASE_URL}${d.file_url}`,
          fileName: d.file_name,
          
          scanDate: d.scan_date,
          bodyPart: d.body_part,
          department: d.department,
          referringDoctorId: d.referring_doctor_id,
          findings: d.findings,
          impression: d.impression,
          symptoms: d.symptoms,
          clinicalHistory: d.clinical_history,
          reasonForScan: d.reason_for_scan,
          doctorNotes: d.doctor_notes,

          notes: d.notes,
          uploadDate: d.created_at,
          uploadedBy: d.uploaded_by
        }));

        set({ documents: mappedDocs });
        return mappedDocs;
      }
    } catch (error) {
      console.error('Fetch patient documents error:', error);
    }
    return [];
  },

  fetchAllDocuments: async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents/repository`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ documentRepository: data });
      }
    } catch (error) {
      console.error('Fetch all documents error:', error);
    }
  },

  uploadDocument: async (formData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (response.ok) {
        await get().fetchDocumentRepository();
        const patientId = formData.get('patient_id') as string;
        if (patientId) await get().fetchPatientDocuments(patientId);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload document error:', error);
      throw error;
    }
  },

  deleteDocument: async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
      }
    } catch (error) {
      console.error('Delete document error:', error);
    }
  },

  addNote: async (noteData: any) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData),
      });
      if (response.ok) {
        const newNote = await response.json();
        set((state) => ({ 
          notes: [
            {
              id: newNote.id,
              patientId: newNote.patient_id,
              authorName: newNote.author_name,
              authorRole: newNote.author_role,
              content: newNote.content,
              createdAt: newNote.created_at
            } as Note, 
            ...state.notes
          ] 
        }));
      }
    } catch (error) {
      console.error('Add note error:', error);
    }
  },

  fetchNotesByPatient: async (patientId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/notes/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedNotes = data.map((n: any) => ({
          id: n.id,
          patientId: n.patient_id,
          authorName: n.author_name,
          authorRole: n.author_role,
          content: n.content,
          createdAt: n.created_at
        })) as Note[];
        set((state) => {
          // Filter out existing notes for this patient and add the new ones
          const otherNotes = state.notes.filter(note => note.patientId !== patientId);
          return { notes: [...mappedNotes, ...otherNotes] };
        });
      }
    } catch (error) {
      console.error('Fetch notes error:', error);
    }
  },

  fetchPatientPrescriptions: async (patientId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/prescriptions?patient_id=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set((state) => {
          // Filter out existing for this patient
          const otherRx = state.prescriptions.filter(rx => rx.patient_id !== patientId);
          return { prescriptions: [...data, ...otherRx] };
        });
        return data;
      }
    } catch (error) {
      console.error('Fetch prescriptions error:', error);
    }
    return [];
  },

  createPrescription: async (data: Partial<Prescription>) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/prescriptions/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result = await response.json();
        set((state) => ({ prescriptions: [result, ...state.prescriptions] }));
        return result;
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Create prescription error:', error);
      throw error;
    }
  },

  fetchPatientTimeline: async (patientId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/patients/${patientId}/timeline`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ timeline: data });
        return data;
      }
    } catch (error) {
      console.error('Fetch timeline error:', error);
    }
    return [];
  },

  // Study Implementation
  fetchPatientStudies: async (patientId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents/study/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedStudies = data.map((s: any) => ({
          id: s.id,
          patientId: s.patient_id,
          studyType: s.study_type,
          bodyPart: s.body_part,
          scanDate: s.scan_date,
          department: s.department,
          referringDoctorId: s.referring_doctor_id,
          findings: s.findings,
          impression: s.impression,
          symptoms: s.symptoms,
          clinicalHistory: s.clinical_history,
          reasonForScan: s.reason_for_scan,
          doctorNotes: s.doctor_notes,
          uploadedBy: s.uploaded_by,
          createdAt: s.created_at,
          files: s.files.map((f: any) => ({
            id: f.id,
            studyId: f.study_id,
            fileUrl: `${BASE_URL}${f.file_url}`,
            fileName: f.file_name,
            fileFormat: f.file_format,
            createdAt: f.created_at
          }))
        }));
        set({ studies: mappedStudies });
        return mappedStudies;
      }
    } catch (error) {
      console.error('Fetch patient studies error:', error);
    }
    return [];
  },

  uploadStudy: async (formData: FormData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents/study/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (response.ok) {
        const newStudy = await response.json();
        set((state) => ({ 
          studies: [newStudy, ...state.studies],
          stats: state.stats ? { ...state.stats, total_documents: state.stats.total_documents + 1 } : null
        }));
        // Trigger timeline refresh
        const patientId = formData.get('patient_id') as string;
        if (patientId) get().fetchPatientTimeline(patientId);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload study error:', error);
      throw error;
    }
  },

  fetchAllStudies: async (filters) => {
    const token = localStorage.getItem('token');
    try {
      let url = `${API_URL}/documents/study`;
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.study_type) params.append('study_type', filters.study_type);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ studyRepository: data });
      }
    } catch (error) {
      console.error('Fetch all studies error:', error);
    }
  },

  fetchStudyById: async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents/study/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Fetch study by ID error:', error);
    }
    return null;
  },

  deleteStudy: async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents/study/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        set((state) => ({ 
          studies: state.studies.filter(s => s.id !== id),
          studyRepository: state.studyRepository.filter(s => s.id !== id)
        }));
      }
    } catch (error) {
      console.error('Delete study error:', error);
    }
  },

  // Appointment Implementation
  fetchAppointments: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/appointments/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedAppointments = data.map(mapAppointment);
        const uniqueAppointments = mappedAppointments.filter((app: any, index: number, self: any[]) => 
          index === self.findIndex((a: any) => 
            a.patientId === app.patientId && 
            a.doctorId === app.doctorId && 
            a.date === app.date && 
            a.time === app.time
          )
        );
        set({ appointments: uniqueAppointments });
      } else {
        import('sonner').then(({ toast }) => toast.error('Failed to load appointments from server.'));
      }
    } catch (error) {
      import('sonner').then(({ toast }) => toast.error('Network error while loading appointments.'));
    } finally {
      set({ isLoading: false });
    }
  },

  bookAppointment: async (data: any) => {
    const token = localStorage.getItem('token');
    try {
      // Map camelCase to snake_case for backend
      const payload = {
        patient_id: data.patientId,
        doctor_id: data.doctorId,
        department_id: data.departmentId,
        appointment_date: data.date,
        appointment_time: data.time,
        type: data.type,
        reason: data.reason
      };

      const response = await fetch(`${API_URL}/appointments/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const rawApp = await response.json();
        const newApp = mapAppointment(rawApp);
        set((state) => {
          const exists = state.appointments.some((a: any) => 
            a.patientId === newApp.patientId && 
            a.doctorId === newApp.doctorId && 
            a.date === newApp.date && 
            a.time === newApp.time
          );
          if (exists) return state;
          return { appointments: [newApp, ...state.appointments] };
        });
        
        import('sonner').then(({ toast }) => {
          toast.success('Appointment booked successfully!', {
            description: `Token: ${newApp.token}`,
          });
        });
      } else {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to book appointment');
      }
    } catch (error: any) {
      console.error('Book appointment error:', error);
      import('sonner').then(({ toast }) => toast.error(error.message || 'Failed to book appointment'));
      throw error;
    }
  },

  cancelAppointment: async (id: string, reason: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Cancelled', cancellation_reason: reason }),
      });
      
      if (response.ok) {
        const rawApp = await response.json();
        const updatedApp = mapAppointment(rawApp);
        set((state) => ({
          appointments: state.appointments.map((app) => 
            app.id === id ? updatedApp : app
          )
        }));
        import('sonner').then(({ toast }) => toast.info('Appointment cancelled'));
      } else {
        const err = await response.json().catch(() => ({}));
        import('sonner').then(({ toast }) => toast.error(err.detail || 'Failed to cancel appointment.'));
      }
    } catch (error) {
      import('sonner').then(({ toast }) => toast.error('Connection error. Could not cancel appointment.'));
    }
  },

  rescheduleAppointment: async (id: string, date: string, time: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ appointment_date: date, appointment_time: time, status: 'Rescheduled' }),
      });
      
      if (response.ok) {
        const rawApp = await response.json();
        const updatedApp = mapAppointment(rawApp);
        set((state) => ({
          appointments: state.appointments.map((app) => 
            app.id === id ? updatedApp : app
          )
        }));
        import('sonner').then(({ toast }) => toast.success('Appointment rescheduled'));
      } else {
        const err = await response.json().catch(() => ({}));
        import('sonner').then(({ toast }) => toast.error(err.detail || 'Failed to reschedule appointment.'));
      }
    } catch (error) {
      import('sonner').then(({ toast }) => toast.error('Connection error. Could not reschedule appointment.'));
    }
  },

  updateAppointmentStatus: async (id: string, status: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        const rawApp = await response.json();
        const updatedApp = mapAppointment(rawApp);
        set((state) => ({
          appointments: state.appointments.map((app) => 
            app.id === id ? updatedApp : app
          )
        }));
        import('sonner').then(({ toast }) => toast.success(`Appointment marked as ${status}`));
      } else {
        const err = await response.json().catch(() => ({}));
        import('sonner').then(({ toast }) => toast.error(err.detail || 'Failed to update status.'));
      }
    } catch (error) {
      import('sonner').then(({ toast }) => toast.error('Connection error. Could not update status.'));
    }
  },

  // OT Implementation
  fetchOTBookings: async (filters = {}) => {
    set({ isLoading: true });
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.theatre_id) params.append('theatre_id', filters.theatre_id);
      
      const response = await fetch(`${API_URL}/ot/bookings/?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedBookings = data.map(mapOTBooking);
        const uniqueBookings = mappedBookings.filter((b: any, index: number, self: any[]) => 
          index === self.findIndex((o: any) => 
            o.theatreId === b.theatreId && 
            o.surgeryDate === b.surgeryDate && 
            o.startTime === b.startTime
          )
        );
        set({ otBookings: uniqueBookings });
      } else {
        import('sonner').then(({ toast }) => toast.error('Failed to load OT schedule.'));
      }
    } catch (error) {
      import('sonner').then(({ toast }) => toast.error('Network error while loading OT data.'));
    } finally {
      set({ isLoading: false });
    }
  },

  bookOT: async (data: any) => {
    const token = localStorage.getItem('token');
    try {
      // Map camelCase to snake_case for backend
      const payload = {
        patient_id: data.patientId,
        surgeon_id: data.surgeonId,
        theatre_id: data.theatreId,
        surgery_name: data.surgeryName,
        surgery_date: data.surgeryDate,
        start_time: data.startTime,
        end_time: data.endTime,
        type: data.type,
        notes: data.notes
      };

      const response = await fetch(`${API_URL}/ot/bookings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const rawBooking = await response.json();
        const newBooking = mapOTBooking(rawBooking);
        set((state) => ({ otBookings: [newBooking, ...state.otBookings] }));
        import('sonner').then(({ toast }) => toast.success('OT scheduled successfully'));
      } else {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to schedule OT');
      }
    } catch (error: any) {
      import('sonner').then(({ toast }) => toast.error(error.message));
      throw error;
    }
  },

  updateOTStatus: async (id: string, status: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/ot/bookings/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        const rawUpdated = await response.json();
        const updated = mapOTBooking(rawUpdated);
        set((state) => ({
          otBookings: state.otBookings.map((b) => b.id === id ? updated : b)
        }));
      }
    } catch (error) {
      console.error('Update OT status error:', error);
    }
  },

  fetchOTStats: async (date?: string) => {
    const token = localStorage.getItem('token');
    try {
      const url = date ? `${API_URL}/ot/stats/?date=${date}` : `${API_URL}/ot/stats/`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ otStats: data });
      }
    } catch (error) {
      console.error('Fetch OT stats error:', error);
    }
  },
}));
