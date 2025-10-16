import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreatePledgeFulfillmentRequest } from "@/lib/types";

interface PledgeFulfillmentFormProps {
  pledgeAmount: number;
  outstandingBalance: number;
  onSubmit: (data: CreatePledgeFulfillmentRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const PledgeFulfillmentForm = ({
  pledgeAmount,
  outstandingBalance,
  onSubmit,
  onCancel,
  loading = false,
}: PledgeFulfillmentFormProps) => {
  const [formData, setFormData] = useState<CreatePledgeFulfillmentRequest>({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (amount > outstandingBalance) {
      newErrors.amount = `Amount cannot exceed outstanding balance of ${formatCurrency(outstandingBalance)}`;
    }

    // Payment method validation
    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleInputChange = (field: keyof CreatePledgeFulfillmentRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pledge Summary */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Total Pledge:</span>
          <span className="text-lg font-semibold text-gray-900">{formatCurrency(pledgeAmount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Outstanding Balance:</span>
          <span className="text-lg font-semibold text-red-600">{formatCurrency(outstandingBalance)}</span>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount">Fulfillment Amount (GHS) *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          max={outstandingBalance}
          value={formData.amount}
          onChange={(e) => handleInputChange('amount', e.target.value)}
          placeholder="Enter amount"
          className={errors.amount ? 'border-red-500' : ''}
          required
        />
        {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <Label htmlFor="payment_method">Payment Method *</Label>
        <Select
          value={formData.payment_method}
          onValueChange={(value) => handleInputChange('payment_method', value)}
        >
          <SelectTrigger className={errors.payment_method ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="momo">Mobile Money</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
        {errors.payment_method && <p className="text-sm text-red-500">{errors.payment_method}</p>}
      </div>

      {/* Reference Number */}
      <div className="space-y-2">
        <Label htmlFor="reference_number">Reference Number</Label>
        <Input
          id="reference_number"
          type="text"
          value={formData.reference_number || ''}
          onChange={(e) => handleInputChange('reference_number', e.target.value)}
          placeholder="Optional reference number"
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Optional notes about this fulfillment"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Fulfillment'}
        </Button>
      </div>
    </form>
  );
};

export default PledgeFulfillmentForm;
