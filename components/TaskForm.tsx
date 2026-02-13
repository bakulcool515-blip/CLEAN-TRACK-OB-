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

  // Group areas for dropdown
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
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please check permissions.");
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, [activePhotoType]: dataUrl }));
        stopCamera();
      }
    }
  };

  const removePhoto = (type: 'photoBefore' | 'photoProgress' | 'photoAfter') => {
    setFormData(prev => ({ ...prev, [type]: '' }));
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAreaName = e.target.value;
    const areaItem = availableAreas.find(a => a.name === selectedAreaName);
    setFormData(prev => ({
      ...prev,
      area: selectedAreaName,
      category: areaItem ? areaItem.category : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.area && formData.jobDescription && formData.assignee) {
      let finalCategory = formData.category;
      if (!finalCategory) {
          const areaItem = availableAreas.find(a => a.name === formData.area);
          finalCategory = areaItem ? areaItem.category : 'General';
      }

      onSave({
        id: formData.id || crypto.randomUUID(),
        date: formData.date!,
        area: formData.area!,
        category: finalCategory,
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
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
         date: new Date().toISOString().split('T')[0],
         area: availableAreas.length > 0 ? availableAreas[0].name : '',
         category: availableAreas.length > 0 ? availableAreas[0].category : '',
         jobDescription: '',
         assignee: '',
         status: TaskStatus.PENDING,
         remarks: '',
         photoBefore: '',
         photoProgress: '',
         photoAfter: ''
      });
    }
    return () => {
      stopCamera();
    };
  }, [initialData, isOpen, availableAreas]);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  if (!isOpen) return null;

  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center">
        <div className="relative w-full h-full max-w-lg bg-black flex flex-col">
          <div className="absolute top-4 left-0 right-0 text-center text-white z-10">
            <span className="bg-black/50 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-widest border border-white/20">
              Capturing {activePhotoType?.replace('photo', '').toUpperCase()}
            </span>
          </div>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="flex-1 w-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
            <button 
              type="button" 
              onClick={stopCamera} 
              className="text-white font-medium px-4 py-2"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={capturePhoto} 
              className="w-20 h-20 rounded-full bg-white border-8 border-gray-600 shadow-lg active:scale-95 transition-transform"
            ></button>
            <div className="w-16"></div> 
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {initialData ? 'Edit Task' : 'New Housekeeping Task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
              <input 
                type="date" 
                required
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <select 
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({...prev, status: e.target.value as TaskStatus}))}
              >
                {Object.values(TaskStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location / Area</label>
            <select 
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={formData.area}
              onChange={handleAreaChange}
              required
            >
              <option value="" disabled>Select Area</option>
              {Object.keys(groupedAreas).sort().map(category => (
                <optgroup label={category} key={category}>
                  {groupedAreas[category].map(area => (
                    <option key={area.name} value={area.name}>{area.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Job Description</label>
              <input 
                type="text" 
                placeholder="e.g. Mopping floor"
                required
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.jobDescription}
                onChange={(e) => setFormData(prev => ({...prev, jobDescription: e.target.value}))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Assignee Staff</label>
              <input 
                type="text" 
                placeholder="Staff Name"
                required
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.assignee}
                onChange={(e) => setFormData(prev => ({...prev, assignee: e.target.value}))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Before Photo */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">BEFORE</label>
              {formData.photoBefore ? (
                <div className="relative">
                  <img src={formData.photoBefore} alt="Before" className="w-full h-24 object-cover rounded-md border" />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button type="button" onClick={() => startCamera('photoBefore')} className="bg-blue-600 text-white p-1 rounded-full shadow-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                    <button type="button" onClick={() => removePhoto('photoBefore')} className="bg-red-600 text-white p-1 rounded-full shadow-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={() => startCamera('photoBefore')}
                  className="w-full border-2 border-dashed border-gray-300 rounded-md h-24 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-blue-300 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[9px] font-bold">BEFORE</span>
                </button>
              )}
            </div>

            {/* Progress Photo */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">PROGRESS</label>
              {formData.photoProgress ? (
                <div className="relative">
                  <img src={formData.photoProgress} alt="Progress" className="w-full h-24 object-cover rounded-md border border-blue-200" />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button type="button" onClick={() => startCamera('photoProgress')} className="bg-blue-600 text-white p-1 rounded-full shadow-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                    <button type="button" onClick={() => removePhoto('photoProgress')} className="bg-red-600 text-white p-1 rounded-full shadow-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={() => startCamera('photoProgress')}
                  className="w-full border-2 border-dashed border-blue-200 bg-blue-50/20 rounded-md h-24 flex flex-col items-center justify-center text-blue-400 hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[9px] font-bold">PROGRESS</span>
                </button>
              )}
            </div>

            {/* After Photo */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">AFTER</label>
              {formData.photoAfter ? (
                <div className="relative">
                  <img src={formData.photoAfter} alt="After" className="w-full h-24 object-cover rounded-md border" />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button type="button" onClick={() => startCamera('photoAfter')} className="bg-blue-600 text-white p-1 rounded-full shadow-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                    <button type="button" onClick={() => removePhoto('photoAfter')} className="bg-red-600 text-white p-1 rounded-full shadow-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={() => startCamera('photoAfter')}
                  className="w-full border-2 border-dashed border-gray-300 rounded-md h-24 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-blue-300 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[9px] font-bold">AFTER</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Remarks</label>
            <textarea 
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({...prev, remarks: e.target.value}))}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm text-sm font-bold"
            >
              Save Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};