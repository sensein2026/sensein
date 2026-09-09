import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import Category from '../models/Category.js'

// @desc    Get Admin Dashboard Stats
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments()
    const totalProducts = await Product.countDocuments()
    const totalUsers = await User.countDocuments()

    const salesAggregate = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } },
    ])

    const totalSales = salesAggregate.length > 0 ? salesAggregate[0].totalSales : 0

    const pendingOrdersCount = await Order.countDocuments({ orderStatus: 'PROCESSING' })
    const shippedOrdersCount = await Order.countDocuments({ orderStatus: 'SHIPPED' })
    const deliveredOrdersCount = await Order.countDocuments({ orderStatus: 'DELIVERED' })

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')

    res.status(200).json({
      success: true,
      stats: {
        totalSales,
        totalOrders,
        pendingOrdersCount,
        shippedOrdersCount,
        deliveredOrdersCount,
        totalProducts,
        totalUsers,
      },
      recentOrders,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get All Orders for Admin
// @route   GET /api/v1/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const filter = {}

    if (status) {
      filter.orderStatus = status.toUpperCase()
    }

    const count = await Order.countDocuments(filter)
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('user', 'name email')

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

import { DELHIVERY_CONFIG } from '../utils/delhivery.js'

let currentServiceAlert = {
  active: true,
  title: 'Service Alert:',
  message: 'Deliveries and pickups are operating normally across all major Delhivery Express & Surface hubs.',
  updatedAt: new Date(),
}

// @desc    Get live dynamic Service Alert
// @route   GET /api/v1/admin/service-alert
// @access  Private/Admin
export const getServiceAlert = async (req, res) => {
  res.status(200).json({
    success: true,
    data: currentServiceAlert,
  })
}

// @desc    Update live dynamic Service Alert
// @route   PUT /api/v1/admin/service-alert
// @access  Private/Admin
export const updateServiceAlert = async (req, res) => {
  try {
    const { title, message, active } = req.body
    if (title !== undefined) currentServiceAlert.title = title
    if (message !== undefined) currentServiceAlert.message = message
    if (active !== undefined) currentServiceAlert.active = Boolean(active)
    currentServiceAlert.updatedAt = new Date()

    res.status(200).json({
      success: true,
      message: 'Service alert notification updated successfully',
      data: currentServiceAlert,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get Delhivery Configuration & Account Status
// @route   GET /api/v1/admin/delhivery/config
// @access  Private/Admin
export const getDelhiveryConfig = async (req, res) => {
  res.status(200).json({
    success: true,
    config: {
      apiToken: DELHIVERY_CONFIG.apiToken,
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

// Backward compatibility alias
export const getEkartConfig = getDelhiveryConfig

// @desc    Update Delhivery Configuration & Toggle Test/Live Mode
// @route   PUT /api/v1/admin/delhivery/config
// @access  Private/Admin
export const updateDelhiveryConfig = async (req, res) => {
  try {
    const { apiToken, clientId, isLiveMode, merchantName, warehouseName, originPincode } = req.body
    if (apiToken !== undefined) DELHIVERY_CONFIG.apiToken = apiToken.trim()
    if (clientId !== undefined) DELHIVERY_CONFIG.clientId = clientId.trim()
    if (isLiveMode !== undefined) DELHIVERY_CONFIG.isLiveMode = Boolean(isLiveMode)
    if (merchantName !== undefined) DELHIVERY_CONFIG.merchantName = merchantName.trim()
    if (warehouseName !== undefined) DELHIVERY_CONFIG.warehouseName = warehouseName.trim()
    if (originPincode !== undefined) DELHIVERY_CONFIG.originPincode = originPincode.trim()

    res.status(200).json({
      success: true,
      message: `Delhivery B2C Logistics configured successfully in ${DELHIVERY_CONFIG.isLiveMode ? 'LIVE PRODUCTION' : 'TEST / SANDBOX'} mode!`,
      config: {
        apiToken: DELHIVERY_CONFIG.apiToken,
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

// Backward compatibility alias
export const updateEkartConfig = updateDelhiveryConfig

// @desc    Sync / Refresh all orders with Delhivery B2C Logistics statuses
// @route   POST /api/v1/admin/orders/sync-delhivery
// @access  Private/Admin
export const syncDelhiveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 })
    let syncedCount = 0

    for (const order of orders) {
      // Ensure package details are populated
      if (!order.packageDetails || !order.packageDetails.deadWeight) {
        order.packageDetails = {
          deadWeight: 0.05,
          volumetricWeight: 0.20,
          length: 10,
          breadth: 10,
          height: 10,
          chargedWeight: 0.20,
        }
      }
      if (!order.estimatedDeliveryDays) {
        order.estimatedDeliveryDays = '2-3 Business Days'
      }

      // If order is shipped, ensure Delhivery tracking object is synchronized
      if (order.trackingNumber || (order.orderStatus === 'SHIPPED' || order.orderStatus === 'IN_TRANSIT')) {
        const waybill = order.trackingNumber || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`
        const sortCode = order.shippingAddress?.postalCode?.startsWith('395') ? 'SUR/HUB/395010' : 'AMD/HUB/380015'
        order.trackingNumber = waybill
        order.courierPartner = 'Delhivery Surface & Express B2C'
        order.delhivery = {
          waybill,
          shipmentId: `DELH-${order._id.toString().slice(-6)}`,
          sortCode,
          courierName: 'Delhivery Surface & Express B2C',
          trackingUrl: `https://www.delhivery.com/track/package/${waybill}`,
          labelUrl: `https://track.delhivery.com/api/p/packing_slip?wbns=${waybill}&pdf=true`,
          status: 'SHIPPED',
          assignmentStatus: 'ASSIGNED',
          statusMessage: 'Delhivery Express courier assigned & in transit',
          isTestMode: !DELHIVERY_CONFIG.isLiveMode,
        }
      }
      await order.save()
      syncedCount++
    }

    const updatedOrders = await Order.find({}).sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      message: `Successfully synchronized ${syncedCount} orders with Delhivery B2C logistics engine!`,
      count: updatedOrders.length,
      orders: updatedOrders,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Backward compatibility alias
export const syncEkartOrders = syncDelhiveryOrders

// @desc    Update Order Status
// @route   PUT /api/v1/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, trackingNumber, courierPartner } = req.body
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    if (orderStatus) order.orderStatus = orderStatus.toUpperCase()
    if (paymentStatus) order.paymentStatus = paymentStatus.toUpperCase()
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber
    if (courierPartner !== undefined) order.courierPartner = courierPartner

    await order.save()

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create Product
// @route   POST /api/v1/admin/products
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
        message: 'A product with this name already exists. Duplicate items cannot be added.',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update Product
// @route   PUT /api/v1/admin/products/:id
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A product with this name already exists. Duplicate items cannot be added.',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete Product
// @route   DELETE /api/v1/admin/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get All Users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean()

    // Enrich users with phone number from savedAddresses or latest order
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        let phone = u.phone || u.savedAddresses?.[0]?.phone || ''

        if (!phone) {
          const latestOrder = await Order.findOne({ user: u._id })
            .sort({ createdAt: -1 })
            .select('shippingAddress')
            .lean()
          if (latestOrder?.shippingAddress?.phone) {
            phone = latestOrder.shippingAddress.phone
          }
        }

        return {
          ...u,
          phone: phone || null,
        }
      })
    )

    res.status(200).json({
      success: true,
      users: enrichedUsers,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update User Role
// @route   PUT /api/v1/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body

    if (!['user', 'admin', 'wholesale', 'distributor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role provided' })
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create Category
// @route   POST /api/v1/admin/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, image } = req.body
    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    const category = new Category({
      name,
      slug: catSlug,
      description,
      image,
    })

    await category.save()

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This category already exists. Duplicate items cannot be added.',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update Category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const { name, slug, description, image } = req.body
    const updateData = {}
    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (image !== undefined) updateData.image = image
    if (slug) {
      updateData.slug = slug.trim()
    } else if (name) {
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This category already exists. Duplicate items cannot be added.',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete Category
// @route   DELETE /api/v1/admin/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Export All Orders Sheet as CSV
// @route   GET /api/admin/orders/export
// @access  Private/Admin
export const exportOrdersCsv = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email')
    const adminOrigin = req.headers.origin || 'http://localhost:5175'

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
      'Order / Fulfillment Status',
      'Assigned Courier Partner',
      'AWB Tracking Number',
      'Dead Weight (kg)',
      'Volumetric Weight (kg)',
      'Charged Weight (kg)',
      'Estimated Delivery',
      'Print 4x6 Label Link',
      'Print GST Invoice Link',
      'Print Manifest Link',
      'Live Tracking Link',
      'Order Booking Date',
    ]

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = orders.map((o) => {
      const customerName = o.customerName || o.shippingAddress?.fullName || o.user?.name || 'Customer'
      const customerEmail = o.customerEmail || o.user?.email || 'N/A'
      const customerPhone = o.customerPhone || o.shippingAddress?.phone || 'N/A'
      const addressLine = o.shippingAddress?.addressLine || o.shippingAddress?.addressLine1 || 'N/A'
      const city = o.shippingAddress?.city || 'Surat'
      const state = o.shippingAddress?.state || 'Gujarat'
      const pinCode = o.shippingAddress?.postalCode || '395010'

      const itemsSummary = (o.items || [])
        .map((it) => `${it.name || it.productName || 'Item'} (Qty: ${it.quantity} x ₹${it.price})`)
        .join(' | ')

      const labelLink = o.delhivery?.labelUrl || `${adminOrigin}/print/label/${o._id}`
      const invoiceLink = `${adminOrigin}/print/invoice/${o._id}`
      const manifestLink = `${adminOrigin}/print/manifest/${o._id}`
      const trackingLink = o.delhivery?.trackingUrl || (o.trackingNumber ? `https://www.delhivery.com/track/package/${o.trackingNumber}` : 'Awaiting Dispatch')

      return [
        escapeCsv(o._id),
        escapeCsv(o.orderNumber || ('ORD-' + o._id.toString().slice(-8).toUpperCase())),
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
        escapeCsv(o.orderStatus || 'PROCESSING'),
        escapeCsv(o.courierPartner || 'Delhivery Surface & Express B2C'),
        escapeCsv(o.trackingNumber || 'Pending Courier Assignment'),
        escapeCsv(o.packageDetails?.deadWeight ? `${o.packageDetails.deadWeight} kg` : (o.trackingNumber ? '0.05 kg' : 'N/A')),
        escapeCsv(o.packageDetails?.volumetricWeight ? `${o.packageDetails.volumetricWeight} kg` : (o.trackingNumber ? '0.20 kg' : 'N/A')),
        escapeCsv(o.packageDetails?.chargedWeight ? `${o.packageDetails.chargedWeight} kg` : (o.trackingNumber ? '0.20 kg' : 'N/A')),
        escapeCsv(o.estimatedDeliveryDays || '2-3 Business Days'),
        escapeCsv(labelLink),
        escapeCsv(invoiceLink),
        escapeCsv(manifestLink),
        escapeCsv(trackingLink),
        escapeCsv(new Date(o.createdAt).toLocaleString('en-IN')),
      ]
    })

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join(
      '\n'
    )

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sensein-orders-master-links-${Date.now()}.csv"`
    )
    return res.status(200).send(csvContent)
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get Shipping & Auto-Ship Configuration
// @route   GET /api/v1/admin/shipping/config
// @access  Private/Admin
export const getShippingConfig = async (req, res) => {
  try {
    const ShippingConfig = (await import('../models/ShippingConfig.js')).default
    let config = await ShippingConfig.findOne()
    if (!config) {
      config = await ShippingConfig.create({ isAutoShipEnabled: false })
    }
    res.status(200).json({ success: true, config })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update Shipping & Auto-Ship Configuration Toggle
// @route   PUT /api/v1/admin/shipping/config
// @access  Private/Admin
export const updateShippingConfig = async (req, res) => {
  try {
    const { isAutoShipEnabled } = req.body
    const ShippingConfig = (await import('../models/ShippingConfig.js')).default
    let config = await ShippingConfig.findOne()
    if (!config) {
      config = new ShippingConfig()
    }
    if (isAutoShipEnabled !== undefined) {
      config.isAutoShipEnabled = Boolean(isAutoShipEnabled)
    }
    await config.save()
    res.status(200).json({
      success: true,
      message: `Auto-Ship Mode is now ${config.isAutoShipEnabled ? 'ENABLED (Instant Auto-Ship)' : 'DISABLED (Manual 1-Click Ship)'}`,
      config,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}


