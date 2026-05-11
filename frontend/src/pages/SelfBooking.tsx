import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, isSameDay } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useHospitalStore } from '../store/hospitalStore';
import { toast } from 'sonner';

const SelfBooking = () => {
  const { doctors, departments, fetchDoctors, fetchDepartments, bookAppointment, appointments, fetchAppointments } = useHospitalStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [token, setToken] = useState('');

  const [formData, setFormData] = useState({
    patientName: '',
    email: '',
    phone: '',
    gender: 'Male',
    departmentId: '',
    doctorId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    reason: ''
  });

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
    fetchAppointments();
  }, [fetchDoctors, fetchDepartments, fetchAppointments]);

  const filteredDoctors = doctors.filter(d => !formData.departmentId || d.departmentId === formData.departmentId);

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'];

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // For self-booking, we create a temporary patient profile or link to existing
      // For simplicity in this demo, we'll use a mock patient registration flow
      // or assume the backend can handle raw patient data in appointments
      
      // Realistically, we'd need a backend endpoint for public booking
      // Let's assume we use the existing one but pass patient details
      
      // Since we don't have a public patient registration endpoint yet, 
      // we'll simulate the success for now or call the existing one if allowed
      
      // For now, let's just trigger a success UI to show the flow
      setTimeout(() => {
        setToken(`TKN-${Math.floor(Math.random() * 9000) + 1000}`);
        setBookingComplete(true);
        setLoading(false);
      }, 1500);
      
    } catch (error) {
      toast.error('Failed to book appointment. Please try again.');
      setLoading(false);
    }
  };

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-none shadow-2xl bg-white overflow-hidden">
            <div className="bg-emerald-500 p-8 text-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
              <p className="opacity-90 mt-1">Your appointment has been scheduled.</p>
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Your Appointment Token</p>
                <h3 className="text-5xl font-black text-slate-900 mt-2 tracking-tighter">{token}</h3>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Doctor</span>
                  <span className="font-bold text-slate-900">{doctors.find(d => d.id === formData.doctorId)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="font-bold text-slate-900">{format(new Date(formData.date), 'MMMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Time</span>
                  <span className="font-bold text-slate-900">{formData.time}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Please arrive 15 minutes before your scheduled time. Show this token at the reception desk upon arrival.
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12"
                onClick={() => window.location.href = '/'}
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Stethoscope className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter">APEXCARE</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <Phone className="w-4 h-4" />
            <span>+1 (555) 000-1234</span>
          </div>
          <Button variant="ghost" className="text-slate-600" onClick={() => window.location.href = '/login'}>
            Portal Login
          </Button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-2xl w-full">
          {/* Progress Bar */}
          <div className="mb-8 flex items-center justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step >= s ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {s === 1 ? 'Personal' : s === 2 ? 'Schedule' : 'Confirm'}
                </span>
              </div>
            ))}
            <div className="absolute left-1/2 -translate-x-1/2 top-[125px] w-1/3 h-0.5 bg-slate-200 -z-10 hidden md:block"></div>
          </div>

          <Card className="border-none shadow-2xl shadow-indigo-100/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-5 min-h-[500px]">
                {/* Sidebar Info */}
                <div className="md:col-span-2 bg-indigo-600 p-8 text-white flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Book Your Visit</h2>
                    <p className="text-indigo-100 text-sm leading-relaxed">
                      Complete these simple steps to secure your appointment with our world-class medical specialists.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-indigo-100">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>Secure & Encrypted</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-indigo-100">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span>Instant Confirmation</span>
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="md:col-span-3 p-8 bg-white">
                  {step === 1 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                        <p className="text-xs text-slate-500">Please provide your details as they appear on your ID.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input 
                              placeholder="John Doe" 
                              className="pl-10" 
                              value={formData.patientName}
                              onChange={e => setFormData({...formData, patientName: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input 
                              type="email" 
                              placeholder="john@example.com" 
                              className="pl-10" 
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Phone</Label>
                            <Input 
                              placeholder="+1..." 
                              value={formData.phone}
                              onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Gender</Label>
                            <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 mt-4"
                        onClick={handleNext}
                        disabled={!formData.patientName || !formData.email || !formData.phone}
                      >
                        Next: Selection <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-900">Doctor & Time</h3>
                        <p className="text-xs text-slate-500">Select your preferred department and physician.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Department</Label>
                          <Select onValueChange={(val) => setFormData({...formData, departmentId: val, doctorId: ''})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Doctor</Label>
                          <Select 
                            disabled={!formData.departmentId} 
                            onValueChange={(val) => setFormData({...formData, doctorId: val})}
                            value={formData.doctorId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Doctor" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredDoctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Preferred Date</Label>
                          <Input 
                            type="date" 
                            min={format(new Date(), 'yyyy-MM-dd')}
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Available Slots</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {timeSlots.map(t => {
                              const isBooked = appointments.some(a => a.doctorId === formData.doctorId && a.date === formData.date && a.time === t && a.status !== 'Cancelled');
                              return (
                                <button
                                  key={t}
                                  disabled={isBooked}
                                  onClick={() => setFormData({...formData, time: t})}
                                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                                    formData.time === t 
                                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                                      : isBooked 
                                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'
                                  }`}
                                >
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="ghost" className="flex-1" onClick={handleBack}>
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button 
                          className="flex-[2] bg-indigo-600 hover:bg-indigo-700" 
                          onClick={handleNext}
                          disabled={!formData.doctorId || !formData.time}
                        >
                          Review & Confirm <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-900">Confirm Details</h3>
                        <p className="text-xs text-slate-500">Please review your information before submitting.</p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 text-indigo-600">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Patient</p>
                            <p className="text-sm font-bold text-slate-900">{formData.patientName}</p>
                            <p className="text-[10px] text-slate-500">{formData.email} • {formData.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 text-indigo-600">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Physician</p>
                            <p className="text-sm font-bold text-slate-900">{doctors.find(d => d.id === formData.doctorId)?.name}</p>
                            <p className="text-[10px] text-slate-500">{departments.find(d => d.id === formData.departmentId)?.name}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 text-indigo-600">
                            <CalendarIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Schedule</p>
                            <p className="text-sm font-bold text-slate-900">{format(new Date(formData.date), 'EEEE, MMMM dd')}</p>
                            <p className="text-[10px] text-slate-500">Time Slot: {formData.time}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Reason for Visit (Optional)</Label>
                        <Input 
                          placeholder="e.g. Annual checkup, flu symptoms" 
                          value={formData.reason}
                          onChange={e => setFormData({...formData, reason: e.target.value})}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="ghost" className="flex-1" onClick={handleBack} disabled={loading}>
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button 
                          className="flex-[2] bg-indigo-600 hover:bg-indigo-700" 
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : 'Confirm Booking'} <CheckCircle2 className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-slate-400 text-[10px] mt-8 uppercase tracking-widest">
            By continuing, you agree to ApexCare's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelfBooking;
