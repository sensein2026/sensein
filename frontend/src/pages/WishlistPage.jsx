import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Heart, ShoppingBag, Trash2, ArrowLeft, Star } from 'lucide-react'
import { selectWishlistItems, removeFromWishlist, clearWishlist } from '@/store/wishlistSlice'
import { addToCart } from '@/store/cartSlice'
import { setCartDrawerOpen } from '@/store/uiSlice'

export default function WishlistPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const wishlistItems = useSelector(selectWishlistItems)

  const handleAddToCart = (product) => {
    dispatch(addToCart({ product, quantity: 1 }))
  }

  const handleMoveAllToCart = () => {
    wishlistItems.forEach((item) => {
      dispatch(addToCart({ product: item, quantity: 1 }))
    })
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-10 md:py-14 pb-24 font-sans">
      <div className="container-page max-w-6xl space-y-8">
        
        {/* Top Navigation & Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#5A3859] transition-colors bg-white px-3.5 py-1.5 border border-stone-200 rounded-none shadow-sm cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Shopping</span>
          </button>

          {wishlistItems.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(clearWishlist())}
              className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-none shadow-sm cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Wishlist</span>
            </button>
          )}
        </div>

        {/* Page Title & Bulk Action */}
        <div className="pb-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-[0.25em] text-[#5A3859]">
              Personal Favorites Saved
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              My Saved Wishlist ({wishlistItems.length})
            </h1>
          </div>

          {wishlistItems.length > 0 && (
            <button
              type="button"
              onClick={handleMoveAllToCart}
              className="bg-[#5A3859] hover:bg-[#4B2F4A] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-none flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Move All Items to Bag</span>
            </button>
          )}
        </div>

        {/* Wishlist Grid */}
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-none p-12 text-center max-w-md mx-auto border border-stone-200 shadow-sm space-y-4 my-12">
            <Heart className="h-12 w-12 text-stone-300 mx-auto" />
            <h3 className="text-xl font-bold text-stone-900">Your Wishlist is Empty</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Explore our luxury botanical formulations and tap the heart icon on any product to save it for later.
            </p>
            <Link
              to="/shop"
              className="bg-[#5A3859] hover:bg-[#4B2F4A] text-white text-xs font-bold uppercase tracking-wider py-3 px-8 inline-block rounded-none shadow-sm transition-all"
            >
              Explore Botanical Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map((product) => {
              const productId = product._id || product.id
              const discountPct = product.compareAtPrice > product.price
                ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                : 15

              return (
                <div
                  key={productId}
                  className="bg-white rounded-none border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Product Image Stage */}
                    <div className="relative overflow-hidden bg-stone-50 aspect-square border-b border-stone-100">
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Discount Badge - Sharp Square */}
                      <div className="absolute top-2.5 left-2.5 bg-[#5A3859] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-none shadow-sm uppercase tracking-wider">
                        {discountPct}% OFF
                      </div>

                      {/* Remove Button - Sharp Square */}
                      <button
                        type="button"
                        onClick={() => dispatch(removeFromWishlist(productId))}
                        className="absolute top-2.5 right-2.5 h-7 w-7 rounded-none bg-white text-stone-400 hover:text-red-600 hover:bg-red-50 border border-stone-200 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Rating Badge - Sharp Square */}
                      <div className="absolute bottom-2.5 left-2.5 bg-white/95 px-2 py-0.5 rounded-none text-[10px] font-bold text-stone-800 flex items-center gap-1 border border-stone-200 shadow-sm">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span>{product.rating || '4.9'}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-1.5">
                      <span className="text-[9px] font-bold tracking-wider text-[#5A3859] uppercase">
                        {product.category?.name || 'Hair Care'}
                      </span>
                      <Link
                        to={`/product/${product.slug}`}
                        className="block text-xs font-bold text-stone-900 group-hover:text-[#5A3859] transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="p-4 pt-0 flex items-center justify-between border-t border-stone-100 pt-3 mt-1">
                    <div>
                      <span className="text-sm font-black text-stone-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.compareAtPrice > product.price && (
                        <span className="text-xs text-stone-400 line-through ml-1.5">
                          ₹{product.compareAtPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="bg-[#5A3859] hover:bg-[#4B2F4A] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-none flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      <span>Move to Bag</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
