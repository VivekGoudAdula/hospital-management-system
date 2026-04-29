import { create } from 'zustand';
import { Department, Doctor, Patient, Document, Note, AvailabilitySlot } from '../types';
import { 
  departments as initialDepartments, 
  doctors as initialDoctors, 
  patients as initialPatients, 
  documents as initialDocuments, 
  notes as initialNotes 
} from '../lib/mockData';

const API_URL = 'http://localhost:8000/api';

interface HospitalState {
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  documents: Document[];
  notes: Note[];
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
  
  // Stats Actions
  fetchStats: () => Promise<void>;
  
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
  fetchPatientDocuments: (patientId: string) => Promise<void>;
  fetchAllDocuments: () => Promise<void>;
  uploadDocument: (formData: FormData) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  
  // Note Actions
  addNote: (note: Note) => void;
}

export const useHospitalStore = create<HospitalState>((set, get) => ({
  departments: [],
  doctors: [],
  patients: [],
  documents: [],
  notes: initialNotes,
  isLoading: false,
  stats: null,

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

  fetchDepartments: async () => {
    try {
      const response = await fetch(`${API_URL}/departments`);
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
      
      const response = await fetch(`${API_URL}/doctors?${params.toString()}`);
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
      const response = await fetch(`${API_URL}/doctors`, {
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
      
      const response = await fetch(`${API_URL}/patients?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend fields to frontend fields
        const mappedPatients = data.map((p: any) => ({
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
      const response = await fetch(`${API_URL}/patients`, {
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

  fetchPatientDocuments: async (patientId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents?patient_id=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedDocs = data.map((d: any) => ({
          id: d.id,
          type: d.file_type,
          patientId: d.patient_id,
          fileUrl: `http://localhost:8000${d.file_url}`,
          fileName: d.file_name,
          notes: d.notes,
          uploadDate: d.created_at,
          uploadedBy: d.uploaded_by
        }));
        set({ documents: mappedDocs });
      }
    } catch (error) {
      console.error('Fetch documents error:', error);
    }
  },

  fetchAllDocuments: async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedDocs = data.map((d: any) => ({
          id: d.id,
          type: d.file_type,
          patientId: d.patient_id,
          fileUrl: `http://localhost:8000${d.file_url}`,
          fileName: d.file_name,
          notes: d.notes,
          uploadDate: d.created_at,
          uploadedBy: d.uploaded_by,
          patientName: d.patient_name,
          patientMrn: d.patient_mrn
        }));
        set({ documents: mappedDocs });
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
}));
