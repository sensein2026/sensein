import Category from '../models/Category.js'

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
}
