import HomepageConfig from '../models/HomepageConfig.js'
import AuditLog from '../models/AuditLog.js'

/**
 * Generate comprehensive structured list of ALL 10 homepage sections, categories, cards, and their inner properties
 */
function extractStructuredHomepageItems(config = {}) {
  const items = []

  const add = (section, categoryOrItem, property, value) => {
    const valStr = value === undefined || value === null ? '' : String(value).trim()
    items.push({
      section,
      categoryOrItem,
      property,
      currentValue: valStr || '(Not Set / Empty)',
    })
  }

  // 1. Sections Overview (Visibility Toggles)
  const vis = config.visibility || {}
  add('1. Sections Overview', 'Announcement Bar', 'Display Toggle', vis.announcementBar ? 'Visible (ON)' : 'Hidden (OFF)')
  add('1. Sections Overview', 'Hero Carousel', 'Display Toggle', vis.heroSlider ? 'Visible (ON)' : 'Hidden (OFF)')
  add('1. Sections Overview', 'Brand Mission', 'Display Toggle', vis.missionQuote ? 'Visible (ON)' : 'Hidden (OFF)')
  add('1. Sections Overview', 'Shop By Concern', 'Display Toggle', vis.shopByConcern ? 'Visible (ON)' : 'Hidden (OFF)')
  add('1. Sections Overview', 'Video Reels (3D)', 'Display Toggle', vis.realResults ? 'Visible (ON)' : 'Hidden (OFF)')
  add('1. Sections Overview', 'Before & After', 'Display Toggle', vis.beforeAfter ? 'Visible (ON)' : 'Hidden (OFF)')
  add('1. Sections Overview', 'Trust & Values', 'Display Toggle', vis.brandValues ? 'Visible (ON)' : 'Hidden (OFF)')
  add('1. Sections Overview', 'Instagram Feed', 'Display Toggle', vis.instagramFeed ? 'Visible (ON)' : 'Hidden (OFF)')
  add('1. Sections Overview', 'Reviews & Proof', 'Display Toggle', vis.customerReviews ? 'Visible (ON)' : 'Hidden (OFF)')

  // 2. Announcement Bar
  const ann = config.announcementBar || {}
  add('2. Announcement Bar', 'Bar Settings', 'Enabled Status', ann.enabled ? 'Enabled (ON)' : 'Disabled (OFF)')
  const msgs = ann.messages || []
  msgs.forEach((m, idx) => {
    add('2. Announcement Bar', `Announcement Message #${idx + 1}`, 'Message Text', m)
  })

  // 3. Hero Carousel Slides
  const slides = config.heroSlider?.slides || []
  slides.forEach((s, idx) => {
    const slideName = s.title ? `Slide #${idx + 1}: ${s.title}` : `Slide #${idx + 1}`
    add('3. Hero Carousel', slideName, 'Media Type', s.type || 'image')
    add('3. Hero Carousel', slideName, 'Video Source URL Link', s.videoSrc)
    add('3. Hero Carousel', slideName, 'Poster Thumbnail Image Link', s.poster)
    add('3. Hero Carousel', slideName, 'Slide Image Photo Link', s.image)
    add('3. Hero Carousel', slideName, 'Headline Title Text', s.title)
    add('3. Hero Carousel', slideName, 'Description Subtitle Text', s.description)
    add('3. Hero Carousel', slideName, 'Button CTA Text', s.btnText || 'Shop Now')
    add('3. Hero Carousel', slideName, 'Button Target Destination Link', s.btnLink || '/shop')
  })

  // 4. Brand Mission
  const mq = config.missionQuote || {}
  add('4. Brand Mission', 'Mission Header', 'Badge Tag Text', mq.badgeText)
  add('4. Brand Mission', 'Mission Header', 'Main Heading Prefix', mq.mainHeadingPrefix)
  add('4. Brand Mission', 'Mission Header', 'Highlighted Brand Text', mq.highlightText)
  add('4. Brand Mission', 'Mission Header', 'Main Heading Suffix', mq.mainHeadingSuffix)

  // 5. Shop By Concern (Categories & Targeted Routines)
  const sbc = config.shopByConcern || {}
  add('5. Shop By Concern', 'Section Settings', 'Section Eyebrow Tag', sbc.tag || 'TARGETED FORMULATION')
  add('5. Shop By Concern', 'Section Settings', 'Section Headline Title', sbc.title || 'Shop by Hair Concern')
  add('5. Shop By Concern', 'Section Settings', 'Section Description Subtitle', sbc.description)
  const concerns = sbc.concerns || []
  concerns.forEach((c, idx) => {
    const catName = c.title ? `Category #${idx + 1}: ${c.title}` : `Category #${idx + 1}`
    add('5. Shop By Concern', catName, 'Category Title Name', c.title)
    add('5. Shop By Concern', catName, 'Category Badge Tag', c.badge)
    add('5. Shop By Concern', catName, 'Full Description Text', c.description)
    add('5. Shop By Concern', catName, 'Banner Photo Image Link', c.image)
    add('5. Shop By Concern', catName, 'Target Shop URL Link', c.link)
  })

  // 6. Video Reels (3D Real Results)
  const rr = config.realResults || {}
  add('6. Video Reels (3D)', 'Section Settings', 'Section Eyebrow Tag', rr.tag || 'REAL PEOPLE. REAL RESULTS.')
  add('6. Video Reels (3D)', 'Section Settings', 'Section Headline Title', rr.title || 'See Sensein In Action')
  add('6. Video Reels (3D)', 'Section Settings', 'Section Description', rr.description)
  add('6. Video Reels (3D)', 'Section Settings', 'Button CTA Text', rr.buttonText || 'Shop All Bestsellers')
  add('6. Video Reels (3D)', 'Section Settings', 'Button Target Link', rr.buttonLink || '/shop')
  const reels = rr.videoCards || []
  reels.forEach((r, idx) => {
    const reelName = r.title ? `Reel #${idx + 1}: ${r.title}` : `Reel #${idx + 1}`
    add('6. Video Reels (3D)', reelName, 'Reel Headline Title', r.title)
    add('6. Video Reels (3D)', reelName, 'Reel Subtitle Description', r.subtitle)
    add('6. Video Reels (3D)', reelName, 'Tagged Product Name', r.productName)
    add('6. Video Reels (3D)', reelName, 'Product Price', r.price)
    add('6. Video Reels (3D)', reelName, 'Video Media URL Link', r.videoSrc)
    add('6. Video Reels (3D)', reelName, 'Video Poster Thumbnail Link', r.poster)
    add('6. Video Reels (3D)', reelName, 'Product Target Link', r.productLink)
    add('6. Video Reels (3D)', reelName, 'Customer Rating Score', r.rating)
    add('6. Video Reels (3D)', reelName, 'Badge Tag', r.tag)
  })

  // 7. Clinical Before & After
  const ba = config.beforeAfter || {}
  add('7. Before & After', 'Section Settings', 'Title Prefix', ba.titlePrefix || 'DIGITS')
  add('7. Before & After', 'Section Settings', 'Title Highlight', ba.titleHighlight || "DON'T LIE")
  add('7. Before & After', 'Section Settings', 'Clinical Footnote Reference', ba.footnote)
  const stats = ba.stats || []
  stats.forEach((st, idx) => {
    add('7. Before & After', `Clinical Stat #${idx + 1}`, 'Metric Percentage / Value', st.value)
    add('7. Before & After', `Clinical Stat #${idx + 1}`, 'Metric Description Label', st.label)
  })
  const trans = ba.transformations || []
  trans.forEach((t, idx) => {
    const transName = t.title ? `Transformation #${idx + 1}: ${t.title}` : `Transformation #${idx + 1}`
    add('7. Before & After', transName, 'Transformation Title', t.title)
    add('7. Before & After', transName, 'Before Photo Image Link', t.beforeImage)
    add('7. Before & After', transName, 'After Photo Image Link', t.afterImage)
    add('7. Before & After', transName, 'Product Name', t.productName)
    add('7. Before & After', transName, 'Product Price', t.productPrice)
    add('7. Before & After', transName, 'Product Target Link', t.productLink)
    add('7. Before & After', transName, 'Badge Tag', t.tag)
  })

  // 8. Trust & Values
  const bv = config.brandValues || {}
  add('8. Trust & Values', 'Section Settings', 'Section Eyebrow Tag', bv.tag || 'OUR TRUST GUARANTEE')
  add('8. Trust & Values', 'Section Settings', 'Section Headline Title', bv.title || 'Why Choose Sensein?')
  const vals = bv.values || []
  vals.forEach((v, idx) => {
    const valName = v.title ? `Value #${idx + 1}: ${v.title}` : `Value #${idx + 1}`
    add('8. Trust & Values', valName, 'Lucide Icon Name', v.iconName || 'ShieldCheck')
    add('8. Trust & Values', valName, 'Value Title Heading', v.title)
    add('8. Trust & Values', valName, 'Full Description Text', v.desc)
  })

  // 9. Instagram Feed
  const insta = config.instagramFeed || {}
  add('9. Instagram Feed', 'Profile Settings', 'Instagram Handle Tag', insta.handle || '@SENSEIN.INDIA')
  add('9. Instagram Feed', 'Profile Settings', 'Instagram Profile URL Link', insta.profileUrl)
  add('9. Instagram Feed', 'Profile Settings', 'Section Headline Title', insta.title)
  const posts = insta.posts || []
  posts.forEach((p, idx) => {
    const postName = `Instagram Post #${idx + 1}`
    add('9. Instagram Feed', postName, 'Post Photo URL Link', p.image)
    add('9. Instagram Feed', postName, 'Handle Tag', p.handle)
  })

  // 10. Reviews & Proof
  const cr = config.customerReviews || {}
  add('10. Reviews & Proof', 'Section Settings', 'Section Eyebrow Tag', cr.tag || 'PROVEN RESULTS & LOVE')
  add('10. Reviews & Proof', 'Section Settings', 'Section Headline Title', cr.title || 'Loved by 25,000+ Indian Hair Routines')
  add('10. Reviews & Proof', 'Section Settings', 'Rating Summary Text', cr.ratingSummary)
  const revs = cr.reviews || []
  revs.forEach((rv, idx) => {
    const revName = rv.name ? `Review #${idx + 1}: ${rv.name}` : `Review #${idx + 1}`
    add('10. Reviews & Proof', revName, 'Customer Reviewer Name', rv.name)
    add('10. Reviews & Proof', revName, 'Customer Role', rv.role)
    add('10. Reviews & Proof', revName, 'Location / City', rv.location)
    add('10. Reviews & Proof', revName, 'Rating Stars Score', `${rv.rating || 5} Stars`)
    add('10. Reviews & Proof', revName, 'Review Headline Title', rv.title)
    add('10. Reviews & Proof', revName, 'Full Story / Feedback Text', rv.text)
    add('10. Reviews & Proof', revName, 'Product Mentioned', rv.product)
    add('10. Reviews & Proof', revName, 'Customer Avatar Photo Link', rv.avatar)
    add('10. Reviews & Proof', revName, 'Verified Buyer Status', rv.verified ? 'Verified Buyer' : 'General')
  })

  return items
}

