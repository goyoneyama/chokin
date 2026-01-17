'use client';

import { useState, useEffect } from 'react';
import { BankDetail } from '@/types/assets';
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

interface BankBalanceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: BankDetail[];
  onSave: (details: BankDetail[]) => void;
}

export function BankBalanceDetailModal({
  open,
  onOpenChange,
  details,
  onSave,
}: BankBalanceDetailModalProps) {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);

  useEffect(() => {
    if (open) {
      setBankDetails(details.length > 0 ? [...details] : [{ name: '', balance: 0 }]);
    }
  }, [open, details]);

  const addBank = () => {
    setBankDetails([...bankDetails, { name: '', balance: 0 }]);
  };

  const removeBank = (index: number) => {
    setBankDetails(bankDetails.filter((_, i) => i !== index));
  };

  const updateBank = (index: number, field: keyof BankDetail, value: string | number) => {
    const updated = [...bankDetails];
    updated[index] = { ...updated[index], [field]: value };
    setBankDetails(updated);
  };

  const handleSave = () => {
    // Filter out empty entries
    const filtered = bankDetails.filter((b) => b.name.trim() !== '');
    onSave(filtered);
    onOpenChange(false);
  };

  const totalBalance = bankDetails.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>口座残高の詳細</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {bankDetails.map((bank, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`bank-name-${index}`} className="text-sm">
                        口座名
                      </Label>
                      <Input
                        id={`bank-name-${index}`}
                        value={bank.name}
                        onChange={(e) => updateBank(index, 'name', e.target.value)}
                        placeholder="例: 三菱UFJ銀行"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`bank-balance-${index}`} className="text-sm">
                        残高
                      </Label>
                      <Input
                        id={`bank-balance-${index}`}
                        type="number"
                        value={bank.balance}
                        onChange={(e) => updateBank(index, 'balance', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {bankDetails.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBank(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addBank} className="w-full">
            <Plus size={16} className="mr-2" />
            口座を追加
          </Button>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">合計残高</span>
                <span className="text-2xl font-bold text-blue-900">
                  {formatCurrency(totalBalance)}
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
