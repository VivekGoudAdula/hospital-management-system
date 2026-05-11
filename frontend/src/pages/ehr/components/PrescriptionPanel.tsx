import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  Printer, 
  Save, 
  CheckCircle, 
  History, 
  AlertCircle, 
  ChevronRight,
  Clipboard,
  Download,
  AlertTriangle,
  X,
  Keyboard,
  Star,
  Clock,
  ExternalLink,
  Stethoscope
} from 'lucide-react';
import { useEHRStore, MedicationItem, MedicineMetadata } from '@/store/ehrStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PrescriptionPanel = () => {
  const { 
    currentPatient, 
    currentVisit, 
    diagnosis,
    prescription, 
    prescriptionLoading,
    medicationHistory,
    fetchVisitPrescription,
    createPrescription,
    updatePrescription,
    finalizePrescription,
    searchMedicines,
    checkDrugInteractions,
    generatePrescriptionPDF,
    fetchMedicationHistory
  } = useEHRStore();

  const [medicines, setMedicines] = useState<MedicationItem[]>([]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MedicineMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [interactionAlerts, setInteractionAlerts] = useState<any[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentVisit?.id) {
      fetchVisitPrescription(currentVisit.id);
    }
    if (currentPatient?.id) {
      fetchMedicationHistory(currentPatient.id);
    }
  }, [currentVisit?.id, currentPatient?.id]);

  useEffect(() => {
    if (prescription) {
      setMedicines(prescription.medicines || []);
      setNotes(prescription.notes || '');
    } else {
      setMedicines([]);
      setNotes('');
    }
  }, [prescription]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 1) {
        const results = await searchMedicines(searchTerm);
        setSearchResults(results);
        setIsSearching(true);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddMedicine = (med: MedicineMetadata) => {
    const newItem: MedicationItem = {
      medicine_name: med.name,
      dosage: med.dosage_variants[0] || '1 tablet',
      frequency: 'TID',
      duration: '5 days',
      route: 'Oral',
      instructions: 'After food'
    };
    const updated = [...medicines, newItem];
    setMedicines(updated);
    setSearchTerm('');
    setIsSearching(false);
    checkInteractions(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
    checkInteractions(updated);
  };

  const handleUpdateMedicine = (index: number, field: keyof MedicationItem, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
    if (field === 'medicine_name') checkInteractions(updated);
  };

  const checkInteractions = async (currentMeds: MedicationItem[]) => {
    if (currentPatient?.id) {
      const alerts = await checkDrugInteractions(currentPatient.id, currentMeds);
      setInteractionAlerts(alerts);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentVisit || !currentPatient) return;
    
    try {
      if (prescription) {
        await updatePrescription(prescription.id, { medicines, notes });
      } else {
        await createPrescription({
          patient_id: currentPatient.id,
          visit_id: currentVisit.id,
          medicines,
          notes,
          diagnosis_id: diagnosis?.id
        });
      }
      toast.success('Prescription draft saved');
    } catch (error) {
      toast.error('Failed to save prescription');
    }
  };

  const handleFinalize = async () => {
    if (!prescription) {
      toast.error('Save as draft first');
      return;
    }
    
    try {
      await finalizePrescription(prescription.id);
      toast.success('Prescription finalized and signed');
    } catch (error) {
      toast.error('Failed to finalize prescription');
    }
  };

  const handlePrint = async () => {
    if (!prescription) return;
    try {
      const url = await generatePrescriptionPDF(prescription.id);
      if (url) {
        window.open(`http://localhost:8000${url}`, '_blank');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const reuseMedication = (med: MedicationHistoryItem) => {
    const newItem: MedicationItem = {
      medicine_name: med.medicine_name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      route: 'Oral',
      instructions: 'As previously prescribed'
    };
    const updated = [...medicines, newItem];
    setMedicines(updated);
    checkInteractions(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearching) return;

    if (e.key === 'ArrowDown') {
      setSelectedResultIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedResultIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedResultIndex >= 0) {
      handleAddMedicine(searchResults[selectedResultIndex]);
      setSelectedResultIndex(-1);
    } else if (e.key === 'Escape') {
      setIsSearching(false);
    }
  };

  const isFinalized = prescription?.status === 'finalized';

  return (
    <div className="grid grid-cols-12 gap-8 h-full">
      {/* MAIN PRESCRIPTION WORKSPACE */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                 <Clipboard className="h-5 w-5" />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-slate-800 tracking-tight">Prescription Workspace</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">A4 Clinical Standard</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-slate-200 text-[10px] font-bold uppercase tracking-widest h-9"
                onClick={handleSaveDraft}
                disabled={prescriptionLoading || isFinalized}
              >
                <Save className="h-3.5 w-3.5 mr-2" /> Save Draft
              </Button>
              <Button 
                size="sm" 
                className="rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 text-[10px] font-bold uppercase tracking-widest h-9"
                onClick={handleFinalize}
                disabled={prescriptionLoading || isFinalized || medicines.length === 0}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-2" /> Finalize Rx
              </Button>
              {isFinalized && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-[10px] font-bold uppercase tracking-widest h-9"
                  onClick={handlePrint}
                >
                  <Printer className="h-3.5 w-3.5 mr-2" /> Print PDF
                </Button>
              )}
           </div>
        </div>

        {/* Prescription Sheet - Adopting A4 style from existing format */}
        <Card className="rounded-none border-none shadow-2xl bg-white overflow-hidden min-h-[1123px] w-[794px] mx-auto flex flex-col relative print:shadow-none">
          {isFinalized && (
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none opacity-[0.03]">
               <div className="rotate-12 border-[20px] border-emerald-500 px-20 py-10 rounded-[4rem]">
                  <p className="text-[120px] font-black text-emerald-500 uppercase tracking-tighter italic">Finalized</p>
               </div>
            </div>
          )}

          {/* Header - Adopting from PrescriptionEditor.tsx */}
          <div className="p-10 border-b-2 border-indigo-600 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Stethoscope className="h-10 w-10" />
                <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">ApexCare</h1>
              </div>
              <p className="text-sm font-bold text-slate-700">ApexCare Medical Center</p>
              <p className="text-xs font-medium text-slate-500">123 Health Avenue, Medical District</p>
              <p className="text-xs font-medium text-slate-500">Contact: +1 (555) 123-4567</p>
            </div>
            <div className="text-right space-y-1">
              <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Dr. Vivek Goud</h2>
              <p className="text-sm font-bold text-indigo-600">General Physician</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reg No: MED-2024-9921</p>
            </div>
          </div>

          <div className="p-10 space-y-10 flex-1 flex flex-col">
             {/* Patient Info - Adopting from PrescriptionEditor.tsx */}
             <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                <div className="space-y-3">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Name:</span>
                      <span className="text-lg font-bold text-slate-900 tracking-tight">{currentPatient?.full_name}</span>
                   </div>
                   <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age/Sex:</span>
                         <span className="text-sm font-bold text-slate-800">
                           {currentPatient?.dob ? new Date().getFullYear() - new Date(currentPatient.dob).getFullYear() : 'N/A'}Y / {currentPatient?.gender?.charAt(0)}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MRN:</span>
                         <span className="text-sm font-bold text-slate-800 font-mono">{currentPatient?.mrn}</span>
                      </div>
                   </div>
                </div>
                <div className="text-right space-y-1">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Date</span>
                   <span className="text-sm font-bold text-slate-900">{format(new Date(), 'dd MMMM, yyyy')}</span>
                </div>
             </div>

             {/* Rx Symbol */}
             <div className="pt-2">
                <span className="text-5xl font-serif font-bold text-slate-900 select-none italic">Rx</span>
             </div>

             {/* Interaction Alerts */}
             <AnimatePresence>
                {interactionAlerts.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    {interactionAlerts.map((alert, i) => (
                      <div key={i} className={cn(
                        "p-3 rounded-xl flex items-center gap-3 border",
                        alert.severity === 'high' ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-amber-50 border-amber-100 text-amber-700"
                      )}>
                        {alert.severity === 'high' ? <AlertTriangle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <span className="text-[11px] font-bold uppercase tracking-wide">{alert.message}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
             </AnimatePresence>

             {/* Medicine Search */}
             {!isFinalized && (
               <div className="relative" ref={searchRef}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                     <Search className="h-5 w-5" />
                  </div>
                  <Input 
                    placeholder="Search medicines by name or generic..."
                    className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  
                  <AnimatePresence>
                    {isSearching && searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                         <div className="p-2">
                            {searchResults.map((res, index) => (
                              <button
                                key={index}
                                onClick={() => handleAddMedicine(res)}
                                className={cn(
                                  "w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group",
                                  selectedResultIndex === index ? "bg-indigo-50" : "hover:bg-slate-50"
                                )}
                              >
                                <div>
                                   <p className="text-sm font-bold text-slate-800">{res.name}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{res.generic} • {res.category}</p>
                                </div>
                                <Plus className={cn("h-4 w-4 transition-colors", selectedResultIndex === index ? "text-indigo-600" : "text-slate-300 group-hover:text-indigo-600")} />
                              </button>
                            ))}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
             )}

             {/* Medicines Table */}
             <div className="flex-1">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 mb-4 border-b-2 border-slate-900">
                   <div className="col-span-4 text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Medicine</div>
                   <div className="col-span-2 text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Dosage</div>
                   <div className="col-span-2 text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Freq</div>
                   <div className="col-span-2 text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Duration</div>
                   <div className="col-span-2"></div>
                </div>

                <div className="space-y-4">
                   <AnimatePresence initial={false}>
                      {medicines.map((med, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="grid grid-cols-12 gap-4 items-start px-4 pb-4 border-b border-slate-100 group transition-all"
                        >
                           <div className="col-span-4">
                              <p className="text-sm font-bold text-slate-900 mb-1">{med.medicine_name}</p>
                              <Input 
                                placeholder="Instructions (e.g. After food)..."
                                className="h-6 text-[10px] border-none bg-transparent p-0 focus-visible:ring-0 text-slate-400 font-bold uppercase tracking-widest italic"
                                value={med.instructions}
                                onChange={(e) => handleUpdateMedicine(index, 'instructions', e.target.value)}
                                disabled={isFinalized}
                              />
                           </div>
                           <div className="col-span-2">
                              <Input 
                                value={med.dosage}
                                className="h-8 rounded-lg border-none bg-slate-50/50 text-xs font-bold text-slate-700"
                                onChange={(e) => handleUpdateMedicine(index, 'dosage', e.target.value)}
                                disabled={isFinalized}
                              />
                           </div>
                           <div className="col-span-2">
                              <select 
                                className="w-full h-8 rounded-lg border-none bg-slate-50/50 text-xs font-bold text-slate-700 px-2 appearance-none cursor-pointer"
                                value={med.frequency}
                                onChange={(e) => handleUpdateMedicine(index, 'frequency', e.target.value)}
                                disabled={isFinalized}
                              >
                                 <option>QD</option>
                                 <option>BID</option>
                                 <option>TID</option>
                                 <option>QID</option>
                                 <option>PRN</option>
                                 <option>HS</option>
                              </select>
                           </div>
                           <div className="col-span-2">
                              <Input 
                                value={med.duration}
                                className="h-8 rounded-lg border-none bg-slate-50/50 text-xs font-bold text-slate-700"
                                onChange={(e) => handleUpdateMedicine(index, 'duration', e.target.value)}
                                disabled={isFinalized}
                              />
                           </div>
                           <div className="col-span-2 flex justify-end">
                              {!isFinalized && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleRemoveMedicine(index)}
                                >
                                   <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                           </div>
                        </motion.div>
                      ))}
                   </AnimatePresence>

                   {medicines.length === 0 && (
                     <div className="py-20 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-slate-100 rounded-[2rem]">
                        <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                           <Clipboard className="h-8 w-8 text-slate-200" />
                        </div>
                        <div className="text-center">
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Prescription Canvas Empty</p>
                           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Add medications to start drafting</p>
                        </div>
                     </div>
                   )}
                </div>
             </div>

             {/* Notes Area */}
             <div className="mt-12 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                   <FileText className="h-4 w-4" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Clinical Assessment & Advice</span>
                </div>
                <textarea 
                  className="w-full h-32 rounded-[1.5rem] border-none bg-slate-50/30 p-6 text-sm font-medium text-slate-700 focus:ring-0 resize-none placeholder:text-slate-300 italic shadow-inner"
                  placeholder="Additional dietary advice, clinical observations, or follow-up instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isFinalized}
                />
             </div>

             {/* Footer Signature */}
             <div className="mt-16 flex justify-end border-t border-slate-100 pt-10">
                <div className="text-center min-w-[200px] space-y-2">
                   {isFinalized ? (
                     <>
                        <div className="h-16 flex items-center justify-center">
                           <p className="text-3xl font-serif text-indigo-600/30 select-none italic -rotate-3">Dr. Vivek Goud</p>
                        </div>
                        <div className="w-full border-b-2 border-slate-200" />
                        <p className="text-sm font-bold text-slate-900 tracking-tight">Dr. Vivek Goud</p>
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Digitally Signed at {prescription.signed_at ? format(new Date(prescription.signed_at), 'hh:mm a, MMM dd') : ''}</p>
                     </>
                   ) : (
                     <>
                        <div className="h-16" />
                        <div className="w-full border-b-2 border-dashed border-slate-200" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] pt-2 italic">Clinical Signature</p>
                     </>
                   )}
                </div>
             </div>
          </div>
        </Card>
      </div>

      {/* RIGHT SIDEBAR - HISTORY & CONTEXT */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
         {/* Current Diagnosis Context */}
         <Card className="rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
               <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Primary Diagnosis</h3>
               <Stethoscope className="h-4 w-4 text-white/50" />
            </div>
            <CardContent className="p-6">
               {diagnosis ? (
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <Badge className="bg-indigo-600 text-white border-none rounded-lg text-[9px] font-bold px-2 py-0.5">{diagnosis.primary_diagnosis.code}</Badge>
                       <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Link</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-tight tracking-tight">{diagnosis.primary_diagnosis.label}</p>
                    <div className="pt-2 border-t border-slate-50">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Linked Comorbidities</p>
                       <div className="flex flex-wrap gap-2">
                          {diagnosis.secondary_diagnoses.map((d, i) => (
                            <Badge key={i} variant="outline" className="border-slate-100 text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5">{d.label.split(',')[0]}</Badge>
                          ))}
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="py-8 text-center space-y-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center mx-auto">
                       <AlertCircle className="h-5 w-5 text-slate-200" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No clinical diagnosis found</p>
                 </div>
               )}
            </CardContent>
         </Card>

         {/* Medication History */}
         <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Medication History</h3>
               </div>
               <Badge className="bg-indigo-50 text-indigo-600 border-none text-[9px] font-bold uppercase tracking-widest">{medicationHistory.length}</Badge>
            </div>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto scrollbar-hide">
               <div className="divide-y divide-slate-50">
                  {medicationHistory.length > 0 ? (
                    medicationHistory.map((history, i) => (
                      <div key={i} className="p-6 hover:bg-slate-50 transition-colors group relative cursor-pointer" onClick={() => reuseMedication(history)}>
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                               <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight">{history.medicine_name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{history.dosage} • {history.frequency}</p>
                            </div>
                            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                               <Plus className="h-4 w-4" />
                            </div>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100/50 px-2 py-0.5 rounded-full uppercase tracking-widest">{format(new Date(history.prescribed_at), 'MMM dd, yyyy')}</span>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Add to Rx</span>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4">
                       <div className="h-16 w-16 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto">
                          <Clock className="h-8 w-8 text-slate-200" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Med History</p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Start a new cycle</p>
                       </div>
                    </div>
                  )}
               </div>
            </CardContent>
         </Card>

         {/* Quick Knowledge / AI Ready Placeholder */}
         <div className="p-6 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200/50 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
               <Star className="h-16 w-16" />
            </div>
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Star className="h-5 w-5 text-white" />
               </div>
               <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Prescription AI</span>
            </div>
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
               AI-driven dosage suggestions and conflict analysis foundation ready. Start documenting to initialize patterns.
            </p>
            <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] uppercase tracking-widest h-11 rounded-2xl shadow-lg border-none">
               Learn Intelligence Patterns
            </Button>
         </div>
      </div>
    </div>
  );
};

export default PrescriptionPanel;
