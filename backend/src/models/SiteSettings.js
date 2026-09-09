import mongoose from 'mongoose'

const siteSettingsSchema = new mongoose.Schema(
  {
    isMaintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceTitle: {
      type: String,
      default: 'Under Scheduled Maintenance',
    },
    maintenanceMessage: {
      type: String,
      default: 'Sensein Luxury Haircare is currently undergoing scheduled platform updates to enhance your shopping experience. We will be back online shortly.',
    },
    estimatedBackAt: {
      type: String,
      default: '',
    },
    allowAdminBypass: {
      type: Boolean,
      default: true,
    },
    sellerDetails: {
      companyName: {
        type: String,
        default: 'Sensein Botanical Luxury Pvt Ltd',
      },
      dispatchAddress: {
        type: String,
        default: '104, Vijay Nagar 2, Yogi Chowk, Puna-Simada Road',
      },
      city: {
        type: String,
        default: 'Surat',
      },
      state: {
        type: String,
        default: 'Gujarat',
      },
      pincode: {
        type: String,
        default: '395010',
      },
      stateCode: {
        type: String,
        default: '24 (Gujarat)',
      },
      gstin: {
        type: String,
        default: '24AAACR1234F1Z5',
      },
      pan: {
        type: String,
        default: 'AAACR1234F',
      },
      registeredAddress: {
        type: String,
        default: 'Sensein Botanical Luxury Private Limited, Plot 104, Yogi Chowk, Puna-Simada Road, Surat, Gujarat - 395010.',
      },
      authorizedSignatory: {
        type: String,
        default: 'Sensein Botanical Luxury Pvt Ltd',
      },
      hsnCode: {
        type: String,
        default: '33059040',
      },
      gstRate: {
        type: Number,
        default: 18,
      },
      supportPhone: {
        type: String,
        default: '+91 7984919956',
      },
      supportEmail: {
        type: String,
        default: 'support@sensein.com',
      },
    },
    updatedBy: {
      type: String,
      default: 'Super Admin',
    },
  },
  {
    timestamps: true,
  }
)

const SiteSettings = mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema)
export default SiteSettings
