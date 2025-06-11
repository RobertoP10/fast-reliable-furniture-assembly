
import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminStats } from "@/components/admin/AdminStats";
import { PendingTaskersTab } from "@/components/admin/tabs/PendingTaskersTab";
import { UsersTab } from "@/components/admin/tabs/UsersTab";
import { PendingTransactionsTab } from "@/components/admin/tabs/PendingTransactionsTab";
import { TransactionsTab } from "@/components/admin/tabs/TransactionsTab";
import { AnalyticsTab } from "@/components/admin/tabs/AnalyticsTab";
import { useAdminData } from "@/hooks/useAdminData";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'pending-taskers' | 'users' | 'pending-transactions' | 'transactions' | 'analytics'>('pending-taskers');

  // Filter states
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedTasker, setSelectedTasker] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  const {
    pendingTaskers,
    setPendingTaskers,
    allUsers,
    pendingTransactions,
    setPendingTransactions,
    transactions,
    analytics,
    stats,
    setStats,
    loading,
    taskers,
    clients,
    loadData
  } = useAdminData(activeTab, dateFilter, selectedTasker, selectedClient);

  const clearFilters = () => {
    setDateFilter({ start: '', end: '' });
    setSelectedTasker('');
    setSelectedClient('');
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <AdminSidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            stats={stats}
            loading={loading}
            onRefresh={loadData}
          />
          <AdminStats stats={stats} />

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'pending-taskers' && (
              <PendingTaskersTab
                pendingTaskers={pendingTaskers}
                setPendingTaskers={setPendingTaskers}
                loading={loading}
                formatDate={formatDate}
              />
            )}

            {activeTab === 'users' && (
              <UsersTab
                allUsers={allUsers}
                loading={loading}
                formatDate={formatDate}
              />
            )}

            {activeTab === 'pending-transactions' && (
              <PendingTransactionsTab
                pendingTransactions={pendingTransactions}
                setPendingTransactions={setPendingTransactions}
                setStats={setStats}
                loading={loading}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsTab
                transactions={transactions}
                loading={loading}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                selectedTasker={selectedTasker}
                setSelectedTasker={setSelectedTasker}
                selectedClient={selectedClient}
                setSelectedClient={setSelectedClient}
                taskers={taskers}
                clients={clients}
                clearFilters={clearFilters}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsTab
                analytics={analytics}
                loading={loading}
                formatCurrency={formatCurrency}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
