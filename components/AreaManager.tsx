import React, { useState } from 'react';
import { AreaItem } from '../types';

interface AreaManagerProps {
  isOpen: boolean;
  onClose: () => void;
  areas: AreaItem[];
  onAdd: (area: AreaItem) => void;
  onDelete: (name: string) => void;
  onEdit: (oldName: string, newArea: AreaItem) => void;
  onEditCategory: (oldCategory: string, newCategory: string) => void;
  onDeleteCategory: (category: string) => void;
}

export const AreaManager: React.FC<AreaManagerProps> = ({ 
  isOpen, 
  onClose, 
  areas, 
  onAdd, 
  onDelete, 
  onEdit,
  onEditCategory,
  onDeleteCategory
}) => {
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  
  // Area Editing State
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editCategoryValue, setEditCategoryValue] = useState('');

  // Category Editing State
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryNameValue, setEditCategoryNameValue] = useState('');

  // Get unique categories for suggestions
  const existingCategories = Array.from(new Set(areas.map(a => a.category)));

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newName.trim() && newCategory.trim()) {
      onAdd({ name: newName.trim(), category: newCategory.trim() });
      setNewName('');
      // Keep category populated for easier bulk entry
    }
  };

  const startEdit = (area: AreaItem) => {
    setEditingName(area.name);
    setEditNameValue(area.name);
    setEditCategoryValue(area.category);
  };

  const cancelEdit = () => {
    setEditingName(null);
    setEditNameValue('');
    setEditCategoryValue('');
  };

  const saveEdit = () => {
    if (editingName && editNameValue.trim() && editCategoryValue.trim()) {
      onEdit(editingName, { name: editNameValue.trim(), category: editCategoryValue.trim() });
    }
    setEditingName(null);
  };

  const startEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditCategoryNameValue(category);
  };

  const saveEditCategory = () => {
    if (editingCategory && editCategoryNameValue.trim() && editCategoryNameValue.trim() !== editingCategory) {
      onEditCategory(editingCategory, editCategoryNameValue.trim());
    }
    setEditingCategory(null);
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryNameValue('');
  };

  // Group areas for display
  const groupedAreas: { [key: string]: AreaItem[] } = {};
  areas.forEach(area => {
    if (!groupedAreas[area.category]) groupedAreas[area.category] = [];
    groupedAreas[area.category].push(area);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Manage Categories & Locations</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Add Section */}
        <div className="p-6 bg-gray-50 border-b flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Area</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category (e.g. Indoor)"
                list="category-suggestions"
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="category-suggestions">
                {existingCategories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Area Name (e.g. Lobby)"
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newCategory.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        {/* List Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.keys(groupedAreas).length === 0 ? (
            <p className="text-center text-gray-400 italic mt-10">No areas defined. Add one above.</p>
          ) : (
            Object.keys(groupedAreas).sort().map(category => (
              <div key={category} className="mb-6">
                <div className="flex items-center justify-between mb-2 border-b pb-1">
                  {editingCategory === category ? (
                    <div className="flex items-center gap-2 flex-1">
                       <input 
                          type="text"
                          value={editCategoryNameValue}
                          onChange={(e) => setEditCategoryNameValue(e.target.value)}
                          className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm font-bold uppercase tracking-wider outline-none text-gray-600"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditCategory();
                            if (e.key === 'Escape') cancelEditCategory();
                          }}
                       />
                       <button onClick={saveEditCategory} className="text-green-600 hover:bg-green-100 p-1 rounded">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                       </button>
                       <button onClick={cancelEditCategory} className="text-red-500 hover:bg-red-100 p-1 rounded">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                       </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{category}</h3>
                      <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditCategory(category)} className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded" title="Rename Category">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => onDeleteCategory(category)} className="p-1 hover:text-red-600 hover:bg-red-50 rounded" title="Delete Entire Category">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {groupedAreas[category].map((area, index) => (
                    <div key={`${category}-${area.name}`} className="flex justify-between items-center p-3 bg-white border rounded-md hover:shadow-sm transition-shadow">
                      {editingName === area.name ? (
                        <div className="flex flex-col md:flex-row gap-2 w-full">
                           <input 
                            type="text" 
                            value={editCategoryValue} 
                            onChange={(e) => setEditCategoryValue(e.target.value)}
                            className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm outline-none"
                            placeholder="Category"
                            list="category-suggestions"
                          />
                          <input 
                            type="text" 
                            value={editNameValue} 
                            onChange={(e) => setEditNameValue(e.target.value)}
                            className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm outline-none"
                            placeholder="Area Name"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <div className="flex gap-1 shrink-0">
                            <button onClick={saveEdit} className="text-green-600 hover:bg-green-100 p-1 rounded">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </button>
                            <button onClick={cancelEdit} className="text-red-500 hover:bg-red-100 p-1 rounded">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                             <span className="text-gray-800 font-medium">{area.name}</span>
                          </div>
                          <div className="flex gap-1 items-center opacity-60 hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(area)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit Area"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => onDelete(area.name)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete Area"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};