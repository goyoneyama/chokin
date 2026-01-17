'use client';

import { useState, useEffect } from 'react';
import { NisaDetail } from '@/types/assets';
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

interface NisaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: NisaDetail[];
  onSave: (details: NisaDetail[]) => void;
}

export function NisaDetailModal({
  open,
  onOpenChange,
  details,
  onSave,
}: NisaDetailModalProps) {
  const [nisaDetails, setNisaDetails] = useState<NisaDetail[]>([]);

  useEffect(() => {
    if (open) {
      setNisaDetails(details.length > 0 ? [...details] : [{ name: '', value: 0 }]);
    }
  }, [open, details]);

  const addNisa = () => {
    setNisaDetails([...nisaDetails, { name: '', value: 0 }]);
  };

  const removeNisa = (index: number) => {
    setNisaDetails(nisaDetails.filter((_, i) => i !== index));
  };

  const updateNisa = (index: number, field: keyof NisaDetail, value: string | number) => {
    const updated = [...nisaDetails];
    updated[index] = { ...updated[index], [field]: value };
    setNisaDetails(updated);
  };

  const handleSave = () => {
    // Filter out empty entries
    const filtered = nisaDetails.filter((n) => n.name.trim() !== '');
    onSave(filtered);
    onOpenChange(false);
  };

  const totalValue = nisaDetails.reduce((sum, n) => sum + (Number(n.value) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>NISA評価額の詳細</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {nisaDetails.map((nisa, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`nisa-name-${index}`} className="text-sm">
                        NISA口座名
                      </Label>
                      <Input
                        id={`nisa-name-${index}`}
                        value={nisa.name}
                        onChange={(e) => updateNisa(index, 'name', e.target.value)}
                        placeholder="例: 楽天NISA、SBI NISA"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`nisa-value-${index}`} className="text-sm">
                        評価額
                      </Label>
                      <Input
                        id={`nisa-value-${index}`}
                        type="number"
                        value={nisa.value}
                        onChange={(e) => updateNisa(index, 'value', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {nisaDetails.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNisa(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addNisa} className="w-full">
            <Plus size={16} className="mr-2" />
            NISA口座を追加
          </Button>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-purple-900">合計評価額</span>
                <span className="text-2xl font-bold text-purple-900">
                  {formatCurrency(totalValue)}
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
