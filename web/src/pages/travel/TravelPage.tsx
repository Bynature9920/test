import { useState, useEffect } from 'react'
import { hotelService } from '@/services/api/hotelService'
import { flightService } from '@/services/api/flightService'
import { formatCurrency } from '@/utils/format'
import { Calendar, Users, MapPin, Star, Search, Bed, Plane, Clock, ArrowRight, Sparkles } from 'lucide-react'
import FlightSearchSection from './FlightSearchSection'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const searchSchema = z.object({
  cityCode: z.string().min(1, 'Please select a city'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  adults: z.number().min(1).max(10),
})

type SearchFormData = z.infer<typeof searchSchema>

interface Hotel {
  hotelId: string
  name: string
  rating: number
  address: {
    lines: string[]
    cityName: string
    countryCode: string
  }
  contact: {
    phone: string
    email?: string
  }
  amenities?: string[]
  price: {
    currency: string
    total: string
    base: string
  }
  images: string[]
  available: boolean
  description?: string
}

interface Flight {
  flightId: string
  airline: string
  airlineCode: string
  flightNumber: string
  origin: {
    code: string
    name: string
    city: string
    country: string
    time: string
  }
  destination: {
    code: string
    name: string
    city: string
    country: string
    time: string
  }
  departure: {
    date: string
    time: string
    terminal?: string
  }
  arrival: {
    date: string
    time: string
    terminal?: string
  }
  duration: string
  stops: number
  price: {
    currency: string
    total: string
    base: string
    taxes?: string
  }
  aircraft?: string
  available: boolean
  travelClass: string
}

export default function TravelPage() {
  const [activeTab, setActiveTab] = useState<'hotels' | 'flights' | 'reservations'>('hotels')
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [returnFlights, setReturnFlights] = useState<Flight[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [showHotelDetails, setShowHotelDetails] = useState(false)
  const [showFlightDetails, setShowFlightDetails] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      cityCode: 'LOS', // Lagos
      adults: 2,
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (activeTab === 'reservations') {
      loadReservations()
    }
  }, [activeTab])

  const loadReservations = async () => {
    setLoading(true)
    try {
      const [hotelReservations, flightBookings] = await Promise.all([
        hotelService.getReservations(),
        flightService.getBookings(),
      ])
      setReservations([...hotelReservations, ...flightBookings])
    } catch (error) {
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const onFlightSearch = async (data: any) => {
    setLoading(true)
    try {
      toast.loading('Searching flights in real-time...', { id: 'flight-search' })
      const result = await flightService.searchFlights({
        origin: data.origin,
        destination: data.destination,
        departureDate: data.departureDate,
        returnDate: data.returnDate || undefined,
        adults: data.adults,
        children: data.children || 0,
        travelClass: data.travelClass || 'ECONOMY',
      })
      setFlights(result.flights)
      // @ts-ignore - returnFlights may not be in type but exists in API response
      if (result.returnFlights) {
        // @ts-ignore
        setReturnFlights(result.returnFlights)
      }
      toast.dismiss('flight-search')
      if (result.flights.length === 0) {
        toast('No flights found for your search criteria')
      } else {
        toast.success(`Found ${result.flights.length} flights with real-time prices!`)
      }
    } catch (error) {
      toast.dismiss('flight-search')
      toast.error('Failed to search flights. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewFlightDetails = (flight: Flight) => {
    setSelectedFlight(flight)
    setShowFlightDetails(true)
  }

  const handleBookFlight = async (flight: Flight) => {
    try {
      // In production, call booking API
      toast.success(`Booking initiated for ${flight.airline} ${flight.flightNumber}`)
      setShowFlightDetails(false)
    } catch (error) {
      toast.error('Failed to book flight')
    }
  }

  const onSearch = async (data: SearchFormData) => {
    setLoading(true)
    try {
      toast.loading('Searching hotels in real-time...', { id: 'hotel-search' })
      const result = await hotelService.searchHotels({
        cityCode: data.cityCode,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        adults: data.adults,
      })
      setHotels(result.hotels)
      toast.dismiss('hotel-search')
      if (result.hotels.length === 0) {
        toast('No hotels found for your search criteria')
      } else {
        toast.success(`Found ${result.hotels.length} hotels with real-time prices!`)
      }
    } catch (error) {
      toast.dismiss('hotel-search')
      toast.error('Failed to search hotels. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (hotelId: string) => {
    setLoading(true)
    try {
      const hotel = await hotelService.getHotelDetails(hotelId)
      if (hotel) {
        setSelectedHotel(hotel)
        setShowHotelDetails(true)
      }
    } catch (error) {
      toast.error('Failed to load hotel details')
    } finally {
      setLoading(false)
    }
  }

  const handleBookHotel = async (hotel: Hotel) => {
    try {
      // In production, call booking API
      toast.success(`Booking initiated for ${hotel.name}`)
      setShowHotelDetails(false)
    } catch (error) {
      toast.error('Failed to book hotel')
    }
  }

  const checkInDate = watch('checkInDate')
  const checkOutDate = watch('checkOutDate')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-900 dark:via-indigo-950 dark:to-purple-950 text-white p-6 md:p-8 rounded-b-3xl shadow-xl mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-bold">Travel</h2>
          </div>
          <p className="text-white/80">Search and book hotels and flights in real-time</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex gap-2 p-2 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab('hotels')}
              className={`flex-1 px-4 py-3 font-medium rounded-xl transition-all transform ${
                activeTab === 'hotels'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Bed className="w-4 h-4 inline mr-2" />
              Hotels
            </button>
            <button
              onClick={() => setActiveTab('flights')}
              className={`flex-1 px-4 py-3 font-medium rounded-xl transition-all transform ${
                activeTab === 'flights'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Plane className="w-4 h-4 inline mr-2" />
              Flights
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex-1 px-4 py-3 font-medium rounded-xl transition-all transform ${
                activeTab === 'reservations'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              My Bookings
            </button>
          </div>
        
          <div className="p-6">

        {activeTab === 'hotels' && (
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSearch)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">City</label>
                <select {...register('cityCode')} className="input-field">
                  <optgroup label="Nigeria">
                    <option value="LOS">Lagos</option>
                    <option value="ABV">Abuja</option>
                    <option value="PHC">Port Harcourt</option>
                    <option value="KAN">Kano</option>
                  </optgroup>
                  <optgroup label="Africa">
                    <option value="JNB">Johannesburg, South Africa</option>
                    <option value="NBO">Nairobi, Kenya</option>
                    <option value="CAI">Cairo, Egypt</option>
                  </optgroup>
                  <optgroup label="Europe">
                    <option value="LON">London, United Kingdom</option>
                    <option value="PAR">Paris, France</option>
                  </optgroup>
                  <optgroup label="Middle East">
                    <option value="DXB">Dubai, UAE</option>
                  </optgroup>
                  <optgroup label="Asia">
                    <option value="SIN">Singapore</option>
                  </optgroup>
                  <optgroup label="Americas">
                    <option value="NYC">New York, USA</option>
                  </optgroup>
                </select>
                {errors.cityCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.cityCode.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Check-in</label>
                <input
                  {...register('checkInDate')}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
                {errors.checkInDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkInDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Check-out</label>
                <input
                  {...register('checkOutDate')}
                  type="date"
                  min={checkInDate || new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
                {errors.checkOutDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkOutDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Guests</label>
                <input
                  {...register('adults', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="10"
                  className="input-field"
                />
                {errors.adults && (
                  <p className="mt-1 text-sm text-red-600">{errors.adults.message}</p>
                )}
              </div>

              <div className="md:col-span-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Search Hotels
                    </>
                  )}
                </button>
              </div>
            </form>

            {hotels.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Available Hotels ({hotels.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotels.map((hotel) => (
                    <div
                      key={hotel.hotelId}
                      className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-primary-500 dark:hover:border-primary-500 transition-all transform hover:scale-102 bg-white dark:bg-gray-800"
                    >
                      {/* Hotel Image - Real-time from Unsplash */}
                      <div className="relative h-48 bg-gray-200">
                        {hotel.images && hotel.images.length > 0 ? (
                          <img
                            src={hotel.images[0]}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              // Fallback to a generic hotel image
                              ;(e.target as HTMLImageElement).src =
                                `https://source.unsplash.com/800x600/?hotel,${hotel.address.cityName.replace(' ', '+')}`
                            }}
                          />
                        ) : (
                          <img
                            src={`https://source.unsplash.com/800x600/?hotel,${hotel.address.cityName.replace(' ', '+')}`}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                        {hotel.available && (
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            Available
                          </span>
                        )}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{hotel.rating}</span>
                        </div>
                      </div>

                      {/* Hotel Info */}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-lg mb-1">{hotel.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-slate-400 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{hotel.address.cityName}</span>
                        </div>
                        {hotel.description && (
                          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {hotel.description}
                          </p>
                        )}

                        {/* Amenities */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-2 py-1 rounded"
                              >
                                {amenity}
                              </span>
                            ))}
                            {hotel.amenities.length > 3 && (
                              <span className="text-xs text-gray-500 dark:text-slate-400">
                                +{hotel.amenities.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price - Real-time */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <div>
                            <p className="text-2xl font-bold text-primary-600">
                              {formatCurrency(hotel.price.total)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              Total for stay • <span className="text-green-600 font-medium">Live Price</span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleViewDetails(hotel.hotelId)}
                            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
                          >
                            View Details
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'flights' && (
          <FlightSearchSection
            onSearch={onFlightSearch}
            flights={flights}
            returnFlights={returnFlights}
            loading={loading}
            onViewDetails={handleViewFlightDetails}
            onBook={handleBookFlight}
          />
        )}

        {activeTab === 'reservations' && (
          <div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bookings yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your hotel and flight bookings will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {reservation.hotelName ? (
                            <Bed className="w-5 h-5 text-gray-400" />
                          ) : (
                            <Plane className="w-5 h-5 text-gray-400" />
                          )}
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {reservation.hotelName || `${reservation.airline} ${reservation.flightNumber}`}
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {reservation.checkIn ? (
                            <>
                              <div>
                                <p className="text-gray-600">Check-in</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(reservation.checkIn).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Check-out</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(reservation.checkOut).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Guests</p>
                                <p className="font-medium text-gray-900">{reservation.guests}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-gray-600">Route</p>
                                <p className="font-medium text-gray-900">
                                  {reservation.origin?.code} → {reservation.destination?.code}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Departure</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(reservation.departureDate).toLocaleDateString()} {reservation.departureTime}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Passengers</p>
                                <p className="font-medium text-gray-900">{reservation.passengers}</p>
                              </div>
                            </>
                          )}
                          <div>
                            <p className="text-gray-600">Total</p>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(reservation.totalAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            reservation.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {reservation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>

      {/* Hotel Details Modal */}
      {showHotelDetails && selectedHotel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">{selectedHotel.name}</h3>
              <button
                onClick={() => setShowHotelDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Image Gallery - Real-time images */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {selectedHotel.images && selectedHotel.images.length > 0 ? (
                  selectedHotel.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${selectedHotel.name} ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to city-specific hotel images
                        ;(e.target as HTMLImageElement).src = `https://source.unsplash.com/800x600/?hotel,${selectedHotel.address.cityName.replace(' ', '+')},${idx + 1}`
                      }}
                    />
                  ))
                ) : (
                  // Generate real-time images if none provided
                  [0, 1, 2, 3].map((idx) => (
                    <img
                      key={idx}
                      src={`https://source.unsplash.com/800x600/?hotel,${selectedHotel.address.cityName.replace(' ', '+')},${idx + 1}`}
                      alt={`${selectedHotel.name} ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                      loading="lazy"
                    />
                  ))
                )}
              </div>

              {/* Hotel Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-5 h-5 mt-0.5" />
                    <div>
                      {selectedHotel.address.lines.map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                      <p>{selectedHotel.address.cityName}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Contact</h4>
                  <p className="text-gray-600">{selectedHotel.contact.phone}</p>
                  {selectedHotel.contact.email && (
                    <p className="text-gray-600">{selectedHotel.contact.email}</p>
                  )}
                </div>
              </div>

              {/* Amenities */}
              {selectedHotel.amenities && selectedHotel.amenities.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedHotel.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedHotel.description && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedHotel.description}</p>
                </div>
              )}

              {/* Price and Book - Real-time */}
              <div className="border-t border-gray-200 pt-6 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-primary-600">
                    {formatCurrency(selectedHotel.price.total)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Total for your stay • <span className="text-green-600 font-medium">● Live Price</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Price per night: {formatCurrency(selectedHotel.price.base)}
                  </p>
                </div>
                <button
                  onClick={() => handleBookHotel(selectedHotel)}
                  className="btn-primary px-8 py-3 text-lg"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Details Modal */}
      {showFlightDetails && selectedFlight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedFlight.airline} {selectedFlight.flightNumber}
              </h3>
              <button
                onClick={() => setShowFlightDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Route */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedFlight.origin.code}</p>
                    <p className="text-sm text-gray-600">{selectedFlight.origin.city}</p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {selectedFlight.departure.time}
                    </p>
                    <p className="text-xs text-gray-500">{selectedFlight.departure.date}</p>
                    {selectedFlight.departure.terminal && (
                      <p className="text-xs text-gray-400 mt-1">Terminal {selectedFlight.departure.terminal}</p>
                    )}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center justify-center">
                      <div className="border-t-2 border-dashed border-gray-300 flex-1"></div>
                      <Plane className="w-6 h-6 text-primary-600 mx-2" />
                      <div className="border-t-2 border-dashed border-gray-300 flex-1"></div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {selectedFlight.duration}
                    </p>
                    {selectedFlight.stops > 0 && (
                      <p className="text-center text-xs text-gray-500 mt-1">
                        {selectedFlight.stops} stop{selectedFlight.stops > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedFlight.destination.code}</p>
                    <p className="text-sm text-gray-600">{selectedFlight.destination.city}</p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {selectedFlight.arrival.time}
                    </p>
                    <p className="text-xs text-gray-500">{selectedFlight.arrival.date}</p>
                    {selectedFlight.arrival.terminal && (
                      <p className="text-xs text-gray-400 mt-1">Terminal {selectedFlight.arrival.terminal}</p>
                    )}
                  </div>
                </div>

                {/* Flight Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Flight Information</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-600">Airline:</span>{' '}
                        <span className="font-medium">{selectedFlight.airline}</span>
                      </p>
                      <p>
                        <span className="text-gray-600">Flight Number:</span>{' '}
                        <span className="font-medium">{selectedFlight.flightNumber}</span>
                      </p>
                      <p>
                        <span className="text-gray-600">Aircraft:</span>{' '}
                        <span className="font-medium">{selectedFlight.aircraft}</span>
                      </p>
                      <p>
                        <span className="text-gray-600">Class:</span>{' '}
                        <span className="font-medium capitalize">{selectedFlight.travelClass.toLowerCase()}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Route Details</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-600">From:</span>{' '}
                        <span className="font-medium">{selectedFlight.origin.name}</span>
                      </p>
                      <p>
                        <span className="text-gray-600">To:</span>{' '}
                        <span className="font-medium">{selectedFlight.destination.name}</span>
                      </p>
                      <p>
                        <span className="text-gray-600">Stops:</span>{' '}
                        <span className="font-medium">
                          {selectedFlight.stops === 0 ? 'Non-stop' : `${selectedFlight.stops} stop${selectedFlight.stops > 1 ? 's' : ''}`}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Price Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Fare:</span>
                      <span className="font-medium">{formatCurrency(selectedFlight.price.base)}</span>
                    </div>
                    {selectedFlight.price.taxes && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxes & Fees:</span>
                        <span className="font-medium">{formatCurrency(selectedFlight.price.taxes)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary-600">{formatCurrency(selectedFlight.price.total)}</span>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      ● Live Price - Updated in real-time
                    </p>
                  </div>
                </div>

                {/* Book Button */}
                <div className="border-t border-gray-200 pt-6">
                  <button
                    onClick={() => handleBookFlight(selectedFlight)}
                    className="btn-primary w-full py-3 text-lg"
                    disabled={!selectedFlight.available}
                  >
                    {selectedFlight.available ? 'Book This Flight' : 'Flight Unavailable'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
