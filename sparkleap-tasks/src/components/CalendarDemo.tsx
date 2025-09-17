'use client';

import { useMemo } from 'react';
import type { Task } from '../types/task';

interface CalendarDemoProps {
  tasks: Task[];
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export default function CalendarDemo({ tasks }: CalendarDemoProps) {
  const today = new Date();
  const first = startOfMonth(today);
  const last = endOfMonth(today);

  const days = useMemo(() => {
    const leading = (first.getDay() + 6) % 7; // make Monday=0
    const total = leading + last.getDate();
    const rows = Math.ceil(total / 7);
    const cells: Array<{ date: Date | null; items: Task[] }> = [];
    for (let i = 0; i < rows * 7; i++) {
      const dayIndex = i - leading + 1;
      if (dayIndex < 1 || dayIndex > last.getDate()) {
        cells.push({ date: null, items: [] });
      } else {
        const d = new Date(today.getFullYear(), today.getMonth(), dayIndex);
        const items = tasks.filter(t => t.dueDate && t.dueDate.toDateString() === d.toDateString());
        cells.push({ date: d, items });
      }
    }
    return cells;
  }, [first, last, tasks, today]);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-white">{today.toLocaleString('default', { month: 'long' })} {today.getFullYear()}</div>
        <div className="text-xs text-white/60">Demo calendar</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} className="px-2 py-1 text-center text-white/60">{d}</div>
        ))}
        {days.map((cell, idx) => (
          <div key={idx} className={`min-h-[84px] rounded border ${cell.date ? 'border-white/10 bg-black/40' : 'border-transparent bg-transparent'} p-1`}>
            {cell.date && (
              <>
                <div className="mb-1 text-right text-[10px] text-white/40">{cell.date.getDate()}</div>
                <div className="space-y-1">
                  {cell.items.slice(0, 3).map(item => (
                    <div key={item.id} className="truncate rounded bg-emerald-500/20 px-1 py-[2px] text-[10px] text-emerald-300">
                      {item.title}
                    </div>
                  ))}
                  {cell.items.length > 3 && (
                    <div className="text-[10px] text-white/50">+{cell.items.length - 3} more</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


