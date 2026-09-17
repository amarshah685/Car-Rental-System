import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function AdminDashboard() {
  const [tab, setTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [cars, setCars] = useState([])
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    setLoading(true)
    setError(null)

    const [bookingsRes, carsRes, customersRes] = await Promise.all([
      supabase
        .from('bookings')
        .select(`
          id, start_date, end_date, total_price, status, created_at,
          cars ( make, model, plate_number ),
          profiles ( full_name, phone )
        `)
        .order('created_at', { ascending: false }),
      supabase.from('cars').select('*').order('make'),
      supabase.from('profiles').select('*').order('full_name'),
    ])

    if (bookingsRes.error) setError(bookingsRes.error.message)
    else setBookings(bookingsRes.data)

    if (carsRes.error) setError(carsRes.error.message)
    else setCars(carsRes.data)

    if (customersRes.error) setError(customersRes.error.message)
    else setCustomers(customersRes.data)

    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  async function updateCarStatus(carId, newStatus) {
    const { error } = await supabase.from('cars').update({ status: newStatus }).eq('id', carId)
    if (error) alert('Failed: ' + error.message)
    else fetchAll()
  }

  async function updateBookingStatus(bookingId, newStatus) {
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId)
    if (error) alert('Failed: ' + error.message)
    else fetchAll()
  }

  if (loading) return <p className="empty-state">Loading admin data...</p>
  if (error) return <p className="error-text">Error: {error}</p>

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Admin Dashboard</h2>
      <p className="auth-sub" style={{ marginBottom: 20 }}>Manage bookings, fleet status, and customers</p>

      <div className="admin-tabs">
        <button className={tab === 'bookings' ? 'active' : ''} onClick={() => setTab('bookings')}>
          All Bookings
        </button>
        <button className={tab === 'cars' ? 'active' : ''} onClick={() => setTab('cars')}>
          Manage Cars
        </button>
        <button className={tab === 'customers' ? 'active' : ''} onClick={() => setTab('customers')}>
          Customers
        </button>
      </div>

      {tab === 'bookings' && (
        bookings.length === 0 ? (
          <p className="empty-state">No bookings yet.</p>
        ) : (
          <ul className="record-list">
            {bookings.map((b) => (
              <li key={b.id} className="record-card">
                <div className="record-title">{b.cars?.make} {b.cars?.model} — {b.cars?.plate_number}</div>
                <div className="record-detail">
                  <strong>Customer:</strong> {b.profiles?.full_name} · {b.profiles?.phone || '—'}
                  <br />
                  {b.start_date} → {b.end_date} · <strong>RM{b.total_price}</strong>
                </div>
                <select value={b.status} onChange={(e) => updateBookingStatus(b.id, e.target.value)}>
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="ongoing">ongoing</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </li>
            ))}
          </ul>
        )
      )}

      {tab === 'cars' && (
        cars.length === 0 ? (
          <p className="empty-state">No cars in the fleet.</p>
        ) : (
          <ul className="record-list">
            {cars.map((c) => (
              <li key={c.id} className="record-card">
                <div className="record-title">{c.year} {c.make} {c.model} — {c.plate_number}</div>
                <div className="record-detail">RM{c.daily_rate}/day</div>
                <select value={c.status} onChange={(e) => updateCarStatus(c.id, e.target.value)}>
                  <option value="available">available</option>
                  <option value="rented">rented</option>
                  <option value="maintenance">maintenance</option>
                  <option value="inactive">inactive</option>
                </select>
              </li>
            ))}
          </ul>
        )
      )}

      {tab === 'customers' && (
        customers.length === 0 ? (
          <p className="empty-state">No customers yet.</p>
        ) : (
          <ul className="record-list">
            {customers.map((p) => (
              <li key={p.id} className="record-card">
                <div className="record-title">{p.full_name} <span className={`status-badge ${p.role === 'admin' || p.role === 'staff' ? 'ongoing' : 'confirmed'}`} style={{ marginLeft: 8 }}>{p.role}</span></div>
                <div className="record-detail">
                  Phone: {p.phone || '—'} · License: {p.license_no || '—'} ({p.license_verified ? 'verified' : 'not verified'})
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}

export default AdminDashboard