/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  specialization?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  floor: string;
  hodId: string;
  hodName: string;
  totalBeds: number;
  availableBeds: number;
  icuSlots: number;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  is_primary: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  password?: string;
  specialization: string;
  sub_specialization?: string;
  qualifications: string[];
  experience_years: number;
  registration_number: string;
  consultation_fee: number;
  followup_fee: number;
  departments: DepartmentInfo[];
  created_at: string;
  status?: 'Available' | 'On Break' | 'Busy' | 'Offline';
  availability?: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  id: string;
  doctor_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  consultation_duration: number;
  is_leave: boolean;
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  insuranceInfo: string;
  status: 'Stable' | 'Critical' | 'Discharged' | 'In Treatment';
  assignedDoctorId: string;
}

export interface Document {
  id: string;
  applicationId: string;
  type: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  uploadDate: string;
  thumbnail: string;
  fileUrl: string;
  notes: string;
  departmentId?: string;
  departmentName?: string;
  filesCount: number;
  latestActivity: string;
  uploadedBy: string;
}

export interface Note {
  id: string;
  patientId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}
