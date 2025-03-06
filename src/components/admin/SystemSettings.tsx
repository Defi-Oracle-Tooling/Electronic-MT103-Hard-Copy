'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface SystemConfig {
  mfaRequired: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
  };
}

export default function SystemSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<SystemConfig>();

  const onSubmit = async (data: SystemConfig) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
    } catch (error) {
      console.error('Settings update failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      <h2 className="text-xl font-bold">System Settings</h2>
      
      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" {...register('mfaRequired')} />
            <span>Require MFA for all users</span>
          </label>
        </div>

        <div>
          <label>Session Timeout (minutes)</label>
          <input
            type="number"
            {...register('sessionTimeout', { min: 5, max: 120 })}
            className="mt-1 block w-full rounded-md border-gray-300"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
