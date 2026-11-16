'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Minus, Package, Plus, Receipt, Sparkles } from 'lucide-react';
import { StaffShell } from '@/components/StaffShell';
import { getSocket } from '@/lib/socket-client';
import { formatPKR } from '@/lib/format';
import type { ExpenseRecord, InventoryItem } from '@/lib/types';

export default function InventoryExpensesPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // New Inventory Item Form
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('100');
  const [newThreshold, setNewThreshold] = useState('25');

  // New Expense Form
  const [expTitle, setExpTitle] = useState('');
  const [expCat, setExpCat] = useState('Ingredients');
  const [expAmount, setExpAmount] = useState('');

  const loadAll = useCallback(async () => {
    const [iRes, eRes] = await Promise.all([fetch('/api/inventory'), fetch('/api/expenses')]);
    const iData = await iRes.json();
    const eData = await eRes.json();
    setInventory(iData.items || []);
    setExpenses(eData.expenses || []);
  }, []);

  useEffect(() => {
    void loadAll();
    const socket = getSocket();
    const onInv = (items: InventoryItem[]) => setInventory(items);
    socket.on('inventory:updated', onInv);
    return () => {
      socket.off('inventory:updated', onInv);
    };
  }, [loadAll]);

  const adjustStock = async (id: string, delta: number) => {
    await fetch(`/api/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    });
    await loadAll();
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        category: 'Packaging',
        quantity: Number(newQty || 100),
        unit: 'pieces',
        minThreshold: Number(newThreshold || 25),
      }),
    });
    setNewName('');
    await loadAll();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount) return;
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: expTitle.trim(),
        category: expCat,
        amount: Number(expAmount),
      }),
    });
    setExpTitle('');
    setExpAmount('');
    await loadAll();
  };

  const lowStockItems = inventory.filter((i) => i.quantity <= i.minThreshold);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <StaffShell
      title="Inventory & Daily Expenses"
      subtitle="Auto-deducted packaging stock with 25-piece low-stock alerts & expense tracking"
      allowedRoles={['OWNER', 'CASHIER', 'KITCHEN']}
    >
      {lowStockItems.length > 0 && (
        <div className="mb-6 rounded-2xl border-2 border-red-400 bg-red-50 p-4 text-red-950">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Low Stock Alert ({lowStockItems.length} items at or below alert threshold!)
          </div>
          <p className="mt-1 text-xs">
            Restock needed: {lowStockItems.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Inventory Table */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-3xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#4A0B1E]">
                <Package className="h-5 w-5 text-[#6B132E]" />
                Cafe Packaging &amp; Stock
              </h2>
              <span className="rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#73545E] border border-[#E6DAC8]">
                {inventory.length} Items Tracked
              </span>
            </div>

            <div className="space-y-2.5">
              {inventory.map((item) => {
                const isLow = item.quantity <= item.minThreshold;
                return (
                  <div
                    key={item.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 ${
                      isLow
                        ? 'border-red-300 bg-red-50/70'
                        : 'border-[#E6DAC8] bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-[#4A0B1E]">{item.name}</p>
                        {isLow && (
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            LOW STOCK
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#73545E]">
                        Current: <strong className="text-[#4A0B1E]">{item.quantity} {item.unit}</strong> •
                        Alert at: <strong>{item.minThreshold} {item.unit}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => adjustStock(item.id, -5)}
                        className="rounded-lg border border-[#D8CCBA] bg-[#FAF6F0] px-2.5 py-1 text-xs font-bold text-[#4A0B1E] hover:bg-[#EFE5D5]"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => adjustStock(item.id, -1)}
                        className="rounded-lg border border-[#D8CCBA] bg-[#FAF6F0] p-1.5 text-[#4A0B1E] hover:bg-[#EFE5D5]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => adjustStock(item.id, 10)}
                        className="rounded-lg bg-[#6B132E] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#4A0B1E]"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => adjustStock(item.id, 50)}
                        className="rounded-lg bg-[#C9A227] px-2.5 py-1 text-xs font-bold text-[#2A0914] hover:bg-[#E8D28A]"
                      >
                        +50
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Inventory Form */}
            <form onSubmit={handleAddInventory} className="mt-5 border-t border-[#EFE5D5] pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6B132E]">
                Add New Stock Item
              </p>
              <div className="grid gap-2 sm:grid-cols-4">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Item name"
                  className="sm:col-span-2 rounded-xl border border-[#D8CCBA] bg-white px-3 py-2 text-xs"
                  required
                />
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  placeholder="Qty (100)"
                  className="rounded-xl border border-[#D8CCBA] bg-white px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#6B132E] px-3 py-2 text-xs font-bold text-white hover:bg-[#4A0B1E]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Daily Expenses Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#4A0B1E]">
                <Receipt className="h-5 w-5 text-[#6B132E]" />
                Daily Expenses
              </h2>
              <span className="font-serif text-lg font-bold text-[#6B132E]">
                {formatPKR(totalExpenses)}
              </span>
            </div>

            <form onSubmit={handleAddExpense} className="mb-5 space-y-2.5 rounded-2xl bg-[#FAF6F0] p-4 border border-[#E6DAC8]">
              <p className="text-xs font-bold text-[#4A0B1E]">Log Expense</p>
              <input
                type="text"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                placeholder="Expense description (e.g. Fresh Chicken 10kg)"
                className="w-full rounded-xl border border-[#D8CCBA] bg-white px-3 py-2 text-xs"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={expCat}
                  onChange={(e) => setExpCat(e.target.value)}
                  className="rounded-xl border border-[#D8CCBA] bg-white px-3 py-2 text-xs"
                >
                  <option>Ingredients</option>
                  <option>Kitchen Supplies</option>
                  <option>Packaging</option>
                  <option>Utilities</option>
                  <option>Staff &amp; Misc</option>
                </select>
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="Amount (PKR)"
                  className="rounded-xl border border-[#D8CCBA] bg-white px-3 py-2 text-xs"
                  required
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#6B132E] py-2 text-xs font-bold text-white hover:bg-[#4A0B1E]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#E8D28A]" />
                Record Expense
              </button>
            </form>

            <div className="space-y-2">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded-xl border border-[#E6DAC8] bg-white px-3.5 py-2.5"
                >
                  <div>
                    <p className="text-xs font-bold text-[#4A0B1E]">{exp.title}</p>
                    <p className="text-[10px] text-[#73545E]">
                      {exp.category} • {exp.recordedBy}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#6B132E]">{formatPKR(exp.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StaffShell>
  );
}
