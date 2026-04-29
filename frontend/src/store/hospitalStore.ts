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
  addPatient: (patient: Patient) => void;
  
  // Document Actions
  addDocument: (doc: Document) => void;
  
  // Note Actions
  addNote: (note: Note) => void;
}

export const useHospitalStore = create<HospitalState>((set, get) => ({
  departments: [],
  doctors: [],
  patients: initialPatients,
  documents: initialDocuments.map((d, i) => ({
    ...d,
    applicationId: `APP-00${i + 1}`,
    filesCount: Math.floor(Math.random() * 5) + 1,
    latestActivity: d.uploadDate,
    departmentName: 'Cardiology'
  })),
  notes: initialNotes,
  isLoading: false,

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

  addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),

  addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),

  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
}));
