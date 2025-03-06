'use client';

import { useState } from 'react';
import { User } from '@/types/auth';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  sender: string;
  recipient: string;
  timestamp: string;
}

export default function TransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        // Update local state
        setTransactions(prev =>
          prev.map(t => t.id === id ? { ...t, status: 'approved' } : t)
        );
      }
    } catch (error) {
      console.error('Transaction approval failed:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Transaction Management</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.amount} {tx.currency}</td>
                <td>{tx.status}</td>
                <td>
                  {tx.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(tx.id)}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
