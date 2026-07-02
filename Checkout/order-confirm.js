(async function handleSRRedirect() {


    const userId = resolveUserId();
if (!userId) {
  showError('Session expired. Please log in and check My Orders for your payment status.');
  return;
}

    // ── At the top of order-confirm.js ──
const BASE_URL = 'http://localhost:8085'; // ✅ same as checkout.js — reuse this pattern

function resolveUserId() {
  if (window.authService && window.authService.getUserId) {
    return window.authService.getUserId();
  }
  const uid = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  return uid ? parseInt(uid) : null;
}

function authHeaders() {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const userId = resolveUserId();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (userId) headers['X-User-Id'] = String(userId);
  return headers;
}

  const params = new URLSearchParams(window.location.search);
  const oid = params.get('oid');
  const ost = params.get('ost');

  const loadingEl = document.getElementById('loadingState');
  const successEl = document.getElementById('successState');
  const errorEl   = document.getElementById('errorState');

  function showError(msg) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = msg;
    if (typeof showToast === 'function') showToast(msg, 'error');
  }

  function showSuccess(orderStrId) {
    loadingEl.classList.add('hidden');
    successEl.classList.remove('hidden');
    document.getElementById('orderIdDisplay').textContent = orderStrId
      ? `Order ID: ${orderStrId}` : '';
    if (typeof showToast === 'function') showToast('Order placed successfully! 🎉', 'success');
  }

  if (!oid) {
    showError('Invalid order confirmation link.');
    return;
  }

  if (ost !== 'SUCCESS') {
    showError('Checkout was not completed.');
    return;
  }

  try {
   const detailsRes = await fetch(`${BASE_URL}/api/shiprocket/order-details`, {
  method: 'POST',
  headers: authHeaders(),
  body: JSON.stringify({ oid })
});
    const detailsData = await detailsRes.json();
    const result = detailsData.result;

    if (!result || result.status !== 'SUCCESS') {
      showError('Order verification failed. Contact support with ID: ' + oid);
      return;
    }

    const addr = result.shipping_address || {};
    const payment = (result.payments && result.payments[0]) || {};

    const confirmPayload = {
      srOrderId: oid,
      paymentTxnId: payment.txn_id || null,
      paymentGateway: payment.gateway || null,
      paymentMethod: payment.payment_method || null,
      amount: result.total_amount_payable,

      customerName: `${addr.first_name || ''} ${addr.last_name || ''}`.trim(),
      customerPhone: result.phone || addr.phone,
      customerEmail: result.email || addr.email,
      shippingAddress1: addr.line1 || '',
      shippingAddress2: addr.line2 || '',
      shippingCity: addr.city || '',
      shippingState: addr.state || '',
      shippingPincode: addr.pincode || ''
    };

    const confirmRes = await fetch(`${BASE_URL}/api/orders/confirm-buynow`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(confirmPayload)
        });
    const confirmData = await confirmRes.json();

    if (!confirmRes.ok) {
      showError('Payment succeeded but order sync failed. Contact support with ID: ' + oid);
      return;
    }

    const orderStrId = confirmData?.data?.orderStrId;
    showSuccess(orderStrId);

  } catch (err) {
    console.error('[OrderConfirm] SR confirm flow failed:', err);
    showError('Something went wrong confirming your order.');
  }
})();