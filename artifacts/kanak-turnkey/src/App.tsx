import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetCurrentUser, PERMISSIONS } from "@workspace/api-client-react";
import { PermissionGate, AccessDeniedView } from "@/components/auth/permission-gate";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import ResetPasswordPage from "@/pages/reset-password";

import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads/index";
import LeadDetail from "@/pages/leads/[id]";
import Projects from "@/pages/projects/index";
import ProjectDetail from "@/pages/projects/[id]";
import ProjectJourneyPage from "@/pages/projects/project-journey-page";
import Tasks from "@/pages/tasks/index";
import Finance from "@/pages/finance/index";
import AccountsReceivablePage from "@/pages/finance/ar";
import AccountsPayablePage from "@/pages/finance/ap";
import Procurement from "@/pages/procurement/index";
import MaterialRequests from "@/pages/procurement/material-requests";
import MaterialRequestNew from "@/pages/procurement/material-requests-new";
import MaterialRequestEdit from "@/pages/procurement/material-requests-edit";
import MaterialRequestDetail from "@/pages/procurement/material-requests-detail";
import Rfqs from "@/pages/procurement/rfqs";
import RfqDetail from "@/pages/procurement/rfqs-detail";
import QuoteCompare from "@/pages/procurement/quote-compare";
import PurchaseOrderDetail from "@/pages/procurement/purchase-orders-detail";
import ManagerApprovals from "@/pages/procurement/manager-approvals";
import ProcurementDemo from "@/pages/procurement-demo";
import Communications from "@/pages/communications/index";
import Meetings from "@/pages/meetings/index";
import Documents from "@/pages/documents/index";
import Notifications from "@/pages/notifications/index";
import AuditLogs from "@/pages/audit-logs/index";
import Admin from "@/pages/admin/index";
import RoleApprovals from "@/pages/admin/role-approvals";
import Settings from "@/pages/settings/index";
import TaskTemplates from "@/pages/task-templates/index";
import RaBillsDashboard from "@/pages/ra-bills/index";
import ContractsPage from "@/pages/ra-bills/contracts";
import WorkCompletionNew from "@/pages/ra-bills/work-completion-new";
import WorkCompletionDetail from "@/pages/ra-bills/work-completion-detail";
import RaBillNew from "@/pages/ra-bills/ra-bill-new";
import RaBillDetail from "@/pages/ra-bills/ra-bill-detail";
import PmApprovalsPage from "@/pages/ra-bills/pm-approvals";
import InvoiceDetail from "@/pages/ra-bills/invoice-detail";
import SiteExecutionPage from "@/pages/site-execution/index";
import QualitySafetyPage from "@/pages/quality-safety/index";
import ReportsPage from "@/pages/reports/index";
import ClientPortalPage from "@/pages/client-portal/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({
  component: Component,
  permission,
  roles,
  path,
}: {
  component: React.ComponentType<any>;
  permission?: string;
  roles?: string[];
  path: string;
}) {
  return (
    <Route path={path}>
      {(params) => (
        <PermissionGate
          permission={permission}
          roles={roles}
          fallback={<AccessDeniedView />}
        >
          <Component params={params} />
        </PermissionGate>
      )}
    </Route>
  );
}

