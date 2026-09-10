import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import Category from '../models/Category.js'
import Shipment from '../models/Shipment.js'
import ReturnRequest from '../models/ReturnRequest.js'
import AuditLog from '../models/AuditLog.js'
import { transitionOrderStatus } from '../services/orderStatusEngine.js'
import {
  DELHIVERY_CONFIG,
  generateDelhiveryWaybill,
  generateSortCode,
  pushOrderToDelhivery,
} from '../utils/delhivery.js'
import { logger } from '../config/logger.js'

// @desc    Get Admin Dashboard Stats
// @route   GET /api/v1/admin/stats or /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments()
    const totalProducts = await Product.countDocuments({ isArchived: { $ne: true } })
    const totalUsers = await User.countDocuments()

    const salesAggregate = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } },
    ])

    const totalSales = salesAggregate.length > 0 ? salesAggregate[0].totalSales : 0

    const pendingOrdersCount = await Order.countDocuments({ fulfillmentStatus: 'PROCESSING' })
    const shippedOrdersCount = await Order.countDocuments({ fulfillmentStatus: { $in: ['READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT'] } })
    const deliveredOrdersCount = await Order.countDocuments({ fulfillmentStatus: 'DELIVERED' })
    const returnsPendingCount = await ReturnRequest.countDocuments({ status: { $in: ['RETURN_REQUESTED', 'UNDER_REVIEW', 'QC_PENDING'] } })

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('activeShipment')

    res.status(200).json({
      success: true,
      stats: {
        totalSales,
        totalOrders,
        pendingOrdersCount,
        shippedOrdersCount,
        deliveredOrdersCount,
        returnsPendingCount,
        totalProducts,
        totalUsers,
      },
      recentOrders,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get All Orders for Admin with Multi-Status Filtering & Search
// @route   GET /api/v1/admin/orders or /api/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const {
      status,
      fulfillmentStatus,
      paymentStatus,
      codStatus,
      returnStatus,
      search,
      page = 1,
      limit = 20,
    } = req.query

    const filter = {}

    if (status && status !== 'ALL') {
      const s = status.toUpperCase().trim()
      if (['ACTIVE', 'CANCELLED', 'COMPLETED', 'RTO', 'RETURN', 'REPLACEMENT'].includes(s)) {
        filter.orderStatus = s
      } else {
        filter.$or = [{ fulfillmentStatus: s }, { orderStatus: s }]
      }
    }

    if (fulfillmentStatus && fulfillmentStatus !== 'ALL') {
      filter.fulfillmentStatus = fulfillmentStatus.toUpperCase().trim()
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      filter.paymentStatus = paymentStatus.toUpperCase().trim()
    }

    if (codStatus && codStatus !== 'ALL') {
      filter.codCollectionStatus = codStatus.toUpperCase().trim()
    }

    if (returnStatus && returnStatus !== 'ALL') {
      filter.returnStatus = returnStatus.toUpperCase().trim()
    }

    if (search && search.trim()) {
      const q = search.trim()
      const searchRegex = new RegExp(q, 'i')
      filter.$or = [
        { orderNumber: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { customerPhone: searchRegex },
        { trackingNumber: searchRegex },
        { 'paymentDetails.razorpayPaymentId': searchRegex },
      ]
    }

    const count = await Order.countDocuments(filter)
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('user', 'name email')
      .populate('activeShipment')
      .populate('returnRequests')

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      orders,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update Order Status (State Machine Enforced)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const {
      orderStatus,
      fulfillmentStatus,
      paymentStatus,
      codCollectionStatus,
      trackingNumber,
      courierPartner,
      reason = 'Status updated by admin',
    } = req.body

    const order = await Order.findById(req.params.id).populate('activeShipment')

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    const updates = {}
    if (orderStatus) updates.orderStatus = orderStatus.toUpperCase()
    if (fulfillmentStatus) updates.fulfillmentStatus = fulfillmentStatus.toUpperCase()
    if (paymentStatus) updates.paymentStatus = paymentStatus.toUpperCase()
    if (codCollectionStatus) updates.codCollectionStatus = codCollectionStatus.toUpperCase()
    if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber
    if (courierPartner !== undefined) updates.courierPartner = courierPartner

    await transitionOrderStatus(order, updates, {
      actor: req.user?.email || 'Admin',
      actorType: 'ADMIN',
      reason,
      source: 'ADMIN_PANEL',
    })

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    })
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}

