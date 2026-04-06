import React, { useState } from 'react';
import { Search, ChevronRight, User, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function UserTable({ users, onSelectUser, selectedUserId }) {
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800 mb-3">Contas Cadastradas ({users.length})</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar usuário..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>
      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">Nenhum usuário encontrado</p>
        )}
        {filtered.map(user => (
          <button
            key={user.email}
            onClick={() => onSelectUser(user)}
            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 transition-colors text-left ${selectedUserId === user.email ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                {user.role === 'admin'
                  ? <Shield className="w-4 h-4 text-purple-600" />
                  : <User className="w-4 h-4 text-purple-400" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 leading-tight">{user.full_name || 'Sem nome'}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                {user.role === 'admin' ? 'Admin' : 'Usuário'}
              </Badge>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {user.records?.length || 0} jogos
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}