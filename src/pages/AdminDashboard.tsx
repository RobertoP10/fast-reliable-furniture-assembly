
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, Users, CheckCircle, X, Eye, User, LogOut } from "lucide-react";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending-taskers' | 'users' | 'transactions'>('pending-taskers');

  const mockPendingTaskers = [
    {
      id: '1',
      name: 'Alexandru Popescu',
      email: 'alex@email.com',
      location: 'București, Sector 2',
      registeredAt: new Date(Date.now() - 86400000),
      experience: 'Experiență 5 ani în asamblare mobilier'
    },
    {
      id: '2',
      name: 'Maria Ionescu',
      email: 'maria@email.com',
      location: 'Cluj-Napoca',
      registeredAt: new Date(Date.now() - 172800000),
      experience: 'Designer de interior cu experiență în IKEA'
    }
  ];

  const mockUsers = [
    {
      id: '1',
      name: 'Ion Client',
      email: 'client@email.com',
      role: 'client',
      status: 'active',
      tasksCompleted: 5,
      joinedAt: new Date(Date.now() - 2592000000)
    },
    {
      id: '2',
      name: 'Ana Tasker',
      email: 'ana@email.com',
      role: 'tasker',
      status: 'active',
      tasksCompleted: 12,
      joinedAt: new Date(Date.now() - 5184000000)
    }
  ];

  const mockTransactions = [
    {
      id: '1',
      taskTitle: 'Asamblare dulap PAX',
      client: 'Ion Client',
      tasker: 'Ana Tasker',
      amount: 200,
      paymentMethod: 'bank',
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      id: '2',
      taskTitle: 'Asamblare birou',
      client: 'Maria Clientă',
      tasker: 'Andrei Tasker',
      amount: 150,
      paymentMethod: 'cash',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 172800000)
    }
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const handleApproveTasker = (id: string) => {
    console.log('Approving tasker:', id);
  };

  const handleRejectTasker = (id: string) => {
    console.log('Rejecting tasker:', id);
  };

  const handleConfirmTransaction = (id: string) => {
    console.log('Confirming transaction:', id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MGSDEAL
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">{user?.name}</span>
                <Badge className="bg-purple-100 text-purple-700">Admin</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-blue-900">Panel Admin</CardTitle>
                <CardDescription>Gestionează platforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'pending-taskers' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('pending-taskers')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Taskeri în așteptare
                </Button>
                <Button
                  variant={activeTab === 'users' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('users')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Utilizatori
                </Button>
                <Button
                  variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('transactions')}
                >
                  Tranzacții
                </Button>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="shadow-lg border-0 mt-6">
              <CardHeader>
                <CardTitle className="text-blue-900 text-lg">Statistici</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Taskeri în așteptare</span>
                  <Badge className="bg-yellow-100 text-yellow-700">2</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Utilizatori activi</span>
                  <Badge className="bg-green-100 text-green-700">248</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tranzacții pending</span>
                  <Badge className="bg-blue-100 text-blue-700">5</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'pending-taskers' && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">Taskeri în așteptarea aprobării</CardTitle>
                  <CardDescription>
                    Revizuiește și aprobă conturile de taskeri
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nume</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Locația</TableHead>
                        <TableHead>Data înregistrării</TableHead>
                        <TableHead>Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPendingTaskers.map((tasker) => (
                        <TableRow key={tasker.id}>
                          <TableCell className="font-medium">{tasker.name}</TableCell>
                          <TableCell>{tasker.email}</TableCell>
                          <TableCell>{tasker.location}</TableCell>
                          <TableCell>{formatDate(tasker.registeredAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveTasker(tasker.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectTasker(tasker.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === 'users' && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">Toți utilizatorii</CardTitle>
                  <CardDescription>
                    Vizualizează și gestionează utilizatorii platformei
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nume</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Task-uri</TableHead>
                        <TableHead>Membru din</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              user.role === 'client' ? 'text-blue-700' : 'text-green-700'
                            }>
                              {user.role === 'client' ? 'Client' : 'Tasker'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700">
                              {user.status === 'active' ? 'Activ' : 'Inactiv'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.tasksCompleted}</TableCell>
                          <TableCell>{formatDate(user.joinedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === 'transactions' && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">Tranzacții</CardTitle>
                  <CardDescription>
                    Gestionează și confirmă tranzacțiile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Tasker</TableHead>
                        <TableHead>Suma</TableHead>
                        <TableHead>Plată</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.taskTitle}</TableCell>
                          <TableCell>{transaction.client}</TableCell>
                          <TableCell>{transaction.tasker}</TableCell>
                          <TableCell>{transaction.amount} RON</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.paymentMethod === 'cash' ? 'Cash' : 'Transfer'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              transaction.status === 'confirmed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }>
                              {transaction.status === 'confirmed' ? 'Confirmat' : 'În așteptare'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.status === 'pending' && transaction.paymentMethod === 'bank' && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirmTransaction(transaction.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Confirmă
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