function AppContent() {
  const { data: user, isLoading, error } = useGetCurrentUser();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Kanak Turnkey...</p>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (error || !user) {
    if (location.startsWith("/reset-password")) {
      return <ResetPasswordPage />;
    }
    if (location !== "/login") {
      return <Redirect to="/login" />;
    }
    return <LoginPage />;
  }

  // Allow visiting /reset-password even if user has session
  if (location.startsWith("/reset-password")) {
    return <ResetPasswordPage />;
  }

  // If authenticated and visiting /login, redirect to dashboard
  if (location === "/login") {
    return <Redirect to="/" />;
  }

  // Authenticated routes wrapped in AppLayout
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />

        {/* Leads: Restricted to Admin and Project Managers */}
        <ProtectedRoute path="/leads/:id" component={LeadDetail} roles={["admin", "project_manager"]} />
        <ProtectedRoute path="/leads" component={Leads} roles={["admin", "project_manager"]} />

        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id/journey" component={ProjectJourneyPage} />
        <Route path="/projects/:id" component={ProjectDetail} />

        <Route path="/tasks" component={Tasks} />
        <ProtectedRoute path="/task-templates" component={TaskTemplates} roles={["admin", "project_manager"]} />

        {/* Finance Hub & Ledgers: Restricted to Admin and Accountant */}
        <ProtectedRoute path="/finance/ar" component={AccountsReceivablePage} roles={["admin", "accountant"]} permission={PERMISSIONS.BILLING_VIEW} />
        <ProtectedRoute path="/finance/ap" component={AccountsPayablePage} roles={["admin", "accountant"]} permission={PERMISSIONS.PAYMENT_VIEW} />
        <ProtectedRoute path="/finance" component={Finance} roles={["admin", "accountant"]} permission={PERMISSIONS.BILLING_VIEW} />

        {/* Procurement Routes */}
        <Route path="/procurement/demo" component={ProcurementDemo} />
        <ProtectedRoute path="/procurement/manager-approvals" component={ManagerApprovals} permission={PERMISSIONS.PROCUREMENT_APPROVE} roles={["admin", "project_manager"]} />
        <Route path="/procurement/material-requests/new" component={MaterialRequestNew} />
        <Route path="/procurement/material-requests/:id/edit" component={MaterialRequestEdit} />
        <Route path="/procurement/material-requests/:id" component={MaterialRequestDetail} />
        <Route path="/procurement/material-requests" component={MaterialRequests} />
        <ProtectedRoute path="/procurement/rfqs/:id/compare" component={QuoteCompare} roles={["admin", "procurement_officer"]} />
        <ProtectedRoute path="/procurement/rfqs/:id" component={RfqDetail} roles={["admin", "procurement_officer"]} />
        <ProtectedRoute path="/procurement/rfqs" component={Rfqs} roles={["admin", "procurement_officer"]} />
        <Route path="/procurement/purchase-orders/:id" component={PurchaseOrderDetail} />
        <Route path="/procurement/purchase-orders">
          {() => <Redirect to="/procurement?tab=pos" />}
        </Route>
        <Route path="/procurement/inventory">
          {() => <Redirect to="/procurement?tab=materials" />}
        </Route>
        <Route path="/procurement/vendors">
          {() => <Redirect to="/procurement?tab=vendors" />}
        </Route>
        <Route path="/procurement" component={Procurement} />

        {/* Site Execution Module */}
        <Route path="/site-execution/daily-reports">
          {() => <Redirect to="/site-execution?tab=daily-reports" />}
        </Route>
        <Route path="/site-execution/work-completions">
          {() => <Redirect to="/ra-bills?tab=work-completions" />}
        </Route>
        <Route path="/site-execution/milestones">
          {() => <Redirect to="/site-execution?tab=milestones" />}
        </Route>
        <Route path="/site-execution" component={SiteExecutionPage} />

        {/* Quality & Safety Module - Restricted from Site Engineer */}
        <ProtectedRoute path="/quality-safety/inspections" component={() => <Redirect to="/quality-safety?tab=inspections" />} roles={["admin", "project_manager"]} />
        <ProtectedRoute path="/quality-safety/snag-list" component={() => <Redirect to="/quality-safety?tab=snag-list" />} roles={["admin", "project_manager"]} />
        <ProtectedRoute path="/quality-safety/safety-logs" component={() => <Redirect to="/quality-safety?tab=safety-logs" />} roles={["admin", "project_manager"]} />
        <ProtectedRoute path="/quality-safety/test-reports" component={() => <Redirect to="/quality-safety?tab=test-reports" />} roles={["admin", "project_manager"]} />
        <ProtectedRoute path="/quality-safety" component={QualitySafetyPage} roles={["admin", "project_manager"]} />

        {/* RA Bills & Work Completion Workflow Routes */}
        <Route path="/contracts/new" component={ContractsPage} />
        <Route path="/contracts" component={ContractsPage} />
        <Route path="/work-completions/new" component={WorkCompletionNew} />
        <Route path="/work-completions/:id" component={WorkCompletionDetail} />
        <Route path="/work-completions">
          {() => <Redirect to="/ra-bills?tab=work-completions" />}
        </Route>
        <Route path="/ra-bills/contracts/new" component={ContractsPage} />
        <Route path="/ra-bills/contracts" component={ContractsPage} />
        <Route path="/ra-bills/work-completions/new" component={WorkCompletionNew} />
        <Route path="/ra-bills/work-completions/:id" component={WorkCompletionDetail} />
        <Route path="/ra-bills/work-completions">
          {() => <Redirect to="/ra-bills?tab=work-completions" />}
        </Route>
        <ProtectedRoute path="/ra-bills/new" component={RaBillNew} roles={["admin", "project_manager", "accountant"]} />
        <Route path="/ra-bills/detail/:id" component={RaBillDetail} />
        <ProtectedRoute path="/ra-bills/pm-approvals" component={PmApprovalsPage} roles={["admin", "project_manager", "accountant"]} />
        <ProtectedRoute path="/ra-bills/invoices/:id" component={InvoiceDetail} roles={["admin", "accountant"]} />
        <Route path="/ra-bills" component={RaBillsDashboard} />

        {/* Reports & Analytics Module */}
        <Route path="/reports/project-progress">
          {() => <Redirect to="/reports?tab=project-progress" />}
        </Route>
        <Route path="/reports/financial-variance">
          {() => <Redirect to="/reports?tab=financial-variance" />}
        </Route>
        <Route path="/reports/procurement-summary">
          {() => <Redirect to="/reports?tab=procurement-summary" />}
        </Route>
        <Route path="/reports/quality-safety">
          {() => <Redirect to="/reports?tab=quality-safety" />}
        </Route>
        <Route path="/reports" component={ReportsPage} />
        <Route path="/client-portal" component={ClientPortalPage} />

        <Route path="/communications" component={Communications} />
        <Route path="/meetings" component={Meetings} />
        <Route path="/documents" component={Documents} />
        <Route path="/notifications" component={Notifications} />

        {/* Administration Routes */}
        <ProtectedRoute path="/audit-logs" component={AuditLogs} permission={PERMISSIONS.AUDIT_LOG_VIEW} roles={["admin"]} />
        <ProtectedRoute path="/admin/role-approvals" component={RoleApprovals} roles={["admin", "project_manager"]} />
        <ProtectedRoute path="/admin" component={Admin} permission={PERMISSIONS.ADMIN_ACCESS} roles={["admin"]} />
        <Route path="/settings" component={Settings} />

        {/* Catch-all 404 */}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter>
            <AppContent />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
