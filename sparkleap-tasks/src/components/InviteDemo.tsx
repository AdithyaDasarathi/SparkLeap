'use client';

import { useState } from 'react';

export default function InviteDemo() {
  const [email, setEmail] = useState('founder@example.com');
  const [role, setRole] = useState<'Owner' | 'Member' | 'Viewer'>('Member');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="max-w-md rounded-lg border border-white/10 bg-black/40 p-4 text-white">
      <h4 className="mb-3 text-base font-semibold">Invite a teammate</h4>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-white/20 bg-black/60 px-3 py-2 text-sm text-white placeholder-white/40"
            placeholder="name@company.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/70">Role</label>
          <select
            className="w-full rounded border border-white/20 bg-black/60 px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option>Owner</option>
            <option>Member</option>
            <option>Viewer</option>
          </select>
        </div>
        <button
          onClick={handleSend}
          className="w-full rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-black hover:bg-emerald-400"
        >
          Send Invite (demo)
        </button>
        {sent && (
          <div className="rounded border border-emerald-400/30 bg-emerald-500/10 p-2 text-center text-xs text-emerald-300">
            Invite sent to {email} as {role}
          </div>
        )}
      </div>
    </div>
  );
}