/**
 * Compare old configuration and new configuration item-by-item across all sections
 */
function extractHomepageDiff(oldDoc = {}, newDoc = {}) {
  const oldItems = extractStructuredHomepageItems(oldDoc)
  const newItems = extractStructuredHomepageItems(newDoc)

  const oldMap = new Map()
  oldItems.forEach((item) => {
    oldMap.set(`${item.section}:::${item.categoryOrItem}:::${item.property}`, item.currentValue)
  })

  const changes = []

  newItems.forEach((item) => {
    const key = `${item.section}:::${item.categoryOrItem}:::${item.property}`
    const oldVal = oldMap.get(key)
    const newVal = item.currentValue

    if (oldVal === undefined) {
      // NEW CATEGORY / ITEM ADDED: Did not exist in old version
      changes.push({
        section: item.section,
        categoryOrItem: item.categoryOrItem,
        property: item.property,
        beforeValue: '✨ [NEW ITEM ADDED — Previously Did Not Exist / અગાઉ નહોતું]',
        afterValue: newVal,
        status: 'NEWLY_ADDED',
        timestamp: new Date(),
      })
    } else if (oldVal !== newVal) {
      // MODIFIED: Value changed
      changes.push({
        section: item.section,
        categoryOrItem: item.categoryOrItem,
        property: item.property,
        beforeValue: oldVal,
        afterValue: newVal,
        status: 'MODIFIED',
        timestamp: new Date(),
      })
    }
  })

  return changes
}

