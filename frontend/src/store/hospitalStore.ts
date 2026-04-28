import { create } from 'zustand';
import { Department, Doctor, Patient, Document, Note } from '../types';
import { 
  departments as initialDepartments, 
  doctors as initialDoctors, 
  patients as initialPatients, 
  documents as initialDocuments, 
  notes as initialNotes 
} from '../lib/mockData';

interface HospitalState {
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  documents: Document[];
  notes: Note[];
  
  // Department Actions
  addDepartment: (dept: Department) => void;
  updateDepartment: (dept: Department) => void;
  deleteDepartment: (id: string) => void;
  
  // Doctor Actions
  addDoctor: (doctor: Doctor) => void;
  updateDoctor: (doctor: Doctor) => void;
  
  // Patient Actions
  addPatient: (patient: Patient) => void;
  
  // Document Actions
  addDocument: (doc: Document) => void;
  
  // Note Actions
  addNote: (note: Note) => void;
}

export const useHospitalStore = create<HospitalState>((set) => ({
  departments: initialDepartments,
  doctors: initialDoctors.map(d => ({ ...d, email: d.name.toLowerCase().replace('dr. ', '').replace(' ', '.') + '@apexcare.com', password: 'password123' })),
  patients: initialPatients,
  documents: initialDocuments.map((d, i) => ({
    ...d,
    applicationId: `APP-00${i + 1}`,
    filesCount: Math.floor(Math.random() * 5) + 1,
    latestActivity: d.uploadDate,
    departmentName: 'Cardiology' // Default for mock
  })),
  notes: initialNotes,

  addDepartment: (dept) => set((state) => ({ departments: [...state.departments, dept] })),
  updateDepartment: (dept) => set((state) => ({
    departments: state.departments.map((d) => d.id === dept.id ? dept : d)
  })),
  deleteDepartment: (id) => set((state) => ({
    departments: state.departments.filter((d) => d.id !== id)
  })),

  addDoctor: (doctor) => set((state) => ({ doctors: [...state.doctors, doctor] })),
  updateDoctor: (doctor) => set((state) => ({
    doctors: state.doctors.map((d) => d.id === doctor.id ? doctor : d)
  })),

  addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),

  addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),

  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
}));
