import { isFulfilled, isRejectedWithValue } from '@reduxjs/toolkit'

export const toastMiddleware = () => (next) => (action) => {
  const result = next(action)

  // Handle successful mutations
  if (isFulfilled(action) && action.type?.startsWith('api/executeMutation/')) {
    const endpointName = action.meta?.arg?.endpointName
    const toast = window.__adminToast

    if (toast && endpointName) {
      const messages = {
        // Products
        createProduct: { fn: toast.create, msg: 'Product created and listed in store successfully!' },
        updateProduct: { fn: toast.update, msg: 'Product details and inventory updated!' },
        deleteProduct: { fn: toast.delete, msg: 'Product removed from catalog!' },

        // Categories
        createCategory: { fn: toast.create, msg: 'New category created successfully!' },
        updateCategory: { fn: toast.update, msg: 'Category details updated successfully!' },
        deleteCategory: { fn: toast.delete, msg: 'Category removed successfully!' },

        // Orders
        updateOrderStatus: { fn: toast.update, msg: 'Order delivery status updated & synced!' },

        // Users
        updateUserRole: { fn: toast.update, msg: 'User role and permissions updated!' },

        // Bulk Inquiries
        updateBulkInquiryStatus: { fn: toast.update, msg: 'Bulk B2B inquiry status updated!' },
        deleteBulkInquiry: { fn: toast.delete, msg: 'Bulk inquiry removed from records!' },

        // Homepage CMS
        updateHomepageContent: { fn: toast.update, msg: 'Homepage content published & synced live!' },
        resetHomepageContent: { fn: toast.success, msg: 'Homepage reset to default preset!' },

        // Media Vault
        uploadMedia: { fn: toast.create, msg: 'Media asset uploaded to master sheet!' },
        deleteMedia: { fn: toast.delete, msg: 'Media asset moved to trash!' },
        restoreMedia: { fn: toast.success, msg: 'Media asset restored successfully!' },

        // Tracking & Analytics
        updateTrackingConfig: { fn: toast.update, msg: 'Tracking Pixels & GA4 configuration saved!' },

        // Recovery
        recoverFromLog: { fn: toast.success, msg: 'Snapshot data restored successfully!' },
      }

      const match = messages[endpointName]
      if (match) {
        match.fn(match.msg)
      }
    }
  }

  // Handle failed mutations
  if (isRejectedWithValue(action) && action.type?.startsWith('api/executeMutation/')) {
    const toast = window.__adminToast
    if (toast) {
      let rawMsg = action.payload?.data?.message || action.payload?.message || ''
      let errTitle = 'Action Failed'
      let finalMsg = rawMsg || 'Operation failed. Please try again.'

      // Detect duplicate error
      if (
        rawMsg.includes('E11000') ||
        rawMsg.includes('duplicate') ||
        rawMsg.includes('dup key') ||
        rawMsg.includes('already exists')
      ) {
        errTitle = 'Duplicate Entry / Already Exists'
        finalMsg = 'This item already exists in the store'
      }

      toast.error(finalMsg, errTitle)
    }
  }

  return result
}
