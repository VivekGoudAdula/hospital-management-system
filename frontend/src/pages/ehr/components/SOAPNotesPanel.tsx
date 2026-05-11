import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Shield, CheckCircle2, Clock, User, Stethoscope,
  Brain, ClipboardList, Loader2, PlusCircle, FileText, PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useEHRStore, useAuthStore, SoapSection } from '@/store';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── Section config ───────────────────────────────────────────────────────────

interface SectionDef {
  key: SoapSection;
  label: string;
  short: string;
  icon: React.ElementType;
  description: string;
  placeholder: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentRing: string;
  accentBadgeBg: string;   // full static Tailwind class for the letter badge
}

const SECTIONS: SectionDef[] = [
  {
    key: 'subjective',
    label: 'Subjective',
    short: 'S',
    icon: User,
    description: 'Patient-reported symptoms, chief complaint, and history',
    placeholder: 'e.g. Patient reports chest pain radiating to the left arm for 2 hours, associated with dizziness and mild shortness of breath...',
    accentBg: 'bg-indigo-50',
    accentBorder: 'border-indigo-200',
    accentText: 'text-indigo-600',
    accentRing: 'focus:ring-indigo-500/20 focus:border-indigo-400',
    accentBadgeBg: 'bg-indigo-500',
  },
  {
    key: 'objective',
    label: 'Objective',
    short: 'O',
    icon: Stethoscope,
    description: 'Clinical observations, vitals, and measurable findings',
    placeholder: 'e.g. BP 142/90 mmHg, HR 98 bpm, Temp 37.4°C. Chest auscultation clear. No crepitus...',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    accentText: 'text-emerald-600',
    accentRing: 'focus:ring-emerald-500/20 focus:border-emerald-400',
    accentBadgeBg: 'bg-emerald-500',
  },
  {
    key: 'assessment',
    label: 'Assessment',
    short: 'A',
    icon: Brain,
    description: 'Clinical impression, differential diagnosis, and conclusions',
    placeholder: 'e.g. Hypertensive urgency with possible cardiac involvement. Differential includes NSTEMI, unstable angina...',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    accentText: 'text-amber-600',
    accentRing: 'focus:ring-amber-500/20 focus:border-amber-400',
    accentBadgeBg: 'bg-amber-500',
  },
  {
    key: 'plan',
    label: 'Plan',
    short: 'P',
    icon: ClipboardList,
    description: 'Treatment plan, medications, follow-up, and orders',
    placeholder: 'e.g. 1. Start Amlodipine 5mg daily\n2. Order ECG and troponin panel\n3. Monitor BP every 2 hours\n4. Follow-up in 5 days...',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-violet-200',
    accentText: 'text-violet-600',
    accentRing: 'focus:ring-violet-500/20 focus:border-violet-400',
    accentBadgeBg: 'bg-violet-500',
  },
];

// ─── Save status type ─────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────

