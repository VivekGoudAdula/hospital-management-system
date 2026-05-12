import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  FileText,
  Upload,
  Download,
  Info,
  Calendar,
  User,
  Activity,
  Microscope,
  Zap,
  MoreVertical,
  Share2,
  Phone,
  Trash2
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

const LabsPanel = () => {
  const { currentPatient, currentVisit, labOrders, labsLoading, fetchLabs, createLabOrder, updateLabOrder } = useEHRStore();
  const { user } = useAuthStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState('Blood Test');
  const [testName, setTestName] = useState('');
  const [urgency, setUrgency] = useState<'Routine' | 'Priority' | 'Urgent' | 'STAT'>('Routine');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [notes, setNotes] = useState('');

  // Result State
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [radiologistComments, setRadiologistComments] = useState('');
  const [selectedResultFiles, setSelectedResultFiles] = useState<File[]>([]);
  const resultFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleResultFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedResultFiles(Array.from(e.target.files));
      toast.info(`${e.target.files.length} diagnostic reports selected`);
    }
  };

  const triggerResultFileInput = () => {
    resultFileInputRef.current?.click();
  };

  const selectedOrder = labOrders.find(o => o.id === selectedOrderId) || labOrders[0];

  useEffect(() => {
    if (currentVisit?.id) {
      fetchLabs(currentVisit.id);
    }
  }, [currentVisit?.id]);

  useEffect(() => {
    if (labOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(labOrders[0].id);
    }
  }, [labOrders]);

  const handleOrderTest = async () => {
    if (!currentPatient || !currentVisit) return;
    try {
      await createLabOrder({
        patient_id: currentPatient.id,
        visit_id: currentVisit.id,
        category,
        test_name: testName,
        urgency,
        clinical_indication: clinicalIndication,
        notes
      });
      toast.success('Lab test ordered successfully');
      setIsOrderModalOpen(false);
      // Reset form
      setTestName('');
      setClinicalIndication('');
      setNotes('');
    } catch (error) {
      toast.error('Failed to order lab test');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateLabOrder(id, { status: status as any });
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveResults = async () => {
    if (!selectedOrderId) return;
    try {
      await updateLabOrder(selectedOrderId, {
        status: 'Completed',
        findings,
        impression,
        radiologist_comments: radiologistComments
      });
      toast.success('Lab results saved and finalized');
      setIsResultModalOpen(false);
    } catch (error) {
      toast.error('Failed to save results');
    }
  };

  const getUrgencyColor = (u: string) => {
    switch (u) {
      case 'STAT': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'Urgent': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Priority': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'Processing': return <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />;
      case 'Sample Collected': return <Activity className="h-4 w-4 text-amber-500" />;
      case 'Ordered': return <Clock className="h-4 w-4 text-slate-400" />;
      default: return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 min-h-[600px]">
      {/* LEFT: Lab orders list */}
      <div className="w-80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Orders</h3>
          <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                <Plus className="h-4 w-4 mr-1" /> Order Test
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                   <FlaskConical className="h-6 w-6 text-indigo-600" />
                   New Diagnostics Order
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Fill in the details to order a new laboratory or imaging test.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Blood Test', 'Urine Test', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'ECG', 'Pathology'].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Urgency</Label>
                    <Select value={urgency} onValueChange={(v: any) => setUrgency(v)}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Routine', 'Priority', 'Urgent', 'STAT'].map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Test Name</Label>
                  <Input 
                    placeholder="e.g. CBC with Differential" 
                    className="rounded-xl border-slate-200"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Clinical Indication</Label>
                  <Textarea 
                    placeholder="Why is this test needed?" 
                    className="rounded-xl border-slate-200 min-h-[80px] resize-none"
                    value={clinicalIndication}
                    onChange={(e) => setClinicalIndication(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Internal Notes</Label>
                  <Input 
                    placeholder="Special instructions for lab technician" 
                    className="rounded-xl border-slate-200"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setIsOrderModalOpen(false)}>Cancel</Button>
                <Button className="bg-indigo-600 rounded-xl px-8" onClick={handleOrderTest}>Create Order</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
          {labOrders.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
               <FlaskConical className="h-10 w-10 text-slate-200 mx-auto mb-3" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active orders</p>
            </div>
          ) : (
            labOrders.map((order) => (
              <motion.div
                key={order.id}
                layoutId={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer group",
                  selectedOrderId === order.id 
                    ? "bg-white border-indigo-200 shadow-lg shadow-indigo-50" 
                    : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className={cn("text-[9px] uppercase tracking-widest font-bold border px-1.5 py-0", getUrgencyColor(order.urgency))}>
                    {order.urgency}
                  </Badge>
                  {getStatusIcon(order.status)}
                </div>
                <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{order.test_name}</h4>
                <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{order.category}</span>
                  <span>{format(new Date(order.ordered_at), 'MMM dd')}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* CENTER: Active order details */}
      <div className="flex-1 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {selectedOrder ? (
            <motion.div
              key={selectedOrder.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col gap-6"
            >
              <Card className="rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="bg-indigo-600 p-8 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                        <FlaskConical className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">{selectedOrder.test_name}</h2>
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-[0.2em]">{selectedOrder.category} • ORDER #{selectedOrder.id.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Status</p>
                         <Badge className="bg-white text-indigo-600 border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                            {selectedOrder.status}
                         </Badge>
                      </div>
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all">
                             <MoreVertical className="h-5 w-5" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                           <DropdownMenuItem className="gap-2 font-bold text-xs uppercase tracking-widest cursor-pointer" onClick={() => toast.info('Order details exported')}>
                             <Share2 className="h-3.5 w-3.5 text-indigo-500" /> Export Order
                           </DropdownMenuItem>
                           <DropdownMenuItem className="gap-2 font-bold text-xs uppercase tracking-widest cursor-pointer" onClick={() => toast.info('Contacting lab...')}>
                             <Phone className="h-3.5 w-3.5 text-emerald-500" /> Contact Lab
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="gap-2 font-bold text-xs uppercase tracking-widest text-rose-600 cursor-pointer" onClick={() => toast.error('Cancellation restricted')}>
                             <Trash2 className="h-3.5 w-3.5" /> Cancel Order
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 py-4 border-t border-white/10">
                     <div>
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Ordered At</p>
                        <p className="text-sm font-bold">{format(new Date(selectedOrder.ordered_at), 'MMMM dd, hh:mm a')}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Ordered By</p>
                        <p className="text-sm font-bold">Dr. Clinical Lead</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Urgency</p>
                        <p className={cn("text-sm font-bold flex items-center gap-1.5", selectedOrder.urgency === 'STAT' ? 'text-rose-300' : 'text-white')}>
                           <Zap className="h-3 w-3" /> {selectedOrder.urgency}
                        </p>
                     </div>
                  </div>
                </div>

                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Info className="h-3 w-3" /> Clinical Indication
                      </h4>
                      <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                        {selectedOrder.clinical_indication || 'No clinical indication provided.'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-3 w-3" /> Instructions/Notes
                      </h4>
                      <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                        {selectedOrder.notes || 'No special instructions.'}
                      </p>
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  {selectedOrder.status === 'Completed' ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h4 className="text-lg font-bold text-slate-900">Diagnostic Results</h4>
                         <Button variant="outline" className="rounded-xl h-9 border-slate-200 text-indigo-600 font-bold text-[10px] uppercase tracking-widest">
                            <Download className="h-3 w-3 mr-2" /> Download Full Report
                         </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3" /> Findings & Observations
                           </p>
                           <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedOrder.findings}</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                           <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                              <Microscope className="h-3 w-3" /> Clinical Impression
                           </p>
                           <p className="text-sm font-bold text-slate-800 leading-relaxed">{selectedOrder.impression}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <div className="h-20 w-20 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center relative">
                         <Clock className="h-10 w-10 text-indigo-300" />
                         <div className="absolute inset-0 rounded-[2.5rem] border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-800">Results Pending</h4>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium">Diagnostic laboratory is currently processing the sample. Estimated completion: 4-6 hours.</p>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="rounded-2xl h-11 px-6 border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px]"
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'Sample Collected')}
                        >
                          Mark Sample Collected
                        </Button>
                        <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
                          <DialogTrigger asChild>
                            <Button className="rounded-2xl h-11 px-8 bg-indigo-600 shadow-lg shadow-indigo-100 text-white font-bold uppercase tracking-widest text-[10px]">
                              Capture Results
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] rounded-3xl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold text-slate-900">Finalize Diagnostics</DialogTitle>
                              <DialogDescription className="text-slate-500">
                                Record the findings and finalize the diagnostic results for this order.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Findings</Label>
                                <Textarea 
                                  className="rounded-2xl border-slate-200 min-h-[120px] resize-none"
                                  placeholder="Detailed laboratory observations..."
                                  value={findings}
                                  onChange={(e) => setFindings(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Clinical Impression</Label>
                                <Input 
                                  className="rounded-2xl border-slate-200"
                                  placeholder="Primary clinical conclusion"
                                  value={impression}
                                  onChange={(e) => setImpression(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Technician/Radiologist Comments</Label>
                                <Input 
                                  className="rounded-2xl border-slate-200"
                                  placeholder="Internal feedback"
                                  value={radiologistComments}
                                  onChange={(e) => setRadiologistComments(e.target.value)}
                                />
                              </div>
                              <input 
                                type="file" 
                                ref={resultFileInputRef} 
                                className="hidden" 
                                multiple 
                                onChange={handleResultFileChange} 
                              />
                              <div 
                                className="p-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={triggerResultFileInput}
                              >
                                 <Upload className="h-8 w-8 text-slate-300" />
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                   {selectedResultFiles.length > 0 ? `${selectedResultFiles.length} reports selected` : 'Upload PDF/Image Reports'}
                                 </p>
                                 <Button variant="outline" size="sm" className="rounded-xl text-[9px] uppercase tracking-widest font-bold">
                                   {selectedResultFiles.length > 0 ? 'Change Reports' : 'Browse Files'}
                                 </Button>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" className="rounded-xl" onClick={() => setIsResultModalOpen(false)}>Cancel</Button>
                              <Button className="bg-indigo-600 rounded-xl px-8" onClick={handleSaveResults}>Finalize & Sign</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-24 w-24 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                 <FlaskConical className="h-12 w-12 text-indigo-300" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Diagnostic Workspace</h2>
                 <p className="text-slate-400 max-w-sm mx-auto font-medium">Select an order from the list or create a new diagnostic request to begin clinical evaluation.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: Lab history + status timeline */}
      <div className="w-80 flex flex-col gap-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Workflow Tracker</h3>
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6 relative">
             <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-slate-100" />
             {[
               { status: 'Ordered', label: 'Order Placed', time: selectedOrder ? format(new Date(selectedOrder.ordered_at), 'hh:mm a') : '--' },
               { status: 'Sample Collected', label: 'Sample Intake', time: 'Pending' },
               { status: 'Processing', label: 'Lab Processing', time: 'Pending' },
               { status: 'Completed', label: 'Finalized', time: 'Pending' },
             ].map((step, i) => {
               const isDone = selectedOrder && (
                 selectedOrder.status === 'Completed' || 
                 (selectedOrder.status === 'Processing' && i < 3) ||
                 (selectedOrder.status === 'Sample Collected' && i < 2) ||
                 (selectedOrder.status === 'Ordered' && i < 1)
               );
               const isCurrent = selectedOrder?.status === step.status;
               
               return (
                 <div key={i} className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center border-2 transition-all",
                      isDone ? "bg-indigo-600 border-indigo-600" : isCurrent ? "bg-white border-indigo-600 animate-pulse" : "bg-white border-slate-100"
                    )}>
                       {isDone ? <CheckCircle2 className="h-4 w-4 text-white" /> : <div className={cn("h-1.5 w-1.5 rounded-full", isCurrent ? "bg-indigo-600" : "bg-slate-200")} />}
                    </div>
                    <div>
                       <p className={cn("text-xs font-bold", isDone ? "text-slate-900" : isCurrent ? "text-indigo-600" : "text-slate-400")}>{step.label}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{step.time}</p>
                    </div>
                 </div>
               );
             })}
          </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Imaging History</h3>
           <div className="space-y-3">
              {[
                { type: 'MRI Brain', date: 'Oct 24, 2025', result: 'Normal' },
                { type: 'X-Ray Chest', date: 'Aug 12, 2025', result: 'Clear' },
              ].map((h, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group cursor-pointer hover:bg-white hover:border-indigo-100 transition-all">
                   <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">{h.type}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{h.date}</p>
                   </div>
                   <Badge className="bg-white text-emerald-600 border-slate-100 font-bold text-[9px] uppercase tracking-widest px-2">
                      {h.result}
                   </Badge>
                </div>
              ))}
           </div>
           <Button variant="ghost" className="w-full rounded-xl h-10 border-dashed border border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-600 hover:bg-indigo-50">
              <Download className="h-3 w-3 mr-2" /> Export History
           </Button>
        </div>
      </div>
    </div>
  );
};

export default LabsPanel;
