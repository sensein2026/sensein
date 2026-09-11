import { useState, useEffect } from 'react'
import {
  Gift,
  Truck,
  Sparkles,
  Save,
  RefreshCw,
  Zap,
  CheckCircle2,
  Tag,
  ShieldCheck,
  Package,
  ExternalLink,
  Percent,
  Sliders,
  Eye,
  Info,
  Layers,
} from 'lucide-react'
import {
  useGetShippingFeeSettingsQuery,
  useUpdateShippingFeeSettingsMutation,
} from '@/features/adminApi'
import { useToast } from '@/context/ToastContext'

export default function GiftsPage() {
  const toast = useToast()
  const { data: settingsData, isLoading, refetch } = useGetShippingFeeSettingsQuery()
  const [updateSettings, { isLoading: isSaving }] = useUpdateShippingFeeSettingsMutation()

  const [formData, setFormData] = useState({
    // Cart Progress Mode: 'simple' (1-tier Free Shipping only) vs 'tiered' (3-tier Milestones)
    cartProgressMode: 'tiered',

    // Standard Shipping
    standardShippingFee: 79,
    freeShippingThreshold: 999,
    isFreeShippingEnabled: true,
    shippingNote: 'Standard shipping ₹79 • Free express delivery on orders above ₹999',

    // Legacy / Gift Sync
    isGiftPromoEnabled: true,
    giftMinSpend: 2999,
    giftItemName: 'Sensein Luxury Botanical Mini Elixir (30ml)',
    giftBadge: 'FREE GIFT',
    giftNote: 'Complimentary luxury haircare gift included on all orders above ₹2999',

    // 3-Tier Gamified Milestones
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
    tier3Note: 'Complimentary luxury gift added to your order',
  })

  // Simulated Cart Amount for live preview
  const [previewCartSpend, setPreviewCartSpend] = useState(1500)

  // Populate from DB when fetched
  useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings
      setFormData({
        cartProgressMode: s.cartProgressMode === 'simple' ? 'simple' : 'tiered',
        standardShippingFee: s.standardShippingFee ?? 79,
        freeShippingThreshold: s.freeShippingThreshold ?? 999,
        isFreeShippingEnabled: s.isFreeShippingEnabled !== false,
        shippingNote:
          s.shippingNote ||
          'Standard shipping ₹79 • Free express delivery on orders above ₹999',

        isGiftPromoEnabled: s.isGiftPromoEnabled !== false,
        giftMinSpend: s.giftMinSpend ?? 2999,
        giftItemName:
          s.giftItemName || 'Sensein Luxury Botanical Mini Elixir (30ml)',
        giftBadge: s.giftBadge || 'FREE GIFT',
        giftNote:
          s.giftNote ||
          'Complimentary luxury haircare gift included on all orders above ₹2999',

        tier1Enabled: s.tier1Enabled !== false,
        tier1Threshold: s.tier1Threshold ?? s.freeShippingThreshold ?? 999,
        tier1Title: s.tier1Title || 'Free Delivery',

        tier2Enabled: s.tier2Enabled !== false,
        tier2Threshold: s.tier2Threshold ?? 1999,
        tier2Title: s.tier2Title || 'Special Coupon',
        tier2CouponCode: s.tier2CouponCode || 'EXTRA10',
        tier2DiscountText: s.tier2DiscountText || '10% Instant Off',

        tier3Enabled: s.tier3Enabled !== false,
        tier3Threshold: s.tier3Threshold ?? s.giftMinSpend ?? 2999,
        tier3Title: s.tier3Title || 'Special Gift Free',
        tier3ItemName:
          s.tier3ItemName || s.giftItemName || 'Sensein Luxury Botanical Mini Elixir (30ml)',
        tier3ProductLink: s.tier3ProductLink || '/shop',
        tier3Badge: s.tier3Badge || s.giftBadge || 'FREE GIFT',
        tier3Note:
          s.tier3Note || s.giftNote || 'Complimentary luxury gift added to your order',
      })
    }
  }, [settingsData])

  const handleSave = async (e) => {
    e?.preventDefault()
    try {
      const isSimple = formData.cartProgressMode === 'simple'
      const payload = {
        cartProgressMode: formData.cartProgressMode || 'tiered',
        standardShippingFee: Math.max(0, Number(formData.standardShippingFee) || 0),
        freeShippingThreshold: Math.max(0, Number(formData.tier1Threshold) || 0),
        isFreeShippingEnabled: true,
        shippingNote: formData.shippingNote.trim(),

        isGiftPromoEnabled: !isSimple,
        giftMinSpend: Math.max(0, Number(formData.tier3Threshold) || 0),
        giftItemName: formData.tier3ItemName.trim(),
        giftBadge: formData.tier3Badge.trim().toUpperCase() || 'FREE GIFT',
        giftNote: formData.tier3Note.trim(),

        // 3-Tier Milestones
        tier1Enabled: true,
        tier1Threshold: Math.max(0, Number(formData.tier1Threshold) || 0),
        tier1Title: formData.tier1Title.trim() || 'Free Delivery',

        tier2Enabled: !isSimple,
        tier2Threshold: Math.max(0, Number(formData.tier2Threshold) || 0),
        tier2Title: formData.tier2Title.trim() || 'Special Coupon',
        tier2CouponCode: formData.tier2CouponCode.trim().toUpperCase() || 'EXTRA10',
        tier2DiscountText: formData.tier2DiscountText.trim() || '10% Instant Off',

        tier3Enabled: !isSimple,
        tier3Threshold: Math.max(0, Number(formData.tier3Threshold) || 0),
        tier3Title: formData.tier3Title.trim() || 'Special Gift Free',
        tier3ItemName: formData.tier3ItemName.trim() || 'Sensein Luxury Botanical Mini Elixir (30ml)',
        tier3ProductLink: formData.tier3ProductLink.trim() || '/shop',
        tier3Badge: formData.tier3Badge.trim().toUpperCase() || 'FREE GIFT',
        tier3Note: formData.tier3Note.trim() || 'Complimentary luxury gift added to your order',
      }

      const res = await updateSettings(payload).unwrap()
      if (toast?.success) {
        toast.success(res?.message || 'Cart Milestone & Shipping settings saved successfully!', 'Settings Saved')
      }
    } catch (err) {
      if (toast?.error) {
        toast.error(err?.data?.message || 'Failed to save settings. Please check details.', 'Save Failed')
      }
    }
  }

  // Calculate live progress for preview
  const t1 = Math.max(1, Number(formData.tier1Threshold) || 999)
  const t2 = Math.max(t1 + 1, Number(formData.tier2Threshold) || 1999)
  const t3 = Math.max(t2 + 1, Number(formData.tier3Threshold) || 2999)

  let previewProgress = 0
  if (previewCartSpend >= t1) {
    if (previewCartSpend < t2) {
      // Filling from Node 1 (0%) to Node 2 (50%)
      const range = Math.max(1, t2 - t1)
      previewProgress = ((previewCartSpend - t1) / range) * 50
    } else if (previewCartSpend < t3) {
      // Filling from Node 2 (50%) to Node 3 (100%)
      const range = Math.max(1, t3 - t2)
      previewProgress = 50 + ((previewCartSpend - t2) / range) * 50
    } else {
      previewProgress = 100
    }
  }
  previewProgress = Math.min(100, Math.max(0, Math.round(previewProgress * 10) / 10))

  const isT1Unlocked = previewCartSpend >= t1
  const isT2Unlocked = previewCartSpend >= t2
  const isT3Unlocked = previewCartSpend >= t3

  let previewBannerText = ''
  if (!isT1Unlocked) {
    const diff = t1 - previewCartSpend
    previewBannerText = `Add ₹${diff.toLocaleString('en-IN')} more to unlock Free Express Shipping!`
  } else if (!isT2Unlocked) {
    const diff = t2 - previewCartSpend
    previewBannerText = `🎉 Free Delivery Unlocked! Add ₹${diff.toLocaleString('en-IN')} more to unlock Special Coupon (${formData.tier2CouponCode})!`
  } else if (!isT3Unlocked) {
    const diff = t3 - previewCartSpend
    previewBannerText = `🎉 Coupon & Delivery Unlocked! Add ₹${diff.toLocaleString('en-IN')} more to claim Free Luxury Gift!`
  } else {
    previewBannerText = `🔥 Congratulations! You have unlocked all 3 Milestone Rewards!`
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl shadow-md shadow-purple-500/20">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Cart Milestone &amp; Shipping Settings</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {formData.cartProgressMode === 'simple' ? '1-Tier Simple' : '3-Tier System'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose between Classic 1-Tier Free Shipping or 3-Tier Gamified Milestones (Delivery + Coupon + Gift)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={async () => {
              await refetch()
              toast?.info?.('Settings reloaded from database', 'Reloaded')
            }}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Reload from server"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2-Option Mode Switcher */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-600" />
              <span>Cart Progress Bar Display Mode (પ્રોગ્રેસ બાર મોડ પસંદ કરો)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select either Option 1 (Classic Simple Bar) or Option 2 (3-Tier Milestones).
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase self-start sm:self-auto ${
            formData.cartProgressMode === 'simple'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-purple-100 text-purple-800 border border-purple-200'
          }`}>
            {formData.cartProgressMode === 'simple' ? '🚚 Classic Simple Active' : '🎁 3-Tier System Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option 1: Classic Simple Bar (સાદી વાળી - Only Free Shipping) */}
          <div
            onClick={() => {
              setFormData({ ...formData, cartProgressMode: 'simple' })
              toast?.info?.('Switched to Classic Simple (1-Tier) Free Delivery Mode. Click Save to apply changes.', 'Mode Selected')
            }}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.cartProgressMode === 'simple'
                ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  formData.cartProgressMode === 'simple'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Classic Simple Bar (સાદી વાળી)</span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">1-TIER</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Only Free Shipping goal bar (પહેલા જેવું ફક્ત Free Delivery).
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                formData.cartProgressMode === 'simple'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}>
                {formData.cartProgressMode === 'simple' && <CheckCircle2 className="h-3.5 w-3.5" />}
              </div>
            </div>
          </div>

          {/* Option 2: 3-Tier Gamified Milestones (3-Tier સિસ્ટમ) */}
          <div
            onClick={() => {
              setFormData({ ...formData, cartProgressMode: 'tiered' })
              toast?.info?.('Switched to 3-Tier Gamified Milestones Mode. Click Save to apply changes.', 'Mode Selected')
            }}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.cartProgressMode === 'tiered'
                ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-2 ring-purple-100'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  formData.cartProgressMode === 'tiered'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">3-Tier Gamified Milestones (3-Tier સિસ્ટમ)</span>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">3-TIER</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    3 Rewards: Free Delivery + Special Coupon (EXTRA10) + Free Luxury Botanical Gift.
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                formData.cartProgressMode === 'tiered'
                  ? 'border-purple-600 bg-purple-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}>
                {formData.cartProgressMode === 'tiered' && <CheckCircle2 className="h-3.5 w-3.5" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Storefront Cart Preview Banner (Interactive) */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 overflow-hidden relative">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Live Customer Cart Drawer Preview ({formData.cartProgressMode === 'simple' ? 'Classic Simple' : '3-Tier Gamified'})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Simulate Cart Amount:
            </span>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
              <span className="text-xs font-mono font-bold text-emerald-400">
                ₹{previewCartSpend.toLocaleString('en-IN')}
              </span>
              <input
                type="range"
                min="0"
                max={formData.cartProgressMode === 'simple' ? t1 + 500 : t3 + 500}
                step="50"
                value={previewCartSpend}
                onChange={(e) => setPreviewCartSpend(Number(e.target.value))}
                className="w-24 sm:w-32 accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Cart Milestone Component */}
        {formData.cartProgressMode === 'simple' ? (
          /* Classic Simple Preview */
          <div className="mt-5 max-w-lg mx-auto bg-[#FAF9F6] text-stone-900 p-4 rounded-xl border border-stone-200 shadow-lg space-y-3">
            <div className={`px-3 py-2 rounded-lg text-center text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs ${
              previewCartSpend >= t1
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-[#5A3859]/5 text-[#5A3859] border border-[#5A3859]/15'
            }`}>
              <Truck className="h-4 w-4 text-emerald-700 shrink-0" />
              <span className="text-xs font-bold">
                {previewCartSpend >= t1
                  ? '🎉 Awesome! You have unlocked FREE Express Delivery!'
                  : `Add ₹${(t1 - previewCartSpend).toLocaleString('en-IN')} more to unlock FREE Delivery!`}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="relative h-2.5 w-full bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#5A3859] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((previewCartSpend / t1) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium font-mono">
                <span>₹0</span>
                <span className="font-bold text-[#5A3859]">
                  {previewCartSpend >= t1 ? '100% Unlocked ✓' : `Goal: ₹${formData.tier1Threshold}`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* 3-Tier Gamified Preview */
          <div className="mt-5 max-w-lg mx-auto bg-[#FAF9F6] text-stone-900 p-4 rounded-xl border border-stone-200 shadow-lg">
            {/* Announcement Strip */}
            <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-2 rounded-lg text-center text-xs font-semibold text-emerald-900 mb-3.5 flex items-center justify-center gap-1.5 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate text-xs font-bold">{previewBannerText}</span>
            </div>

            {/* Gamified Milestone Track (Node 1 @ 0%, Node 2 @ 50%, Node 3 @ 100%) */}
            <div className="relative pt-2 pb-7 px-6">
              {/* Background Track Line */}
              <div className="relative h-2 w-full bg-stone-200/90 rounded-full overflow-visible">
                {/* Active Progress Fill using Brand Gradient */}
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-[#5A3859] to-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${previewProgress}%` }}
                />

                {/* Node 1: Free Shipping (at 0% Left) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-default z-10"
                  style={{ left: '0%' }}
                  title={`₹${t1} - Free Delivery`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs ${
                      isT1Unlocked
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-100'
                        : 'bg-white border-stone-300 text-stone-400'
                    }`}
                  >
                    {isT1Unlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                  </div>
                  <div className="absolute top-7 flex flex-col items-center text-center whitespace-nowrap">
                    <span className="text-[10px] font-bold text-stone-800 font-mono">₹{formData.tier1Threshold}</span>
                    <span className={`text-[8px] font-medium -mt-0.5 ${isT1Unlocked ? 'text-emerald-700 font-bold' : 'text-stone-500'}`}>
                      {isT1Unlocked ? 'Free Ship ✓' : 'Free Ship'}
                    </span>
                  </div>
                </div>

                {/* Node 2: Special Coupon (at 50% Middle) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-default z-10"
                  style={{ left: '50%' }}
                  title={`₹${t2} - Special Coupon (${formData.tier2CouponCode})`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs ${
                      isT2Unlocked
                        ? 'bg-[#5A3859] border-[#5A3859] text-white shadow-purple-900/30 ring-2 ring-purple-100'
                        : 'bg-white border-stone-300 text-stone-400'
                    }`}
                  >
                    {isT2Unlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
                  </div>
                  <div className="absolute top-7 flex flex-col items-center text-center whitespace-nowrap">
                    <span className="text-[10px] font-bold text-stone-800 font-mono">₹{formData.tier2Threshold}</span>
                    <span className={`text-[8px] font-medium -mt-0.5 ${isT2Unlocked ? 'text-[#5A3859] font-bold' : 'text-stone-500'}`}>
                      {isT2Unlocked ? `${formData.tier2CouponCode} ✓` : formData.tier2CouponCode}
                    </span>
                  </div>
                </div>

                {/* Node 3: Free Gift with Underline Link (at 100% Right) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-default z-10"
                  style={{ left: '100%' }}
                  title={`₹${t3} - Free Luxury Gift`}
                >
                  <div className="relative flex items-center justify-center">
                    {isT3Unlocked && (
                      <span className="absolute -inset-0.5 rounded-full bg-amber-400/25 ring-2 ring-amber-300/40 animate-pulse pointer-events-none" />
                    )}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs relative z-10 ${
                        isT3Unlocked
                          ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_8px_rgba(245,158,11,0.35)] ring-2 ring-amber-100'
                          : 'bg-white border-stone-300 text-stone-400'
                      }`}
                    >
                      <Gift className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="absolute top-7 flex flex-col items-center text-center whitespace-nowrap">
                    <span className="text-[10px] font-bold text-stone-800 font-mono">₹{formData.tier3Threshold}</span>
                    <a
                      href={formData.tier3ProductLink || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`text-[8.5px] font-bold underline transition-colors cursor-pointer ${
                        isT3Unlocked ? 'text-amber-800 font-extrabold hover:text-amber-950' : 'text-stone-500 hover:text-stone-800'
                      }`}
                      title="Click to view free gift product"
                    >
                      Free Gift 🎁
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Form (Separate for Option 1 vs Option 2) */}
      <form onSubmit={handleSave} className="space-y-6">
        {formData.cartProgressMode === 'simple' ? (
          /* OPTION 1: Classic Simple Free Shipping Form (સાદી વાળી - Only Delivery Settings) */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Classic Free Shipping Settings (સાદી ડિલિવરી સેટિંગ્સ)</span>
                    <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                      SIMPLE 1-TIER
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure the Free Shipping threshold amount and standard courier fee
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Free Shipping Threshold (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={formData.tier1Threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tier1Threshold: e.target.value,
                        freeShippingThreshold: e.target.value,
                      })
                    }
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="999"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  E.g. ₹999 for free delivery nationwide
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Standard Shipping Fee (If below threshold) (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={formData.standardShippingFee}
                    onChange={(e) =>
                      setFormData({ ...formData, standardShippingFee: e.target.value })
                    }
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="79"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Standard courier fee charged when cart is under threshold (e.g. ₹79)
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Shipping Announcement Note
                </label>
                <input
                  type="text"
                  value={formData.shippingNote}
                  onChange={(e) =>
                    setFormData({ ...formData, shippingNote: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="Free standard express shipping nationwide on all orders above ₹999"
                />
              </div>
            </div>
          </div>
        ) : (
          /* OPTION 2: 3-Tier Gamified Milestones Form (આ 3-Tier વાળી - Without On/Off Toggles) */
          <div className="space-y-6">
            {/* Tier 1: Free Express Shipping (Always Active in 3-Tier Mode) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Tier 1: Free Shipping Delivery Policy</span>
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                        MILESTONE 1
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Customers get free nationwide shipping when order reaches this amount
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Free Shipping Threshold (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.tier1Threshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tier1Threshold: e.target.value,
                          freeShippingThreshold: e.target.value,
                        })
                      }
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                      placeholder="999"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    E.g. ₹999 for free delivery nationwide
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Standard Shipping Fee (If below threshold) (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.standardShippingFee}
                      onChange={(e) =>
                        setFormData({ ...formData, standardShippingFee: e.target.value })
                      }
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                      placeholder="79"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Standard courier fee charged when cart is under threshold (e.g. ₹79)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Shipping Announcement Note
                  </label>
                  <input
                    type="text"
                    value={formData.shippingNote}
                    onChange={(e) =>
                      setFormData({ ...formData, shippingNote: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                    placeholder="Standard shipping ₹79 • Free express delivery on orders above ₹999"
                  />
                </div>
              </div>
            </div>

            {/* Tier 2: Special Coupon Reward (Always Active in 3-Tier Mode) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-purple-50 to-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl border border-purple-200">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Tier 2: Special Coupon Reward (Auto-Applied)</span>
                      <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                        MILESTONE 2
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Automatically applied to customer cart upon reaching this threshold
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Spend Threshold for Coupon (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.tier2Threshold}
                      onChange={(e) =>
                        setFormData({ ...formData, tier2Threshold: e.target.value })
                      }
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                      placeholder="1999"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">E.g. ₹1999 shopping</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select or Enter Coupon Code
                  </label>
                  <div className="space-y-2">
                    <select
                      value={
                        ['SENSEIN10', 'LUXE15', 'GLOW200', 'FIRSTBUY', 'EXTRA10'].includes(formData.tier2CouponCode)
                          ? formData.tier2CouponCode
                          : 'CUSTOM'
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === 'CUSTOM') return
                        setFormData((prev) => ({
                          ...prev,
                          tier2CouponCode: val,
                          tier2DiscountText:
                            val === 'SENSEIN10'
                              ? '10% Instant Off'
                              : val === 'LUXE15'
                              ? '15% Instant Off'
                              : val === 'GLOW200'
                              ? '₹200 Flat Off'
                              : val === 'FIRSTBUY'
                              ? '20% Welcome Off'
                              : '10% Instant Off',
                        }))
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-purple-500"
                    >
                      <option value="EXTRA10">EXTRA10 (10% Instant Off)</option>
                      <option value="SENSEIN10">SENSEIN10 (Flat 10% OFF)</option>
                      <option value="LUXE15">LUXE15 (15% OFF Luxury)</option>
                      <option value="GLOW200">GLOW200 (₹200 Flat OFF)</option>
                      <option value="FIRSTBUY">FIRSTBUY (20% Welcome OFF)</option>
                      <option value="CUSTOM">Custom Code...</option>
                    </select>

                    <input
                      type="text"
                      value={formData.tier2CouponCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tier2CouponCode: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-purple-700 uppercase focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                      placeholder="EXTRA10"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Auto-applies when order reaches ₹{formData.tier2Threshold}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Discount Perk Description
                  </label>
                  <input
                    type="text"
                    value={formData.tier2DiscountText}
                    onChange={(e) =>
                      setFormData({ ...formData, tier2DiscountText: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                    placeholder="10% Instant Off"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Badge text shown to customer
                  </p>
                </div>
              </div>
            </div>

            {/* Tier 3: Special Free Gift Promotion (Always Active in 3-Tier Mode) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-amber-50 to-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl border border-amber-200">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Tier 3: Special Free Gift Promotion</span>
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                        MILESTONE 3 (WITH LINK)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Customers receive a free luxury gift with a clickable product link on reaching this threshold
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Minimum Spend for Free Gift (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.tier3Threshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tier3Threshold: e.target.value,
                          giftMinSpend: e.target.value,
                        })
                      }
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                      placeholder="2999"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    E.g. ₹2999 order unlocks the free gift
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Free Gift Item Name
                  </label>
                  <input
                    type="text"
                    value={formData.tier3ItemName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tier3ItemName: e.target.value,
                        giftItemName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="Sensein Luxury Botanical Mini Elixir (30ml)"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Title displayed on the free gift badge
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Special Gift Product Link / URL (અહીં લિંક નાખવી)</span>
                    {formData.tier3ProductLink && (
                      <a
                        href={formData.tier3ProductLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.tier3ProductLink}
                      onChange={(e) =>
                        setFormData({ ...formData, tier3ProductLink: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                      placeholder="/product/sensein-luxury-botanical-mini-elixir or /shop"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Customers can click on this link in the Cart Drawer to view the gift product details!
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Gift Badge Label
                  </label>
                  <input
                    type="text"
                    value={formData.tier3Badge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tier3Badge: e.target.value.toUpperCase(),
                        giftBadge: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-amber-700 uppercase focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="FREE GIFT"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Customer Gift Notification Note
                  </label>
                  <input
                    type="text"
                    value={formData.tier3Note}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tier3Note: e.target.value,
                        giftNote: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="Complimentary luxury haircare gift included on all orders above ₹2999"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
