import { useState } from 'react'
import {
  useGetAuditLogsQuery,
  useRecoverFromLogMutation,
} from '@/features/adminApi'
import {
  History,
  RotateCcw,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Loader2,
  Trash2,
  PlusCircle,
  Edit,
  Upload,
} from 'lucide-react'

export default function ActivityVaultPage() {
  const [actionFilter, setActionFilter] = useState('all')
  const [onlyRecoverable, setOnlyRecoverable] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [notification, setNotification] = useState('')

  const { data: response, isLoading, refetch } = useGetAuditLogsQuery({
    action: actionFilter,
    isRecoverable: onlyRecoverable ? 'true' : undefined,
    search: searchTerm,
  })

  const [recoverFromLog, { isLoading: isRecovering }] = useRecoverFromLogMutation()

  const logs = response?.data || []
  const stats = response?.stats || { total: 0, recoverable: 0 }

  const showMsg = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 4000)
  }

  const handleRecover = async (logId, title) => {
    if (!window.confirm(`Are you sure you want to recover & restore snapshot for "${title}"?`)) {
      return
    }
    try {
      await recoverFromLog(logId).unwrap()
      showMsg(`✅ Successfully recovered and restored: ${title}!`)
      refetch()
    } catch (err) {
      showMsg('Failed to recover item.', true)
    }
  }

  const handleDownloadCsv = () => {
    const headers = [
      'Action Type (ઓપરેશન: ADD / UPDATE / REMOVE / RESTORE / UPLOAD)',
      'Location / Section / Module (કઈ જગ્યાએ / સેક્શન પર ફેરફાર કર્યો)',
      'Item / Category / File Name (કઈ આઇટમ / ફાઈલ / કેટેગરી)',
      'Property / Field Name (અંદરની વિગત / પ્રોપર્ટી)',
      'Value Before Change (🔴 પહેલાં શું હતું - Previous Data)',
      'Value After Change (🟢 હાલમાં શું છે - New / Live Data)',
      'Action Description (વિગતવાર વર્ણન)',
      'Date & Time (ચોક્કસ તારીખ અને સમય)',
      'Admin Performer (કોણે કર્યું - Email)',
      '1-Click Recovery Available (બેકઅપ ઉપલબ્ધ)',
      'Audit Reference ID',
    ]

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = []

    logs.forEach((l) => {
      const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN') : 'N/A'
      const adminEmail = l.performerEmail || 'admin@sensein.in'
      const hasSnapshot = l.snapshotData ? (l.recoveredAt ? 'RESTORED' : 'YES (1-Click Restore Available)') : 'NO'
      const changesList = l.details?.changes || []

      if (changesList.length > 0) {
        changesList.forEach((c) => {
          const location = c.section ? `Front Page CMS -> ${c.section}` : (l.entityType || 'Homepage CMS')
          const itemName = c.categoryOrItem || c.field || l.title
          const propertyName = c.property || 'Content Value'
          const beforeVal = c.beforeValue || '(None / Not Set)'
          const afterVal = c.afterValue || '(None / Not Set)'
          let opType = l.action
          if (c.status === 'NEWLY_ADDED') opType = 'ADD (NEW ITEM)'
          else if (c.status === 'MODIFIED') opType = 'UPDATE / CHANGE'

          rows.push([
            escapeCsv(opType),
            escapeCsv(location),
            escapeCsv(itemName),
            escapeCsv(propertyName),
            escapeCsv(beforeVal),
            escapeCsv(afterVal),
            escapeCsv(l.title),
            escapeCsv(dateStr),
            escapeCsv(adminEmail),
            escapeCsv(hasSnapshot),
            escapeCsv(l._id),
          ])
        })
      } else {
        let location = l.entityType || 'General System'
        let itemName = l.title || 'Item'
        let propName = 'Asset / Record Status'
        let beforeVal = '(Previous Active State)'
        let afterVal = '(Updated State)'

        if (l.entityType === 'MediaAsset') {
          location = 'Media Library & Vault'
          itemName = l.title.replace('Uploaded new asset: ', '').replace('Moved asset to Trash: ', '')
          if (l.action === 'UPLOAD') {
            beforeVal = '✨ [NEW ASSET — Previously Did Not Exist / અગાઉ નહોતું]'
            afterVal = `Live Media Asset: ${itemName}`
          } else if (l.action === 'DELETE') {
            beforeVal = 'Active in Media Library'
            afterVal = '🗑️ Moved to Trash / Archived'
          } else if (l.action === 'RESTORE') {
            beforeVal = 'In Trash / Deleted'
            afterVal = '🟢 Restored to Active Library'
          }
        } else if (l.entityType === 'HomepageConfig') {
          location = 'Front Page CMS'
          if (l.action === 'RESET') {
            beforeVal = 'Custom Homepage Layout'
            afterVal = '🔄 Reset to Original Default Template'
          }
        }

        rows.push([
          escapeCsv(l.action),
          escapeCsv(location),
          escapeCsv(itemName),
          escapeCsv(propName),
          escapeCsv(beforeVal),
          escapeCsv(afterVal),
          escapeCsv(l.title),
          escapeCsv(dateStr),
          escapeCsv(adminEmail),
          escapeCsv(hasSnapshot),
          escapeCsv(l._id),
        ])
      }
    })

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Activity_Recovery_Audit_Master_Sheet_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showMsg('📥 Downloaded comprehensive Activity & Recovery Audit Sheet!')
  }

  const getActionBadge = (action) => {
    switch (action) {
      case 'UPLOAD':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20 text-[10px] font-mono font-bold flex items-center gap-1 w-max">
            <Upload className="h-3 w-3 text-blue-600" /> UPLOAD
          </span>
        )
      case 'CREATE':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1 w-max">
            <PlusCircle className="h-3 w-3 text-emerald-600" /> CREATE
          </span>
        )
      case 'UPDATE':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 text-[10px] font-mono font-bold flex items-center gap-1 w-max">
            <Edit className="h-3 w-3 text-amber-600" /> UPDATE
          </span>
        )
      case 'DELETE':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 border border-rose-500/20 text-[10px] font-mono font-bold flex items-center gap-1 w-max">
            <Trash2 className="h-3 w-3 text-rose-600" /> DELETE
          </span>
        )
      case 'RESTORE':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 border border-purple-500/20 text-[10px] font-mono font-bold flex items-center gap-1 w-max">
            <RotateCcw className="h-3 w-3 text-purple-600" /> RESTORE
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-700 border border-slate-500/20 text-[10px] font-mono font-bold">
            {action}
          </span>
        )
    }
  }

  const getLogLocation = (log) => {
    if (log.details?.changes && log.details.changes.length > 0) {
      const sec = log.details.changes[0]?.section
      if (sec) return sec.includes('Bulk') ? sec : `Front Page CMS -> ${sec}`
    }
    if (log.entityType === 'BulkOrderConfig') return 'Bulk Orders -> Quantity Tiers'
    if (log.entityType === 'BulkOrder') return 'Bulk Orders -> Lead Inquiry'
    if (log.entityType === 'MediaAsset') return 'Media Library & Vault'
    if (log.entityType === 'HomepageConfig') return 'Front Page CMS'
    if (log.entityType === 'Product') return 'Products Catalog'
    return log.entityType || 'General System'
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-6 sm:p-7 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-mono text-[11px] uppercase tracking-widest font-bold">
            <History className="h-3.5 w-3.5" />
            <span>Audit Trail &amp; Data Protection</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display mt-1">
            Activity Logs &amp; Recovery Vault
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Audit trails of all changes, deletions, location updates &amp; 1-click snapshot restore.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Download Audit Sheet (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, location, section, file, or admin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none font-medium transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyRecoverable}
              onChange={(e) => setOnlyRecoverable(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span>Recoverable Snapshots Only ({stats.recoverable})</span>
          </label>

          <div className="flex items-center gap-1.5">
            {['all', 'UPLOAD', 'UPDATE', 'DELETE', 'RESTORE'].map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => setActionFilter(act)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${
                  actionFilter === act
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="font-mono text-xs font-bold text-slate-600">Loading activity audit log...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-3">
            <History className="h-10 w-10 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">No activity logs recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Any file uploads, CMS updates, additions, or removals will automatically record here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Location / Section</th>
                  <th className="py-3.5 px-4">Description / Item Changed</th>
                  <th className="py-3.5 px-4">Admin Performer</th>
                  <th className="py-3.5 px-4">Timestamp (Date &amp; Time)</th>
                  <th className="py-3.5 px-4 text-right">Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const location = getLogLocation(log)
                  return (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Action Badge */}
                      <td className="py-3 px-4">{getActionBadge(log.action)}</td>

                      {/* Location / Section */}
                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-blue-800 text-[11px]">
                        {location}
                      </td>

                      {/* Description / Title */}
                      <td className="py-3 px-4 max-w-md">
                        <p className="font-bold text-slate-900">{log.title}</p>
                        {log.details?.changes && log.details.changes.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {log.details.changes.slice(0, 3).map((c, idx) => (
                              <div key={idx} className="text-[10px] font-mono text-slate-600">
                                • <span className="font-semibold">{c.categoryOrItem || c.field}</span>: {c.beforeValue} → <span className="font-bold text-emerald-700">{c.afterValue}</span>
                              </div>
                            ))}
                            {log.details.changes.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                +{log.details.changes.length - 3} more properties changed
                              </span>
                            )}
                          </div>
                        )}
                        {log.recoveredAt && (
                          <span className="text-[10px] font-mono text-emerald-600 font-bold block mt-1">
                            ✓ Recovered at {new Date(log.recoveredAt).toLocaleTimeString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Performer */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                        {log.performerEmail}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700 text-[11px]">
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <p className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      </td>

                      {/* Recovery Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {log.snapshotData && !log.recoveredAt ? (
                          <button
                            type="button"
                            onClick={() => handleRecover(log._id, log.title)}
                            disabled={isRecovering}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto shadow-xs transition-all cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>1-Click Recover</span>
                          </button>
                        ) : log.recoveredAt ? (
                          <span className="text-[10px] font-bold text-emerald-600 font-mono">
                            RESTORED
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-mono italic">No snapshot</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
