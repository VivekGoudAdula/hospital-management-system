import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Files, 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Image as ImageIcon, 
  File, 
  MoreVertical, 
  Download, 
  Eye, 
  Trash2,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Tag,
  Plus,
  ArrowRight,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { useEHRStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const DocumentRepository = () => {
  const { currentPatient, currentVisit, documentStudies, documentsLoading, fetchDocumentStudies, createDocumentStudy } = useEHRStore();
  const { user } = useAuthStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Form State
  const [category, setCategory] = useState('Imaging Study');
  const [bodyPart, setBodyPart] = useState('');
  const [findings, setFindings] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      toast.info(`${e.target.files.length} files selected`);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (currentPatient?.id) {
      fetchDocumentStudies(currentPatient.id);
    }
  }, [currentPatient?.id]);

  const handleUploadStudy = async () => {
    if (!currentPatient || !currentVisit) return;
    try {
      await createDocumentStudy({
        patient_id: currentPatient.id,
        visit_id: currentVisit.id,
        category,
        body_part: bodyPart,
        findings,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        files: [
          { file_url: 'https://example.com/demo-scan.jpg', file_type: 'image/jpeg', uploaded_at: new Date().toISOString() }
        ]
      });
      toast.success('Clinical study uploaded and indexed');
      setIsUploadModalOpen(false);
      // Reset form
      setBodyPart('');
      setFindings('');
      setTags('');
    } catch (error) {
      toast.error('Failed to upload study');
    }
  };

  const filteredStudies = documentStudies.filter(s => {
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    const matchesSearch = s.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (s.body_part || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Repository</h2>
          <p className="text-sm text-slate-500 font-medium">Enterprise document & imaging management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search studies..." 
              className="pl-10 rounded-xl border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100 h-11 px-6 text-xs font-bold uppercase tracking-widest">
                <Upload className="h-4 w-4 mr-2" /> Upload Study
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                   <FolderOpen className="h-6 w-6 text-indigo-600" />
                   Index New Clinical Study
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Upload and index imaging studies, lab reports, or other clinical documents for the patient's longitudinal record.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={handleFileChange} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Imaging Study">Imaging Study</SelectItem>
                        <SelectItem value="Lab Report">Lab Report</SelectItem>
                        <SelectItem value="Discharge Summary">Discharge Summary</SelectItem>
                        <SelectItem value="Consent Form">Consent Form</SelectItem>
                        <SelectItem value="External Record">External Record</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Body Part / Region</Label>
                    <Input 
                      placeholder="e.g. Abdomen, Chest" 
                      className="rounded-xl border-slate-200"
                      value={bodyPart}
                      onChange={(e) => setBodyPart(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Clinical Context / Findings</Label>
                  <Textarea 
                    placeholder="Initial observations or reason for upload..." 
                    className="rounded-xl border-slate-200 min-h-[100px] resize-none"
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tags (comma separated)</Label>
                  <Input 
                    placeholder="urgent, follow-up, radiology" 
                    className="rounded-xl border-slate-200"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                <div 
                  className="p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                  onClick={triggerFileInput}
                >
                   <div className="h-16 w-16 rounded-3xl bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-indigo-600" />
                   </div>
                   <div className="text-center">
                      <p className="text-sm font-bold text-slate-900">
                        {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Drop files here or click to browse'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Supports PDF, DICOM, JPG, PNG (Max 50MB per file)</p>
                   </div>
                   <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-bold uppercase tracking-widest">
                      {selectedFiles.length > 0 ? 'Change Files' : 'Select Files'}
                   </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                <Button className="bg-indigo-600 rounded-xl px-8" onClick={handleUploadStudy} disabled={selectedFiles.length === 0}>
                   {documentsLoading ? 'Processing...' : 'Process & Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentsLoading ? (
           Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="h-64 rounded-[2rem] bg-slate-100 animate-pulse" />
           ))
        ) : filteredStudies.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-4">
             <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center">
                <Files className="h-10 w-10 text-slate-200" />
             </div>
             <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">No studies indexed</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">Upload clinical documents or imaging series to build the patient repository.</p>
             </div>
          </div>
        ) : (
          filteredStudies.map((study) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={cn(
                      "rounded-lg text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border-none",
                      study.category === 'Imaging Study' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                    )}>
                      {study.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                          <DropdownMenuItem className="gap-2 font-bold text-xs uppercase tracking-widest cursor-pointer" onClick={() => toast.info('Opening study...')}>
                            <Eye className="h-3.5 w-3.5 text-indigo-500" /> Open Viewer
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 font-bold text-xs uppercase tracking-widest cursor-pointer" onClick={() => toast.success('Report downloaded')}>
                            <Download className="h-3.5 w-3.5 text-emerald-500" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 font-bold text-xs uppercase tracking-widest text-rose-600 cursor-pointer" onClick={() => toast.error('Delete restricted')}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete Study
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {study.body_part || 'Clinical Record'}
                  </CardTitle>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {format(new Date(study.created_at), 'MMMM dd, yyyy')} • {study.files.length} Files
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="aspect-video rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative group/preview">
                     <div className="absolute inset-0 flex items-center justify-center">
                        {study.category === 'Imaging Study' ? <ImageIcon className="h-12 w-12 text-slate-200" /> : <FileText className="h-12 w-12 text-slate-200" />}
                     </div>
                     <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover/preview:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                        <Button size="sm" className="rounded-xl bg-white text-indigo-600 font-bold text-[10px] uppercase tracking-widest h-9 shadow-lg active:scale-95" onClick={() => toast.info('Previewing document...')}>
                           <Eye className="h-3.5 w-3.5 mr-2" /> Preview
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl bg-transparent border-white/40 text-white font-bold text-[10px] uppercase tracking-widest h-9 hover:bg-white hover:text-indigo-600 hover:border-white transition-all active:scale-95" onClick={() => toast.success('Report downloaded')}>
                           <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                  </div>

                  <div className="space-y-3">
                     <div className="flex flex-wrap gap-1.5">
                        {study.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[8px] font-bold uppercase tracking-widest px-1.5 border-slate-100 text-slate-400 bg-slate-50/50">
                             #{tag}
                          </Badge>
                        ))}
                     </div>
                     <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {study.findings || 'No findings recorded for this study.'}
                     </p>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", 
                           study.status === 'Critical' ? 'bg-rose-500' : 
                           study.status === 'Reviewed' ? 'bg-emerald-500' : 
                           'bg-amber-500'
                        )} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{study.status}</span>
                     </div>
                     <Button variant="ghost" className="h-8 text-indigo-600 font-bold text-[10px] uppercase tracking-widest group/btn">
                        Open Study <ArrowRight className="h-3 w-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                     </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentRepository;
