import React from 'react'

export function numberToWordsInRupees(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const n = Math.floor(Number(num) || 0)
  if (n === 0) return '(Zero Rupees Only)'
  if (n === 1) return '(One Rupee Only)'
  if (n === 100) return '(One Hundred Rupees Only)'

  function convert(val) {
    if (val < 20) return a[val]
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '')
    if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 !== 0 ? ' and ' + convert(val % 100) : '')
    if (val < 100000) return convert(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 !== 0 ? ' ' + convert(val % 1000) : '')
    if (val < 10000000) return convert(Math.floor(val / 100000)) + ' Lakh' + (val % 100000 !== 0 ? ' ' + convert(val % 100000) : '')
    return convert(Math.floor(val / 10000000)) + ' Crore' + (val % 10000000 !== 0 ? ' ' + convert(val % 10000000) : '')
  }
  return `(${convert(n)} Rupees Only)`
}

/**
 * 1. Delhivery B2C Official Tax Invoice
 */
export function DelhiveryTaxInvoice({ order, sellerConfig }) {
  if (!order) return null
  const seller = {
    companyName: sellerConfig?.companyName || 'Sensein Botanical Luxury Pvt Ltd',
    dispatchAddress: sellerConfig?.dispatchAddress || '104, Vijay Nagar 2, Yogi Chowk, Puna-Simada Road',
    city: sellerConfig?.city || 'Surat',
    state: sellerConfig?.state || 'Gujarat',
    pincode: sellerConfig?.pincode || '395010',
    stateCode: sellerConfig?.stateCode || '24 (Gujarat)',
    gstin: sellerConfig?.gstin || '24AAACR1234F1Z5',
    pan: sellerConfig?.pan || 'AAACR1234F',
    registeredAddress: sellerConfig?.registeredAddress || 'Sensein Botanical Luxury Private Limited, Plot 104, Yogi Chowk, Puna-Simada Road, Surat, Gujarat - 395010.',
    authorizedSignatory: sellerConfig?.authorizedSignatory || sellerConfig?.companyName || 'Sensein Botanical Luxury Pvt Ltd',
    hsnCode: sellerConfig?.hsnCode || '33059040',
  }

  const orderRef = order.orderNumber || ('ORD-' + (order._id ? order._id.slice(-8).toUpperCase() : '20260908-40881'))
  const invoiceRef = order.invoiceNumber || order.delhivery?.waybill || `INV-${orderRef.replace(/\D/g, '').slice(-8) || '2026-6655'}`
  const formattedOrderDate = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const formattedInvoiceDate = new Date(order.createdAt ? new Date(order.createdAt).getTime() + 3600000 : Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const totalAmount = Number(order.totalAmount || 0)
  const totalDiscount = Number(order.discount || 0)
  const shippingFee = Number(order.shippingFee || 0)
  const items = order.items && order.items.length > 0 ? order.items : [{ name: 'Sensein Hair Care Product', quantity: 1, price: totalAmount }]
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

  return (
    <div className="border border-neutral-400 p-5 bg-white text-black font-sans max-w-3xl mx-auto text-[11px] leading-snug print:p-2 print:border-black print:text-black shadow-sm">
      {/* Top Header: Title + Sensein Logo */}
      <div className="flex justify-between items-center border-b border-neutral-300 pb-3 mb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black uppercase">Tax Invoice</h1>
          <div className="text-[10px] text-neutral-500 font-medium">Original for Recipient</div>
        </div>
        <div className="flex items-center">
          <img
            src="/images/sensein-logo.png"
            alt="SENSEIN"
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>

      {/* Structured Meta Grid with clean alignment */}
      <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2.5 border border-neutral-300 mb-3 text-[10px]">
        <div>
          <span className="font-bold text-neutral-700">Order Id: </span>
          <span className="font-semibold text-black">{orderRef}</span>
        </div>
        <div>
          <span className="font-bold text-neutral-700">Invoice No: </span>
          <span className="font-semibold text-black">{invoiceRef}</span>
        </div>
        <div>
          <span className="font-bold text-neutral-700">GSTIN: </span>
          <span className="font-semibold text-black">{seller.gstin}</span>
        </div>

        <div>
          <span className="font-bold text-neutral-700">Order Date: </span>
          <span className="text-neutral-900">{formattedOrderDate}</span>
        </div>
        <div>
          <span className="font-bold text-neutral-700">Invoice Date: </span>
          <span className="text-neutral-900">{formattedInvoiceDate}</span>
        </div>
        <div>
          <span className="font-bold text-neutral-700">PAN: </span>
          <span className="font-semibold text-black">{seller.pan}</span>
        </div>
      </div>

      {/* 2 Column Address Layout: Sold By | Billing & Shipping Address */}
      <div className="grid grid-cols-2 gap-6 border-b border-neutral-300 pb-3 mb-3 text-[10px] text-neutral-900">
        <div className="space-y-0.5">
          <div className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-1">Sold By</div>
          <div className="font-bold text-black">{seller.companyName}</div>
          <div>{seller.dispatchAddress}</div>
          <div>{seller.city}, {seller.state} - <span className="font-semibold">{seller.pincode}</span>, IN-GJ</div>
          <div><strong>State Code:</strong> {seller.stateCode}</div>
          <div><strong>GSTIN:</strong> {seller.gstin}</div>
        </div>

        <div className="space-y-0.5">
          <div className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-1">Billing & Shipping Address</div>
          <div className="font-bold text-black">{order.customerName || order.shippingAddress?.fullName || order.user?.name || 'Customer Name'}</div>
          <div>{order.shippingAddress?.addressLine || 'Address Line'}</div>
          <div>
            {[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(', ')} - <span className="font-semibold">{order.shippingAddress?.postalCode || '395010'}</span>, India
          </div>
          {(order.customerPhone || order.shippingAddress?.phone || order.user?.phone) && (
            <div className="pt-0.5">
              <strong>Phone: </strong>
              <span className="font-semibold">{order.customerPhone || order.shippingAddress?.phone || order.user?.phone}</span>
            </div>
          )}
          {(order.customerEmail || order.user?.email) && (
            <div>
              <strong>Email: </strong>
              <span>{order.customerEmail || order.user?.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Itemized Table */}
      <div className="border border-neutral-400 overflow-hidden mb-3">
        <table className="w-full text-left text-[10px] border-collapse">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-400 font-bold text-neutral-900">
              <th className="p-1.5 border-r border-neutral-300 w-[28%]">Product</th>
              <th className="p-1.5 border-r border-neutral-300 w-[24%]">Description</th>
              <th className="p-1.5 border-r border-neutral-300 text-center w-[5%]">Qty</th>
              <th className="p-1.5 border-r border-neutral-300 text-right w-[9%]">Gross Amount</th>
              <th className="p-1.5 border-r border-neutral-300 text-right w-[8%]">Discount</th>
              <th className="p-1.5 border-r border-neutral-300 text-right w-[9%]">Taxable Value</th>
              <th className="p-1.5 border-r border-neutral-300 text-right w-[7%]">CGST (9%)</th>
              <th className="p-1.5 border-r border-neutral-300 text-right w-[7%]">SGST (9%)</th>
              <th className="p-1.5 border-r border-neutral-300 text-right w-[5%]">CESS</th>
              <th className="p-1.5 text-right w-[8%]">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = item.quantity || 1
              const unitPrice = Number(item.price || 0)
              const grossAmt = unitPrice * qty
              const discountAmt = Number(totalDiscount > 0 ? (totalDiscount / items.length) : 0)
              const netAmt = Math.max(0, grossAmt - discountAmt)
              const taxableVal = netAmt / 1.18
              const taxAmt = netAmt - taxableVal
              const halfTax = taxAmt / 2
              const sizeInfo = item.size || item.selectedSize || item.variant || ''

              return (
                <tr key={idx} className="border-b border-neutral-300 align-top">
                  <td className="p-1.5 border-r border-neutral-300">
                    <div className="font-semibold text-neutral-900">{item.name || item.product?.title || 'Sensein Hair Care Product'}</div>
                    <div className="text-[9px] text-neutral-500 font-mono">
                      {sizeInfo ? `Size: ${sizeInfo} | ` : ''}SKU: {item.sku || 'SKU-001'}
                    </div>
                  </td>
                  <td className="p-1.5 border-r border-neutral-300 text-[9px] text-neutral-700">
                    <div>HSN: {seller.hsnCode}</div>
                    <div className="text-neutral-500">GST: 18.00% | CESS: 0.00%</div>
                  </td>
                  <td className="p-1.5 border-r border-neutral-300 text-center font-semibold">{qty}</td>
                  <td className="p-1.5 border-r border-neutral-300 text-right font-mono">{grossAmt.toFixed(2)}</td>
                  <td className="p-1.5 border-r border-neutral-300 text-right font-mono text-neutral-700">
                    {discountAmt > 0 ? `-${discountAmt.toFixed(2)}` : '0.00'}
                  </td>
                  <td className="p-1.5 border-r border-neutral-300 text-right font-mono">{taxableVal.toFixed(2)}</td>
                  <td className="p-1.5 border-r border-neutral-300 text-right font-mono">{halfTax.toFixed(2)}</td>
                  <td className="p-1.5 border-r border-neutral-300 text-right font-mono">{halfTax.toFixed(2)}</td>
                  <td className="p-1.5 border-r border-neutral-300 text-right font-mono">0.00</td>
                  <td className="p-1.5 text-right font-bold font-mono">{netAmt.toFixed(2)}</td>
                </tr>
              )
            })}

            {/* Dedicated Shipping & Handling Row */}
            <tr className="border-b border-neutral-400 bg-neutral-50/60 align-top">
              <td className="p-1.5 border-r border-neutral-300 font-semibold text-neutral-900">
                Shipping and Handling Charges
              </td>
              <td className="p-1.5 border-r border-neutral-300 text-[9px] text-neutral-700">
                <div>SAC: 996812</div>
                <div className="text-neutral-500">{shippingFee > 0 ? 'GST: 18.00%' : 'GST: 0.00%'} | CESS: 0.00%</div>
              </td>
              <td className="p-1.5 border-r border-neutral-300 text-center font-semibold">1</td>
              <td className="p-1.5 border-r border-neutral-300 text-right font-mono">{shippingFee.toFixed(2)}</td>
              <td className="p-1.5 border-r border-neutral-300 text-right font-mono">0.00</td>
              <td className="p-1.5 border-r border-neutral-300 text-right font-mono">
                {shippingFee > 0 ? (shippingFee / 1.18).toFixed(2) : '0.00'}
              </td>
              <td className="p-1.5 border-r border-neutral-300 text-right font-mono">
                {shippingFee > 0 ? ((shippingFee - (shippingFee / 1.18)) / 2).toFixed(2) : '0.00'}
              </td>
              <td className="p-1.5 border-r border-neutral-300 text-right font-mono">
                {shippingFee > 0 ? ((shippingFee - (shippingFee / 1.18)) / 2).toFixed(2) : '0.00'}
              </td>
              <td className="p-1.5 border-r border-neutral-300 text-right font-mono">0.00</td>
              <td className="p-1.5 text-right font-bold font-mono">{shippingFee.toFixed(2)}</td>
            </tr>
          </tbody>

          {/* Table Footer: Total Qty & Amount in Words on Left, Total Price on Right */}
          <tfoot>
            <tr className="border-t-2 border-neutral-400 bg-white">
              <td colSpan={4} className="p-2 border-r border-neutral-300 align-top">
                <div className="font-bold text-[11px] uppercase tracking-wider text-black">
                  TOTAL QTY: {totalQty}
                </div>
                <div className="text-[10px] text-neutral-700 pt-1">
                  <strong>Amount in Words: </strong>
                  <span className="italic font-medium">{numberToWordsInRupees(totalAmount)}</span>
                </div>
              </td>
              <td colSpan={6} className="p-2 text-right align-top">
                <div className="text-[12px] font-black tracking-tight text-black">
                  <span className="uppercase">TOTAL PRICE: </span>
                  <span className="font-mono">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="text-[9px] text-neutral-500 font-normal">
                  All values are in INR
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Footer: Registered Address + System Generated Signatory */}
      <div className="flex justify-between items-end pt-2 text-[9px] text-neutral-700">
        <div className="space-y-0.5 max-w-sm">
          <div>
            <strong>Seller Registered Address:</strong> {seller.registeredAddress}
          </div>
          <div className="text-neutral-500 italic">
            * This is a computer-generated tax invoice and does not require a physical signature.
          </div>
        </div>

        <div className="text-right space-y-0.5">
          <div className="font-bold text-[10px] text-neutral-900">
            {seller.authorizedSignatory || seller.companyName}
          </div>
          <div className="text-[9px] text-neutral-500 font-medium">
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 2. Official Delhivery 4×6 Thermal Shipping Label
 */
export function DelhiveryShippingLabel({ order }) {
  if (!order) return null
  const waybill = order.delhivery?.waybill || order.trackingNumber || '1284512369845'
  const sortCode = order.delhivery?.sortCode || 'SRT/GCI'
  const isCod = order.paymentMethod === 'COD'
  const totalAmount = Number(order.totalAmount || 0)
  const orderRef = order.orderNumber || ('ORD' + (order._id?.slice(-8) || '').toUpperCase())

  return (
    <div className="border-2 border-black p-4 bg-white text-black font-sans w-[380px] mx-auto text-xs leading-tight print:p-2 print:border-black print:text-black shadow-sm print:w-full print:max-w-[4in]">
      {/* Top Header: Delhivery Logo + Courier Details */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="bg-[#d9222a] text-white font-black text-sm px-2 py-0.5 tracking-tighter rounded">DELHIVERY</span>
          <div className="text-[10px] font-bold leading-none">
            <div>SURFACE & EXPRESS</div>
            <div className="text-[8px] text-neutral-600">DELHIVERY ONE B2C</div>
          </div>
        </div>
        <div className="text-right font-black text-sm border-2 border-black px-2 py-0.5">
          {isCod ? `COD: ₹${totalAmount}` : 'PREPAID'}
        </div>
      </div>

      {/* Barcode representation for Delhivery Waybill */}
      <div className="text-center py-2 border-b-2 border-black my-1">
        <div className="font-mono text-lg font-black tracking-widest leading-none my-1">{waybill}</div>
        <div className="inline-block bg-black h-12 w-11/12 my-1" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px)',
        }} />
        <div className="text-[9px] font-bold tracking-wider text-neutral-600">DELHIVERY WAYBILL NUMBER</div>
      </div>

      {/* Sort Hub & Routing Info */}
      <div className="grid grid-cols-2 border-b-2 border-black py-1.5 text-center font-bold text-[11px]">
        <div className="border-r-2 border-black pr-1">
          <div className="text-[8px] text-neutral-600">ROUTING / SORT CODE</div>
          <div className="text-sm font-black">{sortCode}</div>
        </div>
        <div className="pl-1">
          <div className="text-[8px] text-neutral-600">DESTINATION PINCODE</div>
          <div className="text-base font-black">{order.shippingAddress?.postalCode || '395010'}</div>
        </div>
      </div>

      {/* Ship To Address */}
      <div className="py-2 border-b-2 border-black">
        <div className="font-bold text-[10px] text-neutral-600 uppercase">DELIVER TO (CONSIGNEE):</div>
        <div className="font-black text-sm">{order.customerName || order.shippingAddress?.fullName || 'Customer Name'}</div>
        <div className="text-[11px] mt-0.5 font-medium">
          {[
            order.shippingAddress?.addressLine || 'Address Line',
            order.shippingAddress?.city || 'Surat',
            order.shippingAddress?.state || 'Gujarat',
            order.shippingAddress?.postalCode || '395010'
          ].filter(Boolean).join(', ')}
        </div>
        <div className="font-bold text-xs mt-1">Phone: {order.customerPhone || order.shippingAddress?.phone || '9265259954'}</div>
      </div>

      {/* Return & Seller Info */}
      <div className="py-2 border-b-2 border-black text-[10px]">
        <div className="font-bold text-neutral-600 uppercase">RETURN TO (WAREHOUSE HUB):</div>
        <div className="font-bold">Sensein Botanical / MINDNEXT B2C</div>
        <div>104, Vijaynagar 2, Yogichowk, Surat, Gujarat - 395010</div>
        <div>Support: +91 7984919956</div>
      </div>

      {/* Package & Product Summary */}
      <div className="pt-2 flex justify-between items-center text-[10px]">
        <div>
          <div>Order Ref: <span className="font-bold">{orderRef}</span></div>
          <div>Weight: <span className="font-bold">{order.packageDetails?.deadWeight || 0.05} KG</span></div>
        </div>
        <div className="text-right text-[9px] text-neutral-600">
          <div>Direct Courier Integration</div>
          <div className="font-bold text-black">https://www.delhivery.com</div>
        </div>
      </div>
    </div>
  )
}

