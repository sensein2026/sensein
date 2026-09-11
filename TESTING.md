# TESTING GUIDE & INTEGRATION PLAYBOOK

This document details the exact testing procedures, test credentials guide, and manual test checklist covering all production flows and edge cases.

---

## 1. CREDENTIALS & ENVIRONMENT MODES

### 1.1 Razorpay Payment Gateway
- **Test Mode Keys**:
  1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com).
  2. Switch the top toggle to **Test Mode**.
  3. Navigate to **Account & Settings** > **API Keys** > **Generate Key**.
  4. Copy `Key Id` (`rzp_test_...`) and `Key Secret` to your `.env` file as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
  5. Go to **Webhooks** > **Add New Webhook**, enter your URL (`https://your-domain.com/api/payment/webhook`), enter a secret string, set `RAZORPAY_WEBHOOK_SECRET`, and select events: `payment.captured`, `payment.failed`, `refund.created`, `refund.processed`, `order.paid`.
- **Offline / Local Simulation**: If keys are omitted in development, the system generates simulated Razorpay orders (`order_sim_...`) and permits mock signatures starting with `sim_` for testing without network requests.

### 1.2 Delhivery Express Logistics
- **Sandbox vs Production**:
  - Delhivery offers a staging environment at `https://staging-express.delhivery.com`.
  - Set `DELHIVERY_SANDBOX=true` in `.env`.
  - If your account does **not** have staging credentials:
    - Keep `DELHIVERY_API_TOKEN` blank or set to a placeholder (`delhivery_test_token`). The backend automatically runs in safe **Courier Simulation Mode**, allowing you to test pincode validation, forward waybill creation, reverse pickup scheduling, and status tracking without creating real commercial shipments or courier pickups.
    - When connecting live credentials, test non-destructive endpoints first: pincode serviceability (`GET /api/delhivery/serviceability/395010`) and track package.

### 1.3 MongoDB Transactions & Replica Set Notice
- MongoDB ACID transactions require a replica set (including MongoDB Atlas or a single-node local replica set).
- If running a bare standalone MongoDB instance: the backend automatically detects standalone mode and executes operations with atomic find-and-modify operations and sequential fallbacks, ensuring zero crashes while logging an informative dev warning.

---

## 2. STEP-BY-STEP MANUAL TEST SCENARIOS

### Scenario 1: Standard Checkout & Payment Success
1. Add product to cart and proceed to `/checkout`.
2. Inspect network request `POST /api/payment/create-order` with `Idempotency-Key` header.
3. Verify that the price is recomputed server-side from the DB and a `StockReservation` document is created (`status: ACTIVE`).
4. Complete payment on Razorpay modal.
5. Verify `POST /api/payment/verify` is called.
6. Verify Order moves to `orderStatus: CONFIRMED`, `paymentStatus: PAID`, and `StockReservation` transitions from `ACTIVE` to `CONVERTED` with `Product.stock` decremented.

### Scenario 2: Payment Failure & Cart Recovery
1. Open Razorpay payment modal and click **Cancel / Failure**.
2. Verify `POST /api/payment/failed` sets `paymentStatus: FAILED`.
3. Order remains in `orderStatus: PLACED`, cart items are preserved, and customer can retry payment.

### Scenario 3: Duplicate Webhook Replay Protection
1. Send two identical `POST /api/payment/webhook` payloads with the same `event_id` simultaneously.
2. The first request is processed and stored in `ProcessedWebhookEvent`.
3. The second request triggers a duplicate key error on the unique index `(provider, eventId)` and returns HTTP `200` without reprocessing business logic or double-decrementing stock.

### Scenario 4: Pre-Shipment Cancellation (Double-Restock Protection)
1. Place a paid or COD order (`orderStatus: CONFIRMED`).
2. Call `POST /api/orders/:id/cancel`.
3. Verify:
   - Delhivery waybill is cancelled (if generated).
   - Stock is restored once, `order.restockStatus` becomes `RESTOCKED`, and `restockedAt` is recorded.
   - Calling cancel a second time does **not** double-increment stock.
   - For paid orders, a `Refund` record is created and `paymentStatus` transitions to `REFUND_INITIATED` / `REFUNDED`.

