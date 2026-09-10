import ReturnRequest from '../models/ReturnRequest.js'
import Order from '../models/Order.js'
import Shipment from '../models/Shipment.js'
import Product from '../models/Product.js'
import AuditLog from '../models/AuditLog.js'
import { restockFromQC } from '../services/stockService.js'
import { transitionOrderStatus } from '../services/orderStatusEngine.js'
import { generateDelhiveryWaybill, generateSortCode } from '../utils/delhivery.js'
import { logger } from '../config/logger.js'

export function generateReturnNumber() {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `RET-${dateStr}-${rand}`
}

/**
 * 1. Customer initiates Return / Replacement request
 * POST /api/returns
 */
export const createReturnRequest = async (req, res, next) => {
  try {
    const {
      orderId,
      items,
      requestType = 'RETURN_REFUND',
      evidenceMedia = [],
      customerComment = '',
    } = req.body

    const order = await Order.findOne({
      $or: [
        { _id: orderId?.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderNumber: orderId },
      ],
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    // Authorization check: customer can only return their own order
    if (req.user && order.user && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to return this order' })
    }

    // Eligibility check: must be DELIVERED
    const isDelivered = order.fulfillmentStatus === 'DELIVERED' || order.orderStatus === 'DELIVERED'
    if (!isDelivered) {
      return res.status(400).json({
        success: false,
        message: 'Returns can only be requested after the order has been delivered.',
      })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one item to return.',
      })
    }

    const returnNumber = generateReturnNumber()

    // Format items snapshot
    const returnItems = items.map((item) => ({
      product: item.product?._id || item.product,
      name: item.name || 'Product',
      sku: item.sku || '',
      image: item.image || '',
      price: Number(item.price) || 0,
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      reason: item.reason || 'Other',
      customerComment: item.customerComment || customerComment || '',
    }))

    const returnDoc = new ReturnRequest({
      returnNumber,
      order: order._id,
      orderNumber: order.orderNumber,
      user: req.user?._id || order.user,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      requestType,
      items: returnItems,
      evidenceMedia: Array.isArray(evidenceMedia) ? evidenceMedia : [],
      status: 'RETURN_REQUESTED',
      timeline: [
        {
          status: 'RETURN_REQUESTED',
          title: 'Return Request Submitted',
          description: `Customer submitted return request for ${returnItems.length} item(s). Type: ${requestType}`,
          actor: req.user?.email || order.customerEmail,
          timestamp: new Date(),
        },
      ],
    })

    await returnDoc.save()

    // Link return request to Order
    if (!Array.isArray(order.returnRequests)) order.returnRequests = []
    order.returnRequests.push(returnDoc._id)
    order.returnStatus = 'REQUESTED'
    if (requestType === 'RETURN_REPLACEMENT') {
      order.replacementStatus = 'REQUESTED'
    }

    await transitionOrderStatus(
      order,
      {
        returnStatus: 'REQUESTED',
        replacementStatus: requestType === 'RETURN_REPLACEMENT' ? 'REQUESTED' : 'NONE',
      },
      {
        actor: req.user?.email || order.customerEmail,
        actorType: 'CUSTOMER',
        reason: `Return/Replacement request #${returnNumber} submitted.`,
        source: 'RETURN_API',
      }
    )

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully. Our team will review the evidence and schedule pickup.',
      data: returnDoc,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 2. Get All Return Requests (Admin / Customer)
 * GET /api/returns
 */
export const getAllReturns = async (req, res, next) => {
  try {
    const { status, requestType, orderNumber, page = 1, limit = 20 } = req.query
    const filter = {}

    // If customer, only show their returns
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'ADMIN') {
      filter.user = req.user._id
    }

    if (status) filter.status = status
    if (requestType) filter.requestType = requestType
    if (orderNumber) filter.orderNumber = new RegExp(orderNumber.trim(), 'i')

    const count = await ReturnRequest.countDocuments(filter)
    const returns = await ReturnRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('order', 'orderNumber totalAmount paymentMethod shippingAddress')

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: returns,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 3. Get Return Request by ID
 * GET /api/returns/:id
 */
export const getReturnById = async (req, res, next) => {
  try {
    const { id } = req.params
    const returnDoc = await ReturnRequest.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { returnNumber: id },
      ],
    })
      .populate('order')
      .populate('reverseShipment')
      .populate('replacementOrder')

    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return request not found' })
    }

    res.json({ success: true, data: returnDoc })
  } catch (error) {
    next(error)
  }
}

/**
 * 4. Admin Approves or Rejects Return Request
 * PUT /api/returns/:id/status
 */
