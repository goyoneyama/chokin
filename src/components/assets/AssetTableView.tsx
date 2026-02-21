'use client';

import { useState, useEffect, Fragment } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { MonthlyAssetRecord } from '@/types/assets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight, ExternalLink, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface AssetTableViewProps {
  onNavigateToMonth: (yearMonth: string) => void;
  active?: boolean;
}

type EditCell = {
  recordId: string;
  field: 'bank_balance' | 'monthly_income' | 'credit_expenses' | 'nisa_value';
  value: string;
};

type EditDetail = {
  recordId: string;
  type: 'bank' | 'income' | 'credit' | 'nisa';
  index: number;
  field: 'name' | 'balance' | 'amount' | 'value';
  value: string;
};

export function AssetTableView({ onNavigateToMonth, active }: AssetTableViewProps) {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<MonthlyAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditCell | null>(null);
  const [editingDetail, setEditingDetail] = useState<EditDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPastMonths, setShowPastMonths] = useState(0); // 過去何ヶ月表示するか（デフォルト0）

  useEffect(() => {
    loadRecords();
  }, [user]);

  // タブが表示されたときにデータを再取得
  useEffect(() => {
    if (active && user) {
      loadRecords();
    }
  }, [active]);

  const loadRecords = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('monthly_asset_records')
        .select('*')
        .eq('user_id', user.id)
        .order('year_month', { ascending: true }); // 古い順（昇順）

      if (!error && data) {
        setRecords(data as MonthlyAssetRecord[]);
      }
    } catch (e) {
      console.error('Error loading records:', e);
    } finally {
      setLoading(false);
    }
  };

  const salaryDay = user?.salary_day || 25;
  const cardPaymentDay = user?.card_payment_day || 27;

  const getChange = (current: MonthlyAssetRecord, index: number, displayedRecords: MonthlyAssetRecord[]): number | null => {
    // displayedRecords内で前の月を探す（昇順なので前のindex）
    if (index === 0) return null;
    const prev = displayedRecords[index - 1];
    if (!prev) return null;
    return current.calculated_balance - prev.calculated_balance;
  };

  // 今月を見つける（昇順のrecords配列内で）
  const getCurrentMonthIndex = () => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const index = records.findIndex(r => r.year_month === currentYearMonth);
    return index >= 0 ? index : records.length - 1; // 今月がなければ最新のデータ
  };

  const currentMonthIndex = getCurrentMonthIndex();

  // 今月 + 未来5ヶ月（合計6ヶ月） + 過去showPastMonths分を表示（昇順）
  const futureMonthsCount = 5; // 今月は含まないので5
  const startIndex = Math.max(0, currentMonthIndex - showPastMonths); // 過去の開始位置
  const endIndex = Math.min(records.length, currentMonthIndex + 1 + futureMonthsCount); // 今月+1 + 未来5 = 今月含めて6ヶ月

  const displayedRecords = records.slice(startIndex, endIndex);

  const pastRecordsAvailable = currentMonthIndex > 0;
  const pastRecordsCount = currentMonthIndex;


  const showMorePast = () => {
    const increment = 3;
    setShowPastMonths(prev => Math.min(prev + increment, pastRecordsCount));
  };

  const hidePast = () => {
    setShowPastMonths(0);
  };

  const toggleExpand = (yearMonth: string) => {
    setExpandedMonth(expandedMonth === yearMonth ? null : yearMonth);
  };

  const formatYearMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  const hasDetails = (record: MonthlyAssetRecord): boolean => {
    return !!(
      (record.bank_details && record.bank_details.length > 0) ||
      (record.income_details && record.income_details.length > 0) ||
      (record.credit_details && record.credit_details.length > 0) ||
      (record.nisa_details && record.nisa_details.length > 0)
    );
  };

  const startEdit = (record: MonthlyAssetRecord, field: EditCell['field']) => {
    setEditingCell({
      recordId: record.id,
      field,
      value: record[field].toString(),
    });
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  const saveEdit = async () => {
    if (!editingCell || saving) return;

    const newValue = parseInt(editingCell.value);
    if (isNaN(newValue)) {
      toast.error('数値を入力してください');
      return;
    }

    setSaving(true);

    try {
      const record = records.find(r => r.id === editingCell.recordId);
      if (!record) return;

      const { error } = await supabase
        .from('monthly_asset_records')
        .update({
          [editingCell.field]: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCell.recordId);

      if (!error) {
        // Update local state with recalculated balance
        setRecords(records.map(r => {
          if (r.id === editingCell.recordId) {
            const updatedRecord = { ...r, [editingCell.field]: newValue };
            // Recalculate balance
            const bank = editingCell.field === 'bank_balance' ? newValue : r.bank_balance;
            const income = editingCell.field === 'monthly_income' ? newValue : r.monthly_income;
            const expense = editingCell.field === 'credit_expenses' ? newValue : r.credit_expenses;
            return {
              ...updatedRecord,
              calculated_balance: bank + income - expense
            };
          }
          return r;
        }));
        toast.success('保存しました');
        setEditingCell(null);
      } else {
        toast.error('保存に失敗しました');
      }
    } catch (e) {
      console.error('Error saving:', e);
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleDetailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveDetailEdit();
    } else if (e.key === 'Escape') {
      cancelDetailEdit();
    }
  };

  const startDetailEdit = (record: MonthlyAssetRecord, type: EditDetail['type'], index: number, field: EditDetail['field'], value: string | number) => {
    setEditingDetail({
      recordId: record.id,
      type,
      index,
      field,
      value: value.toString(),
    });
  };

  const cancelDetailEdit = () => {
    setEditingDetail(null);
  };

  const saveDetailEdit = async () => {
    if (!editingDetail || saving) return;

    setSaving(true);

    try {
      const record = records.find(r => r.id === editingDetail.recordId);
      if (!record) return;

      let updatedDetails: any[] = [];
      let fieldName = '';
      let totalField = '';

      switch (editingDetail.type) {
        case 'bank':
          updatedDetails = [...(record.bank_details || [])];
          if (editingDetail.field === 'name') {
            updatedDetails[editingDetail.index] = { ...updatedDetails[editingDetail.index], name: editingDetail.value };
          } else {
            const newValue = parseInt(editingDetail.value);
            if (isNaN(newValue)) {
              toast.error('数値を入力してください');
              setSaving(false);
              return;
            }
            updatedDetails[editingDetail.index] = { ...updatedDetails[editingDetail.index], balance: newValue };
          }
          fieldName = 'bank_details';
          totalField = 'bank_balance';
          break;
        case 'income':
          updatedDetails = [...(record.income_details || [])];
          if (editingDetail.field === 'name') {
            updatedDetails[editingDetail.index] = { ...updatedDetails[editingDetail.index], name: editingDetail.value };
          } else {
            const newValue = parseInt(editingDetail.value);
            if (isNaN(newValue)) {
              toast.error('数値を入力してください');
              setSaving(false);
              return;
            }
            updatedDetails[editingDetail.index] = { ...updatedDetails[editingDetail.index], amount: newValue };
          }
          fieldName = 'income_details';
          totalField = 'monthly_income';
          break;
        case 'credit':
          updatedDetails = [...(record.credit_details || [])];
          if (editingDetail.field === 'name') {
            updatedDetails[editingDetail.index] = { ...updatedDetails[editingDetail.index], name: editingDetail.value };
          } else {
            const newValue = parseInt(editingDetail.value);
            if (isNaN(newValue)) {
              toast.error('数値を入力してください');
              setSaving(false);
              return;
            }
            updatedDetails[editingDetail.index] = { ...updatedDetails[editingDetail.index], amount: newValue };
          }
          fieldName = 'credit_details';
          totalField = 'credit_expenses';
          break;
        case 'nisa':
          updatedDetails = [...(record.nisa_details || [])];
          if (editingDetail.field === 'name') {
            updatedDetails[editingDetail.index] = { ...updatedDetails[editingDetail.index], name: editingDetail.value };
          } else {
            const newValue = parseInt(editingDetail.value);
            if (isNaN(newValue)) {
              toast.error('数値を入力してください');
              setSaving(false);
              return;
            }
            updatedDetails[editingDetail.index] = { ...updatedDetails[editingDetail.index], value: newValue };
          }
          fieldName = 'nisa_details';
          totalField = 'nisa_value';
          break;
      }

      // Calculate new total
      let newTotal = 0;
      if (editingDetail.type === 'bank') {
        newTotal = updatedDetails.reduce((sum, d) => sum + (d.balance || 0), 0);
      } else if (editingDetail.type === 'income') {
        newTotal = updatedDetails.reduce((sum, d) => sum + (d.amount || 0), 0);
      } else if (editingDetail.type === 'credit') {
        newTotal = updatedDetails.reduce((sum, d) => sum + (d.amount || 0), 0);
      } else if (editingDetail.type === 'nisa') {
        newTotal = updatedDetails.reduce((sum, d) => sum + (d.value || 0), 0);
      }

      const { error } = await supabase
        .from('monthly_asset_records')
        .update({
          [fieldName]: updatedDetails,
          [totalField]: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingDetail.recordId);

      if (!error) {
        // Update local state
        setRecords(records.map(r => {
          if (r.id === editingDetail.recordId) {
            const updatedRecord = {
              ...r,
              [fieldName]: updatedDetails,
              [totalField]: newTotal,
            };
            // Recalculate balance
            const bank = totalField === 'bank_balance' ? newTotal : r.bank_balance;
            const income = totalField === 'monthly_income' ? newTotal : r.monthly_income;
            const expense = totalField === 'credit_expenses' ? newTotal : r.credit_expenses;
            return {
              ...updatedRecord,
              calculated_balance: bank + income - expense
            };
          }
          return r;
        }));
        toast.success('保存しました');
        setEditingDetail(null);
      } else {
        toast.error('保存に失敗しました');
      }
    } catch (e) {
      console.error('Error saving detail:', e);
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const addDetail = async (record: MonthlyAssetRecord, type: EditDetail['type']) => {
    if (saving) return;
    setSaving(true);

    try {
      let updatedDetails: any[] = [];
      let fieldName = '';
      let totalField = '';
      let newItem: any = {};

      switch (type) {
        case 'bank':
          updatedDetails = [...(record.bank_details || []), { name: '新しい口座', balance: 0 }];
          fieldName = 'bank_details';
          totalField = 'bank_balance';
          break;
        case 'income':
          updatedDetails = [...(record.income_details || []), { name: '新しい収入', amount: 0 }];
          fieldName = 'income_details';
          totalField = 'monthly_income';
          break;
        case 'credit':
          updatedDetails = [...(record.credit_details || []), { name: '新しい支出', amount: 0 }];
          fieldName = 'credit_details';
          totalField = 'credit_expenses';
          break;
        case 'nisa':
          updatedDetails = [...(record.nisa_details || []), { name: '新しいNISA', value: 0 }];
          fieldName = 'nisa_details';
          totalField = 'nisa_value';
          break;
      }

      const { error } = await supabase
        .from('monthly_asset_records')
        .update({
          [fieldName]: updatedDetails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (!error) {
        setRecords(records.map(r =>
          r.id === record.id ? { ...r, [fieldName]: updatedDetails } : r
        ));
        toast.success('追加しました');
      } else {
        toast.error('追加に失敗しました');
      }
    } catch (e) {
      console.error('Error adding detail:', e);
      toast.error('追加に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const deleteDetail = async (record: MonthlyAssetRecord, type: EditDetail['type'], index: number) => {
    if (saving) return;
    setSaving(true);

    try {
      let updatedDetails: any[] = [];
      let fieldName = '';
      let totalField = '';
      let newTotal = 0;

      switch (type) {
        case 'bank':
          updatedDetails = (record.bank_details || []).filter((_, i) => i !== index);
          fieldName = 'bank_details';
          totalField = 'bank_balance';
          newTotal = updatedDetails.reduce((sum, d) => sum + d.balance, 0);
          break;
        case 'income':
          updatedDetails = (record.income_details || []).filter((_, i) => i !== index);
          fieldName = 'income_details';
          totalField = 'monthly_income';
          newTotal = updatedDetails.reduce((sum, d) => sum + d.amount, 0);
          break;
        case 'credit':
          updatedDetails = (record.credit_details || []).filter((_, i) => i !== index);
          fieldName = 'credit_details';
          totalField = 'credit_expenses';
          newTotal = updatedDetails.reduce((sum, d) => sum + d.amount, 0);
          break;
        case 'nisa':
          updatedDetails = (record.nisa_details || []).filter((_, i) => i !== index);
          fieldName = 'nisa_details';
          totalField = 'nisa_value';
          newTotal = updatedDetails.reduce((sum, d) => sum + d.value, 0);
          break;
      }

      const { error } = await supabase
        .from('monthly_asset_records')
        .update({
          [fieldName]: updatedDetails.length > 0 ? updatedDetails : null,
          [totalField]: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (!error) {
        setRecords(records.map(r => {
          if (r.id === record.id) {
            const updatedRecord = {
              ...r,
              [fieldName]: updatedDetails.length > 0 ? updatedDetails : null,
              [totalField]: newTotal,
            };
            const bank = totalField === 'bank_balance' ? newTotal : r.bank_balance;
            const income = totalField === 'monthly_income' ? newTotal : r.monthly_income;
            const expense = totalField === 'credit_expenses' ? newTotal : r.credit_expenses;
            return {
              ...updatedRecord,
              calculated_balance: bank + income - expense
            };
          }
          return r;
        }));
        toast.success('削除しました');
      } else {
        toast.error('削除に失敗しました');
      }
    } catch (e) {
      console.error('Error deleting detail:', e);
      toast.error('削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground mb-2">データがまだありません</p>
          <p className="text-sm text-muted-foreground">
            カード表示で月次データを入力すると、テーブルに表示されます
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderEditableCell = (
    record: MonthlyAssetRecord,
    field: EditCell['field'],
    value: number,
    colorClass: string
  ) => {
    const isEditing = editingCell?.recordId === record.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center space-x-1">
          <Input
            type="number"
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm text-right w-24"
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={saveEdit}
            disabled={saving}
          >
            <Check size={14} className="text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={cancelEdit}
          >
            <X size={14} className="text-red-600" />
          </Button>
        </div>
      );
    }

    return (
      <button
        className={`font-medium ${colorClass} hover:bg-gray-100 px-2 py-1 rounded transition-colors w-full text-right`}
        onClick={(e) => {
          e.stopPropagation();
          startEdit(record, field);
        }}
        title="クリックして編集"
      >
        {formatCurrency(value)}
      </button>
    );
  };

  const renderDetailItem = (
    record: MonthlyAssetRecord,
    type: EditDetail['type'],
    detail: any,
    index: number,
    colorClass: string
  ) => {
    const nameField = 'name';
    const valueField = type === 'bank' ? 'balance' : type === 'nisa' ? 'value' : 'amount';
    const isEditingName = editingDetail?.recordId === record.id && editingDetail?.type === type && editingDetail?.index === index && editingDetail?.field === 'name';
    const isEditingValue = editingDetail?.recordId === record.id && editingDetail?.type === type && editingDetail?.index === index && editingDetail?.field === valueField;

    return (
      <div key={index} className="text-xs flex justify-between items-center group">
        {isEditingName ? (
          <div className="flex items-center space-x-1 flex-1">
            <Input
              type="text"
              value={editingDetail.value}
              onChange={(e) => setEditingDetail({ ...editingDetail, value: e.target.value })}
              onKeyDown={handleDetailKeyDown}
              className="h-6 text-xs flex-1"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={saveDetailEdit}
              disabled={saving}
            >
              <Check size={12} className="text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={cancelDetailEdit}
            >
              <X size={12} className="text-red-600" />
            </Button>
          </div>
        ) : (
          <button
            className="text-muted-foreground hover:bg-gray-100 px-1 py-0.5 rounded flex-1 text-left"
            onClick={() => startDetailEdit(record, type, index, 'name', detail.name)}
          >
            {detail.name}
          </button>
        )}

        {isEditingValue ? (
          <div className="flex items-center space-x-1">
            <Input
              type="number"
              value={editingDetail.value}
              onChange={(e) => setEditingDetail({ ...editingDetail, value: e.target.value })}
              onKeyDown={handleDetailKeyDown}
              className="h-6 text-xs text-right w-20"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={saveDetailEdit}
              disabled={saving}
            >
              <Check size={12} className="text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={cancelDetailEdit}
            >
              <X size={12} className="text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <button
              className="text-muted-foreground hover:bg-gray-100 px-1 py-0.5 rounded"
              onClick={() => startDetailEdit(record, type, index, valueField, detail[valueField])}
            >
              {formatCurrency(detail[valueField])}
            </button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteDetail(record, type, index)}
              disabled={saving}
            >
              <X size={12} className="text-red-600" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <p className="text-xs text-blue-800">
            <strong>基準日:</strong> 口座残高は{salaryDay - 1}日時点、資産合計は{cardPaymentDay}日時点
            ・<strong>セルをクリックで直接編集</strong> ・行をクリックで内訳展開 ・月名クリックでカード表示へ
            {showPastMonths === 0 && pastRecordsAvailable && (
              <span className="ml-2">・今月から表示中（過去データは下のボタンで表示）</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">月次資産テーブル</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-3 font-medium sticky left-0 bg-gray-50 min-w-[120px]">
                  月
                </th>
                <th className="text-right py-3 px-3 font-medium text-blue-700 min-w-[110px]">
                  口座残高
                </th>
                <th className="text-right py-3 px-3 font-medium text-green-700 min-w-[100px]">
                  収入
                </th>
                <th className="text-right py-3 px-3 font-medium text-red-700 min-w-[100px]">
                  支出
                </th>
                <th className="text-right py-3 px-3 font-medium text-purple-700 min-w-[100px]">
                  NISA
                </th>
                <th className="text-right py-3 px-3 font-bold min-w-[140px]">
                  資産合計
                </th>
                <th className="text-center py-3 px-3 font-medium min-w-[70px]">
                  状態
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedRecords.map((record, index) => {
                const change = getChange(record, index, displayedRecords);
                const isExpanded = expandedMonth === record.year_month;

                return (
                  <Fragment key={record.year_month}>
                    {/* Main row */}
                    <tr
                      className={`border-b hover:bg-gray-50 transition-colors ${
                        isExpanded ? 'bg-gray-50' : ''
                      }`}
                    >
                      {/* Month */}
                      <td className="py-3 px-3 sticky left-0 bg-white">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => toggleExpand(record.year_month)}
                            className="hover:text-primary"
                          >
                            <span className="text-muted-foreground">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                          </button>
                          <button
                            className="font-medium text-left hover:text-primary hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToMonth(record.year_month);
                            }}
                            title="カード表示で開く"
                          >
                            {formatYearMonth(record.year_month)}
                          </button>
                        </div>
                      </td>

                      {/* Bank Balance - Editable */}
                      <td className="text-right py-3 px-3">
                        {renderEditableCell(record, 'bank_balance', record.bank_balance, 'text-blue-700')}
                      </td>

                      {/* Income - Editable */}
                      <td className="text-right py-3 px-3">
                        {renderEditableCell(record, 'monthly_income', record.monthly_income, 'text-green-700')}
                      </td>

                      {/* Expenses - Editable */}
                      <td className="text-right py-3 px-3">
                        {renderEditableCell(record, 'credit_expenses', record.credit_expenses, 'text-red-700')}
                      </td>

                      {/* NISA - Editable */}
                      <td className="text-right py-3 px-3">
                        {renderEditableCell(record, 'nisa_value', record.nisa_value, 'text-purple-700')}
                      </td>

                      {/* Calculated Balance - Read Only */}
                      <td className="text-right py-3 px-3">
                        <div className="font-bold">{formatCurrency(record.calculated_balance)}</div>
                        {change !== null && (
                          <div
                            className={`text-xs flex items-center justify-end mt-0.5 ${
                              change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {change >= 0 ? (
                              <TrendingUp size={11} className="mr-0.5" />
                            ) : (
                              <TrendingDown size={11} className="mr-0.5" />
                            )}
                            {change >= 0 ? '+' : ''}
                            {formatCurrency(change)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="text-center py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            record.is_confirmed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {record.is_confirmed ? '確定' : '予測'}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr className="border-b bg-gray-50/50">
                        <td colSpan={7} className="px-6 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Bank Details */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-blue-700">口座内訳</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 text-xs px-1"
                                  onClick={() => addDetail(record, 'bank')}
                                  disabled={saving}
                                >
                                  + 追加
                                </Button>
                              </div>
                              <div className="space-y-0.5">
                                {(record.bank_details || []).map((d, i) =>
                                  renderDetailItem(record, 'bank', d, i, 'text-blue-700')
                                )}
                                {(!record.bank_details || record.bank_details.length === 0) && (
                                  <p className="text-xs text-muted-foreground italic">なし</p>
                                )}
                              </div>
                            </div>

                            {/* Income Details */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-green-700">収入内訳</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 text-xs px-1"
                                  onClick={() => addDetail(record, 'income')}
                                  disabled={saving}
                                >
                                  + 追加
                                </Button>
                              </div>
                              <div className="space-y-0.5">
                                {(record.income_details || []).map((d, i) =>
                                  renderDetailItem(record, 'income', d, i, 'text-green-700')
                                )}
                                {(!record.income_details || record.income_details.length === 0) && (
                                  <p className="text-xs text-muted-foreground italic">なし</p>
                                )}
                              </div>
                            </div>

                            {/* Credit Details */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-red-700">支出内訳</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 text-xs px-1"
                                  onClick={() => addDetail(record, 'credit')}
                                  disabled={saving}
                                >
                                  + 追加
                                </Button>
                              </div>
                              <div className="space-y-0.5">
                                {(record.credit_details || []).map((d, i) =>
                                  renderDetailItem(record, 'credit', d, i, 'text-red-700')
                                )}
                                {(!record.credit_details || record.credit_details.length === 0) && (
                                  <p className="text-xs text-muted-foreground italic">なし</p>
                                )}
                              </div>
                            </div>

                            {/* NISA Details */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-purple-700">NISA内訳</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 text-xs px-1"
                                  onClick={() => addDetail(record, 'nisa')}
                                  disabled={saving}
                                >
                                  + 追加
                                </Button>
                              </div>
                              <div className="space-y-0.5">
                                {(record.nisa_details || []).map((d, i) =>
                                  renderDetailItem(record, 'nisa', d, i, 'text-purple-700')
                                )}
                                {(!record.nisa_details || record.nisa_details.length === 0) && (
                                  <p className="text-xs text-muted-foreground italic">なし</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          {record.notes && (
                            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                              メモ: {record.notes}
                            </p>
                          )}

                          {/* Link to card view */}
                          <div className="mt-2 pt-2 border-t">
                            <button
                              className="text-xs text-primary hover:underline flex items-center"
                              onClick={() => onNavigateToMonth(record.year_month)}
                            >
                              <ExternalLink size={12} className="mr-1" />
                              カード表示で詳しく見る
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </CardContent>

        {/* Past Records Toggle */}
        {pastRecordsAvailable && (
          <CardContent className="p-3 border-t bg-gray-50/50">
            <div className="flex items-center justify-center space-x-3">
              {showPastMonths < pastRecordsCount && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showMorePast}
                  className="text-xs"
                >
                  過去3ヶ月を表示 ({showPastMonths} / {pastRecordsCount}ヶ月表示中)
                </Button>
              )}
              {showPastMonths > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={hidePast}
                  className="text-xs"
                >
                  過去を隠す
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary Stats */}
      {displayedRecords.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">平均月収（表示中）</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(
                  Math.round(
                    displayedRecords.reduce((sum, r) => sum + r.monthly_income, 0) / displayedRecords.length
                  )
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">平均支出（表示中）</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(
                  Math.round(
                    displayedRecords.reduce((sum, r) => sum + r.credit_expenses, 0) / displayedRecords.length
                  )
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">月平均貯蓄額（表示中）</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(
                  Math.round(
                    displayedRecords.reduce(
                      (sum, r) => sum + (r.monthly_income - r.credit_expenses),
                      0
                    ) / displayedRecords.length
                  )
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
