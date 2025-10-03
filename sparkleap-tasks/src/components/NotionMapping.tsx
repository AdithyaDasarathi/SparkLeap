"use client";

import { useEffect, useMemo, useState } from 'react';

type DbItem = { id: string; title: string; last_edited_time?: string };
type Property = { name: string; type: string; id?: string };

interface Props {
  sourceId: string;
  userId?: string;
}

export default function NotionMapping({ sourceId, userId = 'demo-user' }: Props) {
  const [databases, setDatabases] = useState<DbItem[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const mockMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mock') === '1';

  const propNames = useMemo(() => properties.map(p => p.name), [properties]);

  const [mapping, setMapping] = useState({
    title: "",
    status: "",
    assignee: "",
    dueDate: "",
    completedAt: "",
    createdTime: "",
    lastEditedTime: "",
    projectRelation: "",
    priority: "",
    estimate: "",
    tags: "",
    activeStatusValues: [] as string[],
    completedStatusValues: [] as string[],
    backlogStatusValues: [] as string[]
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage("");
      try {
        if (mockMode) {
          setDatabases([{ id: 'mock-db-1', title: 'Mock Tasks' }]);
        } else {
          const res = await fetch(`/api/notion/databases?sourceId=${sourceId}`);
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Failed to list databases');
          setDatabases(json.databases || []);
        }
      } catch (e: any) {
        setMessage(e.message || 'Failed to load databases');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sourceId]);

  const onSelectDbs = async () => {
    try {
      setLoading(true);
      const selected = databases.filter(d => d.id === selectedDb).map(d => ({ id: d.id, name: d.title }));
      const res = await fetch('/api/notion/databases/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, userId, selections: selected })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save selection');
      setMessage('Database selected. Fetching schema...');
      await fetchSchema(selectedDb);
    } catch (e: any) {
      setMessage(e.message || 'Failed to select database');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchema = async (dbId: string) => {
    try {
      setLoading(true);
      if (mockMode) {
        setProperties([
          { name: 'Name', type: 'title' },
          { name: 'Status', type: 'status' },
          { name: 'Assignee', type: 'people' },
          { name: 'Due', type: 'date' },
          { name: 'Completed', type: 'date' },
          { name: 'Priority', type: 'select' },
          { name: 'Estimate', type: 'number' },
          { name: 'Tags', type: 'multi_select' }
        ]);
      } else {
        const res = await fetch(`/api/notion/schemas?sourceId=${sourceId}&databaseId=${dbId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch schema');
        setProperties(json.properties || []);
      }
      setMessage('Schema loaded. Map your fields.');
    } catch (e: any) {
      setMessage(e.message || 'Failed to fetch schema');
    } finally {
      setLoading(false);
    }
  };

  const saveMapping = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notion/mapping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseId: selectedDb, mapping })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save mapping');
      setMessage('Mapping saved. You can now sync.');
    } catch (e: any) {
      setMessage(e.message || 'Failed to save mapping');
    } finally {
      setLoading(false);
    }
  };

  const runSync = async (mode: 'backfill' | 'incremental') => {
    try {
      setLoading(true);
      if (mockMode) {
        const seedRes = await fetch('/api/notion/mock/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, databaseId: selectedDb || 'mock-db-1', tasksCount: 24 })
        });
        const json = await seedRes.json();
        if (!seedRes.ok) throw new Error(json.error || 'Mock seed failed');
        setMessage(`Mock data seeded: ${json.seeded} tasks.`);
      } else {
        const res = await fetch('/api/notion/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId, mode })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Sync failed');
        setMessage(`Sync complete. Upserted ${json.total} tasks.`);
      }
    } catch (e: any) {
      setMessage(e.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const computeKpis = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('userId', userId);
      if (selectedDb) params.set('databaseId', selectedDb);
      const res = await fetch(`/api/notion/kpis?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to compute KPIs');
      setMessage(`KPIs: completed=${json.completedTasks}, onTime=${Math.round(json.onTimeRate*100)}%, WIP=${json.wipCount}, overdue=${json.overdueOpen}`);
    } catch (e: any) {
      setMessage(e.message || 'Failed to compute KPIs');
    } finally {
      setLoading(false);
    }
  };

  const Select = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ opacity: 0.9 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ background: '#11151a', color: '#fff', borderRadius: 8, padding: '8px 10px', border: '1px solid #27313a' }}>
        <option value="">—</option>
        {propNames.map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600 }}>Notion Mapping</h3>
      {mockMode && <div style={{ color: '#22c55e' }}>Mock mode active (use ?mock=1)</div>}
      {message && <div style={{ color: '#93c5fd' }}>{message}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
        <select value={selectedDb} onChange={e => setSelectedDb(e.target.value)} style={{ background: '#11151a', color: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #27313a' }}>
          <option value="">Select a Notion database…</option>
          {databases.map(db => (
            <option key={db.id} value={db.id}>{db.title}</option>
          ))}
        </select>
        <button onClick={onSelectDbs} disabled={!selectedDb || loading} style={{ background: '#16a34a', color: '#fff', borderRadius: 8, padding: '10px 14px' }}>Use this database</button>
      </div>

      {properties.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Select label="Title" value={mapping.title} onChange={v => setMapping(m => ({ ...m, title: v }))} />
          <Select label="Status" value={mapping.status} onChange={v => setMapping(m => ({ ...m, status: v }))} />
          <Select label="Assignee" value={mapping.assignee} onChange={v => setMapping(m => ({ ...m, assignee: v }))} />
          <Select label="Due date" value={mapping.dueDate} onChange={v => setMapping(m => ({ ...m, dueDate: v }))} />
          <Select label="Completed at" value={mapping.completedAt} onChange={v => setMapping(m => ({ ...m, completedAt: v }))} />
          <Select label="Priority" value={mapping.priority} onChange={v => setMapping(m => ({ ...m, priority: v }))} />
          <Select label="Estimate" value={mapping.estimate} onChange={v => setMapping(m => ({ ...m, estimate: v }))} />
          <Select label="Tags" value={mapping.tags} onChange={v => setMapping(m => ({ ...m, tags: v }))} />
        </div>
      )}

      {properties.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={saveMapping} disabled={loading} style={{ background: '#2563eb', color: '#fff', borderRadius: 8, padding: '10px 14px' }}>Save mapping</button>
          <button onClick={() => runSync('backfill')} disabled={loading} style={{ background: '#4f46e5', color: '#fff', borderRadius: 8, padding: '10px 14px' }}>Backfill</button>
          <button onClick={() => runSync('incremental')} disabled={loading} style={{ background: '#7c3aed', color: '#fff', borderRadius: 8, padding: '10px 14px' }}>Incremental sync</button>
          <button onClick={computeKpis} disabled={loading} style={{ background: '#0ea5e9', color: '#fff', borderRadius: 8, padding: '10px 14px' }}>Compute KPIs</button>
        </div>
      )}
    </div>
  );
}



