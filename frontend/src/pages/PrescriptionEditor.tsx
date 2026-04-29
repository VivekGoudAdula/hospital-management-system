import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Printer,
  Download,
  Save,
  Plus,
  Trash2,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHospitalStore } from '@/store/hospitalStore';
import { toast } from 'sonner';

export default function PrescriptionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    fetchPatientById,
    createPrescription,
    doctors
  } = useHospitalStore();

  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  const assignedDoctor = patient ? doctors.find((d) => d.id === patient.assignedDoctorId) : null;

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) return;
      try {
        const p = await fetchPatientById(id);
        setPatient(p);
      } catch (error) {
        toast.error('Failed to load patient');
      } finally {
        setIsLoading(false);
      }
    };
    loadPatient();
  }, [id, fetchPatientById]);

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSave = async () => {
    if (!id) return;
    
    // Filter out empty rows
    const validMeds = medications.filter(m => m.name.trim() !== '');
    
    if (validMeds.length === 0 && !clinicalNotes.trim()) {
      toast.error('Please add clinical notes or medications');
      return;
    }

    if (!patient.assignedDoctorId) {
      toast.error('This patient has no assigned doctor. Please assign one first.');
      return;
    }

    setIsSaving(true);
    try {
      await createPrescription({
        patient_id: id,
        doctor_id: patient.assignedDoctorId,
        clinical_notes: clinicalNotes,
        medications: validMeds,
        additional_notes: additionalNotes
      });
      toast.success('Prescription saved successfully');
      navigate(`/patients/${id}`);
    } catch (error) {
      toast.error('Failed to save prescription');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 print:bg-white print:p-0">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/patients/${id}`)}>
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900">New Prescription</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* A4 Canvas Area */}
      <div className="flex justify-center mt-8 print:mt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-2xl print:shadow-none print:w-full print:max-w-none"
          style={{ width: '794px', minHeight: '1123px' }}
        >
          {/* Header */}
          <div className="p-10 border-b-2 border-indigo-600 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Stethoscope className="h-8 w-8" />
                <h1 className="text-3xl font-serif font-bold text-slate-900">ApexCare</h1>
              </div>
              <p className="text-sm font-medium text-slate-600">ApexCare Medical Center</p>
              <p className="text-xs text-slate-500">123 Health Avenue, Medical District</p>
              <p className="text-xs text-slate-500">Contact: +1 (555) 123-4567</p>
            </div>
            <div className="text-right space-y-1">
              <h2 className="text-xl font-bold text-slate-900">{assignedDoctor?.name || 'Dr. Medical Staff'}</h2>
              <p className="text-sm font-bold text-indigo-600">{assignedDoctor?.specialization || 'General Physician'}</p>
              <p className="text-xs text-slate-500">Reg No: {assignedDoctor?.registration_number || 'MED-2024-XXXX'}</p>
            </div>
          </div>

          <div className="p-10 space-y-8">
            {/* Patient Info */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name:</span>
                  <span className="text-base font-bold text-slate-900">{patient.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Age/Sex:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {new Date().getFullYear() - new Date(patient.dob).getFullYear()}Y / {patient.gender.charAt(0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">MRN:</span>
                    <span className="text-sm font-medium text-slate-900">{patient.mrn}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date:</span>
                <span className="text-sm font-medium text-slate-900 ml-2">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Rx Symbol */}
            <div className="text-4xl font-serif font-bold text-slate-900 pt-4">Rx</div>

            {/* Clinical Notes */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                Clinical Assessment
              </h3>
              <textarea
                className="w-full min-h-[100px] p-0 text-sm text-slate-800 bg-transparent border-none focus:ring-0 resize-none print:resize-none outline-none placeholder:text-slate-300"
                placeholder="Chief complaints, diagnosis, vitals, observations..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </div>

            {/* Medications Table */}
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 border-b-2 border-slate-800 pb-2">
                <div className="col-span-4 text-xs font-bold text-slate-800 uppercase tracking-wider">Medicine Name</div>
                <div className="col-span-2 text-xs font-bold text-slate-800 uppercase tracking-wider">Dosage</div>
                <div className="col-span-2 text-xs font-bold text-slate-800 uppercase tracking-wider">Frequency</div>
                <div className="col-span-2 text-xs font-bold text-slate-800 uppercase tracking-wider">Duration</div>
                <div className="col-span-2 text-xs font-bold text-slate-800 uppercase tracking-wider">Instructions</div>
              </div>

              {medications.map((med, index) => (
                <div key={index} className="group relative grid grid-cols-12 gap-4 items-start border-b border-slate-100 pb-3">
                  <div className="col-span-4">
                    <input
                      type="text"
                      className="w-full p-0 text-sm font-bold text-slate-900 bg-transparent border-none focus:ring-0 outline-none placeholder:font-normal placeholder:text-slate-300"
                      placeholder="e.g. Paracetamol 500mg"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      className="w-full p-0 text-sm text-slate-700 bg-transparent border-none focus:ring-0 outline-none placeholder:text-slate-300"
                      placeholder="e.g. 1 Tab"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      className="w-full p-0 text-sm text-slate-700 bg-transparent border-none focus:ring-0 outline-none placeholder:text-slate-300"
                      placeholder="e.g. 1-0-1"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      className="w-full p-0 text-sm text-slate-700 bg-transparent border-none focus:ring-0 outline-none placeholder:text-slate-300"
                      placeholder="e.g. 5 days"
                      value={med.duration}
                      onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 relative">
                    <input
                      type="text"
                      className="w-full p-0 text-sm text-slate-500 italic bg-transparent border-none focus:ring-0 outline-none placeholder:text-slate-300"
                      placeholder="After food"
                      value={med.instructions}
                      onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                    />
                    {medications.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-6 w-6 text-rose-500 hover:bg-rose-50 print:hidden"
                        onClick={() => handleRemoveMedication(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 print:hidden gap-1 mt-2"
                onClick={handleAddMedication}
              >
                <Plus className="h-3.5 w-3.5" /> Add Medicine
              </Button>
            </div>

            {/* Additional Notes */}
            <div className="space-y-3 pt-6">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                Additional Advice / Investigations
              </h3>
              <textarea
                className="w-full min-h-[80px] p-0 text-sm text-slate-600 bg-transparent border-none focus:ring-0 resize-none print:resize-none outline-none placeholder:text-slate-300"
                placeholder="Dietary advice, next review date, required tests..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>

            {/* Footer Signature */}
            <div className="pt-20 flex justify-end">
              <div className="text-center">
                <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
                <p className="text-sm font-bold text-slate-900">{assignedDoctor?.name || 'Doctor Signature'}</p>
                <p className="text-xs text-slate-500">{assignedDoctor?.specialization}</p>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
