import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HousekeepingTask, TaskStatus, AreaItem } from '../types';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: HousekeepingTask) => void;
  initialData?: HousekeepingTask;
  availableAreas: AreaItem[];
}

export const TaskForm: React.FC<TaskFormProps> = ({ isOpen, onClose, onSave, initialData, availableAreas }) => {
  const [formData, setFormData] = useState<Partial<HousekeepingTask>>({
    date: new Date().toISOString().split('T')[0],
    area: '',
    category: '',
    jobDescription: '',
    assignee: '',
    status: TaskStatus.PENDING,
    remarks: '',
    photoBefore: '',
    photoProgress: '',
    photoAfter: ''
  });

  const groupedAreas = useMemo(() => {
    const groups: { [key: string]: AreaItem[] } = {};
    availableAreas.forEach(a => {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    });
    return groups;
  }, [availableAreas]);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [activePhotoType, setActivePhotoType] = useState<'photoBefore' | 'photoProgress' | 'photoAfter' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setActivePhotoType(null);
  };

  const startCamera = async (type: 'photoBefore' | 'photoProgress' | 'photoAfter') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      setActivePhotoType(type);
      setIsCameraOpen(true);
    } catch (err) {
      alert("Camera access denied.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && activePhotoType) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setFormData(prev => ({ ...prev, [activePhotoType]: canvas.toDataURL('image/jpeg', 0.7) }));
        stopCamera();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.area && formData.jobDescription) {
      onSave({
        id: formData.id || crypto.randomUUID(),
        date: formData.date!,
        area: formData.area!,
        category: formData.category || 'General',
        jobDescription: formData.jobDescription!,
        assignee: formData.assignee!,
        status: formData.status || TaskStatus.PENDING,
        remarks: formData.remarks || '',
        photoBefore: formData.photoBefore,
        photoProgress: formData.photoProgress,
        photoAfter: formData.photoAfter
      });
      onClose();
    }
  };

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        area: availableAreas[0]?.name || '',
        category: availableAreas[0]?.category || '',
        status: TaskStatus.PENDING,
        jobDescription: '', assignee: '', remarks: '', photoBefore: '', photoProgress: '', photoAfter: ''
      });
    }
  }, [initialData, isOpen, availableAreas]);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [isCameraOpen, cameraStream]);

  if (!isOpen) return null;

  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col">
        <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
        <div className="p-8 bg-slate-900 flex justify-between items-center">
          <button onClick={stopCamera} className="text-white font-bold">CANCEL</button>
          <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-8 border-slate-700 bg-white shadow-xl active:scale-95"></button>
          <div className="w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-in fade-in">
      <div className="bg-white rounded-t-[40px] md:rounded-[40px] w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl slide-in-from-bottom duration-300">
        <div className="p-1 text-center md:hidden">
           <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3"></div>
        </div>

        <div className="flex justify-between items-center px-8 py-4 border-b border-slate-50 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-extrabold text-slate-900">{initialData ? 'Update Report' : 'New Report'}</h2>
          <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
              <input type="date" required className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500" value={formData.date} onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
              <select className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500" value={formData.status} onChange={(e) => setFormData(prev => ({...prev, status: e.target.value as TaskStatus}))}>
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location / Area</label>
            <select className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500" value={formData.area} onChange={(e) => setFormData(prev => ({...prev, area: e.target.value, category: availableAreas.find(a => a.name === e.target.value)?.category }))} required>
              {Object.keys(groupedAreas).map(cat => (
                <optgroup label={cat} key={cat}>
                  {groupedAreas[cat].map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Job Description</label>
              <input type="text" placeholder="e.g. Mopping floor" required className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500" value={formData.jobDescription} onChange={(e) => setFormData(prev => ({...prev, jobDescription: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Staff Name</label>
              <input type="text" placeholder="Staff Assignee" required className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500" value={formData.assignee} onChange={(e) => setFormData(prev => ({...prev, assignee: e.target.value}))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['photoBefore', 'photoProgress', 'photoAfter'].map((key) => {
              const url = formData[key as keyof HousekeepingTask] as string;
              const label = key.replace('photo', '').toUpperCase();
              return (
                <div key={key} className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center block">{label}</label>
                  {url ? (
                    <div className="relative group">
                      <img src={url} className="w-full aspect-square object-cover rounded-2xl border-2 border-slate-100" />
                      <button type="button" onClick={() => setFormData(prev => ({...prev, [key]: ''}))} className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-lg">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg>
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => startCamera(key as any)} className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-100 transition-colors">
                      <span className="text-xl">📷</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all">Save Report</button>
            <button type="button" onClick={onClose} className="md:hidden w-full text-slate-400 font-bold py-2">DISMISS</button>
          </div>
        </form>
      </div>
    </div>
  );
};