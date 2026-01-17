'use client';

import { useState, useEffect } from 'react';
import { IncomeDetail } from '@/types/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface IncomeDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: IncomeDetail[];
  onSave: (details: IncomeDetail[]) => void;
}

export function IncomeDetailModal({
  open,
  onOpenChange,
  details,
  onSave,
}: IncomeDetailModalProps) {
  const [incomeDetails, setIncomeDetails] = useState<IncomeDetail[]>([]);

  useEffect(() => {
    if (open) {
      setIncomeDetails(details.length > 0 ? [...details] : [{ name: '', amount: '' as any }]);
    }
  }, [open, details]);

  const addIncome = () => {
    setIncomeDetails([...incomeDetails, { name: '', amount: '' as any }]);
  };

  const removeIncome = (index: number) => {
    setIncomeDetails(incomeDetails.filter((_, i) => i !== index));
  };

  const updateIncome = (index: number, field: keyof IncomeDetail, value: string | number) => {
    const updated = [...incomeDetails];
    updated[index] = { ...updated[index], [field]: value };
    setIncomeDetails(updated);
  };

  const handleSave = () => {
    // Filter out empty entries
    const filtered = incomeDetails.filter((i) => i.name.trim() !== '');
    onSave(filtered);
    onOpenChange(false);
  };

  const totalIncome = incomeDetails.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>収入の詳細</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {incomeDetails.map((income, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`income-name-${index}`} className="text-sm">
                        収入源
                      </Label>
                      <Input
                        id={`income-name-${index}`}
                        value={income.name}
                        onChange={(e) => updateIncome(index, 'name', e.target.value)}
                        placeholder="例: 給与、副業、投資収益"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`income-amount-${index}`} className="text-sm">
                        金額
                      </Label>
                      <Input
                        id={`income-amount-${index}`}
                        type="number"
                        value={income.amount || ''}
                        onChange={(e) => updateIncome(index, 'amount', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        placeholder="金額を入力"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {incomeDetails.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIncome(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addIncome} className="w-full">
            <Plus size={16} className="mr-2" />
            収入を追加
          </Button>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-900">合計収入</span>
                <span className="text-2xl font-bold text-green-900">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