const SOAPNotesPanel: React.FC = () => {
  const { role } = useAuthStore();
  const {
    currentPatient,
    currentVisit,
    soapNote,
    soapLoading,
    fetchSOAP,
    createSOAP,
    saveSOAP,
    signSOAP,
    fetchTimeline,
    setSelectedTab,
  } = useEHRStore();

  // ── Local state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeVoiceSection, setActiveVoiceSection] = useState<SoapSection | null>(null);
  const [showSignConfirm, setShowSignConfirm] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRefs = useRef<Partial<Record<SoapSection, HTMLTextAreaElement | null>>>({});

  const isSigned = soapNote?.status === 'signed';
  const isReadOnly = isSigned && role !== 'Admin';
  const canAccess = role === 'Doctor' || role === 'Admin';

  // ── Fetch SOAP on visit load ───────────────────────────────────────────────
  useEffect(() => {
    if (currentVisit?.id) {
      fetchSOAP(currentVisit.id);
    }
  }, [currentVisit?.id]);

  // ── Sync store → form ─────────────────────────────────────────────────────
  useEffect(() => {
    if (soapNote) {
      setForm({
        subjective: soapNote.subjective ?? '',
        objective: soapNote.objective ?? '',
        assessment: soapNote.assessment ?? '',
        plan: soapNote.plan ?? '',
      });
      setSaveStatus('idle');
      // Clear local backup once server is synced
      if (currentVisit?.id) {
        localStorage.removeItem(`soap_draft_${currentVisit.id}`);
      }
    }
  }, [soapNote?.id, currentVisit?.id]);

  // ── Offline Backup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentVisit?.id && soapNote?.id && !isSigned) {
      localStorage.setItem(`soap_draft_${currentVisit.id}`, JSON.stringify(form));
    }
  }, [form, currentVisit?.id, soapNote?.id, isSigned]);

  // ── Auto-resize textarea helper ───────────────────────────────────────────
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    // Resize all textareas after form syncs from store
    SECTIONS.forEach((s) => autoResize(textareaRefs.current[s.key] ?? null));
  }, [soapNote?.id]);

  // ── Debounced autosave ────────────────────────────────────────────────────
  const triggerAutosave = useCallback(
    (updatedForm: typeof form) => {
      if (!soapNote?.id || isReadOnly) return;

      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      setSaveStatus('unsaved');

      autosaveTimer.current = setTimeout(async () => {
        setSaveStatus('saving');
        const result = await saveSOAP(soapNote.id, updatedForm);
        setSaveStatus(result ? 'saved' : 'error');

        // Reset to idle after 4 s
        setTimeout(() => setSaveStatus('idle'), 4000);
      }, 2000);
    },
    [soapNote?.id, isReadOnly, saveSOAP]
  );

  // ── Handle field change ───────────────────────────────────────────────────
  const handleFieldChange = (key: SoapSection, value: string) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    triggerAutosave(updated);
  };

  // ── Voice dictation ───────────────────────────────────────────────────────
  const toggleVoice = (section: SoapSection) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice dictation is not supported in this browser');
      return;
    }

    // Toggle off if same section
    if (activeVoiceSection === section) {
      recognitionRef.current?.stop();
      setActiveVoiceSection(null);
      return;
    }

    // Stop any running recognition
    recognitionRef.current?.stop();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' ';
        }
      }
      if (finalText) {
        setForm((prev) => {
          const updated = { ...prev, [section]: (prev[section] || '') + finalText };
          triggerAutosave(updated);
          return updated;
        });
        autoResize(textareaRefs.current[section] ?? null);
      }
    };

    recognition.onerror = () => {
      setActiveVoiceSection(null);
      toast.error('Voice recognition error. Please try again.');
    };

    recognition.onend = () => setActiveVoiceSection(null);

    recognitionRef.current = recognition;
    recognition.start();
    setActiveVoiceSection(section);
    toast.success(`Listening for ${section}...`);
  };

  // ── Create new note ───────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!currentVisit || !currentPatient) return;
    setIsCreating(true);
    const note = await createSOAP({
      patient_id: currentPatient.id,
      visit_id: currentVisit.id,
    });
    setIsCreating(false);
    if (note) {
      toast.success('SOAP note created — start documenting');
    } else {
      toast.error('Failed to create SOAP note');
    }
  };

  // ── Sign note ─────────────────────────────────────────────────────────────
  const handleSign = async () => {
    if (!soapNote?.id) return;
    setIsSigning(true);
    try {
      await signSOAP(soapNote.id);
      setShowSignConfirm(false);
      toast.success('SOAP note digitally signed and finalized');
      if (currentPatient) fetchTimeline(currentPatient.id);
    } catch {
      toast.error('Failed to sign note. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  // ── Save status indicator ─────────────────────────────────────────────────
  const SaveIndicator = () => {
    if (saveStatus === 'idle') return null;
    const map: Record<SaveStatus, { label: string; cls: string }> = {
      idle: { label: '', cls: '' },
      unsaved: { label: 'Unsaved changes', cls: 'text-slate-400' },
      saving: { label: 'Saving...', cls: 'text-indigo-500' },
      saved: { label: 'Saved just now', cls: 'text-emerald-500' },
      error: { label: 'Save failed', cls: 'text-rose-500' },
    };
    const { label, cls } = map[saveStatus];
    return (
      <span className={cn('flex items-center gap-1.5 text-[11px] font-bold tracking-wide', cls)}>
        {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
        {saveStatus === 'saving' && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />}
        {saveStatus === 'saved' && <CheckCircle2 className="h-3 w-3" />}
        {label}
      </span>
    );
  };

  // ── Role guard ────────────────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
        <Shield className="h-12 w-12 text-slate-200" />
        <p className="text-slate-400 font-medium">SOAP Notes are restricted to Doctors and Admins.</p>
      </div>
    );
  }

  // ── Skeleton loader ───────────────────────────────────────────────────────
  if (soapLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-100 rounded-2xl" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-8 w-48 bg-slate-100 rounded-xl" />
            <div className="h-32 bg-slate-100 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!soapNote) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-[55vh] gap-6 text-center"
      >
        <div className="h-24 w-24 rounded-[2rem] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center shadow-xl shadow-indigo-100">
          <FileText className="h-10 w-10 text-indigo-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
            Start your first clinical note
          </h3>
          <p className="text-slate-400 max-w-sm font-medium">
            No SOAP note exists for this visit yet. Create one to begin structured clinical documentation.
          </p>
        </div>
        <Button
          id="create-soap-note-btn"
          onClick={handleCreate}
          disabled={isCreating}
          className="rounded-2xl h-13 px-8 bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4 mr-2" />
          )}
          {isCreating ? 'Creating Note...' : 'Create SOAP Note'}
        </Button>
      </motion.div>
    );
  }

  // ── Main editor ───────────────────────────────────────────────────────────
  return (
    <motion.div
      key="soap-editor"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-0"
    >
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border border-slate-100 rounded-2xl mb-6 px-6 py-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-indigo-600" />
            <span className="text-base font-bold text-slate-900">SOAP Notes</span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Visit #{currentVisit?.id?.slice(-6).toUpperCase()}
          </span>
          <SaveIndicator />
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          {isSigned ? (
            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> Signed
            </Badge>
          ) : (
            <Badge className="bg-amber-50 text-amber-600 border border-amber-200 rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest gap-1.5">
              <Clock className="h-3 w-3" /> Draft
            </Badge>
          )}

          {/* Finalize button — only for non-signed notes */}
          {!isSigned && (
            <Button
              id="finalize-sign-btn"
              onClick={() => setShowSignConfirm(true)}
              className="rounded-xl h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest shadow-md shadow-emerald-100 transition-all"
            >
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Finalize & Sign
            </Button>
          )}
        </div>
      </div>

      {/* ── Signed banner ── */}
      <AnimatePresence>
        {isSigned && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 px-5 py-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-700">
                This note has been digitally signed and finalized
              </p>
              {soapNote.signed_at && (
                <p className="text-[11px] text-emerald-500 font-medium">
                  Signed on {format(new Date(soapNote.signed_at), 'MMM dd, yyyy · hh:mm a')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SOAP Sections ── */}
      <div className="space-y-5">
        {SECTIONS.map((section, index) => {
          const Icon = section.icon;
          const isListening = activeVoiceSection === section.key;

          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={cn(
                'rounded-2xl border-2 overflow-hidden transition-all',
                section.accentBorder
              )}
            >
              {/* Section header */}
              <div className={cn('px-6 py-4 flex items-center justify-between', section.accentBg)}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md',
                    section.accentBadgeBg
                  )}>
                    {section.short}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', section.accentText)} />
                      <span className={cn('text-sm font-bold', section.accentText)}>
                        {section.label}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Voice button */}
                {!isReadOnly && (
                  <button
                    id={`voice-btn-${section.key}`}
                    onClick={() => toggleVoice(section.key)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all',
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200'
                        : `${section.accentText} bg-white border border-slate-200 hover:border-${section.accent}-300`
                    )}
                  >
                    {isListening ? (
                      <MicOff className="h-3 w-3" />
                    ) : (
                      <Mic className="h-3 w-3" />
                    )}
                    {isListening ? 'Stop' : 'Dictate'}
                  </button>
                )}

                {section.key === 'assessment' && form.assessment.length > 3 && !isReadOnly && (
                  <button
                    onClick={() => setSelectedTab('Diagnoses')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-amber-500 text-white shadow-lg shadow-amber-200 ml-2"
                  >
                    <Stethoscope className="h-3 w-3" />
                    Convert to Diagnosis
                  </button>
                )}
              </div>

              {/* Textarea */}
              <div className="bg-white px-6 py-4">
                <textarea
                  id={`soap-${section.key}`}
                  ref={(el) => { textareaRefs.current[section.key] = el; }}
                  value={form[section.key]}
                  onChange={(e) => {
                    handleFieldChange(section.key, e.target.value);
                    autoResize(e.target);
                  }}
                  onFocus={(e) => autoResize(e.target)}
                  readOnly={isReadOnly}
                  placeholder={isReadOnly ? '' : section.placeholder}
                  rows={4}
                  className={cn(
                    'w-full resize-none bg-transparent text-sm font-medium text-slate-700',
                    'placeholder:text-slate-300 placeholder:font-normal',
                    'border-0 outline-none focus:ring-0 p-0',
                    'leading-relaxed transition-all min-h-[100px]',
                    isReadOnly && 'cursor-default text-slate-600',
                    !isReadOnly && 'hover:placeholder:text-slate-400'
                  )}
                  style={{ overflow: 'hidden' }}
                />
                {/* Character count */}
                {!isReadOnly && form[section.key].length > 0 && (
                  <p className="text-right text-[9px] font-bold text-slate-300 mt-2 uppercase tracking-widest">
                    {form[section.key].length} chars
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Last updated footer */}
      {soapNote.updated_at && (
        <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-6">
          Last updated · {format(new Date(soapNote.updated_at), 'MMM dd, yyyy · hh:mm a')}
        </p>
      )}

      {/* ── Sign confirmation dialog ── */}
      <AnimatePresence>
        {showSignConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Finalize & Sign Note</h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    This action cannot be undone by non-admin users.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-sm font-medium text-amber-700">
                  Signing this note will lock it and mark it as an official clinical record attached to this visit.
                  Only an Admin can edit it after signing.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl h-11 border-slate-200 font-bold text-xs uppercase tracking-widest"
                  onClick={() => setShowSignConfirm(false)}
                  disabled={isSigning}
                >
                  Cancel
                </Button>
                <Button
                  id="confirm-sign-btn"
                  onClick={handleSign}
                  disabled={isSigning}
                  className="flex-1 rounded-2xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-100"
                >
                  {isSigning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirm & Sign
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SOAPNotesPanel;