/**
 * 3. Official Delhivery Courier Handover Manifest
 */
export function DelhiveryManifestSlip({ order, orders = [] }) {
  const manifestOrders = orders.length > 0 ? orders : (order ? [order] : [])
  const manifestRef = `DLV-MAN-${Date.now().toString().slice(-8)}`
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="border-2 border-black p-6 bg-white text-black font-sans max-w-3xl mx-auto text-xs leading-tight print:p-2 print:border-black print:text-black shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-[#d9222a] text-white font-black text-base px-2 py-0.5 rounded">DELHIVERY</span>
          <div>
            <div className="text-sm font-black uppercase">Courier Pickup Handover Manifest</div>
            <div className="text-[10px] text-neutral-600">
              Official B2C Package Handover Sheet for Delhivery Pickup Field Executive (FE)
            </div>
          </div>
        </div>
        <div className="text-right text-[11px]">
          <div><span className="font-bold">Manifest ID:</span> {manifestRef}</div>
          <div><span className="font-bold">Date & Time:</span> {formattedDate}</div>
          <div><span className="font-bold">Pickup Hub:</span> MINDNEXT B2C (395010)</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="border-2 border-black my-4">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="border-b-2 border-black bg-neutral-100 font-bold uppercase text-[10px]">
              <th className="p-2 border-r border-black">#</th>
              <th className="p-2 border-r border-black">Order Ref</th>
              <th className="p-2 border-r border-black">Delhivery Waybill</th>
              <th className="p-2 border-r border-black">Destination Hub / Pin</th>
              <th className="p-2 border-r border-black">Consignee Name & Phone</th>
              <th className="p-2 border-r border-black">Payment</th>
              <th className="p-2 text-right">Collectable</th>
            </tr>
          </thead>
          <tbody>
            {manifestOrders.map((o, idx) => {
              const waybill = o.delhivery?.waybill || o.trackingNumber || '1284512369845'
              const sortCode = o.delhivery?.sortCode || (o.shippingAddress?.postalCode ? `SRT/${o.shippingAddress.postalCode}` : 'SRT/GCI')
              const isCod = o.paymentMethod === 'COD'
              const amount = Number(o.totalAmount || 0)
              return (
                <tr key={idx} className="border-b border-black">
                  <td className="p-2 border-r border-black font-bold">{idx + 1}</td>
                  <td className="p-2 border-r border-black font-medium">{o.orderNumber || o._id}</td>
                  <td className="p-2 border-r border-black font-mono font-bold">{waybill}</td>
                  <td className="p-2 border-r border-black font-bold">{sortCode}</td>
                  <td className="p-2 border-r border-black">
                    <div className="font-bold">{o.customerName || o.shippingAddress?.fullName || 'Customer'}</div>
                    <div className="text-[10px]">{o.customerPhone || o.shippingAddress?.phone || '9265259954'}</div>
                  </td>
                  <td className="p-2 border-r border-black font-bold">{isCod ? 'COD' : 'PREPAID'}</td>
                  <td className="p-2 text-right font-bold">{isCod ? `₹${amount}` : '₹0.00'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary and Signatures */}
      <div className="grid grid-cols-2 gap-6 border-t-2 border-black pt-4 mt-6 text-[11px]">
        <div>
          <div className="font-bold mb-1">Pickup Summary:</div>
          <div>Total Manifested Shipments: <span className="font-black text-sm">{manifestOrders.length}</span></div>
          <div>Carrier Partner: <span className="font-bold">Delhivery Surface & Express B2C Network</span></div>
        </div>
        <div className="space-y-6 text-right">
          <div className="border-t border-black pt-1 font-bold">Delhivery Pickup FE Signature & Employee ID</div>
          <div className="border-t border-black pt-1 font-bold">Warehouse Dispatch Manager Signature</div>
        </div>
      </div>
    </div>
  )
}

// Aliases for compatibility
export const EkartTaxInvoice = DelhiveryTaxInvoice
export const EkartShippingLabel = DelhiveryShippingLabel
export const EkartManifestSlip = DelhiveryManifestSlip
