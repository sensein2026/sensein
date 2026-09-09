import { Instagram } from 'lucide-react'

const defaultPosts = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80',
    handle: '@sensein.india',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=500&q=80',
    handle: '@sensein.india',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=500&q=80',
    handle: '@sensein.india',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=500&q=80',
    handle: '@sensein.india',
  },
]

export default function InstagramFeedSection({ config }) {
  const handle = config?.handle || 'FOLLOW US @SENSEIN.INDIA'
  const profileUrl =
    config?.profileUrl || 'https://www.instagram.com/sensein.india'
  const title = config?.title || '#SenseinHairCare Routine Spotlights'
  const posts =
    config?.posts && config.posts.length > 0 ? config.posts : defaultPosts

  return (
    <section className="py-16 sm:py-20 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#5A3859] hover:text-[#4b2f4a] transition-colors"
          >
            <Instagram className="w-4 h-4" />
            {handle.startsWith('FOLLOW') ? handle : `FOLLOW US ${handle}`}
          </a>
          <h2 className="font-sans text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-stone-900">
            {title}
          </h2>
        </div>

        {/* Instagram Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {posts.map((post) => (
            <a
              key={post.id}
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-none overflow-hidden bg-stone-100 shadow-sm border border-black/8"
            >
              <img
                src={post.image}
                alt="Sensein Instagram post"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4 text-center">
                <Instagram className="w-6 h-6 mb-2" />
                <span className="text-xs font-bold tracking-wider">{post.handle}</span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  )
}
