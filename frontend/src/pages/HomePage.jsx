import { useState } from 'react'
import { useHomepageConfig } from '@/features/homepageApi'
import HeroSlider from '@/components/HeroSlider'
import MoxieMissionQuote from '@/components/MoxieMissionQuote'
import BestSellersSection from '@/components/BestSellersSection'
import ShopByConcernSection from '@/components/ShopByConcernSection'
import RealResultsSection from '@/components/RealResultsSection'
import BeforeAfterSection from '@/components/BeforeAfterSection'
import BrandValuesBar from '@/components/BrandValuesBar'
import InstagramFeedSection from '@/components/InstagramFeedSection'
import CustomerReviewsSection from '@/components/CustomerReviewsSection'
import HairQuizModal from '@/components/HairQuizModal'

export default function HomePage() {
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const { config } = useHomepageConfig()
  const visibility = config?.visibility || {}

  return (
    <div className="w-full min-h-screen bg-transparent">
      {/* 1. Auto-sliding Hero Carousel */}
      {(visibility.heroSlider ?? true) && (
        <HeroSlider config={config?.heroSlider} />
      )}

      {/* 2. Clean Beauty Brand Mission Headline */}
      {(visibility.missionQuote ?? true) && (
        <MoxieMissionQuote config={config?.missionQuote} />
      )}

      {/* 4. THE CROWD FAVOURITES (Bestseller Product Cards Grid) */}
      {(visibility.bestSellers ?? true) && <BestSellersSection />}

      {/* 5. Shop by Hair Concern (Frizz, Damage, Scalp, Color) */}
      {(visibility.shopByConcern ?? true) && (
        <ShopByConcernSection config={config?.shopByConcern} />
      )}

      {/* 6. Real People. Real Results (Vertical Video Showcase) */}
      {(visibility.realResults ?? true) && (
        <RealResultsSection config={config?.realResults} />
      )}

      {/* 7. Clinical Before & After Transformation Results */}
      {(visibility.beforeAfter ?? true) && (
        <BeforeAfterSection config={config?.beforeAfter} />
      )}

      {/* 8. Trust & Brand Values Bar */}
      {(visibility.brandValues ?? true) && (
        <BrandValuesBar config={config?.brandValues} />
      )}

      {/* 9. Social Proof Instagram Grid (#SenseinIndia) */}
      {(visibility.instagramFeed ?? true) && (
        <InstagramFeedSection config={config?.instagramFeed} />
      )}

      {/* 10. Customer Reviews & Ratings */}
      {(visibility.customerReviews ?? true) && (
        <CustomerReviewsSection config={config?.customerReviews} />
      )}

      {/* Hair Diagnostic Quiz Modal */}
      <HairQuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
    </div>
  )
}
