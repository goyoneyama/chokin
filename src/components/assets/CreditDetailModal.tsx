'use client';

import { useState, useEffect } from 'react';
import { CreditDetail } from '@/types/assets';
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

interface CreditDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: CreditDetail[];
  onSave: (details: CreditDetail[]) => void;
}

export function CreditDetailModal({
  open,
  onOpenChange,
  details,
  onSave,
}: CreditDetailModalProps) {
  const [creditDetails, setCreditDetails] = useState<CreditDetail[]>([]);

  useEffect(() => {
    if (open) {
      setCreditDetails(details.length > 0 ? [...details] : [{ name: '', amount: 0 }]);
    }
  }, [open, details]);

  const addCredit = () => {
    setCreditDetails([...creditDetails, { name: '', amount: 0 }]);
  };

  const removeCredit = (index: number) => {
    setCreditDetails(creditDetails.filter((_, i) => i !== index));
  };

  const updateCredit = (index: number, field: keyof CreditDetail, value: string | number) => {
    const updated = [...creditDetails];
    updated[index] = { ...updated[index], [field]: value };
    setCreditDetails(updated);
  };

  const handleSave = () => {
    // Filter out empty entries
    const filtered = creditDetails.filter((c) => c.name.trim() !== '');
    onSave(filtered);
    onOpenChange(false);
  };

  const totalExpenses = creditDetails.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>クレジット支出の詳細</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {creditDetails.map((credit, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`credit-name-${index}`} className="text-sm">
                        カード名
                      </Label>
                      <Input
                        id={`credit-name-${index}`}
                        value={credit.name}
                        onChange={(e) => updateCredit(index, 'name', e.target.value)}
                        placeholder="例: 楽天カード、ANAカード"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`credit-amount-${index}`} className="text-sm">
                        利用額
                      </Label>
                      <Input
                        id={`credit-amount-${index}`}
                        type="number"
                        value={credit.amount}
                        onChange={(e) => updateCredit(index, 'amount', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {creditDetails.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCredit(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addCredit} className="w-full">
            <Plus size={16} className="mr-2" />
            カードを追加
          </Button>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-red-900">合計支出</span>
                <span className="text-2xl font-bold text-red-900">
                  {formatCurrency(totalExpenses)}
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
