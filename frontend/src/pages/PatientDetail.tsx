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
  const [vitals, setVitals] = useState<any[]>([]); // Initialize empty as requested
  const [prescriptions, setPrescriptions] = useState<any[]>([]); // Initialize empty as requested
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('clinical');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    file_type: 'MRI',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const p = await fetchPatientById(id);
        setPatient(p);
        await fetchPatientDocuments(id);
        await fetchDoctors();
        await fetchNotesByPatient(id);
      } catch (error) {
        console.error('Failed to load patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const assignedDoctor = doctors.find(d => d.id === patient?.assignedDoctorId);

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
    if (!selectedFile || !id) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('patient_id', id);
    formData.append('file_type', uploadData.file_type);
    formData.append('notes', uploadData.notes);

    try {
      await uploadDocument(formData);
      toast.success('Document uploaded successfully');
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadData({ file_type: 'MRI', notes: '' });
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
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

  const patientDocs = documents;
  const uploaderDoc = doctors.find(d => d.id === selectedDoc?.uploadedBy);
  const filteredDocs = documents.filter(doc => 
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.fileName && doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
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
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Attending Staff</span>
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
              <TabsTrigger value="documents" className="px-5 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all flex items-center gap-2">Records <Badge className="bg-slate-100 text-slate-500 text-[9px] border-none px-1 h-3.5">{patientDocs.length}</Badge></TabsTrigger>
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
                    <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"><Plus className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden">
                        <DialogHeader className="p-8 bg-indigo-600 text-white">
                          <DialogTitle className="text-xl font-bold">New Clinical Observation</DialogTitle>
                          <DialogDescription className="text-indigo-100 text-xs font-medium">
                            Append a clinical note or collaboration log to this patient's master record.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddNote} className="p-8 space-y-6 bg-white">
                           <div className="space-y-4">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Clinical Assessment</Label>
                              <textarea 
                                className="w-full h-32 p-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-sm resize-none outline-none border focus:border-indigo-100"
                                placeholder="Enter clinical notes, observation details or diagnostic summary..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                              />
                           </div>
                           <DialogFooter className="sm:justify-between flex items-center pt-2">
                              <Button type="button" variant="ghost" className="rounded-2xl h-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]" onClick={() => setIsNoteDialogOpen(false)}>Abort</Button>
                              <Button type="submit" className="rounded-2xl h-12 px-8 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-100" disabled={!newNote.trim()}>
                                 Finalize Note
                              </Button>
                           </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {notes.filter(n => n.patientId === id).length > 0 ? (
                        notes.filter(n => n.patientId === id).map((note, i) => (
                          <div key={i} className="p-6 flex gap-4 hover:bg-slate-50/50 transition-colors">
                            <Avatar className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                              <AvatarFallback className="text-[10px] font-bold text-slate-400">{note.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 flex-1">
                               <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-bold text-slate-900">{note.authorName}</p>
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
                        {prescriptions.length > 0 ? (
                          prescriptions.map((m, i) => (
                            <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                              <TableCell className="py-4 pl-6">
                                 <div>
                                    <p className="font-bold text-sm text-slate-900">{m.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{m.company}</p>
                                 </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 font-bold py-4">{m.dosage}</TableCell>
                              <TableCell className="text-xs text-slate-500 font-medium py-4">{m.frequency}</TableCell>
                              <TableCell className="text-xs text-slate-400 font-medium py-4">{m.expiry}</TableCell>
                              <TableCell className="text-center py-4">
                                 <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px] font-bold uppercase rounded h-5">{m.status}</Badge>
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
                     <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="flex-1 sm:flex-none h-10 rounded-md bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold gap-2 text-xs shadow-sm">
                              <Plus className="h-3.5 w-3.5" /> Upload Document
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 border-none shadow-2xl">
                          <DialogHeader className="p-10 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                                <Upload className="h-40 w-40" />
                             </div>
                             <DialogTitle className="text-2xl font-bold tracking-tight">Import Record</DialogTitle>
                             <DialogDescription className="text-indigo-100 font-medium text-sm">
                                Append diagnostic reports or imaging to patient chart.
                             </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleFileUpload} className="p-10 space-y-6 bg-white">
                            <div className="space-y-4">
                              <div className="grid gap-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Document Category</Label>
                                <Select value={uploadData.file_type} onValueChange={(v) => setUploadData({ ...uploadData, file_type: v })}>
                                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium">
                                    <SelectValue placeholder="Select Type" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                                    {['MRI', 'X-Ray', 'CT Scan', 'Blood Test', 'Prescription', 'Other'].map(t => (
                                      <SelectItem key={t} value={t} className="rounded-xl">{t}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Clinical Notes</Label>
                                <Input 
                                  placeholder="Initial scan observations..." 
                                  className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                                  value={uploadData.notes}
                                  onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">File Asset</Label>
                                <div className="relative">
                                  <Input 
                                    type="file" 
                                    className="hidden" 
                                    id="file-upload" 
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  <label 
                                    htmlFor="file-upload" 
                                    className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                                  >
                                    <div className="text-center">
                                      <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {selectedFile ? selectedFile.name : 'Select PDF or Image'}
                                      </span>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            </div>
                            <DialogFooter className="pt-4 sm:justify-between flex items-center">
                              <Button type="button" variant="ghost" className="rounded-2xl h-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]" onClick={() => setIsUploadDialogOpen(false)}>Abort</Button>
                              <Button type="submit" className="rounded-2xl h-12 px-8 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-100" disabled={isUploading || !selectedFile}>
                                {isUploading ? 'Uploading...' : 'Finalize Sync'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                     </Dialog>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredDocs.map((doc, i) => (
                     <Card key={doc.id} className="group border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer bg-white" onClick={() => setSelectedDoc(doc)}>
                        <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 border-b border-slate-100 flex items-center justify-center">
                            {doc.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <img src={doc.fileUrl} alt={doc.type} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                              <FileText className="h-16 w-16 text-indigo-100 group-hover:scale-110 transition-transform duration-700" />
                            )}
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors" />
                            <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 border-none text-[9px] font-bold uppercase shadow-sm tracking-tight h-5">
                                DOC-{doc.id.slice(-4).toUpperCase()}
                            </Badge>
                            <Button variant="secondary" className="absolute inset-0 m-auto h-10 w-10 rounded-full bg-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-xl flex items-center justify-center p-0">
                                <Eye className="h-5 w-5 text-indigo-600" />
                            </Button>
                         </div>
                         <CardHeader className="p-4 space-y-1.5 flex-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-none">{doc.type}</CardTitle>
                              <Badge variant="ghost" className="text-[10px] text-slate-400 p-0 font-bold uppercase tracking-widest h-auto leading-none">{new Date(doc.uploadDate).toLocaleDateString()}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                               <TagIcon className="h-3 w-3 text-slate-300" />
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate max-w-[200px]">{doc.fileName}</p>
                            </div>
                         </CardHeader>
                         <CardFooter className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Record</span>
                            <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-white rounded" onClick={(e) => {e.stopPropagation(); window.open(doc.fileUrl);}}><Download className="h-3.5 w-3.5" /></Button>
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-white rounded" onClick={(e) => {e.stopPropagation(); deleteDocument(doc.id);}}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                         </CardFooter>
                     </Card>
                   ))}
                   
                   <Card className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center justify-center py-12 px-6 group" onClick={() => setIsUploadDialogOpen(true)}>
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-4 border border-slate-100 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-600">New Clinical Record</h4>
                      <p className="text-[11px] text-slate-400 text-center mt-1">Append PDF, MRI scans or Lab reports to patient chart.</p>
                   </Card>
                </div>

                {filteredDocs.length === 0 && searchTerm && (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 text-sm">No records matching "{searchTerm}" found.</p>
                    <Button variant="link" className="text-indigo-600 text-xs font-bold" onClick={() => setSearchTerm('')}>Reset and Show All</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0 focus-visible:outline-none">
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[400px] border">
                 <div className="h-20 w-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                    <History className="h-10 w-10" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Phase Timeline & Journey</h3>
                 <p className="text-slate-500 text-sm italic max-w-sm text-center">Full journey logs including triage, consultation, diagnostic phases and discharge trajectory will be visualized in the next release.</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document Detail Viewer - Redesigned to match reference */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[1400px] h-[90vh] rounded-[2.5rem] p-0 border-none shadow-2xl flex flex-col overflow-hidden bg-[#F8FAFC]">
          {/* Visually hidden title/description for screen reader accessibility */}
          <DialogTitle className="sr-only">Clinical Diagnostic Workspace</DialogTitle>
          <DialogDescription className="sr-only">View and manage patient clinical documents</DialogDescription>
          {/* Main Header */}
          <div className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                   <Files className="h-5 w-5" />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-1">Clinical Diagnostic Workspace</h2>
                   <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">
                     DOC-{selectedDoc?.id?.slice(-4).toUpperCase()} • {patientDocs.length} RECORDS
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                   <ShieldCheck className="h-4 w-4 text-slate-400" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Enterprise Secured</span>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-slate-600 rounded-full" onClick={() => setSelectedDoc(null)}>
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
                     <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{selectedDoc?.fileName}</span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-lg px-3 py-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600"><Search className="h-3.5 w-3.5" /></Button>
                        <span className="text-[10px] font-bold text-slate-400">100%</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600"><Plus className="h-3.5 w-3.5" /></Button>
                     </div>
                     
                     <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-1">
                           <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300"><ChevronLeft className="h-3.5 w-3.5" /></Button>
                           <span className="text-[10px] font-bold text-slate-400">1/1</span>
                           <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300"><ChevronRight className="h-3.5 w-3.5" /></Button>
                        </div>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600"><Share2 className="h-4 w-4" /></Button>
                     </div>
                  </div>
               </div>

               {/* Document Display Area */}
               <div className="flex-1 bg-[#475569] p-8 flex items-center justify-center overflow-auto scrollbar-hide">
                  <div className="w-full max-w-4xl bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden min-h-[80%]">
                    {selectedDoc?.fileUrl?.toLowerCase().endsWith('.pdf') ? (
                      <iframe src={`${selectedDoc.fileUrl}#toolbar=0`} className="w-full h-[1200px] border-none" />
                    ) : (
                      <img src={selectedDoc?.fileUrl} className="w-full h-auto" alt="Clinical Document" />
                    )}
                  </div>
               </div>
            </div>

            {/* Right Column: Sidebar - Scrollable for smaller screens */}
            <div className="w-full md:w-[400px] flex flex-col gap-6 overflow-y-auto scrollbar-hide pr-2">
               {/* Metadata Section */}
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-8 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Activity className="h-3 w-3 text-indigo-600" />
                     </div>
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Diagnostic Details</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                     <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Diagnostic ID</p>
                        <p className="text-xs font-bold text-slate-900">DOC-{selectedDoc?.id?.slice(-4).toUpperCase()}</p>
                     </div>
                     <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Entry Date</p>
                        <p className="text-xs font-bold text-slate-900">{selectedDoc && new Date(selectedDoc.uploadDate).toLocaleDateString()}</p>
                     </div>
                     <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Patient MRN</p>
                        <p className="text-xs font-bold text-slate-900">{patient.mrn}</p>
                     </div>
                     <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Record Type</p>
                        <p className="text-xs font-bold text-slate-900 truncate">{selectedDoc?.type}</p>
                     </div>
                     <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Dept Scope</p>
                        <p className="text-xs font-bold text-slate-900">Diagnostics</p>
                     </div>
                     <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sync Agent</p>
                        <p className="text-xs font-bold text-indigo-600">{uploaderDoc?.name?.split(' ')[0] || 'Medical'}</p>
                     </div>
                  </div>
               </div>

               {/* Care Observations Section */}
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-4 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center">
                        <ClipboardList className="h-3 w-3 text-emerald-600" />
                     </div>
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Care Observations</h3>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Collaboration logs and patient notes</p>
                     <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[80px]">
                        <p className="text-xs text-slate-600 leading-relaxed italic font-medium">
                          "{selectedDoc?.notes || 'No specific clinical observations were recorded for this document bundle.'}"
                        </p>
                     </div>
                  </div>
               </div>

               {/* All Documents Section */}
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col shrink-0">
                  <div className="flex items-center justify-between mb-5">
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">All Documents</h3>
                     <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{patientDocs.length} files</span>
                  </div>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-hide">
                     {patientDocs.map((doc) => (
                        <div 
                          key={doc.id} 
                          className={cn(
                            "group p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3",
                            doc.id === selectedDoc?.id ? "bg-indigo-50/50 border-indigo-100" : "bg-white border-slate-50 hover:border-slate-200"
                          )}
                          onClick={() => setSelectedDoc(doc)}
                        >
                           <div className={cn(
                              "h-9 w-9 rounded-xl flex items-center justify-center border shrink-0",
                              doc.id === selectedDoc?.id
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-slate-100 border-slate-100 text-slate-400 group-hover:bg-white group-hover:text-indigo-600"
                           )}>
                              <FileText className="h-4 w-4" />
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className={cn("text-[11px] font-bold truncate", doc.id === selectedDoc?.id ? "text-indigo-700" : "text-slate-900")}>{doc.fileName}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{doc.type} • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                           </div>
                           {doc.id === selectedDoc?.id && (
                             <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                           )}
                           <div className={cn("flex gap-1 transition-opacity", doc.id === selectedDoc?.id ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg"><Download className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg" onClick={(e) => {e.stopPropagation(); deleteDocument(doc.id);}}><Trash2 className="h-3.5 w-3.5" /></Button>
                           </div>
                        </div>
                     ))}
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

