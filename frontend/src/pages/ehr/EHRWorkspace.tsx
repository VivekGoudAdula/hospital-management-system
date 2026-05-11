import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  User, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Calendar,
  FileText,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  History,
  Share2,
  FileDown,
  LayoutDashboard,
  MoreVertical,
  PlusCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEHRStore, useAuthStore } from '@/store';
import SOAPNotesPanel from './components/SOAPNotesPanel';
import DiagnosisPanel from './components/DiagnosisPanel';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EHRWorkspace = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const { 
    currentPatient, 
    currentVisit, 
    visitHistory, 
    timeline,
    loading, 
    selectedTab,
    soapNote,
    diagnosis,
    fetchPatientEHR, 
    fetchActiveVisit,
    fetchTimeline,
    fetchDiagnosis,
    setSelectedTab,
    reset 
  } = useEHRStore();

  useEffect(() => {
    if (patientId) {
      fetchPatientEHR(patientId);
      fetchActiveVisit(patientId);
      fetchTimeline(patientId);
    }
    return () => reset();
  }, [patientId]);

  useEffect(() => {
    if (currentVisit?.id) {
      fetchDiagnosis(currentVisit.id);
    }
  }, [currentVisit?.id]);

  if (loading && !currentPatient) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-indigo-100" />
        <div className="text-center space-y-2">
           <h3 className="text-xl font-bold text-slate-800 tracking-tight">Initializing Clinical Workspace</h3>
           <p className="text-slate-400 font-medium animate-pulse">Syncing patient medical records and visit history...</p>
        </div>
      </div>
    );
  }

  if (!currentPatient) return null;

  const menuItems = [
    { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'SOAP', icon: FileText, label: 'SOAP Notes', hidden: role === 'Receptionist' },
    { id: 'Diagnoses', icon: Stethoscope, label: 'Diagnoses', hidden: role === 'Receptionist' },
    { id: 'Prescriptions', icon: ClipboardList, label: 'Prescriptions' },
    { id: 'Vitals', icon: Activity, label: 'Vitals' },
    { id: 'Labs', icon: FlaskConical, label: 'Labs' },
    { id: 'Timeline', icon: History, label: 'Timeline' },
    { id: 'Documents', icon: FileDown, label: 'Documents' },
  ].filter(item => !item.hidden);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] -m-6 bg-[#f8fafc]">
      {/* TOP HEADER */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col gap-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => navigate('/ehr')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-4 border-r border-slate-100 pr-8">
              <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 font-bold text-xl">
                {currentPatient.full_name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{currentPatient.full_name}</h1>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase tracking-widest px-2 py-0.5">Active Visit</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {currentPatient.mrn}</span>
                  <span className="flex items-center gap-1.5">• {currentPatient.gender}</span>
                  <span className="flex items-center gap-1.5">• {currentPatient.dob}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-10">
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Primary Physician</p>
                 <p className="text-sm font-bold text-slate-700">Dr. {user?.name || 'Self Assigned'}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Department</p>
                 <p className="text-sm font-bold text-indigo-600">General OPD</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Visit ID</p>
                 <p className="text-sm font-mono font-bold text-slate-500">{currentVisit?.id?.slice(-8) || 'INITIALIZING...'}</p>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-slate-200 h-11 px-5 text-xs font-bold uppercase tracking-widest">
               <Share2 className="h-4 w-4 mr-2" /> Share Case
            </Button>
            <Button className="rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 h-11 px-6 text-xs font-bold uppercase tracking-widest">
               Finish Session
            </Button>
          </div>
        </div>

        {/* Allergy & Flag Strip */}
        <div className="flex items-center gap-4">
           <div className="flex-1 h-10 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center px-4 gap-3 overflow-hidden">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                 {['Penicillin', 'Peanuts', 'Latex'].map(a => (
                   <Badge key={a} className="bg-rose-500 text-white border-none rounded-lg text-[9px] font-bold uppercase tracking-widest px-2 whitespace-nowrap">
                     {a}
                   </Badge>
                 ))}
                 <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-2">High Severity Alerts</span>
              </div>
           </div>
           <div className="h-10 px-4 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center gap-3">
              <Info className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Chronic Hypertension</span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT MENU PANEL */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTab(item.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                selectedTab === item.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
              )}
            >
              <item.icon className={cn("h-4 w-4", selectedTab === item.id ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
              {item.label}
            </button>
          ))}
          
          <Separator className="my-4 opacity-50" />
          
          <div className="px-4 py-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Patient Documents</p>
            <div className="space-y-3">
               {[
                 { name: 'X-Ray Report.pdf', date: 'Oct 24' },
                 { name: 'Blood Lab.pdf', date: 'Oct 22' },
               ].map((doc, i) => (
                 <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2 overflow-hidden">
                       <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                       <span className="text-xs font-bold text-slate-600 truncate group-hover:text-indigo-600 transition-colors">{doc.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{doc.date}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* CENTER WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-5xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
              {selectedTab === 'Overview' ? (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Active Visit Engine */}
                     <Card className="rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <CardHeader className="bg-indigo-600 text-white pb-8">
                           <div className="flex items-center justify-between mb-4">
                              <Badge className="bg-white/20 text-white border-none rounded-lg text-[9px] font-bold uppercase tracking-widest px-2">Clinical Session</Badge>
                              <Clock className="h-4 w-4 text-white/60" />
                           </div>
                           <CardTitle className="text-2xl font-bold tracking-tight">Active Visit</CardTitle>
                           <p className="text-indigo-100 text-xs font-medium">Initialized {currentVisit ? format(new Date(currentVisit.admission_date), 'MMMM dd, hh:mm a') : '...'}</p>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                           <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-indigo-600" />
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chief Complaint</p>
                                    <p className="text-sm font-bold text-slate-800">{currentVisit?.chief_complaint || 'No complaint registered'}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <Stethoscope className="h-4 w-4 text-indigo-600" />
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Objective</p>
                                    <p className="text-sm font-bold text-slate-800">Routine Clinical Evaluation</p>
                                 </div>
                              </div>
                           </div>
                           <Button 
                             className="w-full rounded-2xl h-12 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
                             onClick={() => setSelectedTab('SOAP')}
                           >
                              Start clinical Note
                           </Button>
                        </CardContent>
                     </Card>

                     {/* Recent Vitals Placeholder */}
                     <Card className="rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50">
                        <CardHeader className="pb-4">
                           <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              <Activity className="h-5 w-5 text-indigo-600" />
                              Last Captured Vitals
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                              {[
                                { label: 'BP', value: '120/80', unit: 'mmHg', color: 'text-indigo-600' },
                                { label: 'Pulse', value: '72', unit: 'bpm', color: 'text-rose-600' },
                                { label: 'Temp', value: '98.6', unit: '°F', color: 'text-amber-600' },
                                { label: 'SpO2', value: '98', unit: '%', color: 'text-emerald-600' },
                              ].map((v, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{v.label}</p>
                                   <div className="flex items-baseline gap-1">
                                      <span className={cn("text-xl font-bold tracking-tight", v.color)}>{v.value}</span>
                                      <span className="text-[10px] font-bold text-slate-400">{v.unit}</span>
                                   </div>
                                </div>
                              ))}
                           </div>
                           <Button variant="outline" className="w-full rounded-2xl h-12 border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50">
                              Capture New Vitals
                           </Button>
                        </CardContent>
                     </Card>
                  </div>

                  {/* Visit History Timeline Foundation */}
                  <Card className="rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                     <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                        <div>
                           <CardTitle className="text-xl font-bold text-slate-900">Clinical Lifecycle</CardTitle>
                           <p className="text-slate-400 text-xs font-medium">Aggregated medical timeline for current entity.</p>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-xl text-slate-400">
                           <PlusCircle className="h-5 w-5" />
                        </Button>
                     </CardHeader>
                     <CardContent className="p-8">
                        {timeline.length === 0 ? (
                           <div className="py-12 text-center space-y-3">
                              <History className="h-10 w-10 text-slate-200 mx-auto" />
                              <p className="text-slate-400 text-sm font-medium">No clinical events recorded yet.</p>
                           </div>
                        ) : (
                           <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                              {timeline.map((item, i) => (
                                 <div key={i} className="relative pl-12">
                                    <div className="absolute left-0 top-1 h-10 w-10 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center z-10">
                                       {item.type === 'visit' ? <Clock className="h-4 w-4 text-indigo-600" /> : <FileText className="h-4 w-4 text-indigo-600" />}
                                    </div>
                                    <div className="space-y-1">
                                       <div className="flex items-center justify-between">
                                          <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(item.timestamp), 'MMM dd, yyyy')}</span>
                                       </div>
                                       <p className="text-xs text-slate-500 font-medium">Status: <span className="text-indigo-600 font-bold uppercase text-[9px]">{item.metadata?.status}</span></p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </CardContent>
                  </Card>
                </motion.div>
              ) : selectedTab === 'SOAP' ? (
                <motion.div
                  key="soap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SOAPNotesPanel />
                </motion.div>
              ) : selectedTab === 'Diagnoses' ? (
                <motion.div
                  key="diagnoses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <DiagnosisPanel />
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-[50vh] space-y-6 text-center"
                >
                  <div className="h-20 w-20 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    {menuItems.find(i => i.id === selectedTab)?.icon && React.createElement(menuItems.find(i => i.id === selectedTab)!.icon, { className: "h-10 w-10 text-indigo-300" })}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedTab} Module</h2>
                    <p className="text-slate-400 max-w-sm mx-auto font-medium">This clinical module is currently under development. Foundation is ready for integration.</p>
                  </div>
                  <Button variant="outline" className="rounded-2xl px-8 h-12 border-slate-200 text-indigo-600 font-bold uppercase tracking-widest text-xs" onClick={() => setSelectedTab('Overview')}>
                     Return to Overview
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto p-6 space-y-6 scrollbar-hide">
           {/* Patient Snapshot */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Patient Snapshot</h3>
                 <MoreVertical className="h-4 w-4 text-slate-300" />
              </div>
              <div className="space-y-3">
                 {[
                   { label: 'Weight', value: '72 kg', change: '+2 kg' },
                   { label: 'Height', value: '175 cm', change: 'Stable' },
                   { label: 'BMI', value: '23.5', change: 'Normal', color: 'text-emerald-600' },
                 ].map((s, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-xs font-bold text-slate-500">{s.label}</span>
                      <div className="text-right">
                         <p className="text-sm font-bold text-slate-800 leading-none">{s.value}</p>
                         <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-1", s.color || "text-slate-400")}>{s.change}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* SOAP Snapshot */}
           {soapNote && (
             <div className="space-y-4 pt-4 border-t border-slate-100">
               <div className="flex items-center justify-between">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Latest SOAP</h3>
                 <button
                   onClick={() => setSelectedTab('SOAP')}
                   className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700"
                 >
                   Open
                 </button>
               </div>
               <div className="space-y-2">
                 {soapNote.assessment && (
                   <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                     <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1">Assessment</p>
                     <p className="text-xs font-medium text-slate-700 line-clamp-3">{soapNote.assessment}</p>
                   </div>
                 )}
                 {soapNote.plan && (
                   <div className="p-3 rounded-2xl bg-violet-50 border border-violet-100">
                     <p className="text-[9px] font-bold text-violet-500 uppercase tracking-widest mb-1">Plan</p>
                     <p className="text-xs font-medium text-slate-700 line-clamp-3">{soapNote.plan}</p>
                   </div>
                 )}
                 <div className="flex items-center justify-between px-1">
                   <span className={`text-[9px] font-bold uppercase tracking-widest ${
                     soapNote.status === 'signed' ? 'text-emerald-500' : 'text-amber-500'
                   }`}>
                     {soapNote.status === 'signed' ? '✓ Signed' : '● Draft'}
                   </span>
                  </div>
                </div>
              </div>
            )}
 
            {/* Diagnosis Snapshot */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Current Diagnoses</h3>
                  <button
                    onClick={() => setSelectedTab('Diagnoses')}
                    className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700"
                  >
                    Manage
                  </button>
               </div>
               <div className="space-y-3">
                  {diagnosis ? (
                    <>
                      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Primary</p>
                            <Badge className="bg-indigo-600 text-white border-none text-[8px] px-1.5">{diagnosis.primary_diagnosis.code}</Badge>
                         </div>
                         <p className="text-sm font-bold text-slate-800 leading-tight">{diagnosis.primary_diagnosis.label}</p>
                      </div>
                      {diagnosis.secondary_diagnoses.slice(0, 2).map((s) => (
                        <div key={s.code} className="flex items-center justify-between px-2">
                           <span className="text-xs font-medium text-slate-500 truncate mr-2">{s.label}</span>
                           <span className="text-[9px] font-mono font-bold text-slate-300">{s.code}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Active Diagnosis</p>
                    </div>
                  )}
               </div>
            </div>

           {/* Active Medications */}
           <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Active Medications</h3>
              <div className="space-y-3">
                 {[
                   { name: 'Amlodipine', dose: '5mg • Daily', status: 'Compliance High' },
                   { name: 'Metformin', dose: '500mg • BID', status: 'Pending Review' },
                 ].map((m, i) => (
                   <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-2 group hover:border-indigo-200 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                         <p className="text-sm font-bold text-slate-800">{m.name}</p>
                         <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.dose}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                         <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{m.status}</span>
                      </div>
                   </div>
                 ))}
                 <Button variant="ghost" className="w-full rounded-xl h-10 border-dashed border border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-600 hover:bg-indigo-50">
                    <PlusCircle className="h-3 w-3 mr-2" /> New Prescription
                 </Button>
              </div>
           </div>

            {/* Chronic Conditions */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Chronic Entities</h3>
               <div className="flex flex-wrap gap-2">
                  {diagnosis ? (
                    [diagnosis.primary_diagnosis, ...diagnosis.secondary_diagnoses]
                      .filter(d => 
                        /diabetes|hypertension|asthma|copd/i.test(d.label)
                      )
                      .map((d, i) => (
                        <Badge key={`${d.code}-${i}`} className="bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[9px] font-bold uppercase tracking-widest px-2 py-1">
                          {d.label.split(',')[0].split(' ')[0]}
                        </Badge>
                      ))
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-1">No active flags</span>
                  )}
               </div>
            </div>

           {/* Pending Tasks */}
           <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Clinical Tasks</h3>
              <div className="space-y-2">
                 {[
                   'Update Allergy Registry',
                   'Verify Insurance Specs',
                   'Initialize Lab Orders'
                 ].map((t, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 group hover:bg-white border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                      <div className="h-4 w-4 rounded border border-slate-300 bg-white group-hover:border-indigo-600 transition-all" />
                      <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{t}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EHRWorkspace;
