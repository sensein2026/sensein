import Coupon from '../models/Coupon.js'
import Order from '../models/Order.js'

const DEFAULT_COUPONS = [
  {
    code: 'SENSEIN10',
    aliases: ['SENSEIN10', 'SENSE10', 'SENSEIN', 'FLAT10', 'SAVE10', 'DISCOUNT10', 'SENSE'],
    title: 'Flat 10% OFF',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 300,
    description: '10% instant discount (up to ₹300) on all botanical haircare formulations.',
    minSpend: 499,
    badge: '',
    firstOrderOnly: false,
    isActive: true,
  },
  {
    code: 'LUXE15',
    aliases: ['LUXE15', 'LUX15', 'LUXE', 'LUX', 'LUXURY15', 'LUXURY', 'FLAT15'],
    title: '15% OFF LUXURY',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 500,
    description: '15% instant discount (up to ₹500) on luxury orders above ₹1,499.',
    minSpend: 1499,
    badge: '',
    firstOrderOnly: false,
    isActive: true,
  },
  {
    code: 'GLOW200',
    aliases: ['GLOW200', 'GLOW', 'FLAT200', 'SAVE200', 'GLOW20', 'FLAT20'],
    title: '₹200 FLAT OFF',
    discountType: 'fixed',
    discountValue: 200,
    maxDiscount: 200,
    description: 'Flat ₹200 instant cash discount on premium orders above ₹1,199.',
    minSpend: 1199,
    badge: '',
    firstOrderOnly: false,
    isActive: true,
  },
  {
    code: 'FIRST50',
    aliases: ['FIRST50', 'FIRST', 'WELCOME', 'WELCOME50', 'NEWUSER', 'WELCOME10'],
    title: '₹50 WELCOME (1st ORDER)',
    discountType: 'fixed',
    discountValue: 50,
    maxDiscount: 50,
    description: 'Flat ₹50 welcome discount for new Sensein connoisseurs on their 1st order.',
    minSpend: 399,
    badge: '★ 1ST ORDER ONLY',
    firstOrderOnly: true,
    isActive: true,
  },
  {
    code: 'FREESHIP',
    aliases: ['FREESHIP', 'FREESHIPPING', 'FREE', 'DELIVERY', 'SHIPFREE'],
    title: 'FREE EXPRESS SHIPPING',
    discountType: 'fixed',
    discountValue: 79,
    maxDiscount: 79,
    description: 'Free priority doorstep shipping across all India pin codes.',
    minSpend: 699,
    badge: '',
    firstOrderOnly: false,
    isActive: true,
  },
]

// Auto-seed helper
export const ensureDefaultCoupons = async () => {
  try {
    const count = await Coupon.countDocuments()
    if (count === 0) {
      await Coupon.insertMany(DEFAULT_COUPONS)
      console.log('✅ Default coupons seeded successfully')
    } else {
      // Ensure only FIRST50 has the Star badge and firstOrderOnly = true
      await Coupon.updateOne(
        { code: 'FIRST50' },
        { $set: { firstOrderOnly: true, badge: '★ 1ST ORDER ONLY' } }
      )
      // Clear extra badges from other default coupons if any
      await Coupon.updateMany(
        { code: { $ne: 'FIRST50' }, badge: { $in: ['POPULAR', 'BEST VALUE', 'SPECIAL', 'DELIVERY', 'FIRST ORDER'] } },
        { $set: { badge: '', firstOrderOnly: false } }
      )
    }
  } catch (err) {
    console.warn('⚠️ Could not seed default coupons:', err.message)
  }
}

// 1. Get all active coupons (Public API for Storefront)
export const getActiveCoupons = async (req, res) => {
  try {
    await ensureDefaultCoupons()

    // Determine if requester has placed any previous orders
    let hasOrdered = false
    const userEmail = (
      req.user?.email ||
      req.headers['x-user-email'] ||
      req.query?.email ||
      ''
    ).trim().toLowerCase()
    const userId = req.user?._id

    if (userId || userEmail) {
      const orderQuery = {
        $or: [
          ...(userId ? [{ user: userId }] : []),
          ...(userEmail
            ? [
                {
                  customerEmail: {
                    $regex: new RegExp(
                      '^' + userEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$',
                      'i'
                    ),
                  },
                },
              ]
            : []),
        ],
        orderStatus: { $nin: ['CANCELLED', 'PAYMENT_FAILED'] },
      }
      const count = await Order.countDocuments(orderQuery)
      if (count > 0) {
        hasOrdered = true
      }
    }

    let filter = { isActive: true }
    if (hasOrdered) {
      // Hide first-order-only coupons if customer already has placed an order
      filter.firstOrderOnly = { $ne: true }
    }

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 })
    res.json({
      success: true,
      count: coupons.length,
      hasOrdered,
      data: coupons,
    })
  } catch (error) {
    console.error('Error fetching active coupons:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' })
  }
}