### Scenario 5: Cancel-After-Shipped Rejection
1. Transition an order to `orderStatus: SHIPPED`.
2. Call `POST /api/orders/:id/cancel`.
3. Verify the server rejects the request with HTTP `409 Conflict` (`ORDER_CANNOT_BE_CANCELLED`).

### Scenario 6: Full Replacement Lifecycle (Replacement-Only Policy)
1. Mark order as `orderStatus: DELIVERED` (`deliveredAt: new Date()`).
2. Customer submits replacement request via `POST /api/replacements` with proof photos.
3. Verify `Order.orderStatus` remains `DELIVERED` (not overwritten), and `Replacement.status` is `REQUESTED`.
4. Admin approves via `PATCH /api/replacements/:id/approve` with `Idempotency-Key`:
   - System verifies stock availability and creates a `StockReservation` with `purpose: 'REPLACEMENT'`.
   - System generates reverse pickup AWB (`Replacement.reverseWaybill`).
5. Package arrives at warehouse -> transitions to `QC_PENDING`.
6. Admin records QC via `PATCH /api/replacements/:id/qc`:
   - If `qcResult: 'GOOD'` -> returned unit restored to sellable stock, `status: 'QC_PASSED'`, and replacement unit is dispatched with secondary waybill (`Replacement.replacementWaybill`).
   - If `qcResult: 'DAMAGED'` -> returned unit quarantined to damaged inventory (not added to sellable stock).

### Scenario 7: Replacement Quantity Validation
1. Customer buys 2 units of Product A.
2. Customer requests replacement for 1 unit (approved and in progress).
3. Customer attempts to request replacement for 2 additional units.
4. Verify backend rejects with HTTP `400` (`EXCEEDS_ELIGIBLE_QUANTITY`) since only `2 - 1 = 1` unit is eligible.

### Scenario 8: Replacement Converted to Refund Exception
1. On an active replacement, Admin clicks "Convert to Refund Exception" (`PATCH /api/replacements/:id/convert-to-refund`).
2. Verify replacement stock reservation is released back.
3. Verify `Refund` record is created against original order payment.
4. `Replacement.status` becomes `CONVERTED_TO_REFUND`.
5. Audit log entry is recorded with action `REPLACEMENT_CONVERTED_TO_REFUND`.

### Scenario 9: RTO Inspection & Restock Double-Click Protection
1. Order reaches `RTO_DELIVERED`.
2. Package is inspected: Admin selects `SELLABLE` and clicks "Confirm Restocked".
3. Stock is atomically incremented, `order.restockStatus` becomes `RESTOCKED`.
4. Double-clicking the restock button is rejected immediately (`ALREADY_RESTOCKED`).

### Scenario 10: Admin Illegal Status Jump Validation
1. Attempt to change an order from `PLACED` directly to `DELIVERED` via `PATCH /api/orders/:id/status`.
2. Server rejects with HTTP `400` (`ILLEGAL_STATUS_TRANSITION`) as defined in `statusTransitions.js`.

### Scenario 11: Idempotency-Key Header Replay
1. Call `POST /api/orders/:id/shipment` with `Idempotency-Key: test-uuid-123`.
2. A forward waybill is created and returned.
3. Immediately send the identical request with `Idempotency-Key: test-uuid-123`.
4. Verify the server replays the cached response without creating a second shipment or waybill.

### Scenario 12: User Ownership Security
1. Log in as Customer A.
2. Attempt to access Customer B's order via `GET /api/orders/:customerBOrderId` or cancel via `POST /api/orders/:customerBOrderId/cancel`.
3. Verify server returns HTTP `403 Forbidden`.
