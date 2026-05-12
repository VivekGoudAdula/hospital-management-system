import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  User,
  Building2,
  Calendar,
  ExternalLink,
  MoreVertical,
  Mail,
  Phone,
  FileText,
  MapPin,
  ArrowRight
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
import { Trash2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

const ReferralPanel = () => {
  const { currentPatient, currentVisit, referrals, referralsLoading, fetchReferrals, createReferral, updateReferral } = useEHRStore();
  const { user } = useAuthStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'Routine' | 'Urgent' | 'Emergency'>('Routine');
  const [externalHospital, setExternalHospital] = useState('');
  const [referredDoctor, setReferredDoctor] = useState('');

  useEffect(() => {
    if (currentPatient?.id) {
      fetchReferrals(currentPatient.id);
    }
  }, [currentPatient?.id]);

  const handleCreateReferral = async () => {
    if (!currentPatient || !currentVisit) return;
    try {
      await createReferral({
        patient_id: currentPatient.id,
        visit_id: currentVisit.id,
        reason,
        notes,
        priority,
        external_hospital: externalHospital,
        status: 'Sent'
      });
      toast.success('Referral created successfully');
      setIsCreateModalOpen(false);
      // Reset form
      setReason('');
      setNotes('');
      setExternalHospital('');
    } catch (error) {
      toast.error('Failed to create referral');
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Emergency': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'Urgent': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    }
  };

  const filteredReferrals = referrals.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Referral Management</h2>
          <p className="text-sm text-slate-500 font-medium">Care coordination and external transfers</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 rounded-xl border-slate-200">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Referrals</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="In Review">In Review</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100 h-11 px-6 text-xs font-bold uppercase tracking-widest">
                <Plus className="h-4 w-4 mr-2" /> Create Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                   <Share2 className="h-6 w-6 text-indigo-600" />
                   New Clinical Referral
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Provide details for transferring or referring this patient to another specialist or facility.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Priority</Label>
                    <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Routine">Routine</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">External Hospital (Optional)</Label>
                    <Input 
                      placeholder="e.g. City General" 
                      className="rounded-xl border-slate-200"
                      value={externalHospital}
                      onChange={(e) => setExternalHospital(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Referred Reason / Specialty</Label>
                  <Input 
                    placeholder="e.g. Cardiology Consultation" 
                    className="rounded-xl border-slate-200"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Clinical Notes</Label>
                  <Textarea 
                    placeholder="Detailed medical justification for referral..." 
                    className="rounded-xl border-slate-200 min-h-[120px] resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button className="bg-indigo-600 rounded-xl px-8 shadow-lg shadow-indigo-100" onClick={handleCreateReferral}>Send Referral</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {referralsLoading ? (
          <div className="py-24 text-center">
            <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading referrral workflow...</p>
          </div>
        ) : filteredReferrals.length === 0 ? (
          <Card className="rounded-[2rem] border-dashed border-slate-200 bg-slate-50/50 py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center">
              <Share2 className="h-10 w-10 text-slate-200" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No referrals found</h3>
              <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">Patient has no active referrals in the selected category.</p>
            </div>
          </Card>
        ) : (
          filteredReferrals.map((referral) => (
            <motion.div
              key={referral.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className={cn("w-2", 
                      referral.priority === 'Emergency' ? 'bg-rose-500' :
                      referral.priority === 'Urgent' ? 'bg-amber-500' :
                      'bg-indigo-500'
                    )} />
                    <div className="flex-1 p-8">
                       <div className="flex items-start justify-between">
                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border", getPriorityColor(referral.priority))}>
                                   {referral.priority}
                                </Badge>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                   REF #{referral.id.slice(-8)} • {format(new Date(referral.created_at), 'MMM dd, yyyy')}
                                </span>
                             </div>
                             <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                {referral.reason}
                                {referral.external_hospital && (
                                   <Badge className="bg-indigo-50 text-indigo-600 border-none rounded-lg text-[9px] px-2 py-0.5">
                                      <Building2 className="h-3 w-3 mr-1 inline" /> {referral.external_hospital}
                                   </Badge>
                                )}
                             </h3>
                             
                             <div className="flex items-center gap-10">
                                <div className="space-y-1">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status</p>
                                   <div className="flex items-center gap-1.5">
                                      <div className={cn("h-2 w-2 rounded-full", 
                                        referral.status === 'Completed' ? 'bg-emerald-500' :
                                        referral.status === 'Sent' ? 'bg-indigo-500 animate-pulse' :
                                        'bg-amber-500'
                                      )} />
                                      <p className="text-sm font-bold text-slate-700">{referral.status}</p>
                                   </div>
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Referring Doctor</p>
                                   <p className="text-sm font-bold text-slate-700">Dr. Clinical Lead</p>
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Target Unit</p>
                                   <p className="text-sm font-bold text-indigo-600">Cardiology Dept</p>
                                </div>
                             </div>
                          </div>

                           <div className="flex gap-2">
                             <Button variant="outline" size="icon" className="rounded-xl border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => toast.success('Referral email sent')}>
                                <Mail className="h-4 w-4" />
                             </Button>
                             <Button variant="outline" size="icon" className="rounded-xl border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => toast.info('Initiating call...')}>
                                <Phone className="h-4 w-4" />
                             </Button>
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="outline" size="icon" className="rounded-xl border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                   <MoreVertical className="h-4 w-4" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                                 <DropdownMenuItem className="gap-2 font-bold text-xs uppercase tracking-widest cursor-pointer" onClick={() => toast.info('Exporting referral document...')}>
                                   <Download className="h-3.5 w-3.5 text-indigo-500" /> Export PDF
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="gap-2 font-bold text-xs uppercase tracking-widest cursor-pointer" onClick={() => toast.info('Viewing clinical details...')}>
                                   <Eye className="h-3.5 w-3.5 text-emerald-500" /> View Case
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem className="gap-2 font-bold text-xs uppercase tracking-widest text-rose-600 cursor-pointer" onClick={() => toast.error('Cancellation restricted')}>
                                   <Trash2 className="h-3.5 w-3.5" /> Cancel Referral
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </div>
                       </div>

                       <div className="mt-8 p-6 rounded-3xl bg-slate-50 border border-slate-100 relative group-hover:bg-white group-hover:border-indigo-100 transition-all">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                             <FileText className="h-3 w-3" /> Referral Justification
                          </p>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                             "{referral.notes || 'No clinical notes provided.'}"
                          </p>
                          <Button 
                            className="absolute bottom-6 right-6 rounded-xl bg-white border border-slate-200 text-indigo-600 font-bold text-[9px] uppercase tracking-widest h-8 px-4 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm"
                          >
                             View Case Details <ArrowRight className="h-3 w-3 ml-2" />
                          </Button>
                       </div>
                    </div>
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

export default ReferralPanel;
