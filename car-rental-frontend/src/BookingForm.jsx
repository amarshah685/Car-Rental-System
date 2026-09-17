import { useState } from 'react'
import { supabase } from './supabaseClient'

function BookingForm({ car, session, onClose, onBooked }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const days =
    startDate && endDate
      ? Math.max(0, (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
      : 0
  const totalPrice = days * car.daily_rate

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!startDate || !endDate) {
      setError('Please select both dates.')
      return
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: session.user.id,
        car_id: car.id,
        pickup_branch_id: car.branch_id,
        dropoff_branch_id: car.branch_id,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        status: 'confirmed',
      })
      .select()
      .single()

    setLoading(false)

    if (error) {
      if (error.code === '23P01') {
        setError('This car is already booked for the selected dates. Please choose different dates.')
      } else {
        setError(error.message)
      }
      return
    }

    onBooked(data)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3>Book this car</h3>
        <p className="modal-sub">{car.year} {car.make} {car.model} — RM{car.daily_rate}/day</p>

        <form onSubmit={handleSubmit}>
          <label className="field-label">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <label className="field-label">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />

          {days > 0 && (
            <div className="total-line">
              {days} day{days !== 1 ? 's' : ''} — <strong>RM{totalPrice.toFixed(2)}</strong>
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Booking...' : 'Confirm Booking'}
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

export default BookingForm