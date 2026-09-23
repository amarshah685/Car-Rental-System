import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'
import Auth from './Auth'
import BookingForm from './BookingForm'
import MyBookings from './MyBookings'
import PaymentForm from './PaymentForm'
import AdminDashboard from './AdminDashboard'
import { useToast } from './Toast'

function App() {
  const [session, setSession] = useState(null)
  const [cars, setCars] = useState([])
  const [branches, setBranches] = useState([])
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [category, setCategory] = useState('')
  const [branchId, setBranchId] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [status, setStatus] = useState('available')

  const [bookingCar, setBookingCar] = useState(null)
  const [view, setView] = useState('browse')
  const [pendingPayment, setPendingPayment] = useState(null)
  const [profile, setProfile] = useState(null)
  const showToast = useToast()

  function resetFilters() {
  setCategory('')
  setBranchId('')
  setMaxPrice('')
  setStatus('available')
  setStartDate('')
  setEndDate('')
  }

  useEffect(() => {
    if (!session) return
    async function fetchProfile() {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)
    }
    fetchProfile()
  }, [session])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function fetchBranches() {
      const { data } = await supabase.from('branches').select('id, name')
      setBranches(data || [])
    }
    fetchBranches()
  }, [])

useEffect(() => {
  async function fetchCars() {
    if (startDate && endDate) {
      // Date-aware availability search
      const { data, error } = await supabase.rpc('get_available_cars', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_branch_id: branchId || null,
        p_category: category || null,
        p_max_price: maxPrice ? Number(maxPrice) : null,
      })
      if (error) setError(error.message)
      else {
        setError(null)
        setCars(data)
      }
    } else {
      // Fallback: static status-based browse (no dates selected yet)
      let query = supabase.from('cars').select('*')
      if (category) query = query.eq('category', category)
      if (branchId) query = query.eq('branch_id', branchId)
      if (status) query = query.eq('status', status)
      if (maxPrice) query = query.lte('daily_rate', maxPrice)

      const { data, error } = await query.order('daily_rate', { ascending: true })
      if (error) setError(error.message)
      else {
        setError(null)
        setCars(data)
      }
    }
  }
  fetchCars()
}, [category, branchId, status, maxPrice, startDate, endDate])

  if (!session) {
    return <Auth onAuth={() => {}} />
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff'

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">◈</span> Car Rental
        </div>

        <div className="nav-pills">
          <button className={`pill ${view === 'browse' ? 'active' : ''}`} onClick={() => setView('browse')}>
            Browse
          </button>
          <button className={`pill ${view === 'bookings' ? 'active' : ''}`} onClick={() => { resetFilters(); setView('bookings') }}>
            My Bookings
          </button>
          {isAdmin && (
            <button className={`pill ${view === 'admin' ? 'active' : ''}`} onClick={() => { resetFilters(); setView('admin') }}>
              Admin
            </button>
          )}
        </div>

        <button className="logout-btn" onClick={() => supabase.auth.signOut()}>Log Out</button>
      </div>

      {view === 'admin' && <AdminDashboard />}

      {view === 'browse' && (
        <>
          <div className="filter-bar">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Economy">Economy</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="MPV">MPV</option>
              <option value="Luxury">Luxury</option>
            </select>

            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End date"
            />

            <input
              type="number"
              placeholder="Max price/day (RM)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          {error && <p className="error-text">Error: {error}</p>}
          {!error && cars.length === 0 && <p className="empty-state">No cars match your filters.</p>}

          <ul className="car-grid">
            {cars.map((car) => (
              <li key={car.id} className={`car-card status-${car.status}`}>
                <div className="car-name">{car.year} {car.make} {car.model}</div>
                <div className="car-meta">{car.category} · {car.transmission} · {car.seats} seats</div>
                <div className="car-price-row">
                  <div className="car-price">RM{car.daily_rate}<span> /day</span></div>
                  <span className="status-tag">{car.status}</span>
                </div>
                {car.status === 'available' && (
                  <button className="btn-primary" onClick={() => setBookingCar(car)}>
                    Book Now
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {view === 'bookings' && <MyBookings session={session} />}

      {bookingCar && (
        <BookingForm
          car={bookingCar}
          session={session}
          onClose={() => setBookingCar(null)}
          onBooked={(newBooking) => {
            setBookingCar(null)
            setPendingPayment(newBooking)
          }}
        />
      )}

      {pendingPayment && (
        <PaymentForm
          booking={pendingPayment}
          onClose={() => setPendingPayment(null)}
          onPaid={() => {
            setPendingPayment(null)
            showToast('Payment successful! Booking confirmed.', 'success')
          }}
        />
      )}
    </div>
  )
}

export default App