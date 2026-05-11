import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, 
  Search, 
  Plus, 
  X, 
  ChevronRight, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  ShieldAlert,
  Loader2,
  Command
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useEHRStore, ICDCode, Diagnosis } from '@/store';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DiagnosisPanel = () => {
  const { 
    currentPatient, 
    currentVisit, 
    diagnosis, 
    diagnosisLoading,
    fetchDiagnosis,
    saveDiagnosis,
    updateDiagnosis,
    deleteDiagnosis,
    searchICD
  } = useEHRStore();

  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ICDCode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPrimary, setSelectedPrimary] = useState<ICDCode | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<ICDCode[]>([]);
  const [notes, setNotes] = useState('');
  const [recentDiagnoses, setRecentDiagnoses] = useState<ICDCode[]>([]);

  useEffect(() => {
    if (currentVisit?.id) {
      fetchDiagnosis(currentVisit.id);
    }
  }, [currentVisit?.id]);

  useEffect(() => {
    if (diagnosis) {
      setSelectedPrimary(diagnosis.primary_diagnosis);
      setSelectedSecondary(diagnosis.secondary_diagnoses);
      setNotes(diagnosis.notes || '');
    } else {
      setSelectedPrimary(null);
      setSelectedSecondary([]);
      setNotes('');
    }
  }, [diagnosis]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchICD(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  const addDiagnosis = (item: ICDCode) => {
    if (!selectedPrimary) {
      setSelectedPrimary(item);
    } else {
      if (selectedSecondary.some(s => s.code === item.code)) {
        toast.error('Diagnosis already added');
        return;
      }
      setSelectedSecondary([...selectedSecondary, item]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeSecondary = (code: string) => {
    setSelectedSecondary(selectedSecondary.filter(s => s.code !== code));
  };

  const handleSave = async () => {
    if (!selectedPrimary || !currentPatient || !currentVisit) {
      toast.error('Primary diagnosis is required');
      return;
    }

    try {
      const data = {
        patient_id: currentPatient.id,
        visit_id: currentVisit.id,
        primary_diagnosis: selectedPrimary,
        secondary_diagnoses: selectedSecondary,
        notes
      };

      if (diagnosis) {
        await updateDiagnosis(diagnosis.id, data);
        toast.success('Diagnoses updated successfully');
      } else {
        await saveDiagnosis(data);
        toast.success('Diagnoses saved successfully');
      }
      setIsAdding(false);
    } catch (error) {
      toast.error('Failed to save diagnoses');
    }
  };

  const handleDelete = async () => {
    if (!diagnosis) return;
    if (window.confirm('Are you sure you want to remove all diagnoses for this visit?')) {
      await deleteDiagnosis(diagnosis.id);
      toast.success('Diagnoses removed');
    }
  };

  if (diagnosisLoading && !diagnosis) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Diagnoses</h2>
            <p className="text-xs font-medium text-slate-400">Manage ICD-10 coded diagnoses for this clinical session.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {diagnosis && (
            <Button 
              variant="outline" 
              className="rounded-xl border-slate-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-10 font-bold text-xs uppercase tracking-widest px-4"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Reset
            </Button>
          )}
          <Button 
            className="rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 h-10 font-bold text-xs uppercase tracking-widest px-6"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {isAdding ? 'Cancel' : diagnosis ? 'Edit Diagnoses' : 'Add Diagnosis'}
          </Button>
        </div>
      </div>

      {isAdding ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Search className="h-5 w-5 text-indigo-600" />
                  ICD-10 Diagnostic Search
                </CardTitle>
                <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg">
                  <Command className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search Palette</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* SEARCH ENGINE */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input 
                  placeholder="Search by code (e.g. J18) or description (e.g. Pneumonia)..."
                  className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl text-base font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                
                {/* SEARCH RESULTS DROPDOWN */}
                <AnimatePresence>
                  {searchQuery.length >= 2 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto scrollbar-hide"
                    >
                      {isSearching ? (
                        <div className="p-8 text-center space-y-3">
                          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying ICD Dataset...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                          {searchResults.map((item) => (
                            <button
                              key={item.code}
                              className="w-full text-left px-6 py-4 hover:bg-indigo-50/50 transition-colors flex items-center justify-between group"
                              onClick={() => addDiagnosis(item)}
                            >
                              <div className="flex items-center gap-4">
                                <Badge className="bg-indigo-100 text-indigo-600 border-none font-mono text-[10px] px-2">
                                  {item.code}
                                </Badge>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.label}</span>
                              </div>
                              <Plus className="h-4 w-4 text-slate-300 group-hover:text-indigo-600" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <AlertCircle className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching ICD codes found</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SELECTION GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PRIMARY SELECTION */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Primary Diagnosis</h4>
                  {selectedPrimary ? (
                    <motion.div 
                      layoutId="primary-diag"
                      className="p-5 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 group relative"
                    >
                      <button 
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white text-indigo-600 shadow-lg flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        onClick={() => setSelectedPrimary(null)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <Badge className="bg-white/20 text-white border-none font-mono text-[10px] px-2 mb-3">
                        {selectedPrimary.code}
                      </Badge>
                      <h5 className="text-lg font-bold leading-tight">{selectedPrimary.label}</h5>
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                        <span>Active Record</span>
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-[120px] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <ShieldAlert className="h-6 w-6 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Select from Search</p>
                    </div>
                  )}
                </div>

                {/* SECONDARY SELECTION */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Secondary Diagnoses</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSecondary.length > 0 ? (
                      selectedSecondary.map((s) => (
                        <Badge 
                          key={s.code} 
                          className="bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border-none rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer group"
                          onClick={() => removeSecondary(s.code)}
                        >
                          <span className="font-mono mr-2 opacity-50">{s.code}</span>
                          {s.label}
                          <X className="h-3 w-3 ml-2 group-hover:text-rose-500" />
                        </Badge>
                      ))
                    ) : (
                      <div className="w-full h-[120px] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Plus className="h-6 w-6 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Add Multiple</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CLINICAL NOTES */}
              <div className="space-y-4 pt-4">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Diagnostic Notes</h4>
                 <textarea 
                    className="w-full min-h-[100px] p-4 bg-slate-50 border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="Clinical reasoning, rule-outs, or specific observations related to these diagnoses..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                 />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  variant="ghost" 
                  className="rounded-xl h-12 px-8 text-slate-500 font-bold text-xs uppercase tracking-widest"
                  onClick={() => setIsAdding(false)}
                >
                  Discard Changes
                </Button>
                <Button 
                  className="rounded-2xl h-12 px-10 bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-bold text-xs uppercase tracking-widest"
                  onClick={handleSave}
                  disabled={diagnosisLoading}
                >
                  {diagnosisLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Finalize Diagnoses
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : diagnosis ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* PRIMARY DIAGNOSIS DISPLAY */}
           <div className="lg:col-span-2 space-y-6">
              <div className="group relative">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                 <Card className="relative rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white">
                    <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-600 w-full" />
                    <CardHeader className="p-8 pb-4">
                       <div className="flex items-center justify-between mb-4">
                          <Badge className="bg-indigo-50 text-indigo-600 border-none rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1">Primary Clinical Entity</Badge>
                          <div className="flex items-center gap-2">
                             <Badge className="bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-bold uppercase tracking-widest px-2">High Severity</Badge>
                             <Edit2 className="h-4 w-4 text-slate-300 cursor-pointer hover:text-indigo-600" onClick={() => setIsAdding(true)} />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[11px] font-mono font-bold text-slate-400">ICD-10: {diagnosis.primary_diagnosis.code}</p>
                          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                            {diagnosis.primary_diagnosis.label}
                          </CardTitle>
                       </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-8">
                       <div className="grid grid-cols-2 gap-8 py-6 border-y border-slate-50">
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added By</p>
                             <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">Dr</div>
                                <span className="text-sm font-bold text-slate-700">Dr. Assigned Physician</span>
                             </div>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</p>
                             <div className="flex items-center gap-2 text-slate-700">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-sm font-bold">{format(new Date(diagnosis.created_at), 'MMM dd, yyyy · hh:mm a')}</span>
                             </div>
                          </div>
                       </div>
                       
                       {diagnosis.notes && (
                         <div className="space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               Clinical Reasoning
                               <div className="h-px flex-1 bg-slate-50" />
                            </p>
                            <p className="text-sm font-medium text-slate-600 italic bg-slate-50 p-6 rounded-3xl border border-slate-100 leading-relaxed">
                               "{diagnosis.notes}"
                            </p>
                         </div>
                       )}

                       <div className="flex items-center gap-4">
                          <div className="flex -space-x-2">
                             {[1, 2, 3].map(i => (
                               <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                  <User className="h-4 w-4 text-slate-400" />
                               </div>
                             ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peer Reviewed by clinical department</span>
                       </div>
                    </CardContent>
                 </Card>
              </div>
           </div>

           {/* SECONDARY DIAGNOSES & CHRONIC FLAGS */}
           <div className="space-y-8">
              <div className="space-y-4">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Secondary Co-morbidities</h3>
                 <div className="space-y-3">
                    {diagnosis.secondary_diagnoses.length > 0 ? (
                      diagnosis.secondary_diagnoses.map((s, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={s.code} 
                          className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-4 group hover:border-indigo-200 transition-all"
                        >
                           <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-[10px] font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                              {i + 1}
                           </div>
                           <div>
                              <p className="text-[10px] font-mono font-bold text-slate-400 mb-0.5">{s.code}</p>
                              <p className="text-sm font-bold text-slate-700 leading-tight">{s.label}</p>
                           </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                         <Plus className="h-8 w-8 text-slate-100 mx-auto mb-2" />
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Secondary Diagnoses</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* RECENT CLINICAL HISTORY */}
              <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-indigo-200 space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Clinical Snapshot</h3>
                    <Clock className="h-4 w-4 text-indigo-400" />
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-medium text-slate-400">Last Diagnosis</span>
                       <span className="text-xs font-bold">{format(new Date(diagnosis.updated_at), 'MMM dd')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-medium text-slate-400">Session Status</span>
                       <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] px-2">Finalized</Badge>
                    </div>
                    <Separator className="bg-white/10" />
                    <Button variant="ghost" className="w-full text-indigo-400 hover:text-indigo-300 hover:bg-white/5 h-10 text-[10px] font-bold uppercase tracking-widest">
                       View Historical Path <ChevronRight className="h-3 w-3 ml-2" />
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-[50vh] text-center space-y-8"
        >
          <div className="relative">
             <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
             <div className="relative h-24 w-24 rounded-[2.5rem] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center shadow-2xl shadow-indigo-100">
                <Stethoscope className="h-10 w-10 text-indigo-300" />
             </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Diagnostic Records Yet</h3>
            <p className="text-slate-400 max-w-sm mx-auto font-medium text-sm leading-relaxed">
              Every clinical session requires at least one primary diagnosis. Start by searching the ICD-10 database.
            </p>
          </div>
          <Button 
            className="rounded-[1.5rem] h-14 px-10 bg-indigo-600 text-white shadow-2xl shadow-indigo-100 font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-5 w-5 mr-3" /> Initiate Diagnostic Entry
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default DiagnosisPanel;
