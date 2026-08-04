import React from 'react';
import { Check, X, Edit3 } from 'lucide-react';

interface CategoryEditProps {
    categoryName: string;
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onNameChange: (name: string) => void;
    editingName: string;
}

const CategoryEdit: React.FC<CategoryEditProps> = ({
    categoryName,
    isEditing,
    isSaving,
    onEdit,
    onSave,
    onCancel,
    onNameChange,
    editingName
}) => {
    if (isEditing) {
        return (
            <div className="flex gap-1 items-center bg-white rounded-xl border-2 border-indigo-400 p-1 shadow-sm animate-slide-up">
                <input
                    type="text"
                    value={editingName}
                    onChange={e => onNameChange(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') onSave();
                        if (e.key === 'Escape') onCancel();
                    }}
                    className="text-xs px-2 py-1.5 rounded-lg bg-transparent outline-none w-28 font-bold text-slate-900"
                    autoFocus
                    disabled={isSaving}
                />
                <button onClick={onSave} disabled={isSaving} className="p-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60">
                    <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={onCancel} disabled={isSaving} className="p-1 text-slate-400 hover:text-red-500 rounded-md">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="group/pill relative flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
            {categoryName}
            <button
                onClick={onEdit}
                className={`p-0.5 rounded transition-opacity opacity-0 group-hover/pill:opacity-70 hover:bg-slate-200`}
                title="Namakan semula kategori"
            >
                <Edit3 className="w-3 h-3" />
            </button>
        </div>
    );
};

export default CategoryEdit;
