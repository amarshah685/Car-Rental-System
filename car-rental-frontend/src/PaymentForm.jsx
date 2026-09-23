import { useState } from 'react'
import { supabase } from './supabaseClient'

function PaymentForm({ booking, onClose, onPaid }) {
  const [method, setMethod] = useState('fpx')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handlePay(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.from('payments').insert({
      booking_id: booking.id,
      amount: booking.total_price,
      method,
      status: 'pending',
      paid_at: null,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    onPaid()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3>Payment</h3>
        <p className="modal-sub">Complete payment to confirm your booking</p>

        <div className="total-line">
          Amount due — <strong>RM{booking.total_price}</strong>
        </div>

        <form onSubmit={handlePay}>
          <label className="field-label">Payment method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="fpx">FPX</option>
            <option value="card">Credit/Debit Card</option>
            <option value="cash">Cash</option>
          </select>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentForm