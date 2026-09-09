import Product from '../models/Product.js'
import Category from '../models/Category.js'

export const getProducts = async (req, res, next) => {
  try {
    const { category, filter, featured, search, sort, limit = 50, page = 1 } = req.query
    const query = {}

    if (category && category.trim()) {
      const catDoc = await Category.findOne({ slug: new RegExp('^' + category.trim() + '$', 'i') })
      if (catDoc) {
        query.category = catDoc._id
      } else {
        // If category is provided but not found, return empty set
        query.category = null
      }
    }

    if (featured === 'true' || filter === 'bestseller') {
      query.isFeatured = true
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      const matchingCats = await Category.find({
        $or: [{ name: searchRegex }, { slug: searchRegex }],
      }).select('_id')
      const catIds = matchingCats.map((c) => c._id)

      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { category: { $in: catIds } },
        { tags: { $in: [searchRegex] } },
      ]
    }

    let sortOptions = { createdAt: -1 }
    if (sort === 'price-low') sortOptions = { price: 1 }
    if (sort === 'price-high') sortOptions = { price: -1 }
    if (sort === 'rating' || filter === 'bestseller') sortOptions = { rating: -1, reviewsCount: -1 }
    if (filter === 'new') sortOptions = { createdAt: -1 }


    const skip = (Number(page) - 1) * Number(limit)

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ])

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug)
    const product = await Product.findOne(
      isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug }
    ).populate('category', 'name slug')

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    res.json({ success: true, data: product })
  } catch (error) {
    next(error)
  }
}

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true })
      .populate('category', 'name slug')
      .limit(8)
    res.json({ success: true, data: products })
  } catch (error) {
    next(error)
  }
}
