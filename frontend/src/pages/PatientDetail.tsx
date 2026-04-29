import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Droplet, 
  Stethoscope, 
  Shield, 
  FileText, 
  Clock,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Files,
  ShieldCheck,
  Eye,
  Download,
  Share2,
  AlertCircle,
  Activity,
  History,
  ClipboardList,
  Upload,
  Search,
  Tag as TagIcon,
  Filter,
  Users,
  Trash2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useHospitalStore } from '@/store/hospitalStore';
import { notes } from '@/lib/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    fetchPatientById, 
    fetchPatientDocuments, 
    documents, 
    updatePatientStatus, 
    uploadDocument, 
    deleteDocument, 
    doctors, 
    fetchDoctors,
    notes,
    addNote,
    fetchNotesByPatient
  } = useHospitalStore();
  
  const [patient, setPatient] = useState<any>(null);
  const [vitals, setVitals] = useState<any[]>([]); 
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudy, setSelectedStudy] = useState<DocumentStudy | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('clinical');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [stagedAssets, setStagedAssets] = useState<{ file: File, bodyPart: string }[]>([]);
  const [uploadData, setUploadData] = useState({
    file_type: 'X-ray',
    scan_date: new Date().toISOString().split('T')[0],
    referring_doctor_id: '',
    findings: '',
    impression: '',
    symptoms: '',
    clinical_history: '',
    reason_for_scan: '',
    doctor_notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const p = await fetchPatientById(id);
        setPatient(p);
        await fetchPatientStudies(id);
        await fetchDoctors();
        await fetchNotesByPatient(id);
        await useHospitalStore.getState().fetchPatientPrescriptions(id);
        await useHospitalStore.getState().fetchPatientTimeline(id);
      } catch (error) {
        console.error('Failed to load patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const { prescriptions, timeline, studies, uploadStudy, fetchPatientStudies, deleteStudy } = useHospitalStore();

  const assignedDoctor = doctors.find(d => d.id === patient?.assignedDoctorId);

  const combinedNotes = [
    ...notes.filter(n => n.patientId === id).map(n => ({
      id: n.id,
      authorName: n.authorName,
      content: n.content,
      createdAt: n.createdAt,
      type: 'note'
    })),
    ...prescriptions.filter(rx => rx.patient_id === id && rx.clinical_notes?.trim()).map(rx => {
      const rxDoctor = doctors.find(d => d.id === rx.doctor_id);
      return {
        id: rx.id,
        authorName: rxDoctor?.name || 'Doctor',
        content: rx.clinical_notes,
        createdAt: rx.created_at,
        type: 'prescription'
      };
    })
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return;
    try {
      await updatePatientStatus(id, newStatus);
      setPatient({ ...patient, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) });
      toast.success(`Patient status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stagedAssets.length === 0 || !id) return;

    setIsUploading(true);
    const formData = new FormData();
    stagedAssets.forEach(asset => {
      formData.append('files', asset.file);
    });
    formData.append('patient_id', id);
    formData.append('study_type', uploadData.file_type);
    formData.append('scan_date', uploadData.scan_date);
    // Join all body parts for the main record
    formData.append('body_part', stagedAssets.map(a => a.bodyPart).filter(Boolean).join(', ') || 'General');
    formData.append('referring_doctor_id', uploadData.referring_doctor_id);
    formData.append('findings', uploadData.findings);
    formData.append('impression', uploadData.impression);
    formData.append('symptoms', uploadData.symptoms);
    formData.append('clinical_history', uploadData.clinical_history);
    formData.append('reason_for_scan', uploadData.reason_for_scan);
    formData.append('doctor_notes', uploadData.doctor_notes);

    try {
      await uploadStudy(formData);
      toast.success('Study uploaded successfully');
      setIsUploadDialogOpen(false);
      setStagedAssets([]);
      setUploadStep(1);
      fetchPatientStudies(id);
    } catch (error) {
      toast.error('Failed to upload study');
    } finally {
      setIsUploading(false);
    }
  };


  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;

    try {
      await addNote({
        content: newNote,
        patient_id: id,
        doctor_id: patient.assignedDoctorId,
        author_name: "Admin User", // For demo, assuming admin
        author_role: "Medical Staff"
      });
      setNewNote('');
      setIsNoteDialogOpen(false);
      toast.success('Clinical observation appended to chart');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Patient Data Unavailable</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">The patient record you're looking for might have been archived.</p>
        <Button variant="outline" className="rounded-md border-slate-200" onClick={() => navigate('/patients')}>
          Return to Registry
        </Button>
      </div>
    );
  }

  const uploaderDoc = doctors.find(d => d.id === selectedStudy?.uploadedBy);
  const filteredStudies = studies.filter(study => 
    (study.studyType && study.studyType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (study.bodyPart && study.bodyPart.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (study.impression && study.impression.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="group h-10 w-10 bg-white border border-slate-200 shadow-sm rounded-md hover:bg-slate-50" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-5 w-5 text-slate-500 group-hover:text-slate-900" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 leading-none">{patient.name}</h1>
              <Select value={patient.status.toLowerCase()} onValueChange={handleStatusUpdate}>
                <SelectTrigger className="h-6 w-fit bg-emerald-50 text-emerald-700 border-emerald-100 rounded text-[10px] font-bold uppercase tracking-widest leading-none px-2 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl p-1">
                  <SelectItem value="active" className="rounded-lg text-[10px] font-bold uppercase">Active</SelectItem>
                  <SelectItem value="admitted" className="rounded-lg text-[10px] font-bold uppercase">Admitted</SelectItem>
                  <SelectItem value="discharged" className="rounded-lg text-[10px] font-bold uppercase">Discharged</SelectItem>
                  <SelectItem value="follow-up" className="rounded-lg text-[10px] font-bold uppercase">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold border border-slate-200">{patient.mrn}</span>
              <Separator orientation="vertical" className="h-3 bg-slate-200" />
              <span className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5" /> Admitted Apr 12, 2024 • Floor 2, Room 204
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-md border-slate-200 text-slate-600 gap-2 font-bold text-xs">
            <Share2 className="h-3.5 w-3.5" /> Export EMR
          </Button>
          <Button className="h-10 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold text-xs px-5 shadow-lg shadow-indigo-100">
            <Plus className="h-3.5 w-3.5" /> Add Log Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border">
            <div className="h-20 bg-slate-50 border-b border-slate-100 flex items-center justify-end px-4 gap-2">
               <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400"><History className="h-3.5 w-3.5" /></Button>
               <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="px-6 pb-8 -mt-10">
              <div className="relative inline-block mb-4">
                <Avatar className="h-20 w-20 rounded-xl border-4 border-white shadow-md bg-white">
                  <AvatarFallback className="text-xl font-bold text-indigo-600 bg-indigo-50 border border-indigo-100">{patient.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                   <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{patient.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{patient.gender} • {new Date().getFullYear() - new Date(patient.dob).getFullYear()} Years Old</p>
                  </div>
                </div>
                
                <div className="space-y-3.5">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Mobile Contact</p>
                       <p className="text-xs font-bold text-slate-700">{patient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Secure Email</p>
                       <p className="text-xs font-bold text-slate-700 truncate">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Residency</p>
                       <p className="text-xs font-bold text-slate-700">{patient.address || 'Brooklyn, NY 11201'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Droplet className="h-3 w-3 text-rose-500 fill-rose-500" />
                      <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Group</p>
                    </div>
                    <p className="text-[14px] font-black text-slate-800">{patient.bloodGroup}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Shield className="h-3 w-3 text-slate-400" />
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Insurer</p>
                    </div>
                    <p className="text-[11px] font-bold text-slate-700 truncate">{patient.insuranceInfo || 'Aetna Blue'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Assigned Doctor</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400"><Plus className="h-3 w-3" /></Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                <Avatar className="h-9 w-9 rounded-md border border-slate-100 shadow-sm">
                  <AvatarFallback className="text-xs font-bold bg-indigo-50 text-indigo-600">{assignedDoctor?.name?.split(' ').map(n => n[0]).join('') || 'DR'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">{assignedDoctor?.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{assignedDoctor?.specialization}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 w-full md:w-auto h-11 rounded-md border border-slate-200 p-1 flex items-center gap-1 mb-8 shadow-inner overflow-x-auto">
              <TabsTrigger value="clinical" className="px-5 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all">Clinical Insights</TabsTrigger>
              <TabsTrigger value="documents" className="px-5 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all flex items-center gap-2">Records <Badge className="bg-slate-100 text-slate-500 text-[9px] border-none px-1 h-3.5">{studies.length}</Badge></TabsTrigger>
              <TabsTrigger value="timeline" className="px-5 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all">Phase Timeline</TabsTrigger>
              {/* <TabsTrigger value="billing" className="px-5 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all">Billing</TabsTrigger> */}
            </TabsList>
            
            <TabsContent value="clinical" className="mt-0 space-y-6 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card className="bg-white rounded-xl border border-slate-200 shadow-sm md:col-span-3">
                  <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-slate-50">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-indigo-500" /> Care Observations</CardTitle>
                      <CardDescription className="text-xs text-slate-400">Collaboration logs and patient notes</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md" onClick={() => navigate(`/patients/${id}/prescription`)}><Plus className="h-4 w-4" /></Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {combinedNotes.length > 0 ? (
                        combinedNotes.map((note, i) => (
                          <div key={i} className="p-6 flex gap-4 hover:bg-slate-50/50 transition-colors">
                            <Avatar className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                              <AvatarFallback className="text-[10px] font-bold text-slate-400">{(note.authorName || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 flex-1">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-bold text-slate-900">{note.authorName || 'Unknown Author'}</p>
                                    {note.type === 'prescription' && (
                                      <Badge variant="outline" className="text-[9px] font-bold text-indigo-500 border-indigo-100 bg-indigo-50 uppercase tracking-widest px-1.5 py-0">From Prescription</Badge>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium">{new Date(note.createdAt).toLocaleDateString()}</span>
                               </div>
                               <p className="text-sm text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100 shadow-sm italic">
                                  "{note.content}"
                               </p>
                               <div className="flex items-center gap-3 pl-1">
                                  <Button variant="ghost" className="h-6 px-2 text-[9px] font-bold text-slate-400 hover:text-indigo-600">Reply</Button>
                                  <Button variant="ghost" className="h-6 px-2 text-[9px] font-bold text-slate-400 hover:text-rose-600">Pin Note</Button>
                               </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center">
                           <p className="text-sm text-slate-400">No clinical notes recorded yet.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-xl border border-slate-200 shadow-sm md:col-span-2 h-fit overflow-hidden">
                  <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2"><Activity className="h-4 w-4 text-rose-500" /> Vital Snapshots</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><Search className="h-3.5 w-3.5" /></Button>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    {vitals.length > 0 ? (
                      vitals.map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm group hover:ring-1 hover:ring-slate-200 transition-all">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{v.label}</p>
                            <p className="text-xl font-bold text-slate-900 tracking-tight leading-none">{v.value} <span className="text-xs font-medium text-slate-300 ml-0.5">{v.unit}</span></p>
                          </div>
                          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase rounded h-5 border px-2", v.color, v.bg)}>
                            {v.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center bg-slate-50/30 rounded-xl border border-dashed border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No recent snapshots</p>
                      </div>
                    )}
                    <Button variant="ghost" className="w-full text-[10px] font-bold text-indigo-600 uppercase tracking-widest pt-2">View Trends Timeline</Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-50 flex items-center justify-between flex-row space-y-0">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2"><div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse" /> Active Prescriptions</CardTitle>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase rounded-md border-slate-200 text-indigo-600">Print Pharmacy Slip</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                          <TableHead className="text-slate-500 text-[10px] uppercase font-bold py-4 pl-6">Medication / Pharma</TableHead>
                          <TableHead className="text-slate-500 text-[10px] uppercase font-bold py-4">Quantity / Unit</TableHead>
                          <TableHead className="text-slate-500 text-[10px] uppercase font-bold py-4">Administration</TableHead>
                          <TableHead className="text-slate-500 text-[10px] uppercase font-bold py-4">Valid Until</TableHead>
                          <TableHead className="text-slate-500 text-[10px] uppercase font-bold py-4 text-center">Status</TableHead>
                          <TableHead className="text-right pr-6 py-4" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescriptions.filter(rx => rx.patient_id === id).length > 0 ? (
                          prescriptions.filter(rx => rx.patient_id === id).flatMap(rx => rx.medications).map((m, i) => (
                            <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                              <TableCell className="py-4 pl-6">
                                 <div>
                                    <p className="font-bold text-sm text-slate-900">{m.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Prescribed</p>
                                 </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 font-bold py-4">{m.dosage}</TableCell>
                              <TableCell className="text-xs text-slate-500 font-medium py-4">{m.frequency}</TableCell>
                              <TableCell className="text-xs text-slate-400 font-medium py-4">{m.duration}</TableCell>
                              <TableCell className="text-center py-4">
                                 <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px] font-bold uppercase rounded h-5">Active</Badge>
                              </TableCell>
                              <TableCell className="text-right pr-6 py-4">
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-900"><MoreHorizontal className="h-4 w-4" /></Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="py-12 text-center">
                               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Active Prescriptions On File</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="relative w-full sm:w-80">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                     <Input 
                        placeholder="Search records, types, or tags..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 bg-white border-slate-200 rounded-md shadow-sm"
                     />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                     <Button variant="outline" className="flex-1 sm:flex-none h-10 rounded-md border-slate-200 text-slate-600 font-bold gap-2 text-xs">
                        <Filter className="h-3.5 w-3.5" /> Categorize
                     </Button>
                     <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
                       setIsUploadDialogOpen(open);
                       if (!open) {
                         setStagedAssets([]);
                         setUploadStep(1);
                       }
                     }}>
                        <DialogTrigger asChild>
                          <Button className="flex-1 sm:flex-none h-10 rounded-md bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold gap-2 text-xs shadow-sm">
                              <Plus className="h-3.5 w-3.5" /> Upload Document
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[95vw] md:max-w-[1000px] max-h-[90vh] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl flex flex-col">
                           <DialogHeader className="bg-indigo-600 p-8 text-white shrink-0 relative">
                              <div className="absolute top-8 right-8 flex gap-2">
                                {[1, 2].map((s) => (
                                  <div 
                                    key={s} 
                                    className={cn(
                                      "h-1.5 w-8 rounded-full transition-all duration-500",
                                      uploadStep === s ? "bg-white" : "bg-white/20"
                                    )} 
                                  />
                                ))}
                              </div>
                              <DialogTitle className="text-2xl font-bold tracking-tight">
                                {uploadStep === 1 ? 'Step 1: Diagnostic Assets' : 'Step 2: Clinical Context'}
                              </DialogTitle>
                              <DialogDescription className="text-indigo-100 font-medium text-sm">
                                 {uploadStep === 1 
                                   ? 'Upload scans and specify body regions for each asset.' 
                                   : 'Provide diagnostic summary and clinical observations.'}
                              </DialogDescription>
                           </DialogHeader>
                           
                           <div className="flex-1 overflow-y-auto bg-white">
                             {uploadStep === 1 ? (
                               <div className="p-8 space-y-10">
                                 <div className="space-y-6">
                                   <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                      <div className="h-5 w-5 rounded bg-indigo-50 flex items-center justify-center">
                                         <Upload className="h-3 w-3 text-indigo-600" />
                                      </div>
                                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">File Repository</h3>
                                   </div>
                                   
                                   <div className="relative">
                                     <Input 
                                       type="file" 
                                       className="hidden" 
                                       id="file-upload" 
                                       multiple
                                       onChange={(e) => {
                                         const newFiles = Array.from(e.target.files || []);
                                         const newAssets = newFiles.map(file => ({ file, bodyPart: '' }));
                                         setStagedAssets(prev => [...prev, ...newAssets]);
                                       }}
                                       accept=".pdf,.jpg,.jpeg,.png"
                                     />
                                     <label 
                                       htmlFor="file-upload" 
                                       className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                                     >
                                       <div className="text-center">
                                         <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                                         <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                                           Drop scan files here or click to browse
                                         </p>
                                         <p className="text-[10px] text-slate-400 mt-1">Multi-file support (PDF, JPG, PNG)</p>
                                       </div>
                                     </label>
                                   </div>

                                   {stagedAssets.length > 0 && (
                                     <div className="space-y-3">
                                       <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Staged Assets & Regions</Label>
                                       <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                         {stagedAssets.map((asset, idx) => (
                                           <div 
                                             key={idx}
                                             className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                                           >
                                             <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                                               <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                                                 <FileText className="h-5 w-5 text-indigo-500" />
                                               </div>
                                               <div className="min-w-0 flex-1">
                                                 <p className="text-xs font-bold text-slate-700 truncate">{asset.file.name}</p>
                                                 <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{(asset.file.size / 1024).toFixed(1)} KB • {asset.file.type.split('/')[1].toUpperCase()}</p>
                                               </div>
                                             </div>
                                             
                                             <div className="flex items-center gap-3 w-full md:w-auto">
                                               <Input 
                                                 placeholder="Body Part (e.g. Chest)" 
                                                 className="h-10 w-full md:w-48 rounded-xl bg-white border-slate-200 text-xs"
                                                 value={asset.bodyPart}
                                                 onChange={(e) => {
                                                   const newAssets = [...stagedAssets];
                                                   newAssets[idx].bodyPart = e.target.value;
                                                   setStagedAssets(newAssets);
                                                 }}
                                               />
                                               <Button 
                                                 type="button" 
                                                 variant="ghost" 
                                                 size="icon" 
                                                 className="h-10 w-10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl shrink-0"
                                                 onClick={() => setStagedAssets(prev => prev.filter((_, i) => i !== idx))}
                                               >
                                                 <Trash2 className="h-4 w-4" />
                                               </Button>
                                             </div>
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                   )}
                                 </div>

                                 <div className="space-y-6">
                                   <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                      <div className="h-5 w-5 rounded bg-indigo-50 flex items-center justify-center">
                                         <FileText className="h-3 w-3 text-indigo-600" />
                                      </div>
                                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Basic Scan Info</h3>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="grid gap-2">
                                       <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Modality</Label>
                                       <Select value={uploadData.file_type} onValueChange={(v) => setUploadData({ ...uploadData, file_type: v })}>
                                         <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-medium">
                                           <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent className="rounded-xl">
                                           {['X-ray', 'MRI', 'CT Scan', 'Ultrasound', 'Blood Test', 'Other'].map(t => (
                                             <SelectItem key={t} value={t}>{t}</SelectItem>
                                           ))}
                                         </SelectContent>
                                       </Select>
                                     </div>
                                     <div className="grid gap-2">
                                       <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Scan Date</Label>
                                       <Input type="date" className="h-11 rounded-xl bg-slate-50 border-slate-100" value={uploadData.scan_date} onChange={(e) => setUploadData({ ...uploadData, scan_date: e.target.value })} />
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             ) : (
                               <div className="p-8 space-y-10">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                   <div className="space-y-6">
                                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                         <div className="h-5 w-5 rounded bg-rose-50 flex items-center justify-center">
                                            <Activity className="h-3 w-3 text-rose-600" />
                                         </div>
                                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Clinical Context</h3>
                                      </div>
                                      <div className="grid gap-4">
                                        <div className="grid gap-2">
                                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Referring Physician</Label>
                                          <Select value={uploadData.referring_doctor_id} onValueChange={(v) => setUploadData({ ...uploadData, referring_doctor_id: v })}>
                                            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-medium"><SelectValue placeholder="Select Doctor" /></SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                              {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="grid gap-2">
                                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Symptoms</Label>
                                          <Input placeholder="e.g. Shortness of breath" className="h-11 rounded-xl bg-slate-50 border-slate-100" value={uploadData.symptoms} onChange={(e) => setUploadData({ ...uploadData, symptoms: e.target.value })} />
                                        </div>
                                        <div className="grid gap-2">
                                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Medical History</Label>
                                          <textarea 
                                            className="w-full h-24 p-4 rounded-xl bg-slate-50 border-slate-100 text-sm resize-none outline-none border focus:ring-2 focus:ring-indigo-100"
                                            placeholder="e.g. Hypertension, previous surgeries..."
                                            value={uploadData.clinical_history}
                                            onChange={(e) => setUploadData({ ...uploadData, clinical_history: e.target.value })}
                                          />
                                        </div>
                                      </div>
                                   </div>

                                   <div className="space-y-6">
                                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                         <div className="h-5 w-5 rounded bg-amber-50 flex items-center justify-center">
                                            <ClipboardList className="h-3 w-3 text-amber-600" />
                                         </div>
                                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Radiology Report</h3>
                                      </div>
                                      <div className="grid gap-4">
                                        <div className="grid gap-2">
                                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Detailed Findings</Label>
                                          <textarea 
                                            className="w-full h-24 p-4 rounded-xl bg-slate-50 border-slate-100 text-sm resize-none outline-none border focus:ring-2 focus:ring-indigo-100"
                                            placeholder="Objective observations..."
                                            value={uploadData.findings}
                                            onChange={(e) => setUploadData({ ...uploadData, findings: e.target.value })}
                                          />
                                        </div>
                                        <div className="grid gap-2">
                                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Clinical Impression</Label>
                                          <textarea 
                                            className="w-full h-24 p-4 rounded-xl bg-slate-50 border-slate-100 text-sm resize-none outline-none border focus:ring-2 focus:ring-indigo-100"
                                            placeholder="Diagnostic summary..."
                                            value={uploadData.impression}
                                            onChange={(e) => setUploadData({ ...uploadData, impression: e.target.value })}
                                          />
                                        </div>
                                      </div>
                                   </div>
                                 </div>
                               </div>
                             )}
                           </div>
                           
                           <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                             {uploadStep === 1 ? (
                               <>
                                 <Button variant="ghost" className="rounded-xl h-12 px-6 font-bold uppercase tracking-widest text-[10px]" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                                 <Button 
                                   className="rounded-xl h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-100" 
                                   disabled={stagedAssets.length === 0}
                                   onClick={() => setUploadStep(2)}
                                 >
                                   Next: Clinical Context <ChevronRight className="ml-2 h-4 w-4" />
                                 </Button>
                               </>
                             ) : (
                               <>
                                 <Button variant="ghost" className="rounded-xl h-12 px-6 font-bold uppercase tracking-widest text-[10px]" onClick={() => setUploadStep(1)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                                 <Button 
                                   className="rounded-xl h-12 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-100" 
                                   disabled={isUploading}
                                   onClick={handleFileUpload}
                                 >
                                   {isUploading ? 'Synchronizing...' : 'Finalize & Submit'}
                                 </Button>
                               </>
                             )}
                           </div>
                        </DialogContent>
                     </Dialog>

                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudies.map((study, i) => {
                      const firstImage = study.files.find(f => f.fileFormat?.match(/(jpg|jpeg|png|gif)/i));
                     return (
                       <Card key={study.id} className="group border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer bg-white" onClick={() => {setSelectedStudy(study); setActiveFileIndex(0);}}>
                          <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 border-b border-slate-100 flex items-center justify-center">
                              {firstImage ? (
                                <img src={firstImage.fileUrl} alt={study.studyType} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              ) : (
                                <FileText className="h-16 w-16 text-indigo-100 group-hover:scale-110 transition-transform duration-700" />
                              )}
                              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors" />
                              <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 border-none text-[9px] font-bold uppercase shadow-sm tracking-tight h-5">
                                  STUDY-{study.id.slice(-4).toUpperCase()}
                              </Badge>
                              <Badge className="absolute top-3 right-3 bg-indigo-600 text-white border-none text-[9px] font-bold uppercase shadow-sm tracking-tight h-5">
                                  {study.files.length} FILES
                              </Badge>
                              <Button variant="secondary" className="absolute inset-0 m-auto h-10 w-10 rounded-full bg-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-xl flex items-center justify-center p-0">
                                  <Eye className="h-5 w-5 text-indigo-600" />
                              </Button>
                           </div>
                           <CardHeader className="p-4 space-y-1.5 flex-1">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-none">{study.studyType}</CardTitle>
                                <Badge variant="ghost" className="text-[10px] text-slate-400 p-0 font-bold uppercase tracking-widest h-auto leading-none">{new Date(study.createdAt).toLocaleDateString()}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Activity className="h-3 w-3 text-slate-300" />
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate max-w-[200px]">{study.bodyPart || 'General Assessment'}</p>
                              </div>
                           </CardHeader>
                           <CardFooter className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Diagnostic Study</span>
                              <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                 <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-white rounded" onClick={(e) => {e.stopPropagation(); deleteStudy(study.id);}}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                           </CardFooter>
                       </Card>
                     );
                   })}
                   
                   <Card className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center justify-center py-12 px-6 group" onClick={() => setIsUploadDialogOpen(true)}>
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-4 border border-slate-100 group-hover:scale-110 transition-transform">
                        <Plus className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-600">New Diagnostic Study</h4>
                      <p className="text-[11px] text-slate-400 text-center mt-1">Upload multiple scans and reports for a single study.</p>
                   </Card>
                </div>

                {filteredStudies.length === 0 && searchTerm && (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 text-sm">No records matching "{searchTerm}" found.</p>
                    <Button variant="link" className="text-indigo-600 text-xs font-bold" onClick={() => setSearchTerm('')}>Reset and Show All</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0 focus-visible:outline-none">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <History className="h-5 w-5 text-indigo-500" /> Patient Journey
                  </h3>
                </div>
                
                <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-100 space-y-10 py-4">
                  {timeline && timeline.length > 0 ? (
                    timeline.map((event: any, i: number) => {
                      let icon, title, desc, colorClass, bgClass;
                      
                      switch (event.type) {
                        case 'patient_created':
                          icon = <Users className="h-4 w-4" />;
                          title = "Patient Registered";
                          desc = `Registered with MRN: ${event.data.mrn}`;
                          colorClass = "text-emerald-600";
                          bgClass = "bg-emerald-50 border-emerald-100";
                          break;
                        case 'document_uploaded':
                          icon = <Files className="h-4 w-4" />;
                          title = `${event.data.file_type} Uploaded`;
                          if (event.data.body_part) title += ` (${event.data.body_part})`;
                          desc = event.data.impression 
                            ? `Impression: ${event.data.impression}`
                            : `New clinical record: ${event.data.file_name}`;
                          colorClass = "text-amber-600";
                          bgClass = "bg-amber-50 border-amber-100";
                          break;
                        case 'prescription_added':
                          icon = <Stethoscope className="h-4 w-4" />;
                          title = "Prescription Issued";
                          desc = event.data.summary;
                          colorClass = "text-indigo-600";
                          bgClass = "bg-indigo-50 border-indigo-100";
                          break;
                        case 'note_added':
                          icon = <FileText className="h-4 w-4" />;
                          title = "Clinical Note Added";
                          desc = `Note: "${event.data.content}"`;
                          colorClass = "text-blue-600";
                          bgClass = "bg-blue-50 border-blue-100";
                          break;
                        default:
                          icon = <Activity className="h-4 w-4" />;
                          title = "Activity Recorded";
                          desc = "System activity logged";
                          colorClass = "text-slate-600";
                          bgClass = "bg-slate-50 border-slate-100";
                      }
                      
                      return (
                        <div key={i} className="relative group">
                          <div className={`absolute -left-[35px] sm:-left-[43px] h-8 w-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10 ${bgClass} ${colorClass}`}>
                            {icon}
                          </div>
                          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow group-hover:border-indigo-100 relative">
                            <div className="absolute top-5 -left-2 w-4 h-4 bg-white border-t border-l border-slate-100 transform -rotate-45 group-hover:border-indigo-100 transition-colors"></div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className={`text-sm font-bold ${colorClass}`}>{title}</h4>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                                {new Date(event.timestamp).toLocaleString(undefined, {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">{desc}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center bg-white rounded-xl border border-slate-100 border-dashed">
                      <History className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-500">No events recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document Detail Viewer - Redesigned to match reference */}
      <Dialog open={!!selectedStudy} onOpenChange={() => setSelectedStudy(null)}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[1400px] h-[90vh] rounded-[2.5rem] p-0 border-none shadow-2xl flex flex-col overflow-hidden bg-[#F8FAFC]">
          {/* Visually hidden title/description for screen reader accessibility */}
          <DialogTitle className="sr-only">Clinical Diagnostic Workspace</DialogTitle>
          <DialogDescription className="sr-only">View and manage patient clinical documents</DialogDescription>
          {/* Main Header */}
          <div className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                   <Activity className="h-5 w-5" />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-1">{selectedStudy?.studyType} Diagnostic Workspace</h2>
                   <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">
                     STUDY-{selectedStudy?.id?.slice(-4).toUpperCase()} • {selectedStudy?.files.length} CLINICAL ASSETS
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                   <ShieldCheck className="h-4 w-4 text-slate-400" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Enterprise Secured</span>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-slate-600 rounded-full" onClick={() => setSelectedStudy(null)}>
                   <ArrowLeft className="h-5 w-5" />
                </Button>
             </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-6 gap-6">
            {/* Left Column: Viewer */}
            <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
               {/* Viewer Toolbar */}
               <div className="h-14 bg-slate-50/50 border-b border-slate-50 px-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                     <FileText className="h-4 w-4 text-indigo-500" />
                     <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{selectedStudy?.files[activeFileIndex]?.fileName}</span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-lg px-3 py-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600"><Search className="h-3.5 w-3.5" /></Button>
                        <span className="text-[10px] font-bold text-slate-400">100%</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600"><Plus className="h-3.5 w-3.5" /></Button>
                     </div>
                     
                     <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-1">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-5 w-5 text-slate-300"
                             disabled={activeFileIndex === 0}
                             onClick={() => setActiveFileIndex(prev => Math.max(0, prev - 1))}
                           >
                             <ChevronLeft className="h-3.5 w-3.5" />
                           </Button>
                           <span className="text-[10px] font-bold text-slate-400">{activeFileIndex + 1}/{selectedStudy?.files.length}</span>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-5 w-5 text-slate-300"
                             disabled={activeFileIndex === (selectedStudy?.files.length || 1) - 1}
                             onClick={() => setActiveFileIndex(prev => Math.min((selectedStudy?.files.length || 1) - 1, prev + 1))}
                           >
                             <ChevronRight className="h-3.5 w-3.5" />
                           </Button>
                        </div>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100" onClick={() => window.open(selectedStudy?.files[activeFileIndex]?.fileUrl)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600"><Share2 className="h-4 w-4" /></Button>
                     </div>
                  </div>
               </div>

               {/* Document Display Area */}
               <div className="flex-1 bg-[#475569] p-8 flex items-center justify-center overflow-auto scrollbar-hide">
                  <div className="w-full max-w-4xl bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden min-h-[80%] flex items-center justify-center">
                    {selectedStudy?.files[activeFileIndex]?.fileFormat === 'pdf' ? (
                      <iframe src={`${selectedStudy.files[activeFileIndex].fileUrl}#toolbar=0`} className="w-full h-[1200px] border-none" />
                    ) : (
                      <img src={selectedStudy?.files[activeFileIndex]?.fileUrl} className="max-w-full max-h-full object-contain" alt="Study Asset" />
                    )}
                  </div>
               </div>
            </div>

            <div className="w-full md:w-[450px] flex flex-col gap-6 overflow-y-auto scrollbar-hide pr-2">
               {/* Study Details Section */}
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-6 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Activity className="h-3 w-3 text-indigo-600" />
                     </div>
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Study Parameters</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Accession Number</p>
                        <p className="text-xs font-bold text-slate-900">STUDY-{selectedStudy?.id?.slice(-4).toUpperCase()}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Scan Date</p>
                        <p className="text-xs font-bold text-slate-900">{selectedStudy?.scanDate ? new Date(selectedStudy.scanDate).toLocaleDateString() : 'N/A'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Modality</p>
                        <p className="text-xs font-bold text-slate-900 truncate">{selectedStudy?.studyType}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Anatomical Region</p>
                        <p className="text-xs font-bold text-slate-900">{selectedStudy?.bodyPart || 'N/A'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Referring MD</p>
                        <p className="text-xs font-bold text-indigo-600 truncate">
                          {doctors.find(d => d.id === selectedStudy?.referringDoctorId)?.name || 'N/A'}
                        </p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Radiologist</p>
                        <p className="text-xs font-bold text-slate-700">{uploaderDoc?.name?.split(' ')[0] || 'System'}</p>
                     </div>
                  </div>
               </div>

               {/* Radiology Report Section */}
               {(selectedStudy?.findings || selectedStudy?.impression) && (
                 <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-6 shrink-0">
                    <div className="flex items-center gap-3">
                       <div className="h-5 w-5 rounded-full bg-amber-50 flex items-center justify-center">
                          <ClipboardList className="h-3 w-3 text-amber-600" />
                       </div>
                       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Radiology Report</h3>
                    </div>
                    
                    <div className="space-y-4">
                       {selectedStudy?.findings && (
                         <div className="space-y-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Findings</p>
                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                               <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                                 {selectedStudy.findings}
                               </p>
                            </div>
                         </div>
                       )}
                       {selectedStudy?.impression && (
                         <div className="space-y-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Impression</p>
                            <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                               <p className="text-xs text-slate-900 leading-relaxed font-bold whitespace-pre-wrap">
                                 {selectedStudy.impression}
                               </p>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {/* Multi-File Thumbnail Gallery */}
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col shrink-0">
                  <div className="flex items-center justify-between mb-5">
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Study Gallery</h3>
                     <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{selectedStudy?.files.length} Assets</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     {selectedStudy?.files.map((file, idx) => (
                        <div 
                          key={file.id} 
                          className={cn(
                            "group aspect-square rounded-2xl border transition-all cursor-pointer overflow-hidden relative",
                            idx === activeFileIndex ? "border-indigo-600 ring-2 ring-indigo-100" : "border-slate-100 hover:border-slate-300"
                          )}
                          onClick={() => setActiveFileIndex(idx)}
                        >
                           {file.fileFormat?.match(/(jpg|jpeg|png)/i) ? (
                             <img src={file.fileUrl} className="w-full h-full object-cover" alt="Thumb" />
                           ) : (
                             <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                               <FileText className="h-8 w-8 text-slate-300" />
                             </div>
                           )}
                           <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                             <p className="text-[8px] font-bold text-white truncate uppercase tracking-tighter">{file.fileName}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Clinical Context Section */}
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-6 shrink-0 mb-6">
                  <div className="flex items-center gap-3">
                     <div className="h-5 w-5 rounded-full bg-rose-50 flex items-center justify-center">
                        <Stethoscope className="h-3 w-3 text-rose-600" />
                     </div>
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Clinical Context</h3>
                  </div>
                  
                  <div className="space-y-4">
                     {selectedStudy?.symptoms && (
                       <div className="flex justify-between items-start gap-4">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1 shrink-0">Symptoms</p>
                          <p className="text-xs font-medium text-slate-700 text-right">{selectedStudy.symptoms}</p>
                       </div>
                     )}
                     {selectedStudy?.reasonForScan && (
                       <div className="flex justify-between items-start gap-4">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1 shrink-0">Indication</p>
                          <p className="text-xs font-medium text-slate-700 text-right">{selectedStudy.reasonForScan}</p>
                       </div>
                     )}
                     {selectedStudy?.clinicalHistory && (
                       <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">History</p>
                          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                             <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                               {selectedStudy.clinicalHistory}
                             </p>
                          </div>
                       </div>
                     )}
                     {selectedStudy?.doctorNotes && (
                       <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">MD Annotations</p>
                          <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                             <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                               {selectedStudy.doctorNotes}
                             </p>
                          </div>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PatientDetail;

