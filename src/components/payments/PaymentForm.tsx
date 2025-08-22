import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";

type Registration = {
  id: string;
  surname?: string;
  middle_name?: string;
  last_name?: string;
};

type PaymentFormProps = {
  registrations: Registration[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
};

const paymentChannelFields: Record<string, { label: string; name: string }[]> = {
  momo: [
    { label: "Mobile Number", name: "mobile_number" },
    { label: "Network", name: "network" },
  ],
  cheque: [
    { label: "Cheque Number", name: "cheque_number" },
    { label: "Bank", name: "bank" },
  ],
  cash: [
    { label: "Received By", name: "received_by" },
  ],
  bank_transfer: [
    { label: "Bank Name", name: "bank_name" },
    { label: "Account Number", name: "account_number" },
    { label: "Transaction ID", name: "transaction_id" },
  ],
};

export const PaymentForm: React.FC<PaymentFormProps> = ({
  registrations,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentChannel, setPaymentChannel] = useState<string>("momo");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  const handleMetadataChange = (name: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegistrationSelect = (id: string) => {
    setSelectedRegistrationIds((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amount,
      payment_channel: paymentChannel,
      payment_reference: paymentReference,
      payment_metadata: metadata,
      registration_ids: selectedRegistrationIds,
    });
  };

  const channelFields = paymentChannel ? paymentChannelFields[paymentChannel] || [] : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          required
        />
      </div>
      <div>
        <Label>Payment Channel</Label>
        <Select value={paymentChannel} onValueChange={setPaymentChannel}>
          <SelectTrigger>
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="momo">Mobile Money</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Payment Reference</Label>
        <Input
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          required
        />
      </div>
      <div>
        <Label>Campers (Select one or more)</Label>
        <div className="max-h-40 overflow-y-auto border rounded p-2">
          {registrations.map((reg) => (
            <label key={reg.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedRegistrationIds.includes(reg.id)}
                onChange={() => handleRegistrationSelect(reg.id)}
              />
              <span>
                {reg.surname} {reg.middle_name} {reg.last_name}
              </span>
            </label>
          ))}
        </div>
      </div>
      {channelFields.length > 0 && (
        <div>
          <Label>Payment Metadata</Label>
          <div className="space-y-2">
            {channelFields.map((field) => (
              <div key={field.name}>
                <Label>{field.label}</Label>
                <Input
                  value={metadata[field.name] || ""}
                  onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="default" disabled={loading}>
          Save Payment
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;