export const updateReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, rejectionReason, adminNotes } = req.body

    const returnDoc = await ReturnRequest.findById(id).populate('order')
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return request not found' })
    }

    const previousStatus = returnDoc.status
    returnDoc.status = status

    if (status === 'REJECTED') {
      returnDoc.rejectionReason = rejectionReason || 'Does not meet return criteria'
    } else if (status === 'APPROVED') {
      // Schedule reverse shipment in Delhivery
      const reverseWaybill = generateDelhiveryWaybill()
      returnDoc.reverseWaybill = reverseWaybill

      const reverseShipment = new Shipment({
        order: returnDoc.order._id,
        orderNumber: returnDoc.order.orderNumber,
        shipmentNumber: `SHP-REV-${returnDoc.returnNumber}`,
        shipmentType: 'RETURN',
        courier: 'Delhivery Reverse Express',
        waybill: reverseWaybill,
        status: 'READY_FOR_PICKUP',
        pickupStatus: 'SCHEDULED',
        destination: {
          fullName: 'Sensein Central Logistics Hub',
          addressLine: '104, Vijaynagar 2, Yogichowk',
          city: 'Surat',
          state: 'Gujarat',
          postalCode: '395010',
          phone: '7984919956',
        },
        origin: returnDoc.order.shippingAddress,
      })

      await reverseShipment.save()
      returnDoc.reverseShipment = reverseShipment._id
      returnDoc.status = 'APPROVED'
    }

    returnDoc.timeline.push({
      status,
      title: `Return Request ${status}`,
      description: adminNotes || rejectionReason || `Return request status updated to ${status}`,
      actor: req.user?.email || 'Admin',
      timestamp: new Date(),
    })

    await returnDoc.save()

    // Sync state with parent order
    if (returnDoc.order) {
      await transitionOrderStatus(
        returnDoc.order,
        {
          returnStatus: status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : returnDoc.order.returnStatus,
        },
        {
          actor: req.user?.email || 'Admin',
          actorType: 'ADMIN',
          reason: `Return #${returnDoc.returnNumber} ${status}`,
          source: 'RETURN_ADMIN',
        }
      )
    }

    res.json({
      success: true,
      message: `Return request updated to ${status}`,
      data: returnDoc,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 5. Admin Processes Return QC Inspection & Creates Replacement / Refund
 * POST /api/returns/:id/qc
 */
export const processReturnQC = async (req, res, next) => {
  try {
    const { id } = req.params
    const { qcStatus, disposition, qcNotes } = req.body // qcStatus: 'PASSED' | 'FAILED', disposition: 'SELLABLE' | 'DAMAGED' | 'DISPOSED' | 'REFURBISH'

    const returnDoc = await ReturnRequest.findById(id).populate('order')
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return request not found' })
    }

    returnDoc.qcDetails = {
      status: qcStatus,
      disposition: disposition || 'NONE',
      inspectedBy: req.user?._id,
      inspectedAt: new Date(),
      notes: qcNotes || '',
    }

    returnDoc.status = qcStatus === 'PASSED' ? 'QC_APPROVED' : 'QC_REJECTED'

    returnDoc.timeline.push({
      status: returnDoc.status,
      title: `Quality Inspection: ${qcStatus}`,
      description: `Disposition: ${disposition}. Notes: ${qcNotes || 'Inspection completed.'}`,
      actor: req.user?.email || 'QC Specialist',
      timestamp: new Date(),
    })

    // Restock handling: strictly only restock if disposition === 'SELLABLE'
    if (qcStatus === 'PASSED' && disposition === 'SELLABLE') {
      await restockFromQC(returnDoc.items, 'SELLABLE')
    }

    // If replacement requested and QC passed, automatically create Replacement Order ORD-XXXX-R1
    let replacementOrder = null
    if (qcStatus === 'PASSED' && returnDoc.requestType === 'RETURN_REPLACEMENT') {
      const origOrder = returnDoc.order
      const replacementOrderNumber = `${origOrder.orderNumber}-R1`

      replacementOrder = new Order({
        orderNumber: replacementOrderNumber,
        originalOrderId: origOrder.orderNumber,
        returnRequestId: returnDoc._id,
        user: origOrder.user,
        customerName: origOrder.customerName,
        customerEmail: origOrder.customerEmail,
        customerPhone: origOrder.customerPhone,
        shippingAddress: origOrder.shippingAddress,
        billingAddress: origOrder.billingAddress,
        items: returnDoc.items.map((it) => ({
          product: it.product,
          name: it.name,
          sku: it.sku,
          image: it.image,
          price: it.price,
          quantity: it.quantity,
        })),
        paymentMethod: 'ONLINE',
        paymentStatus: 'PAID', // Replacement covered by original payment
        orderStatus: 'ACTIVE',
        fulfillmentStatus: 'PROCESSING',
        subtotal: returnDoc.items.reduce((sum, it) => sum + it.price * it.quantity, 0),
        totalAmount: 0, // ₹0 replacement charge
      })

      await replacementOrder.save()

      returnDoc.replacementOrder = replacementOrder._id
      returnDoc.replacementOrderNumber = replacementOrderNumber
      returnDoc.status = 'COMPLETED'

      // Create new forward shipment for replacement
      const replacementShipment = new Shipment({
        order: replacementOrder._id,
        orderNumber: replacementOrderNumber,
        shipmentNumber: `SHP-${replacementOrderNumber}`,
        shipmentType: 'REPLACEMENT',
        courier: 'Delhivery Surface & Express B2C',
        waybill: generateDelhiveryWaybill(),
        status: 'SHIPMENT_CREATED',
        pickupStatus: 'PENDING',
        destination: origOrder.shippingAddress,
      })
      await replacementShipment.save()
      replacementOrder.activeShipment = replacementShipment._id
      await replacementOrder.save()

      // Update original order
      await transitionOrderStatus(
        origOrder,
        {
          replacementStatus: 'CREATED',
        },
        {
          actor: req.user?.email || 'Admin QC',
          actorType: 'ADMIN',
          reason: `Replacement order #${replacementOrderNumber} generated following QC approval.`,
          source: 'QC_REPLACEMENT',
        }
      )
    }

    await returnDoc.save()

    res.json({
      success: true,
      message: `Return QC processed successfully. Result: ${qcStatus}`,
      data: returnDoc,
      replacementOrder,
    })
  } catch (error) {
    next(error)
  }
}
