'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Activity, Users, TrendingUp, Calendar } from 'lucide-react'
import { Transaction, Attendance, AuditLog } from '@/types'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todayTransactions, setTodayTransactions] = useState(0)
  const [todayAttendance, setTodayAttendance] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      const [transactionsRes, attendanceRes, auditRes] = await Promise.all([
        fetch(`/api/transactions?date=${today}`),
        fetch(`/api/attendance?date=${today}`),
        fetch('/api/audit-logs?limit=10'),
      ])

      const [transactionsData, attendanceData, auditData] = await Promise.all([
        transactionsRes.json(),
        attendanceRes.json(),
        auditRes.json(),
      ])

      if (transactionsData.transactions) {
        const txs = transactionsData.transactions as Transaction[]
        setTodayTransactions(txs.length)
        setTodayRevenue(txs.reduce((sum: number, t: Transaction) => sum + t.totalAmount, 0))
        setRecentTransactions(txs.slice(0, 5))
      }

      if (attendanceData.attendance) {
        setTodayAttendance(attendanceData.attendance.length)
      }

      if (auditData.logs) {
        setRecentActivity(auditData.logs)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan operasional klinik hari ini
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendapatan Hari Ini
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {todayRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              Total {todayTransactions} transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transaksi
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Transaksi hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kehadiran Dokter
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAttendance}</div>
            <p className="text-xs text-muted-foreground">
              Dokter hadir hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hari Ini
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
            <CardDescription>5 transaksi terakhir hari ini</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Belum ada transaksi hari ini
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">
                        {tx.doctor?.name || 'Dokter Substitusi'}
                      </p>
                      <p className="text-muted-foreground">
                        {tx.shift?.name} • {tx.transactionDetails?.length || 0} tindakan
                      </p>
                    </div>
                    <p className="font-medium">
                      Rp {tx.totalAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>10 aktivitas terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Belum ada aktivitas
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentActivity.map((log) => (
                  <div key={log.id} className="text-sm">
                    <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-muted-foreground text-xs">
                      {log.user?.name} • {new Date(log.timestamp).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