// @desc    Create / Manifest Shipment in Delhivery
// @route   POST /api/admin/orders/:id/shipment
// @access  Private/Admin
export const createOrderShipment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('activeShipment')
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    const waybill = generateDelhiveryWaybill()
    const sortCode = generateSortCode(order.shippingAddress?.postalCode || '395010')

    const shipment = new Shipment({
      order: order._id,
      orderNumber: order.orderNumber,
      shipmentNumber: `SHP-${order.orderNumber}-${(order.shipments?.length || 0) + 1}`,
      shipmentType: 'FORWARD',
      courier: 'Delhivery Surface & Express B2C',
      waybill,
      labelUrl: `https://track.delhivery.com/api/p/packing_slip?wbns=${waybill}&pdf=true`,
      trackingUrl: `https://www.delhivery.com/track/package/${waybill}`,
      status: 'READY_FOR_PICKUP',
      pickupStatus: 'SCHEDULED',
      destination: order.shippingAddress,
      packageDetails: order.packageDetails,
      itemsSnapshot: order.items,
    })

    await shipment.save()

    order.activeShipment = shipment._id
    if (!Array.isArray(order.shipments)) order.shipments = []
    order.shipments.push(shipment._id)
    order.trackingNumber = waybill
    order.courierPartner = 'Delhivery Surface & Express B2C'
    order.delhivery = {
      waybill,
      shipmentId: shipment.shipmentNumber,
      sortCode,
      courierName: 'Delhivery Surface & Express B2C',
      trackingUrl: `https://www.delhivery.com/track/package/${waybill}`,
      labelUrl: shipment.labelUrl,
      status: 'READY_FOR_PICKUP',
      assignmentStatus: 'ASSIGNED',
      statusMessage: 'Manifested with Delhivery',
      isTestMode: !DELHIVERY_CONFIG.isLiveMode,
    }

    await transitionOrderStatus(
      order,
      {
        fulfillmentStatus: 'READY_FOR_PICKUP',
        trackingNumber: waybill,
      },
      {
        actor: req.user?.email || 'Admin',
        actorType: 'ADMIN',
        reason: `Delhivery shipment generated with AWB #${waybill}. Ready for pickup.`,
        source: 'ADMIN_SHIPMENT_CREATE',
      }
    )

    res.status(200).json({
      success: true,
      message: `Shipment created with Delhivery AWB #${waybill}`,
      shipment,
      order,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Confirm COD Doorstep Collection
// @route   POST /api/admin/orders/:id/collect-cod
// @access  Private/Admin
export const confirmCodCollection = async (req, res) => {
  try {
    const { reference, notes } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })

    order.codCollectionStatus = 'COLLECTED'
    order.paymentStatus = 'PAID'
    order.codCollectedAt = new Date()
    order.codCollectionReference = reference || `COD_REC_${Date.now()}`

    await transitionOrderStatus(
      order,
      {
        codCollectionStatus: 'COLLECTED',
        paymentStatus: 'PAID',
      },
      {
        actor: req.user?.email || 'Admin',
        actorType: 'ADMIN',
        reason: `COD collection confirmed. Ref: ${order.codCollectionReference}. ${notes || ''}`,
        source: 'ADMIN_COD_CONFIRM',
      }
    )

    res.json({
      success: true,
      message: 'COD payment collection confirmed successfully.',
      order,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get Delhivery Configuration
// @route   GET /api/admin/delhivery/config
// @access  Private/Admin
export const getDelhiveryConfig = async (req, res) => {
  res.status(200).json({
    success: true,
    config: {
      apiToken: DELHIVERY_CONFIG.apiToken ? '••••••••••••' : '',
      clientId: DELHIVERY_CONFIG.clientId,
      merchantName: DELHIVERY_CONFIG.merchantName,
      warehouseName: DELHIVERY_CONFIG.warehouseName,
      isLiveMode: DELHIVERY_CONFIG.isLiveMode,
      originPincode: DELHIVERY_CONFIG.originPincode,
      originCity: DELHIVERY_CONFIG.originCity,
      originState: DELHIVERY_CONFIG.originState,
      modeLabel: DELHIVERY_CONFIG.isLiveMode ? 'LIVE PRODUCTION' : 'SANDBOX / TEST MODE (₹0 Cost)',
    },
  })
}

// @desc    Update Delhivery Configuration
// @route   PUT /api/admin/delhivery/config
// @access  Private/Admin
export const updateDelhiveryConfig = async (req, res) => {
  try {
    const { apiToken, clientId, isLiveMode, merchantName, warehouseName, originPincode } = req.body
    if (apiToken !== undefined && apiToken.trim() && !apiToken.includes('••••')) {
      DELHIVERY_CONFIG.apiToken = apiToken.trim()
    }
    if (clientId !== undefined) DELHIVERY_CONFIG.clientId = clientId.trim()
    if (isLiveMode !== undefined) DELHIVERY_CONFIG.isLiveMode = Boolean(isLiveMode)
    if (merchantName !== undefined) DELHIVERY_CONFIG.merchantName = merchantName.trim()
    if (warehouseName !== undefined) DELHIVERY_CONFIG.warehouseName = warehouseName.trim()
    if (originPincode !== undefined) DELHIVERY_CONFIG.originPincode = originPincode.trim()

    res.status(200).json({
      success: true,
      message: 'Delhivery configuration updated successfully!',
      config: {
        clientId: DELHIVERY_CONFIG.clientId,
        isLiveMode: DELHIVERY_CONFIG.isLiveMode,
        merchantName: DELHIVERY_CONFIG.merchantName,
        warehouseName: DELHIVERY_CONFIG.warehouseName,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Sync Confirmed Orders with Delhivery B2C (manifest & assign waybills)
// @route   GET/POST /api/admin/orders/sync-delhivery
// @access  Private/Admin
export const syncDelhiveryOrders = async (req, res) => {
  try {
    const pendingOrders = await Order.find({
      orderStatus: { $ne: 'CANCELLED' },
      fulfillmentStatus: { $in: ['CONFIRMED', 'NEW', 'READY_TO_SHIP'] },
      $or: [{ trackingNumber: { $in: [null, ''] } }, { 'delhivery.waybill': { $in: [null, ''] } }],
    }).limit(20)

    const synced = []
    for (const order of pendingOrders) {
      try {
        const result = await pushOrderToDelhivery(order)
        if (result.success && result.waybill) {
          order.trackingNumber = result.waybill
          order.courierPartner = 'Delhivery Surface & Express B2C'
          order.fulfillmentStatus = 'SHIPPED'
          order.delhivery = order.delhivery || {}
          order.delhivery.waybill = result.waybill
          order.delhivery.shipmentId = result.shipmentId || ''
          order.delhivery.status = result.status || 'SHIPPED'
          order.shippedAt = new Date()
          await order.save()
          synced.push({ orderNumber: order.orderNumber, waybill: result.waybill })
        }
      } catch (err) {
        logger.warn({ orderNumber: order.orderNumber, err: err.message }, 'Order sync skipped')
      }
    }

    res.status(200).json({
      success: true,
      message: synced.length
        ? `Successfully synced ${synced.length} orders with Delhivery B2C server!`
        : 'All orders are already in sync with Delhivery B2C server.',
      synced,
      count: synced.length,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Sync Confirmed Orders (Ekart alias - currently routed via Delhivery B2C)
// @route   GET/POST /api/admin/orders/sync-ekart
// @access  Private/Admin
export const syncEkartOrders = syncDelhiveryOrders

const EKART_CONFIG = {
  apiToken: '',
  clientId: '',
  merchantName: DELHIVERY_CONFIG.merchantName,
  warehouseName: DELHIVERY_CONFIG.warehouseName,
  originPincode: DELHIVERY_CONFIG.originPincode,
  isLiveMode: false,
}

// @desc    Get Ekart Configuration
// @route   GET /api/admin/ekart/config
// @access  Private/Admin
export const getEkartConfig = async (req, res) => {
  res.status(200).json({
    success: true,
    config: {
      apiToken: EKART_CONFIG.apiToken ? '••••••••••••' : '',
      clientId: EKART_CONFIG.clientId,
      merchantName: EKART_CONFIG.merchantName,
      warehouseName: EKART_CONFIG.warehouseName,
      originPincode: EKART_CONFIG.originPincode,
      isLiveMode: EKART_CONFIG.isLiveMode,
    },
  })
}

// @desc    Update Ekart Configuration
// @route   PUT /api/admin/ekart/config
// @access  Private/Admin
export const updateEkartConfig = async (req, res) => {
  try {
    const { apiToken, clientId, merchantName, warehouseName, originPincode, isLiveMode } = req.body
    if (apiToken !== undefined && apiToken.trim() && !apiToken.includes('••••')) {
      EKART_CONFIG.apiToken = apiToken.trim()
    }
    if (clientId !== undefined) EKART_CONFIG.clientId = clientId.trim()
    if (merchantName !== undefined) EKART_CONFIG.merchantName = merchantName.trim()
    if (warehouseName !== undefined) EKART_CONFIG.warehouseName = warehouseName.trim()
    if (originPincode !== undefined) EKART_CONFIG.originPincode = originPincode.trim()
    if (isLiveMode !== undefined) EKART_CONFIG.isLiveMode = Boolean(isLiveMode)

    res.status(200).json({
      success: true,
      message: 'Ekart configuration updated successfully!',
      config: {
        clientId: EKART_CONFIG.clientId,
        merchantName: EKART_CONFIG.merchantName,
        warehouseName: EKART_CONFIG.warehouseName,
        originPincode: EKART_CONFIG.originPincode,
        isLiveMode: EKART_CONFIG.isLiveMode,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const SERVICE_ALERT = {
  active: true,
  title: 'Delhivery Service Alert:',
  message: 'Deliveries and pickups are operating normally across all major Delhivery Express & Surface hubs.',
}

// @desc    Get Service Alert Banner
// @route   GET /api/admin/service-alert
// @access  Private/Admin
export const getServiceAlert = async (req, res) => {
  res.status(200).json({ success: true, data: SERVICE_ALERT })
}

// @desc    Update Service Alert Banner
// @route   PUT /api/admin/service-alert
// @access  Private/Admin
export const updateServiceAlert = async (req, res) => {
  try {
    const { active, title, message } = req.body
    if (active !== undefined) SERVICE_ALERT.active = Boolean(active)
    if (title !== undefined) SERVICE_ALERT.title = title.trim()
    if (message !== undefined) SERVICE_ALERT.message = message.trim()

    res.status(200).json({
      success: true,
      message: 'Service alert updated successfully!',
      data: SERVICE_ALERT,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create Product
// @route   POST /api/admin/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      price,
      compareAtPrice,
      description,
      shortDescription,
      mainImage,
      gallery,
      stock,
      sku,
      weight,
      dimensions,
      hsnCode,
      isFeatured,
      ingredients,
      howToUse,
    } = req.body

    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    const product = new Product({
      name,
      slug: productSlug,
      category,
      price,
      compareAtPrice: compareAtPrice || 0,
      description,
      shortDescription: shortDescription || '',
      mainImage,
      gallery: gallery || [],
      stock: stock !== undefined ? stock : 10,
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      weight: weight ? Number(weight) : 250,
      dimensions: dimensions || { length: 15, breadth: 10, height: 8 },
      hsnCode: hsnCode || '3305',
      isFeatured: isFeatured || false,
      ingredients: ingredients || '',
      howToUse: howToUse || '',
    })

    await product.save()

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A product with this name or SKU already exists.',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update Product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete / Soft Archive Product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id

    // Check if referenced in existing orders
    const orderCount = await Order.countDocuments({ 'items.product': productId })

    if (orderCount > 0) {
      // Soft Archive to protect existing orders and historical invoices!
      const product = await Product.findByIdAndUpdate(
        productId,
        { isArchived: true, isActive: false },
        { new: true }
      )

      return res.status(200).json({
        success: true,
        message: `Product is referenced by ${orderCount} order(s). It has been safely archived to preserve historical invoices and records.`,
        product,
      })
    }

    // If never ordered, hard delete is safe
    const product = await Product.findByIdAndDelete(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Product removed successfully',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean()
    res.status(200).json({ success: true, users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update User Role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body
    if (!['user', 'admin', 'wholesale', 'distributor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role provided' })
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    res.status(200).json({ success: true, message: 'User role updated successfully', user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create Category
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, image } = req.body
    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    const category = new Category({ name, slug: catSlug, description, image })
    await category.save()
    res.status(201).json({ success: true, message: 'Category created successfully', category })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update Category
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' })
    res.status(200).json({ success: true, message: 'Category updated successfully', category })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' })
    res.status(200).json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Export All Orders Sheet as CSV
export const exportOrdersCsv = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email').populate('activeShipment')

    const headers = [
      'Order ID',
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Shipping Address',
      'City',
      'State',
      'PIN Code',
      'Purchased Items Summary',
      'Total Amount (₹)',
      'Payment Method',
      'Payment Status',
      'Fulfillment Status',
      'Order Status',
      'COD Collection Status',
      'Return Status',
      'Courier Partner',
      'AWB Tracking Number',
      'Order Booking Date',
    ]

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = orders.map((o) => {
      const customerName = o.customerName || o.shippingAddress?.fullName || 'Customer'
      const customerEmail = o.customerEmail || 'N/A'
      const customerPhone = o.customerPhone || 'N/A'
      const addressLine = o.shippingAddress?.addressLine || 'N/A'
      const city = o.shippingAddress?.city || 'Surat'
      const state = o.shippingAddress?.state || 'Gujarat'
      const pinCode = o.shippingAddress?.postalCode || '395010'

      const itemsSummary = (o.items || [])
        .map((it) => `${it.name} (Qty: ${it.quantity} x ₹${it.price})`)
        .join(' | ')

      return [
        escapeCsv(o._id),
        escapeCsv(o.orderNumber),
        escapeCsv(customerName),
        escapeCsv(customerEmail),
        escapeCsv(customerPhone),
        escapeCsv(addressLine),
        escapeCsv(city),
        escapeCsv(state),
        escapeCsv(pinCode),
        escapeCsv(itemsSummary),
        escapeCsv(o.totalAmount || 0),
        escapeCsv(o.paymentMethod || 'COD'),
        escapeCsv(o.paymentStatus || 'PENDING'),
        escapeCsv(o.fulfillmentStatus || 'NEW'),
        escapeCsv(o.orderStatus || 'ACTIVE'),
        escapeCsv(o.codCollectionStatus || 'NOT_APPLICABLE'),
        escapeCsv(o.returnStatus || 'NONE'),
        escapeCsv(o.courierPartner || 'Delhivery Express'),
        escapeCsv(o.trackingNumber || o.activeShipment?.waybill || 'Pending'),
        escapeCsv(new Date(o.createdAt).toLocaleString('en-IN')),
      ]
    })

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="sensein-orders-${Date.now()}.csv"`)
    return res.status(200).send(csvContent)
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