/**
 * @desc Get active homepage configuration & content
 * @route GET /api/homepage
 * @access Public
 */
export async function getHomepageConfig(req, res, next) {
  try {
    let config = await HomepageConfig.findOne({ configKey: 'default_homepage' })

    if (!config) {
      config = await HomepageConfig.create({ configKey: 'default_homepage' })
    }

    res.json({
      success: true,
      data: config,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc Update homepage configuration & content with Before vs After Diff Logging
 * @route PUT /api/admin/homepage
 * @access Private (Admin)
 */
export async function updateHomepageConfig(req, res, next) {
  try {
    const payload = { ...req.body }
    delete payload._id
    delete payload.__v
    delete payload.createdAt
    delete payload.updatedAt

    // 1. Fetch current (before-update) state
    const previousDoc = await HomepageConfig.findOne({ configKey: 'default_homepage' }).lean()

    // 2. Compute Before vs After changes across all sections & inner properties
    const changes = extractHomepageDiff(previousDoc || {}, payload)

    // 3. Upsert new homepage configuration
    const updated = await HomepageConfig.findOneAndUpdate(
      { configKey: 'default_homepage' },
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    )

    // 4. Create AuditLog entry with full comparison diff and previous snapshot
    if (changes.length > 0) {
      await AuditLog.create({
        action: 'UPDATE',
        targetType: 'HomepageConfig',
        targetId: updated._id.toString(),
        entityType: 'HomepageConfig',
        entityId: updated._id.toString(),
        actor: req.user?.email || 'admin@sensein.in',
        actorId: req.user?._id || null,
        title: `Updated Front Page CMS (${changes.length} properties modified/added)`,
        details: {
          changeCount: changes.length,
          changes: changes.slice(0, 150),
          summary: changes.map((c) => `${c.section} -> ${c.categoryOrItem} (${c.property})`).join(', '),
        },
        metadata: {
          changeCount: changes.length,
          changes: changes.slice(0, 150),
          summary: changes.map((c) => `${c.section} -> ${c.categoryOrItem} (${c.property})`).join(', '),
        },
        performedBy: req.user?._id,
        performerEmail: req.user?.email || 'admin@sensein.in',
        isRecoverable: true,
        snapshotData: previousDoc,
      })
    }

    res.json({
      success: true,
      message: `Homepage content updated successfully (${changes.length} changes logged).`,
      data: updated,
      changesLogged: changes.length,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc Reset homepage content back to original defaults
 * @route POST /api/admin/homepage/reset
 * @access Private (Admin)
 */
export async function resetHomepageConfig(req, res, next) {
  try {
    const previousDoc = await HomepageConfig.findOne({ configKey: 'default_homepage' }).lean()
    await HomepageConfig.deleteOne({ configKey: 'default_homepage' })
    const freshConfig = await HomepageConfig.create({ configKey: 'default_homepage' })

    await AuditLog.create({
      action: 'RESET',
      targetType: 'HomepageConfig',
      targetId: freshConfig._id.toString(),
      entityType: 'HomepageConfig',
      entityId: freshConfig._id.toString(),
      actor: req.user?.email || 'admin@sensein.in',
      actorId: req.user?._id || null,
      title: 'Reset Front Page CMS back to default template',
      performedBy: req.user?._id,
      performerEmail: req.user?.email || 'admin@sensein.in',
      isRecoverable: true,
      snapshotData: previousDoc,
    })

    res.json({
      success: true,
      message: 'Homepage content reset to original defaults',
      data: freshConfig,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc Export Front Page CMS Comprehensive Section-Wise Before vs After Sheet as CSV
 * @route GET /api/admin/homepage/export-changes-csv
 * @access Private (Admin)
 */
export async function exportHomepageChangesCsv(req, res, next) {
  try {
    const currentConfig = (await HomepageConfig.findOne({ configKey: 'default_homepage' }).lean()) || {}
    const auditLogs = await AuditLog.find({ entityType: 'HomepageConfig' }).sort({ createdAt: -1 }).limit(100).lean()

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const headers = [
      'Homepage Section (વિભાગ)',
      'Category / Item Name (કેટેગરી / આઇટમ)',
      'Property / Field Name (અંદરની વિગત / ફીલ્ડ)',
      'Value Before Update (🔴 પહેલાં શું હતું - Previous Data)',
      'After Update / Current Live (🟢 હાલ ત્યાં શું પડ્યું છે - New Active Data)',
      'Status / Change Type (સ્થિતિ)',
      'Last Modified Date & Time',
      'Modified By',
      'Log Reference ID',
    ]

    const rows = []
    const changeKeysAdded = new Set()

    // 1. Process all audit log diffs
    for (const log of auditLogs) {
      const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : 'N/A'
      const adminEmail = log.performerEmail || 'admin@sensein.in'
      const changesList = log.details?.changes || []

      for (const item of changesList) {
        const key = `${item.section}:::${item.categoryOrItem || item.field}:::${item.property || ''}`
        changeKeysAdded.add(key)
        rows.push([
          escapeCsv(item.section || 'Front Page CMS'),
          escapeCsv(item.categoryOrItem || item.field || 'Item'),
          escapeCsv(item.property || 'Property Detail'),
          escapeCsv(item.beforeValue || '(None)'),
          escapeCsv(item.afterValue || '(None)'),
          escapeCsv(item.status === 'NEWLY_ADDED' ? '✨ NEWLY ADDED' : '✏️ MODIFIED'),
          escapeCsv(dateStr),
          escapeCsv(adminEmail),
          escapeCsv(log._id),
        ])
      }
    }

    // 2. Add all currently active items across ALL sections & inner properties
    const allCurrentItems = extractStructuredHomepageItems(currentConfig)
    const todayStr = new Date().toLocaleString('en-IN')

    allCurrentItems.forEach((item) => {
      const key = `${item.section}:::${item.categoryOrItem}:::${item.property}`
      if (!changeKeysAdded.has(key)) {
        rows.push([
          escapeCsv(item.section),
          escapeCsv(item.categoryOrItem),
          escapeCsv(item.property),
          escapeCsv('Original Initial Baseline'),
          escapeCsv(item.currentValue),
          escapeCsv('🟢 LIVE ACTIVE'),
          escapeCsv(todayStr),
          escapeCsv('System Master'),
          escapeCsv('LIVE_ACTIVE_SNAPSHOT'),
        ])
      }
    })

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Front_Page_CMS_Complete_Detailed_Sheet_${Date.now()}.csv"`
    )
    return res.status(200).send(csvContent)
  } catch (error) {
    next(error)
  }
}
