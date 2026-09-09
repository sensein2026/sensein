import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import { env } from '../config/env.js'
import { sendEmail } from '../utils/sendEmail.js'

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: '365d',
  })
}

const buildSimpleOtpEmail = ({ otpCode, isReset = false }) => {
  const action = isReset ? 'Password Reset' : 'Login'
  const subject = `OTP for ${action} - ${otpCode}`

  const text = `Dear customer,\n${otpCode} is your one time password (OTP). Please do not share the OTP with others.\n\nRegards,\nTeam Sensein`

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px; padding: 12px 0;">
      <p style="margin: 0 0 14px 0;">Dear customer,</p>
      <p style="margin: 0 0 20px 0;"><strong>${otpCode}</strong> is your one time password (OTP). Please do not share the OTP with others.</p>
      <p style="margin: 0; line-height: 1.5;">Regards,<br><strong>Team Sensein</strong></p>
    </div>
  `

  return { subject, html, text }
}

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const existingUser = await User.findOne({ email: cleanEmail })
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' })
      }
      // If user exists but is not verified, update details and resend OTP
      existingUser.name = name
      existingUser.password = password
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      existingUser.otpToken = crypto.createHash('sha256').update(otpCode).digest('hex')
      existingUser.otpExpires = Date.now() + 10 * 60 * 1000
      await existingUser.save()

      const emailContent = buildSimpleOtpEmail({ otpCode })

      await sendEmail({
        to: cleanEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      })

      return res.status(200).json({
        success: true,
        requireOtp: true,
        email: cleanEmail,
        message: 'Account created. Verification OTP code has been sent to your email address.',
      })
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex')

    await User.create({
      name,
      email: cleanEmail,
      password,
      isVerified: false,
      otpToken: hashedOtp,
      otpExpires: Date.now() + 10 * 60 * 1000,
    })

    const emailContent = buildSimpleOtpEmail({ otpCode })

    await sendEmail({
      to: cleanEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    })

    res.status(201).json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      message: 'Account created. Verification OTP code has been sent to your email address.',
    })
  } catch (error) {
    next(error)
  }
}

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP code' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanOtp = String(otp).trim()
    const hashedOtp = crypto.createHash('sha256').update(cleanOtp).digest('hex')

    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: { $regex: new RegExp('^' + cleanEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } },
      ],
    })

    if (!user) {
      return res.status(400).json({ success: false, message: 'No account found with this email.' })
    }

    // Allow static test OTP 123456 or genuine matching OTP
    const isStaticOtp = cleanOtp === '123456'
    const isOtpValid = Boolean((user.otpToken && user.otpToken === hashedOtp) || isStaticOtp)
    const isNotExpired = Boolean((user.otpExpires && new Date(user.otpExpires) > new Date()) || isStaticOtp)

    if (!isOtpValid || !isNotExpired) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please check your email inbox.',
      })
    }

    user.isVerified = true
    user.otpToken = undefined
    user.otpExpires = undefined

    await user.save()

    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email address' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: { $regex: new RegExp('^' + cleanEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } },
      ],
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' })
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    user.otpToken = crypto.createHash('sha256').update(otpCode).digest('hex')
    user.otpExpires = Date.now() + 10 * 60 * 1000
    await user.save()

    console.log('🔑 [SENSEIN AUTH OTP RESENT]:', cleanEmail, '->', otpCode)

    const emailContent = buildSimpleOtpEmail({ otpCode })

    try {
      await sendEmail({
        to: cleanEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      })
    } catch (err) {
      console.warn('Resend email error:', err.message)
    }

    res.json({
      success: true,
      message: 'New OTP verification code sent to your email address.',
    })
  } catch (error) {
    next(error)
  }
}

export const quickEmailLogin = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' })
    }

    const cleanEmail = email.trim().toLowerCase()
    let user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: { $regex: new RegExp('^' + cleanEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } },
      ],
    })

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex')
      user = await User.create({
        name: 'Customer',
        email: cleanEmail,
        password: randomPassword,
        isVerified: false,
      })
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    user.otpToken = crypto.createHash('sha256').update(otpCode).digest('hex')
    user.otpExpires = Date.now() + 10 * 60 * 1000
    await user.save()

    console.log('🔑 [SENSEIN AUTH OTP GENERATED]:', cleanEmail, '->', otpCode)

    const emailContent = buildSimpleOtpEmail({ otpCode })

    try {
      await sendEmail({
        to: cleanEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      })
    } catch (emailErr) {
      console.warn('Email dispatch error:', emailErr.message)
    }

    res.json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      message: 'A 6-digit verification code has been sent to your email.',
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    if (!user.isVerified) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      user.otpToken = crypto.createHash('sha256').update(otpCode).digest('hex')
      user.otpExpires = Date.now() + 10 * 60 * 1000
      await user.save()

      const emailContent = buildSimpleOtpEmail({ otpCode })

      await sendEmail({
        to: cleanEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      })

      return res.status(403).json({
        success: false,
        requireOtp: true,
        email: user.email,
        message: 'Account not verified. A 6-digit OTP code has been sent to your email.',
      })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      return res.status(404).json({
        success: false,
        notFound: true,
        message: 'No account registered with this email address. Please create a new account first.',
      })
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString()
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000

    await user.save()

    const emailContent = buildSimpleOtpEmail({ otpCode: resetToken, isReset: true })

    await sendEmail({
      to: cleanEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    })

    res.json({
      success: true,
      message: 'Password reset code has been sent to your email inbox.',
    })
  } catch (error) {
    next(error)
  }
}

export const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP code' })
    }

    const hashedCode = crypto.createHash('sha256').update(code.trim()).digest('hex')

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please check your email inbox.' })
    }

    res.json({
      success: true,
      message: 'OTP code verified successfully.',
    })
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide email, reset code and new password' })
    }

    const hashedCode = crypto.createHash('sha256').update(code.trim()).digest('hex')

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' })
    }

    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined

    await user.save()

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('-password')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({ success: true, user })
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized' })
  }
}

export const getSavedAddresses = async (req, res, next) => {
  try {
    const user = (await User.findById(req.user._id)) || req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (!user.savedAddresses || user.savedAddresses.length === 0) {
      // Find past orders by user id or customer email
      const cleanEmail = user.email ? user.email.toLowerCase().trim() : ''
      const pastOrders = await Order.find({
        $or: [
          { user: user._id },
          ...(cleanEmail
            ? [
                {
                  customerEmail: {
                    $regex: new RegExp(
                      '^' + cleanEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$',
                      'i'
                    ),
                  },
                },
              ]
            : []),
        ],
        'shippingAddress.addressLine': { $exists: true, $ne: '' },
      }).sort({ createdAt: -1 })

      if (pastOrders.length > 0) {
        user.savedAddresses = user.savedAddresses || []
        const seen = new Set()

        for (const ord of pastOrders) {
          const addr = ord.shippingAddress
          if (!addr || !addr.addressLine) continue
          const key = `${(addr.addressLine || '').toLowerCase().trim()}|${(addr.postalCode || '').trim()}`
          if (!seen.has(key)) {
            seen.add(key)
            const isFirst = user.savedAddresses.length === 0
            user.savedAddresses.push({
              title: isFirst ? 'Home' : 'Other',
              fullName: ord.customerName || user.name || 'Customer',
              phone: ord.customerPhone || user.phone || '',
              addressLine: addr.addressLine.trim(),
              city: addr.city || '',
              state: addr.state || 'Gujarat',
              postalCode: addr.postalCode || '',
              country: addr.country || 'India',
              isDefault: isFirst,
            })
          }
        }

        if (user.savedAddresses.length > 0) {
          await user.save()
        }
      }
    }

    res.json({ success: true, data: user.savedAddresses || [] })
  } catch (error) {
    next(error)
  }
}

export const addSavedAddress = async (req, res, next) => {
  try {
    const user = (await User.findById(req.user._id)) || req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { title, fullName, phone, addressLine, city, state, postalCode, country = 'India', isDefault } = req.body

    if (!fullName || !phone || !addressLine || !city || !postalCode) {
      return res.status(400).json({ success: false, message: 'Missing required address fields' })
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10)
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' })
    }

    user.savedAddresses = user.savedAddresses || []

    if (isDefault) {
      user.savedAddresses.forEach((a) => (a.isDefault = false))
    }

    const isFirst = user.savedAddresses.length === 0
    const resolvedTitle = title || (isFirst ? 'Home' : 'Other')

    user.savedAddresses.push({
      title: resolvedTitle,
      fullName,
      phone: cleanPhone,
      addressLine,
      city,
      state: state || 'Gujarat',
      postalCode,
      country,
      isDefault: isDefault !== undefined ? isDefault : isFirst,
    })

    await user.save()
    res.status(201).json({ success: true, message: 'Address saved successfully', data: user.savedAddresses })
  } catch (error) {
    next(error)
  }
}

export const updateSavedAddress = async (req, res, next) => {
  try {
    const user = (await User.findById(req.user._id)) || req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { addressId } = req.params
    const { title, fullName, phone, addressLine, city, state, postalCode, country = 'India', isDefault } = req.body

    const addrIndex = user.savedAddresses?.findIndex((a) => a._id.toString() === addressId)
    if (addrIndex === -1 || addrIndex === undefined) {
      return res.status(404).json({ success: false, message: 'Address not found' })
    }

    let cleanPhone = undefined
    if (phone !== undefined) {
      cleanPhone = String(phone).replace(/\D/g, '').slice(-10)
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' })
      }
    }

    if (isDefault) {
      user.savedAddresses.forEach((a) => (a.isDefault = false))
    }

    const existing = user.savedAddresses[addrIndex]
    user.savedAddresses[addrIndex] = {
      ...existing.toObject(),
      title: title || existing.title || 'Home',
      fullName: fullName !== undefined ? fullName : existing.fullName,
      phone: cleanPhone !== undefined ? cleanPhone : existing.phone,
      addressLine: addressLine !== undefined ? addressLine : existing.addressLine,
      city: city !== undefined ? city : existing.city,
      state: state !== undefined ? state : existing.state,
      postalCode: postalCode !== undefined ? postalCode : existing.postalCode,
      country: country || existing.country || 'India',
      isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
    }

    await user.save()
    res.json({ success: true, message: 'Address updated successfully', data: user.savedAddresses })
  } catch (error) {
    next(error)
  }
}

export const deleteSavedAddress = async (req, res, next) => {
  try {
    const user = (await User.findById(req.user._id)) || req.user
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    user.savedAddresses = user.savedAddresses.filter((a) => a._id.toString() !== req.params.addressId)
    await user.save()
    res.json({ success: true, message: 'Address removed', data: user.savedAddresses })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (name !== undefined) {
      user.name = name.trim() || 'Customer'
    }
    await user.save()

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    next(error)
  }
}
