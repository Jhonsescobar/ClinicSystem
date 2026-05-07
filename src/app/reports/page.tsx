'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, DollarSign, Activity, Users, Calendar } from 'lucide-react'

interface DoctorStat {
  doctorId: string
  doctorName: string
  transactionCount: number
  totalAmount: number
  actions: Record<string, { count: number; total: number }>
}

interface ActionStat {
  actionName: string
  count: number
  total: number
}

interface DailyReportData {
  type: 'daily'
  date: string
  totalRevenue: number
  transactionCount: number
  attendanceCount: number
  isLocked: boolean
  doctorStats: DoctorStat[]
}

interface MonthlyReportData {
  type: 'monthly'
  startDate: string
  endDate: string
  totalRevenue: number
  transactionCount: number
  attendanceCount: number
  doctorStats: DoctorStat[]
  actionStats: ActionStat[]
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('daily')

  // Daily report state
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null)
  const [dailyLoading, setDailyLoading] = useState(false)

  // Monthly report state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportData | null>(null)
  const [monthlyLoading, setMonthlyLoading] = useState(false)

  // Initialize start and end date on component mount
  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
    fetchDailyReport()
  }, [])

  // Fetch daily report when date changes
  useEffect(() => {
    if (dailyDate) {
      fetchDailyReport()
    }
  }, [dailyDate])

  // Fetch monthly report when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      fetchMonthlyReport()
    }
  }, [startDate, endDate])

  const fetchDailyReport = async () => {
    if (!dailyDate) return
    setDailyLoading(true)
    try {
      const response = await fetch(`/api/reports?date=${dailyDate}`)
      const data = await response.json()
      setDailyReport(data)
    } catch (error) {
      console.error('Failed to fetch daily report:', error)
    } finally {
      setDailyLoading(false)
    }
  }

  const fetchMonthlyReport = async () => {
    if (!startDate || !endDate) return
    setMonthlyLoading(true)
    try {
      const response = await fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`)
      const data = await response.json()
      setMonthlyReport(data)
    } catch (error) {
      console.error('Failed to fetch monthly report:', error)
    } finally {
      setMonthlyLoading(false)
    }
  }

  const exportDailyExcel = () => {
    if (!dailyDate) return
    const link = document.createElement('a')
    link.href = `/api/reports/export?date=${dailyDate}`
    link.download = `laporan-harian-${dailyDate}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportMonthlyExcel = () => {
    if (!startDate || !endDate) return
    const link = document.createElement('a')
    link.href = `/api/reports/export?startDate=${startDate}&endDate=${endDate}`
    link.download = `laporan-${startDate}-${endDate}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  const renderStatsCards = (revenue: number, transactions: number, attendance: number) => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Pendapatan
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(revenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total pendapatan periode ini
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Jumlah Transaksi
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{transactions}</div>
          <p className="text-xs text-muted-foreground">
            Total transaksi periode ini
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
          <div className="text-2xl font-bold">{attendance}</div>
          <p className="text-xs text-muted-foreground">
            Total kehadiran periode ini
          </p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground">
            Lihat dan unduh laporan operasional klinik
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="monthly">Bulanan</TabsTrigger>
        </TabsList>

        {/* Daily Report Tab */}
        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Harian</CardTitle>
              <CardDescription>
                Pilih tanggal untuk melihat laporan harian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Tanggal
                  </label>
                  <Input
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <Button onClick={exportDailyExcel} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>

              {dailyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : dailyReport ? (
                <>
                  {renderStatsCards(
                    dailyReport.totalRevenue,
                    dailyReport.transactionCount,
                    dailyReport.attendanceCount
                  )}

                  {dailyReport.isLocked && (
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4 text-sm text-amber-800 dark:text-amber-200">
                      <strong>Info:</strong> Laporan untuk tanggal ini sudah dikunci dan tidak dapat dimodifikasi.
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Rincian per Dokter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dokter</TableHead>
                            <TableHead>Shift</TableHead>
                            <TableHead>Tindakan</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyReport.doctorStats.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                Tidak ada data untuk tanggal ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            dailyReport.doctorStats.map((stat) => {
                              const actionsList = Object.entries(stat.actions)
                                .map(([action, data]) => `${action} x${data.count}`)
                                .join(', ')
                              return (
                                <TableRow key={stat.doctorId}>
                                  <TableCell className="font-medium">
                                    {stat.doctorName}
                                  </TableCell>
                                  <TableCell>
                                    {stat.transactionCount} transaksi
                                  </TableCell>
                                  <TableCell>{actionsList || '-'}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(stat.totalAmount)}
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Report Tab */}
        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Bulanan</CardTitle>
              <CardDescription>
                Pilih rentang tanggal untuk melihat laporan bulanan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end flex-wrap">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tanggal Mulai
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tanggal Akhir
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <Button onClick={exportMonthlyExcel} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>

              {monthlyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : monthlyReport ? (
                <>
                  {renderStatsCards(
                    monthlyReport.totalRevenue,
                    monthlyReport.transactionCount,
                    monthlyReport.attendanceCount
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Statistik per Dokter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dokter</TableHead>
                            <TableHead>Jumlah Transaksi</TableHead>
                            <TableHead className="text-right">Total Pendapatan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthlyReport.doctorStats.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                Tidak ada data untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            monthlyReport.doctorStats.map((stat) => (
                              <TableRow key={stat.doctorId}>
                                <TableCell className="font-medium">
                                  {stat.doctorName}
                                </TableCell>
                                <TableCell>{stat.transactionCount}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(stat.totalAmount)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tindakan Paling Sering</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tindakan</TableHead>
                            <TableHead>Jumlah</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthlyReport.actionStats.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                Tidak ada data untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            monthlyReport.actionStats
                              .sort((a, b) => b.count - a.count)
                              .map((stat) => (
                                <TableRow key={stat.actionName}>
                                  <TableCell className="font-medium">
                                    {stat.actionName}
                                  </TableCell>
                                  <TableCell>{stat.count}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(stat.total)}
                                  </TableCell>
                                </TableRow>
                              ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