// 2. Validate a specific coupon code before applying
export const validateCoupon = async (req, res) => {
  try {
    const { code, email, subtotal, cartTotal, amount } = req.body
    const orderAmount = Number(subtotal ?? cartTotal ?? amount ?? 0)
    const cleanCode = (code || '').trim().toUpperCase()
    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' })
    }

    const coupon = await Coupon.findOne({
      $or: [{ code: cleanCode }, { aliases: cleanCode }],
      isActive: true,
    })

    if (!coupon) {
      return res.status(404).json({ success: false, message: `Coupon "${cleanCode}" is invalid or expired` })
    }

    // Check expiry
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" has expired` })
    }

    // Check minimum spend
    if (coupon.minSpend && orderAmount < coupon.minSpend) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${coupon.code}" requires a minimum order of ₹${coupon.minSpend.toLocaleString('en-IN')}`,
      })
    }

    // Check first-order-only constraint
    if (coupon.firstOrderOnly) {
      const userEmail = (
        req.user?.email ||
        req.headers['x-user-email'] ||
        email ||
        ''
      ).trim().toLowerCase()
      const userId = req.user?._id

      if (userId || userEmail) {
        const orderQuery = {
          $or: [
            ...(userId ? [{ user: userId }] : []),
            ...(userEmail
              ? [
                  {
                    customerEmail: {
                      $regex: new RegExp(
                        '^' + userEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$',
                        'i'
                      ),
                    },
                  },
                ]
              : []),
          ],
          orderStatus: { $nin: ['CANCELLED', 'PAYMENT_FAILED'] },
        }
        const pastOrders = await Order.countDocuments(orderQuery)
        if (pastOrders > 0) {
          return res.status(400).json({
            success: false,
            message: `Coupon "${coupon.code}" is valid only for your first order.`,
          })
        }
      }
    }

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      data: coupon,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to validate coupon' })
  }
}

// 3. Get all coupons (Admin API - includes inactive ones)
export const getAllCouponsAdmin = async (req, res) => {
  try {
    await ensureDefaultCoupons()
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    res.json({
      success: true,
      count: coupons.length,
      data: coupons,
    })
  } catch (error) {
    console.error('Error fetching admin coupons:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' })
  }
}

// 4. Create a new coupon (Admin API)
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      title,
      discountType,
      discountValue,
      maxDiscount,
      minSpend,
      description,
      badge,
      isActive,
      expiryDate,
      firstOrderOnly,
      aliases,
    } = req.body

    const cleanCode = (code || '').trim().toUpperCase()
    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' })
    }

    const existing = await Coupon.findOne({ code: cleanCode })
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon with code "${cleanCode}" already exists` })
    }

    const newCoupon = await Coupon.create({
      code: cleanCode,
      title: (title || cleanCode).trim(),
      discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Number(discountValue) || 10,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      minSpend: Number(minSpend) || 0,
      description: (description || '').trim(),
      badge: (badge || 'OFFER').trim().toUpperCase(),
      isActive: isActive !== false,
      firstOrderOnly: Boolean(firstOrderOnly),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      aliases: Array.isArray(aliases)
        ? aliases.map((a) => String(a).trim().toUpperCase()).filter(Boolean)
        : typeof aliases === 'string'
        ? aliases.split(',').map((a) => a.trim().toUpperCase()).filter(Boolean)
        : [cleanCode],
    })

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: newCoupon,
    })
  } catch (error) {
    console.error('Error creating coupon:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to create coupon' })
  }
}

// 5. Update an existing coupon (Admin API)
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params
    const {
      code,
      title,
      discountType,
      discountValue,
      maxDiscount,
      minSpend,
      description,
      badge,
      isActive,
      expiryDate,
      firstOrderOnly,
      aliases,
    } = req.body

    const coupon = await Coupon.findById(id)
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' })
    }

    if (code) {
      const cleanCode = code.trim().toUpperCase()
      if (cleanCode !== coupon.code) {
        const conflict = await Coupon.findOne({ code: cleanCode, _id: { $ne: id } })
        if (conflict) {
          return res.status(400).json({ success: false, message: `Coupon code "${cleanCode}" is already in use` })
        }
        coupon.code = cleanCode
      }
    }

    if (title !== undefined) coupon.title = title.trim()
    if (discountType !== undefined) coupon.discountType = discountType
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue)
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount ? Number(maxDiscount) : null
    if (minSpend !== undefined) coupon.minSpend = Number(minSpend)
    if (description !== undefined) coupon.description = (description || '').trim()
    if (badge !== undefined) coupon.badge = (badge || '').trim().toUpperCase()
    if (isActive !== undefined) coupon.isActive = Boolean(isActive)
    if (firstOrderOnly !== undefined) coupon.firstOrderOnly = Boolean(firstOrderOnly)
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate ? new Date(expiryDate) : null
    if (aliases !== undefined) {
      coupon.aliases = Array.isArray(aliases)
        ? aliases.map((a) => String(a).trim().toUpperCase()).filter(Boolean)
        : typeof aliases === 'string'
        ? aliases.split(',').map((a) => a.trim().toUpperCase()).filter(Boolean)
        : coupon.aliases
    }

    await coupon.save()

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    })
  } catch (error) {
    console.error('Error updating coupon:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to update coupon' })
  }
}

// 6. Delete a coupon (Admin API)
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await Coupon.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coupon not found' })
    }

    res.json({
      success: true,
      message: `Coupon "${deleted.code}" deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    res.status(500).json({ success: false, message: 'Failed to delete coupon' })
  }
}

// 7. Toggle Active Status (Admin API)
export const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params
    const coupon = await Coupon.findById(id)
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' })
    }

    coupon.isActive = !coupon.isActive
    await coupon.save()

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" is now ${coupon.isActive ? 'Active' : 'Inactive'}`,
      data: coupon,
    })
  } catch (error) {
    console.error('Error toggling coupon status:', error)
    res.status(500).json({ success: false, message: 'Failed to toggle coupon status' })
  }
}
