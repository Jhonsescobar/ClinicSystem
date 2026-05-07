export interface User {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  isActive: boolean
  createdAt: string
}

export interface Doctor {
  id: string
  name: string
  status: 'PERMANENT' | 'SUBSTITUTE'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: string
  doctorId?: string
  manualDoctorName?: string
  shiftId: string
  photoUrl: string
  attendanceDate: string
  attendanceTime: string
  adminId: string
  createdAt: string
  updatedAt: string
  doctor?: Doctor
  shift?: Shift
  admin?: Pick<User, 'id' | 'name' | 'email'>
}

export interface MedicalAction {
  id: string
  name: string
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TransactionDetail {
  id: string
  transactionId: string
  medicalActionId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
  updatedAt: string
  medicalAction?: MedicalAction
}

export interface Transaction {
  id: string
  doctorId?: string
  shiftId: string
  transactionDate: string
  totalAmount: number
  adminId: string
  isLocked: boolean
  createdAt: string
  updatedAt: string
  doctor?: Doctor
  shift?: Shift
  admin?: Pick<User, 'id' | 'name' | 'email'>
  transactionDetails?: TransactionDetail[]
}

export interface DailyLock {
  id: string
  lockDate: string
  isLocked: boolean
  lockedAt?: string
  unlockedAt?: string
  lockedBy?: string
  unlockedBy?: string
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  tableName: string
  recordId?: string
  dataBefore?: string
  dataAfter?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  user?: Pick<User, 'id' | 'name' | 'email'>
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
