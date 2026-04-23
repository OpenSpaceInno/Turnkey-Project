import { useState } from "react";
import { useListExpenses, useListInvoices, useListVendorInvoices, useListFinancialInstruments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { format } from "date-fns";

export default function Finance() {
  const { data: expenses, isLoading: loadingExpenses } = useListExpenses();
  const { data: invoices, isLoading: loadingInvoices } = useListInvoices();
  const { data: vendorInvoices, isLoading: loadingVendorInvoices } = useListVendorInvoices();
  const { data: instruments, isLoading: loadingInstruments } = useListFinancialInstruments();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">Manage expenses, invoices, and financial instruments.</p>
        </div>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="client_invoices">Client Invoices</TabsTrigger>
          <TabsTrigger value="vendor_invoices">Vendor Invoices</TabsTrigger>
          <TabsTrigger value="instruments">Financial Instruments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Expenses</h2>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Record Expense</Button>
          </div>
          <div className="rounded-md border bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses?.map(expense => (
                  <tr key={expense.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">{format(new Date(expense.expenseDate), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3">{expense.projectName}</td>
                    <td className="px-4 py-3 capitalize">{expense.category}</td>
                    <td className="px-4 py-3">{expense.description}</td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(expense.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline">{expense.status}</Badge>
                    </td>
                  </tr>
                ))}
                {!expenses?.length && !loadingExpenses && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No expenses recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="client_invoices" className="space-y-4 pt-4">
           <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Client Invoices</h2>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Create Invoice</Button>
          </div>
           <div className="rounded-md border bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice #</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices?.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-mono">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3">{invoice.projectName}</td>
                    <td className="px-4 py-3">{format(new Date(invoice.invoiceDate), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3">{format(new Date(invoice.dueDate), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(invoice.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>{invoice.status}</Badge>
                    </td>
                  </tr>
                ))}
                {!invoices?.length && !loadingInvoices && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No invoices found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="vendor_invoices" className="space-y-4 pt-4">
           <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Vendor Invoices</h2>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Vendor Invoice</Button>
          </div>
          <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
            Vendor invoices list...
          </div>
        </TabsContent>

        <TabsContent value="instruments" className="space-y-4 pt-4">
           <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Financial Instruments</h2>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Instrument</Button>
          </div>
          <div className="rounded-md border bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Instrument No.</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Bank</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Expiry Date</th>
                  <th className="px-4 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {instruments?.map(inst => (
                  <tr key={inst.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-mono">{inst.instrumentNumber}</td>
                    <td className="px-4 py-3 capitalize">{inst.instrumentType.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{inst.projectName}</td>
                    <td className="px-4 py-3">{inst.bankName}</td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inst.amount)}
                    </td>
                    <td className="px-4 py-3">{format(new Date(inst.expiryDate), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={inst.status === 'active' ? 'default' : 'secondary'}>{inst.status}</Badge>
                    </td>
                  </tr>
                ))}
                {!instruments?.length && !loadingInstruments && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No financial instruments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
