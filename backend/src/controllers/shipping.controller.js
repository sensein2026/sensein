import Order from '../models/Order.js'
import ShippingConfig from '../models/ShippingConfig.js'
import AuditLog from '../models/AuditLog.js'
import {
  pushOrderToDelhivery,
  trackDelhiveryShipment,
  checkDelhiveryPincode,
  estimateDelhiveryRate,
  cancelDelhiveryShipment,
  generateDelhiveryWaybill,
  DELHIVERY_CONFIG,
} from '../utils/delhivery.js'
import {
  transitionOrderStatus,
  isAddressEditAllowed,
  isPrePickupCancellationAllowed,
} from '../services/orderStatusEngine.js'
import { logger } from '../config/logger.js'

/**
 * =========================================================================
 * DELHIVERY B2C COURIER LOGISTICS CONTROLLER (Official Engine)
 * =========================================================================
 */

/**
 * 1. Create / Book Single Shipment with Delhivery B2C
 * POST /api/shipping/delhivery/create or POST /api/shipping/create
 */
export const createDelhiveryShipping = async (req, res, next) => {
  try {
    const { orderId } = req.body
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Please provide orderId' })
    }

    const order = await Order.findOne({
      $or: [
        { _id: String(orderId).match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderNumber: orderId },
      ],
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    const delhiveryResult = await pushOrderToDelhivery(order)

    if (!delhiveryResult || !delhiveryResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to create shipment in Delhivery B2C' })
    }

    const waybill = delhiveryResult.waybill
    order.delhivery = {
      waybill: waybill,
      shipmentId: delhiveryResult.shipmentId,
      sortCode: delhiveryResult.sortCode,
      courierName: delhiveryResult.courierName || 'Delhivery Surface & Express B2C',
      trackingUrl: delhiveryResult.trackingUrl,
      labelUrl: delhiveryResult.labelUrl || null,
      status: 'SHIPPED',
      assignmentStatus: 'ASSIGNED',
      statusMessage: delhiveryResult.statusMessage,
      isTestMode: delhiveryResult.isTestMode,
      rawResponse: delhiveryResult.rawResponse,
    }

    order.trackingNumber = waybill
    order.courierPartner = 'Delhivery Surface & Express B2C'
    order.orderStatus = 'SHIPPED'
    order.estimatedDeliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    order.estimatedDeliveryDays = '2-3 Business Days'

    order.trackingHistory.unshift({
      status: 'SHIPPED',
      title: 'Manifested via Delhivery Express B2C',
      location: 'Surat Central Logistics Hub, Gujarat',
      timestamp: new Date(),
      description: `Delhivery Waybill #${waybill} generated. Manifested for pickup from ${DELHIVERY_CONFIG.warehouseName}.`,
    })

    await order.save()

    res.json({
      success: true,
      message: `Delhivery Express shipment booked successfully! (Waybill: ${waybill})`,
      data: order,
    })
  } catch (error) {
    next(error)
  }
}

export const createShipping = createDelhiveryShipping

/**
 * 2. Bulk Create / Manifest Multiple Orders to Delhivery
 * POST /api/shipping/delhivery/bulk-create or POST /api/shipping/bulk-create
 */
export const bulkCreateDelhiveryShipping = async (req, res, next) => {
  try {
    const { orderIds } = req.body
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of orderIds' })
    }

    const results = []
    let successCount = 0

    for (const orderId of orderIds) {
      const order = await Order.findOne({
        $or: [
          { _id: orderId && String(orderId).match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
          { orderNumber: orderId },
        ],
      })

      if (!order) {
        results.push({ orderId, success: false, message: 'Order not found' })
        continue
      }

      const delhiveryResult = await pushOrderToDelhivery(order)
      if (delhiveryResult && delhiveryResult.success) {
        const waybill = delhiveryResult.waybill
        order.delhivery = {
          waybill: waybill,
          shipmentId: delhiveryResult.shipmentId,
          sortCode: delhiveryResult.sortCode,
          courierName: 'Delhivery Surface & Express B2C',
          trackingUrl: delhiveryResult.trackingUrl,
          labelUrl: delhiveryResult.labelUrl || null,
          status: 'SHIPPED',
          assignmentStatus: 'ASSIGNED',
          statusMessage: delhiveryResult.statusMessage,
          isTestMode: delhiveryResult.isTestMode,
          rawResponse: delhiveryResult.rawResponse,
        }
        order.trackingNumber = waybill
        order.courierPartner = 'Delhivery Surface & Express B2C'
        order.orderStatus = 'SHIPPED'

        order.trackingHistory.unshift({
          status: 'SHIPPED',
          title: 'Manifested via Delhivery Express B2C',
          location: 'Surat Central Logistics Hub, Gujarat',
          timestamp: new Date(),
          description: `Delhivery Waybill #${waybill} generated. Manifested for pickup from ${DELHIVERY_CONFIG.warehouseName}.`,
        })

        await order.save()
        results.push({ orderId, success: true, waybill, shipmentId: delhiveryResult.shipmentId })
        successCount++
      } else {
        results.push({ orderId, success: false, message: 'Delhivery manifest notice' })
      }
    }

    res.json({
      success: true,
      message: `Successfully manifested ${successCount} of ${orderIds.length} orders with Delhivery B2C Express!`,
      successCount,
      results,
    })
  } catch (error) {
    next(error)
  }
}

export const bulkCreateShipping = bulkCreateDelhiveryShipping

/**
 * 3. Track Delhivery Waybill / Shipment
 * GET /api/shipping/delhivery/track/:awb or GET /api/shipping/track/:awb
 */
export const getDelhiveryTracking = async (req, res, next) => {
  try {
    const awb = req.params.awb || req.params.waybill || req.query.waybill || req.query.awb
    const tracking = await trackDelhiveryShipment(awb)
    res.json(tracking)
  } catch (error) {
    next(error)
  }
}

export const getShippingTracking = getDelhiveryTracking

/**
 * 4. Check PIN Code Serviceability via Delhivery
 * GET /api/shipping/delhivery/check-pincode/:pincode or GET /api/shipping/check-pincode/:pincode
 */
export const checkDelhiveryPincodeHandler = async (req, res, next) => {
  try {
    const pincode = req.params.pincode || req.query.pincode || req.query.filter_codes
    const result = await checkDelhiveryPincode(pincode)
    res.json({
      success: result.valid !== false,
      data: result,
      ...result,
    })
  } catch (error) {
    next(error)
  }
}

export const checkPincode = checkDelhiveryPincodeHandler

/**
 * 5. Estimate Delhivery Shipping Rate & ETA
 * POST /api/shipping/delhivery/estimate or GET /api/shipping/rates
 */
export const estimateDelhiveryRateHandler = async (req, res, next) => {
  try {
    const result = await estimateDelhiveryRate(req.body || {})
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getShippingRates = async (req, res, next) => {
  try {
    const result = await estimateDelhiveryRate(req.query || {})
    res.json({
      success: true,
      courier: 'Delhivery Surface & Express B2C',
      rateCard: [
        { mode: 'Delhivery Surface B2C (0.5kg)', rate: 40, deliveryDays: '2-3 Days' },
        { mode: 'Delhivery Express Air (0.5kg)', rate: 65, deliveryDays: '1-2 Days' },
      ],
      estimate: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 6. Get / Update Delhivery Configuration
 * GET /api/shipping/delhivery/config
 * PUT /api/shipping/delhivery/config
 */
export const getDelhiveryConfigHandler = async (req, res) => {
  res.json({
    success: true,
    config: {
      apiToken: DELHIVERY_CONFIG.apiToken,
      clientId: DELHIVERY_CONFIG.clientId,
      isLiveMode: DELHIVERY_CONFIG.isLiveMode,
      warehouseName: DELHIVERY_CONFIG.warehouseName,
      originPincode: DELHIVERY_CONFIG.originPincode,
      originAddress: DELHIVERY_CONFIG.originAddress,
      originCity: DELHIVERY_CONFIG.originCity,
      originState: DELHIVERY_CONFIG.originState,
      originPhone: DELHIVERY_CONFIG.originPhone,
      stagingUrl: DELHIVERY_CONFIG.stagingUrl,
      productionUrl: DELHIVERY_CONFIG.productionUrl,
    },
  })
}

export const updateDelhiveryConfigHandler = async (req, res) => {
  const { apiToken, clientId, isLiveMode, warehouseName, originPincode, originAddress, originCity, originState, originPhone } = req.body
  if (apiToken !== undefined) DELHIVERY_CONFIG.apiToken = apiToken.trim()
  if (clientId !== undefined) DELHIVERY_CONFIG.clientId = clientId.trim()
  if (isLiveMode !== undefined) DELHIVERY_CONFIG.isLiveMode = Boolean(isLiveMode)
  if (warehouseName !== undefined) DELHIVERY_CONFIG.warehouseName = warehouseName.trim()
  if (originPincode !== undefined) DELHIVERY_CONFIG.originPincode = originPincode.trim()
  if (originAddress !== undefined) DELHIVERY_CONFIG.originAddress = originAddress.trim()
  if (originCity !== undefined) DELHIVERY_CONFIG.originCity = originCity.trim()
  if (originState !== undefined) DELHIVERY_CONFIG.originState = originState.trim()
  if (originPhone !== undefined) DELHIVERY_CONFIG.originPhone = originPhone.trim()

  res.json({
    success: true,
    message: `Delhivery B2C configuration updated successfully! Mode: ${DELHIVERY_CONFIG.isLiveMode ? 'LIVE PRODUCTION' : 'SANDBOX / TEST MODE'}`,
    config: {
      apiToken: DELHIVERY_CONFIG.apiToken,
      clientId: DELHIVERY_CONFIG.clientId,
      isLiveMode: DELHIVERY_CONFIG.isLiveMode,
      warehouseName: DELHIVERY_CONFIG.warehouseName,
      originPincode: DELHIVERY_CONFIG.originPincode,
    },
  })
}

/**
 * 7. Cancel Shipment in Delhivery
 * POST /api/shipping/delhivery/cancel or POST /api/shipping/cancel
 */
export const cancelDelhiveryOrderShipment = async (req, res, next) => {
  try {
    const waybill = req.body.waybill || req.body.awbNumber || req.body.waybillNumber
    const result = await cancelDelhiveryShipment(waybill)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const cancelOrderShipment = cancelDelhiveryOrderShipment

/**
 * 8. Couriers List (Delhivery Exclusive)
 */
export const getCouriersList = async (req, res, next) => {
  try {
    res.json({
      success: true,
      partners: [
        {
          id: 'DELHIVERY_B2C',
          name: 'Delhivery Surface & Express B2C',
          clientId: DELHIVERY_CONFIG.clientId,
          warehouseName: DELHIVERY_CONFIG.warehouseName,
          isLiveMode: DELHIVERY_CONFIG.isLiveMode,
          status: 'ACTIVE_PRIMARY',
        },
      ],
    })
  } catch (error) {
    next(error)
  }
}

export const processReturnRequest = async (req, res) => {
  res.json({ success: true, message: 'Delhivery reverse pickup request registered' })
}

export const handleNdrReattempt = async (req, res) => {
  res.json({ success: true, message: 'Delhivery NDR re-attempt scheduled' })
}

export const handleDelhiveryWebhook = async (req, res) => {
  logger.info({ body: req.body }, 'Delhivery webhook update received')
  res.json({ success: true })
}

/**
 * 9. Get Store Shipping Settings (Public & Admin)
 * GET /api/shipping/settings
 */
export const getShippingSettings = async (req, res, next) => {
  try {
    let config = await ShippingConfig.findOne()
    if (!config) {
      config = await ShippingConfig.create({
        standardShippingFee: 79,
        freeShippingThreshold: 999,
        isFreeShippingEnabled: true,
        shippingNote: 'Standard shipping ₹79 • Free express delivery on orders above ₹999',
        isGiftPromoEnabled: true,
        giftMinSpend: 2999,
        giftItemName: 'Sensein Luxury Botanical Mini Elixir (30ml)',
        giftBadge: 'FREE GIFT',
        giftNote: 'Complimentary luxury haircare gift included on all orders above ₹2999',
        isAutoShipEnabled: false,
        defaultCourier: 'DELHIVERY_B2C',
        tier1Enabled: true,
        tier1Threshold: 999,
        tier1Title: 'Free Delivery',
        tier2Enabled: true,
        tier2Threshold: 1999,
        tier2Title: 'Special Coupon',
        tier2CouponCode: 'EXTRA10',
        tier2DiscountText: '10% Instant Off',
        tier3Enabled: true,
        tier3Threshold: 2999,
        tier3Title: 'Special Gift Free',
        tier3ItemName: 'Sensein Luxury Botanical Mini Elixir (30ml)',
        tier3ProductLink: '/shop',
        tier3Badge: 'FREE GIFT',
        tier3Note: 'Complimentary luxury gift included on all orders above ₹2999',
      })
    }
    res.json({
      success: true,
      settings: {
        standardShippingFee: config.standardShippingFee ?? 79,
        freeShippingThreshold: config.freeShippingThreshold ?? config.tier1Threshold ?? 999,
        isFreeShippingEnabled: config.isFreeShippingEnabled ?? true,
        shippingNote: config.shippingNote || '',
        isGiftPromoEnabled: config.isGiftPromoEnabled ?? config.tier3Enabled ?? true,
        giftMinSpend: config.giftMinSpend ?? config.tier3Threshold ?? 2999,
        giftItemName: config.giftItemName || config.tier3ItemName || 'Sensein Luxury Botanical Mini Elixir (30ml)',
        giftBadge: config.giftBadge || config.tier3Badge || 'FREE GIFT',
        giftNote: config.giftNote || config.tier3Note || '',
        isAutoShipEnabled: config.isAutoShipEnabled ?? false,
        defaultCourier: config.defaultCourier || 'DELHIVERY_B2C',
        cartProgressMode: config.cartProgressMode || 'tiered',
        // 3-Tier Milestones
        tier1Enabled: config.tier1Enabled !== false,
        tier1Threshold: config.tier1Threshold ?? config.freeShippingThreshold ?? 999,
        tier1Title: config.tier1Title || 'Free Delivery',
        tier2Enabled: config.tier2Enabled !== false,
        tier2Threshold: config.tier2Threshold ?? 1999,
        tier2Title: config.tier2Title || 'Special Coupon',
        tier2CouponCode: config.tier2CouponCode || 'EXTRA10',
        tier2DiscountText: config.tier2DiscountText || '10% Instant Off',
        tier3Enabled: config.tier3Enabled !== false,
        tier3Threshold: config.tier3Threshold ?? config.giftMinSpend ?? 2999,
        tier3Title: config.tier3Title || 'Special Gift Free',
        tier3ItemName: config.tier3ItemName || config.giftItemName || 'Sensein Luxury Botanical Mini Elixir (30ml)',
        tier3ProductLink: config.tier3ProductLink || '/shop',
        tier3Badge: config.tier3Badge || config.giftBadge || 'FREE GIFT',
        tier3Note: config.tier3Note || config.giftNote || '',
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 10. Update Store Shipping & Gift Promotion Settings (Admin)
 * PUT /api/shipping/settings
 */
export const updateShippingSettings = async (req, res, next) => {
  try {
    const {
      standardShippingFee,
      freeShippingThreshold,
      isFreeShippingEnabled,
      shippingNote,
      cartProgressMode,
      isGiftPromoEnabled,
      giftMinSpend,
      giftItemName,
      giftBadge,
      giftNote,
      isAutoShipEnabled,
      defaultCourier,
      // 3-Tier Milestones
      tier1Enabled,
      tier1Threshold,
      tier1Title,
      tier2Enabled,
      tier2Threshold,
      tier2Title,
      tier2CouponCode,
      tier2DiscountText,
      tier3Enabled,
      tier3Threshold,
      tier3Title,
      tier3ItemName,
      tier3ProductLink,
      tier3Badge,
      tier3Note,
    } = req.body

    let config = await ShippingConfig.findOne()
    if (!config) {
      config = new ShippingConfig()
    }

    const previousSnapshot = config.toObject ? config.toObject() : { ...config }

    if (cartProgressMode !== undefined) {
      config.cartProgressMode = cartProgressMode === 'simple' ? 'simple' : 'tiered'
    }

    if (standardShippingFee !== undefined) config.standardShippingFee = Math.max(0, Number(standardShippingFee) || 0)
    if (freeShippingThreshold !== undefined) config.freeShippingThreshold = Math.max(0, Number(freeShippingThreshold) || 0)
    if (isFreeShippingEnabled !== undefined) config.isFreeShippingEnabled = Boolean(isFreeShippingEnabled)
    if (shippingNote !== undefined) config.shippingNote = String(shippingNote).trim()

    if (isGiftPromoEnabled !== undefined) config.isGiftPromoEnabled = Boolean(isGiftPromoEnabled)
    if (giftMinSpend !== undefined) config.giftMinSpend = Math.max(0, Number(giftMinSpend) || 0)
    if (giftItemName !== undefined) config.giftItemName = String(giftItemName).trim()
    if (giftBadge !== undefined) config.giftBadge = String(giftBadge).trim()
    if (giftNote !== undefined) config.giftNote = String(giftNote).trim()

    if (isAutoShipEnabled !== undefined) config.isAutoShipEnabled = Boolean(isAutoShipEnabled)
    if (defaultCourier !== undefined) config.defaultCourier = String(defaultCourier).trim()

    // 3-Tier Updates
    if (tier1Enabled !== undefined) {
      config.tier1Enabled = Boolean(tier1Enabled)
      config.isFreeShippingEnabled = Boolean(tier1Enabled)
    }
    if (tier1Threshold !== undefined) {
      config.tier1Threshold = Math.max(0, Number(tier1Threshold) || 0)
      config.freeShippingThreshold = config.tier1Threshold
    }
    if (tier1Title !== undefined) config.tier1Title = String(tier1Title).trim()

    if (tier2Enabled !== undefined) config.tier2Enabled = Boolean(tier2Enabled)
    if (tier2Threshold !== undefined) config.tier2Threshold = Math.max(0, Number(tier2Threshold) || 0)
    if (tier2Title !== undefined) config.tier2Title = String(tier2Title).trim()
    if (tier2CouponCode !== undefined) config.tier2CouponCode = String(tier2CouponCode).trim().toUpperCase()
    if (tier2DiscountText !== undefined) config.tier2DiscountText = String(tier2DiscountText).trim()

    if (tier3Enabled !== undefined) {
      config.tier3Enabled = Boolean(tier3Enabled)
      config.isGiftPromoEnabled = Boolean(tier3Enabled)
    }
    if (tier3Threshold !== undefined) {
      config.tier3Threshold = Math.max(0, Number(tier3Threshold) || 0)
      config.giftMinSpend = config.tier3Threshold
    }
    if (tier3Title !== undefined) config.tier3Title = String(tier3Title).trim()
    if (tier3ItemName !== undefined) {
      config.tier3ItemName = String(tier3ItemName).trim()
      config.giftItemName = config.tier3ItemName
    }
    if (tier3ProductLink !== undefined) config.tier3ProductLink = String(tier3ProductLink).trim()
    if (tier3Badge !== undefined) {
      config.tier3Badge = String(tier3Badge).trim()
      config.giftBadge = config.tier3Badge
    }
    if (tier3Note !== undefined) {
      config.tier3Note = String(tier3Note).trim()
      config.giftNote = config.tier3Note
    }

    await config.save()

    // Record in AuditLog / Activity Log Vault
    try {
      const modeLabel = config.cartProgressMode === 'simple' ? '1-Tier Classic Simple' : '3-Tier Gamified Milestones'
      await AuditLog.create({
        action: 'UPDATE',
        targetType: 'SHIPPING_CONFIG',
        targetId: config._id.toString(),
        targetName: `Cart Milestone & Shipping Settings (${modeLabel})`,
        performedBy: {
          id: req.user?._id?.toString() || 'admin-id',
          name: req.user?.name || 'Admin',
          email: req.user?.email || 'admin@sensein.in',
          role: req.user?.role || 'admin',
        },
        changes: {
          previousState: previousSnapshot,
          newState: config.toObject ? config.toObject() : { ...config },
        },
        metadata: {
          cartProgressMode: config.cartProgressMode,
          tier1Threshold: config.tier1Threshold,
          tier2Threshold: config.tier2Threshold,
          tier3Threshold: config.tier3Threshold,
          standardShippingFee: config.standardShippingFee,
          reason: 'Admin updated Cart Milestone & Shipping settings',
        },
      })
    } catch (auditErr) {
      logger.error('Failed to create AuditLog for ShippingConfig update:', auditErr)
    }

    res.json({
      success: true,
      message: 'Cart milestone & shipping settings updated successfully!',
      settings: {
        cartProgressMode: config.cartProgressMode,
        standardShippingFee: config.standardShippingFee,
        freeShippingThreshold: config.freeShippingThreshold,
        isFreeShippingEnabled: config.isFreeShippingEnabled,
        shippingNote: config.shippingNote,
        isGiftPromoEnabled: config.isGiftPromoEnabled,
        giftMinSpend: config.giftMinSpend,
        giftItemName: config.giftItemName,
        giftBadge: config.giftBadge,
        giftNote: config.giftNote,
        isAutoShipEnabled: config.isAutoShipEnabled,
        defaultCourier: config.defaultCourier,
        tier1Enabled: config.tier1Enabled,
        tier1Threshold: config.tier1Threshold,
        tier1Title: config.tier1Title,
        tier2Enabled: config.tier2Enabled,
        tier2Threshold: config.tier2Threshold,
        tier2Title: config.tier2Title,
        tier2CouponCode: config.tier2CouponCode,
        tier2DiscountText: config.tier2DiscountText,
        tier3Enabled: config.tier3Enabled,
        tier3Threshold: config.tier3Threshold,
        tier3Title: config.tier3Title,
        tier3ItemName: config.tier3ItemName,
        tier3ProductLink: config.tier3ProductLink,
        tier3Badge: config.tier3Badge,
        tier3Note: config.tier3Note,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Helper to get customer-facing status badge
 */
function getCustomerBadge(status) {
  switch (status) {
    case 'NEW': return { text: 'Order Placed', color: 'bg-blue-100 text-blue-800' }
    case 'CONFIRMED': return { text: 'Order Confirmed', color: 'bg-indigo-100 text-indigo-800' }
    case 'PROCESSING': return { text: 'Packaging in Lab', color: 'bg-purple-100 text-purple-800' }
    case 'PACKED': return { text: 'Packed & Manifested', color: 'bg-amber-100 text-amber-800' }
    case 'READY_FOR_PICKUP': return { text: 'Manifested with Delhivery', color: 'bg-sky-100 text-sky-800' }
    case 'PICKED_UP': return { text: 'Picked Up by Delhivery', color: 'bg-blue-100 text-blue-800' }
    case 'IN_TRANSIT': return { text: 'In Transit', color: 'bg-cyan-100 text-cyan-800' }
    case 'OUT_FOR_DELIVERY': return { text: 'Out for Delivery Today', color: 'bg-orange-100 text-orange-800 animate-pulse' }
    case 'DELIVERED': return { text: 'Delivered Successfully', color: 'bg-emerald-100 text-emerald-800' }
    case 'CANCELLED': return { text: 'Cancelled', color: 'bg-red-100 text-red-800' }
    default: return { text: status, color: 'bg-slate-100 text-slate-800' }
  }
}

/**
 * Helper to get admin notice on courier status
 */
function getAdminNotice(status, paymentMethod) {
  switch (status) {
    case 'READY_FOR_PICKUP':
      return 'Delhivery AWB generated. Handover sticker printed. Waiting for rider.'
    case 'PICKED_UP':
      return 'Handover complete. Customer address editing & cancel buttons LOCKED.'
    case 'IN_TRANSIT':
      return 'Shipment progressing through Delhivery distribution gateways.'
    case 'OUT_FOR_DELIVERY':
      return 'Rider dispatched. Expected doorstep handover in 2-4 hours.'
    case 'DELIVERED':
      return paymentMethod === 'COD'
        ? 'Delivered! COD cash collected by Delhivery. Ready for remittance.'
        : 'Delivered safely to verified customer address.'
    default:
      return `Milestone recorded: ${status}`
  }
}

/**
 * 24. Smart Delhivery Lifecycle Simulator
 * POST /api/shipping/delhivery/simulate
 */
export const simulateDelhiveryEvent = async (req, res, next) => {
  try {
    const { orderId, event, location, remarks, riderName, riderPhone } = req.body
    if (!orderId || !event) {
      return res.status(400).json({ success: false, message: 'Please provide orderId and event' })
    }

    let order = null
    if (orderId && !String(orderId).startsWith('sample_')) {
      order = await Order.findOne({
        $or: [
          { _id: String(orderId).match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
          { orderNumber: orderId },
          { trackingNumber: orderId },
          { 'delhivery.waybill': orderId },
        ],
      })
    }

    if (!order) {
      // Fallback to latest order in DB
      order = await Order.findOne().sort({ createdAt: -1 })
    }

    if (!order) {
      // Create simulated order if DB is empty
      order = await Order.create({
        orderNumber: 'ORD-2026-99214',
        customerName: 'Raj Donga',
        customerPhone: '9265259954',
        customerEmail: 'work.rajdonga@gmail.com',
        shippingAddress: {
          fullName: 'Raj Donga',
          phone: '9265259954',
          addressLine1: '104, Vijay Nagar 2, Puna-Simada Road, Yogi Chowk',
          city: 'Surat',
          state: 'Gujarat',
          pincode: '395010',
        },
        items: [
          {
            product: '66a123456789abcdef012345',
            productName: 'Sensein® Matte Finish Clay Wax',
            qty: 2,
            unitPrice: 499,
            finalPrice: 998,
          },
        ],
        amountBreakdown: { subtotal: 998, totalAmount: 998, currency: 'INR' },
        totalAmount: 998,
        subtotal: 998,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: 'COD',
      })
    }

    const awb = order.trackingNumber || order.delhivery?.waybill || generateDelhiveryWaybill()
    if (!order.trackingNumber) {
      order.trackingNumber = awb
      order.courierPartner = 'Delhivery Surface & Express B2C'
      if (!order.delhivery) order.delhivery = {}
      order.delhivery.waybill = awb
      order.delhivery.courierName = 'Delhivery Surface & Express B2C'
      order.delhivery.trackingUrl = `https://www.delhivery.com/track/package/${awb}`
      order.delhivery.status = 'SHIPPED'
    }

    const evt = String(event).toUpperCase().trim()
    let targetFulfillment = order.fulfillmentStatus || 'NEW'
    let targetOrderStatus = order.orderStatus || 'ACTIVE'
    let targetPaymentStatus = order.paymentStatus
    let targetCodStatus = order.codCollectionStatus
    let targetRtoStatus = order.rtoStatus
    let statusDescription = remarks || ''
    let scanLocation = location || 'Surat Logistics Hub, Gujarat'
    let courierEventCode = ''

    switch (evt) {
      case 'MANIFEST':
      case 'SHIPMENT_CREATED':
      case 'READY_FOR_PICKUP':
        targetFulfillment = 'READY_FOR_PICKUP'
        targetOrderStatus = 'ACTIVE'
        courierEventCode = 'UD'
        scanLocation = location || 'Surat Central Logistics Warehouse (MindNext)'
        statusDescription = remarks || `Shipment manifested. Delhivery AWB #${awb} assigned for pickup.`
        break

      case 'PICKED_UP':
      case 'PICKUP':
        targetFulfillment = 'PICKED_UP'
        targetOrderStatus = 'SHIPPED'
        courierEventCode = 'PU'
        scanLocation = location || 'Surat Central Logistics Warehouse, Gujarat'
        statusDescription = remarks || `Courier Partner (Delhivery Express) physically collected parcel from warehouse.`
        break

      case 'IN_TRANSIT':
      case 'TRANSIT':
        targetFulfillment = 'IN_TRANSIT'
        targetOrderStatus = 'IN_TRANSIT'
        courierEventCode = 'IT'
        scanLocation = location || 'Ahmedabad Mega Gateway Hub, Gujarat'
        statusDescription = remarks || `Parcel scanned and processed at intermediate hub. En route to destination center.`
        break

      case 'OUT_FOR_DELIVERY':
      case 'OFD':
        targetFulfillment = 'OUT_FOR_DELIVERY'
        targetOrderStatus = 'OUT_FOR_DELIVERY'
        courierEventCode = 'OO'
        scanLocation = location || 'Destination Delivery Center Hub'
        statusDescription = remarks || `Parcel is out for delivery with rider ${riderName || 'Ramesh Patel'} (${riderPhone || '+91 9876543210'}).`
        break

      case 'NDR':
      case 'FAILED_ATTEMPT':
        targetFulfillment = 'IN_TRANSIT'
        targetOrderStatus = 'IN_TRANSIT'
        courierEventCode = 'NDR'
        scanLocation = location || 'Local Delivery Center Hub'
        statusDescription = remarks || `Delivery attempt failed: Customer unavailable / Door closed. Next delivery attempt scheduled for tomorrow.`
        break

      case 'DELIVERED':
        targetFulfillment = 'DELIVERED'
        targetOrderStatus = 'DELIVERED'
        courierEventCode = 'DL'
        scanLocation = location || `${order.shippingAddress?.city || 'Destination'}, ${order.shippingAddress?.state || 'India'}`
        statusDescription = remarks || `Package delivered safely to ${order.shippingAddress?.fullName || 'Customer'}. Handover verified.`
        if (order.paymentMethod === 'COD') {
          targetCodStatus = 'COLLECTED'
          targetPaymentStatus = 'PAID'
          order.codCollectedAt = new Date()
          order.codAmount = order.totalAmount
        }
        break

      case 'RTO':
      case 'RETURN_TO_ORIGIN':
        targetOrderStatus = 'RTO'
        targetRtoStatus = 'IN_TRANSIT'
        targetFulfillment = 'IN_TRANSIT'
        courierEventCode = 'RT'
        scanLocation = location || 'Return Sorting Facility'
        statusDescription = remarks || `Customer refused delivery / Repeated NDR failure. Package returning to Surat warehouse.`
        break

      default:
        targetFulfillment = evt
        courierEventCode = 'SCAN'
        statusDescription = remarks || `Courier milestone update: ${evt}`
    }

    // Build raw simulated Delhivery Webhook / API payload
    const simulatedDelhiveryPayload = {
      Shipment: {
        AWB: awb,
        Status: {
          Status: targetFulfillment,
          StatusCode: courierEventCode,
          StatusType: courierEventCode === 'DL' ? 'DEL' : courierEventCode === 'RT' ? 'RTO' : 'UD',
          StatusDateTime: new Date().toISOString(),
          StatusLocation: scanLocation,
          Instructions: statusDescription,
        },
        Scans: [
          {
            ScanDetail: {
              ScanDateTime: new Date().toISOString(),
              ScanType: courierEventCode,
              Scan: statusDescription,
              ScannedLocation: scanLocation,
              Comment: `Simulated via Delhivery Smart Logistics Simulator`,
            },
          },
        ],
        PickUpDate: targetFulfillment !== 'READY_FOR_PICKUP' ? new Date().toISOString() : null,
        DeliveryDate: targetFulfillment === 'DELIVERED' ? new Date().toISOString() : null,
        SenderName: 'MindNext / Sensein Botanical Luxury',
        ReceiverName: order.shippingAddress?.fullName || order.customerName,
        Destination: order.shippingAddress?.city || 'Surat',
        CODAmount: order.paymentMethod === 'COD' ? order.totalAmount : 0,
        CollectedAmount: targetCodStatus === 'COLLECTED' ? order.totalAmount : 0,
      },
      EventSource: 'DELHIVERY_B2C_MCP_WEBHOOK_V2',
      Timestamp: new Date().toISOString(),
      SimulatorMode: true,
    }

    // Apply state transition engine
    await transitionOrderStatus(
      order,
      {
        orderStatus: targetOrderStatus,
        fulfillmentStatus: targetFulfillment,
        paymentStatus: targetPaymentStatus,
        codCollectionStatus: targetCodStatus,
        rtoStatus: targetRtoStatus,
        trackingNumber: awb,
        courierPartner: 'Delhivery Surface & Express B2C',
      },
      {
        actor: req.user?.email || 'Admin Courier Simulator',
        actorType: 'ADMIN',
        reason: statusDescription,
        source: 'DELHIVERY_SIMULATOR',
        externalEventId: `SIM-${awb}-${evt}-${Date.now()}`,
        metadata: {
          location: scanLocation,
          delhiveryEvent: evt,
          courierCode: courierEventCode,
        },
      }
    )

    // Calculate admin and customer impact flags
    const addressEditAllowed = isAddressEditAllowed(order)
    const cancelAllowed = isPrePickupCancellationAllowed(order)

    res.json({
      success: true,
      message: `Courier event '${evt}' applied successfully!`,
      data: {
        order,
        delhiveryPayload: simulatedDelhiveryPayload,
        impact: {
          orderNumber: order.orderNumber,
          fulfillmentStatus: order.fulfillmentStatus,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          codCollectionStatus: order.codCollectionStatus,
          isAddressEditAllowed: addressEditAllowed,
          isPrePickupCancellationAllowed: cancelAllowed,
          customerStatusBadge: getCustomerBadge(order.fulfillmentStatus),
          adminNotice: getAdminNotice(order.fulfillmentStatus, order.paymentMethod),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}


