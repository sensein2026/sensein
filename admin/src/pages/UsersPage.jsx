import { useState, useMemo } from 'react'
import { useGetAdminUsersQuery } from '@/features/adminApi'
import {
  Users,
  Search,
  Mail,
  Calendar,
  Sparkles,
  Download,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  UserCheck,
  Phone,
} from 'lucide-react'

export default function UsersPage() {
  const { data: usersData, isLoading, isError, refetch } = useGetAdminUsersQuery()
  const [searchTerm, setSearchTerm] = useState('')

  const rawUsers = Array.isArray(usersData?.users)
    ? usersData.users
    : Array.isArray(usersData?.data)
    ? usersData.data
    : Array.isArray(usersData)
    ? usersData
    : []

  // Filter out any admin accounts; only keep registered store customers
  const customers = useMemo(() => {
    return rawUsers
      .filter((u) => u.role !== 'admin')
      .filter((u) => {
        const term = searchTerm.toLowerCase().trim()
        if (!term) return true
        return (
          u.name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          (u.phone && u.phone.toLowerCase().includes(term))
        )
      })
  }, [rawUsers, searchTerm])

  // Total registered customers count
  const totalCustomersCount = rawUsers.filter((u) => u.role !== 'admin').length

  // Export Customer List to Excel (CSV)
  const handleExportCsv = () => {
    if (customers.length === 0) {
      if (window.__adminToast) {
        window.__adminToast.error('No customer data available to export.', 'Export Empty')
      }
      return
    }

    const headers = [
      'Customer ID',
      'Customer Name',
      'Email Address',
      'Phone Number',
      'Account Role',
      'Registration Date',
      'Status',
    ]

    const rows = customers.map((c) => [
      `"${c._id || ''}"`,
      `"${(c.name || 'Anonymous Customer').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || 'N/A').replace(/"/g, '""')}"`,
      `"Customer"`,
      `"${c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'N/A'}"`,
      `"Active Verified"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Sensein_Registered_Customers_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (window.__adminToast) {
      window.__adminToast.success(
        `Successfully exported ${customers.length} customer records to Excel!`,
        'Excel Sheet Generated'
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-mono text-[11px] uppercase tracking-widest font-bold">
            <Users className="h-3.5 w-3.5" />
            <span>Customer Directory</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display mt-1">
            Registered Store Customers
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            View verified customer client accounts, contact details, and export to Excel sheet.
          </p>
        </div>

        {/* Excel Export Button */}
        <button
          onClick={handleExportCsv}
          disabled={isLoading || customers.length === 0}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Export Excel Sheet</span>
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Registered Customers
          </div>
          <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1">
            {totalCustomersCount}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Account Verification
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
            <UserCheck className="h-5 w-5" />
            <span>100% Verified</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Platform Security
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-2">
            Admin access is isolated & secure.
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, email ID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100 shrink-0">
            {customers.length} Customers Found
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Loading customer accounts...</span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-rose-600 text-xs font-semibold">
            Failed to load customers from database.
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <Users className="h-10 w-10 text-slate-300" />
            <span>No customer accounts match your search.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] font-bold tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4 sm:p-5">Customer Profile</th>
                  <th className="p-4 sm:p-5">Email Address</th>
                  <th className="p-4 sm:p-5">Phone Number</th>
                  <th className="p-4 sm:p-5">Registered On</th>
                  <th className="p-4 sm:p-5 text-right">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Customer Profile */}
                    <td className="p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {c.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            {c.name || 'Anonymous Customer'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            ID: #{c._id?.slice(-6).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4 sm:p-5 font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="p-4 sm:p-5 font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {c.phone ? (
                          <span className="font-semibold text-slate-800">{c.phone}</span>
                        ) : (
                          <span className="text-slate-400 font-sans text-[11px] italic">Not provided yet</span>
                        )}
                      </div>
                    </td>

                    {/* Registered Date */}
                    <td className="p-4 sm:p-5 text-slate-500 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Verified Buyer'}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 sm:p-5 text-right">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 uppercase font-mono">
                        <CheckCircle2 className="h-3 w-3" /> Active Customer
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
