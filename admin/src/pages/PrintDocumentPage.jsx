import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2, FileText, CheckCircle2 } from 'lucide-react'
import { useGetInvoiceConfigQuery } from '@/features/adminApi'
import {
  DelhiveryTaxInvoice,
  DelhiveryShippingLabel,
  DelhiveryManifestSlip,
} from '@/components/PrintableDocuments'

export default function PrintDocumentPage() {
  const { type = 'invoice', id } = useParams()
  const [searchParams] = useSearchParams()
  const orderId = id || searchParams.get('orderId')
  const docType = (type || searchParams.get('type') || 'invoice').toLowerCase()
  const { data: invoiceConfigData } = useGetInvoiceConfigQuery()
  const sellerConfig = invoiceConfigData?.sellerDetails

  const [order, setOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchOrderData() {
      setLoading(true)
      setError('')
      try {
        if (orderId) {
          const res = await fetch(`/api/orders/${orderId}`)
          const data = await res.json()
          if (data.data || data.order) {
            setOrder(data.data || data.order)
          } else {
            // Try fetching from admin orders list if public route was filtered
            const adminRes = await fetch('/api/admin/orders')
            const adminData = await adminRes.json()
            const found = (adminData.orders || adminData.data || []).find(
              (o) => o._id === orderId || o.orderNumber === orderId
            )
            if (found) {
              setOrder(found)
            } else {
              setError('Order not found or has been archived.')
            }
          }
        } else {
          // If no specific order ID (e.g. bulk manifest), fetch all shipped orders
          const adminRes = await fetch('/api/admin/orders')
          const adminData = await adminRes.json()
          const allOrders = adminData.orders || adminData.data || []
          setOrders(allOrders)
          if (allOrders.length > 0) {
            setOrder(allOrders[0])
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load document for printing.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderData()
  }, [orderId, docType])

  const handlePrint = () => {
    window.print()
  }

  const getDocTitle = () => {
    switch (docType) {
      case 'label':
        return '4×6 Shipping Thermal Label'
      case 'manifest':
        return 'Courier Handover Manifest'
      default:
        return 'GST Tax Invoice'
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-6 px-4 print:p-0 print:bg-white">
      {/* Top Floating Control Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">{getDocTitle()}</span>
            {order?.orderNumber && (
              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                #{order.orderNumber}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Document</span>
          </button>
        </div>
      </div>

      {/* Main Document Content Container */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl shadow-xs border border-slate-200 text-center flex flex-col items-center justify-center gap-3 print:hidden">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Generating print document...</span>
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-2xl shadow-xs border border-rose-200 text-center text-rose-600 text-xs font-semibold print:hidden">
            {error}
          </div>
        ) : (
          <div id="printable-area" className="bg-white print:p-0">
            {docType === 'label' && <DelhiveryShippingLabel order={order} />}
            {docType === 'manifest' && <DelhiveryManifestSlip order={order} orders={orders} />}
            {docType === 'invoice' && <DelhiveryTaxInvoice order={order} sellerConfig={sellerConfig} />}
          </div>
        )}
      </div>
    </div>
  )
}
