import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useToast } from './Toast'

function MyBookings({ session }) {
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const showToast = useToast()

  async function fetchBookings() {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, start_date, end_date, total_price, status,
        cars ( make, model, year, plate_number, daily_rate ),
        pickup:branches!bookings_pickup_branch_id_fkey ( name ),
        dropoff:branches!bookings_dropoff_branch_id_fkey ( name )
      `)
      .eq('customer_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setBookings(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  async function handleCancel(bookingId) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) {
    showToast('Failed to cancel: ' + error.message, 'error')
  } else {
    showToast('Booking cancelled', 'success')
    fetchBookings()
  }
}

  if (loading) return <p className="empty-state">Loading your bookings...</p>
  if (error) return <p className="error-text">Error: {error}</p>
  if (bookings.length === 0) return <p className="empty-state">You have no bookings yet.</p>

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>My Bookings</h2>
      <ul className="record-list">
        {bookings.map((b) => (
          <li key={b.id} className="record-card">
            <div className="record-title">
              {b.cars.year} {b.cars.make} {b.cars.model}
              <span className={`status-badge ${b.status}`} style={{ marginLeft: 10 }}>{b.status}</span>
            </div>
            <div className="record-detail">
              {b.cars.plate_number} · {b.start_date} → {b.end_date}
              <br />
              Pickup: {b.pickup?.name} · Drop-off: {b.dropoff?.name}
              <br />
              Total: <strong>RM{b.total_price}</strong>
            </div>
            {(b.status === 'pending' || b.status === 'confirmed') && (
              <button className="btn-secondary" onClick={() => handleCancel(b.id)} style={{ marginTop: 10, width: 'auto', padding: '8px 16px' }}>
                Cancel Booking
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MyBookings