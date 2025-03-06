'use client';

import { useState } from 'react';
import type { User } from '@/types/auth';
import { AuditService } from '@/services/audit.service';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const auditService = AuditService.getInstance();

  const handlePermissionChange = async (userId: string, permission: string, action: 'grant' | 'revoke') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission, action }),
      });

      if (response.ok) {
        await auditService.logEvent('CONFIG_CHANGE', {
          userId,
          permission,
          action,
          changedBy: 'admin'
        }, 'MEDIUM');
        
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId
            ? {
                ...user,
                permissions: action === 'grant'
                  ? [...user.permissions, { resource: permission, actions: ['read'] }]
                  : user.permissions.filter(p => p.resource !== permission)
              }
            : user
        ));
      }
    } catch (error) {
      console.error('Permission update failed:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">User Management</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Organization</th>
              <th>MFA Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.organizationType}</td>
                <td>{user.mfaEnabled ? 'Enabled' : 'Disabled'}</td>
                <td className="space-x-2">
                  <button 
                    onClick={() => handlePermissionChange(user.id, 'transactions', 'grant')}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Grant Access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
