import React, { useState, useEffect } from 'react';
import { StickyNote, CheckSquare, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { User } from '../../types';

interface DailyQuickNotesProps {
  currentUser?: User;
}

interface QuickTodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export const DailyQuickNotes: React.FC<DailyQuickNotesProps> = ({ currentUser }) => {
  const storageKey = `taxcore_workbench_notes_${currentUser?.id || 'guest'}`;
  
  const [note, setNote] = useState<string>(() => {
    return localStorage.getItem(`${storageKey}_text`) || '';
  });

  const [todos, setTodos] = useState<QuickTodoItem[]>(() => {
    const saved = localStorage.getItem(`${storageKey}_todos`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { id: '1', text: 'Đối chiếu hóa đơn đầu vào 5 công ty phụ trách', completed: true },
      { id: '2', text: 'Nhắc khách hàng nộp tờ khai GTGT T7 trước ngày 20', completed: false },
      { id: '3', text: 'Kiểm tra gia hạn Token CKS cho công ty Minh Anh', completed: false },
    ];
  });

  const [newTodoText, setNewTodoText] = useState('');

  useEffect(() => {
    localStorage.setItem(`${storageKey}_text`, note);
  }, [note, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_todos`, JSON.stringify(todos));
  }, [todos, storageKey]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newItem: QuickTodoItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
    };
    setTodos([...todos, newItem]);
    setNewTodoText('');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <StickyNote className="h-4 w-4 text-amber-500" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Ghi Chú Nhanh Bàn Làm Việc
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Lưu tự động</span>
      </div>

      {/* Quick Checklist */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Mục tiêu hôm nay ({todos.filter(t => t.completed).length}/{todos.length})
        </div>

        <form onSubmit={handleAddTodo} className="flex gap-2">
          <input
            type="text"
            placeholder="Thêm mục tiêu cá nhân..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newTodoText.trim()}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>

        <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar pt-1">
          {todos.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs group"
            >
              <button
                type="button"
                onClick={() => handleToggleTodo(item.id)}
                className="flex items-center space-x-2 text-left flex-1 min-w-0 cursor-pointer"
              >
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <span className={`truncate ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {item.text}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteTodo(item.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Freeform Note */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Nhật ký tác nghiệp / Số hotline cần gọi
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Viết ghi chú ngắn cho ca làm việc hôm nay..."
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>
    </div>
  );
};
