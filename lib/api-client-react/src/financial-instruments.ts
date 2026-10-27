import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import { getListFinancialInstrumentsQueryKey } from "./generated/api";

export interface ExpiringInstrument {
  id: number;
  projectId: number;
  projectName?: string;
  instrumentType: string;
  bgSubType?: string | null;
  amount: number | string;
  issueDate?: string | null;
  expiryDate: string;
  releaseDate?: string | null;
  bankName?: string | null;
  referenceNumber?: string | null;
  instrumentNumber: string;
  retentionPercent?: number | null;
  status: string;
  notes?: string | null;
  daysToExpiry: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  alertLevel: "critical" | "warning" | "info" | "none";
  alertMessage: string;
}

export interface ExpiringAlertsResponse {
  asOfDate: string;
  totalInstruments: number;
  totalActiveCount: number;
  totalActiveAmount: number;
  expiring30DaysCount: number;
  expiring30DaysAmount: number;
  urgent15DaysCount: number;
  expiredCount: number;
  expiredAmount: number;
  expiringInstruments: ExpiringInstrument[];
}

export const getExpiringFinancialInstrumentsAlertsQueryKey = () => [
  "financial-instruments",
  "expiring-alerts",
];

export function useExpiringFinancialInstrumentsAlerts() {
  return useQuery({
    queryKey: getExpiringFinancialInstrumentsAlertsQueryKey(),
    queryFn: () =>
      customFetch<ExpiringAlertsResponse>(
        "/api/financial-instruments/expiring-alerts"
      ),
  });
}

export interface RenewInstrumentInput {
  id: number;
  newExpiryDate: string;
  referenceNumber?: string;
  renewalCharges?: number;
  notes?: string;
}

export function useRenewFinancialInstrument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: RenewInstrumentInput) =>
      customFetch(`/api/financial-instruments/${id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getListFinancialInstrumentsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getExpiringFinancialInstrumentsAlertsQueryKey(),
      });
    },
  });
}

export interface ReleaseInstrumentInput {
  id: number;
  releaseDate?: string;
  releaseReference?: string;
  notes?: string;
}

export function useReleaseFinancialInstrument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ReleaseInstrumentInput) =>
      customFetch(`/api/financial-instruments/${id}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getListFinancialInstrumentsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getExpiringFinancialInstrumentsAlertsQueryKey(),
      });
    },
  });
}
