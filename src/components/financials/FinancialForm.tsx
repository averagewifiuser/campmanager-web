import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FinancialFormProps = {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
};

const FinancialForm: React.FC<FinancialFormProps> = ({ onSubmit, onCancel, loading }) => {
  const [amount, setAmount] = useState<number>(0);
  const [transactionType, setTransactionType] = useState<string>("income");
  const [transactionCategory, setTransactionCategory] = useState<string>("offering");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [description, setDescription] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [receivedBy, setReceivedBy] = useState<string>("");
  const [approvedBy, setApprovedBy] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    onSubmit({
      amount,
      transaction_type: transactionType,
      transaction_category: transactionCategory,
      payment_method: paymentMethod,
      description,
      reference_number: referenceNumber,
      received_by: receivedBy,
      approved_by: approvedBy,
      date: new Date(date).toISOString(),
    });
    
    // Reset form
    setAmount(0);
    setTransactionType("income");
    setTransactionCategory("offering");
    setPaymentMethod("cash");
    setDescription("");
    setReferenceNumber("");
    setReceivedBy("");
    setApprovedBy("");
    setDate(new Date().toISOString().split('T')[0]);
  };

  const isFormValid = () => {
    return amount > 0 && 
           description.trim() !== "" && 
           referenceNumber.trim() !== "" && 
           receivedBy.trim() !== "" && 
           approvedBy.trim() !== "" &&
           date !== "";
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="transaction-type">Transaction Type</Label>
        <Select value={transactionType} onValueChange={setTransactionType}>
          <SelectTrigger>
            <SelectValue placeholder="Select transaction type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="transaction-category">Transaction Category</Label>
        <Select value={transactionCategory} onValueChange={setTransactionCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="offering">Offering</SelectItem>
            <SelectItem value="pledges">Pledges</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="donation">Donation</SelectItem>
            <SelectItem value="camp_payment">Camp Payment</SelectItem>
            <SelectItem value="camp_expense">Camp Expense</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Enter amount"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description of the transaction"
          required
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="payment-method">Payment Method</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="momo">Mobile Money</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="reference-number">Reference Number</Label>
        <Input
          id="reference-number"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="Enter reference number"
          required
        />
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="received-by">Received By</Label>
        <Input
          id="received-by"
          value={receivedBy}
          onChange={(e) => setReceivedBy(e.target.value)}
          placeholder="Enter name of person who received"
          required
        />
      </div>

      <div>
        <Label htmlFor="approved-by">Approved By</Label>
        <Input
          id="approved-by"
          value={approvedBy}
          onChange={(e) => setApprovedBy(e.target.value)}
          placeholder="Enter name of person who approved"
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="default" 
          disabled={loading || !isFormValid()}
          onClick={handleSubmit}
        >
          {loading ? "Saving..." : "Save Financial Record"}
        </Button>
      </div>
    </div>
  );
};

export default FinancialForm;
