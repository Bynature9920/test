import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCurrency } from '@/utils/format'
import { Plane, Clock, ArrowRight, MapPin, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const flightSearchSchema = z.object({
  origin: z.string().min(1, 'Please select origin'),
  destination: z.string().min(1, 'Please select destination'),
  departureDate: z.string().min(1, 'Departure date is required'),
  returnDate: z.string().optional(),
  adults: z.number().min(1).max(10),
  children: z.number().min(0).max(10).optional(),
  travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).optional(),
})

type FlightSearchFormData = z.infer<typeof flightSearchSchema>

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

interface FlightSearchSectionProps {
  onSearch: (data: FlightSearchFormData) => void
  flights: Flight[]
  returnFlights?: Flight[]
  loading: boolean
  onViewDetails: (flight: Flight) => void
  onBook: (flight: Flight) => void
}

const AIRPORTS = [
  { code: 'LOS', name: 'Lagos (LOS)', city: 'Lagos', country: 'Nigeria' },
  { code: 'ABV', name: 'Abuja (ABV)', city: 'Abuja', country: 'Nigeria' },
  { code: 'PHC', name: 'Port Harcourt (PHC)', city: 'Port Harcourt', country: 'Nigeria' },
  { code: 'KAN', name: 'Kano (KAN)', city: 'Kano', country: 'Nigeria' },
  { code: 'JNB', name: 'Johannesburg (JNB)', city: 'Johannesburg', country: 'South Africa' },
  { code: 'NBO', name: 'Nairobi (NBO)', city: 'Nairobi', country: 'Kenya' },
  { code: 'CAI', name: 'Cairo (CAI)', city: 'Cairo', country: 'Egypt' },
  { code: 'LON', name: 'London (LON)', city: 'London', country: 'United Kingdom' },
  { code: 'PAR', name: 'Paris (PAR)', city: 'Paris', country: 'France' },
  { code: 'DXB', name: 'Dubai (DXB)', city: 'Dubai', country: 'UAE' },
  { code: 'SIN', name: 'Singapore (SIN)', city: 'Singapore', country: 'Singapore' },
  { code: 'NYC', name: 'New York (NYC)', city: 'New York', country: 'USA' },
]

export default function FlightSearchSection({
  onSearch,
  flights,
  returnFlights,
  loading,
  onViewDetails,
  onBook,
}: FlightSearchSectionProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FlightSearchFormData>({
    resolver: zodResolver(flightSearchSchema),
    defaultValues: {
      adults: 1,
      travelClass: 'ECONOMY',
      departureDate: new Date().toISOString().split('T')[0],
    },
  })

  const isRoundTrip = watch('returnDate')

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <select {...register('origin')} className="input-field">
              <option value="">Select origin</option>
              {AIRPORTS.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.name} - {airport.city}
                </option>
              ))}
            </select>
            {errors.origin && (
              <p className="mt-1 text-sm text-red-600">{errors.origin.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <select {...register('destination')} className="input-field">
              <option value="">Select destination</option>
              {AIRPORTS.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.name} - {airport.city}
                </option>
              ))}
            </select>
            {errors.destination && (
              <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Departure</label>
            <input
              {...register('departureDate')}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
            />
            {errors.departureDate && (
              <p className="mt-1 text-sm text-red-600">{errors.departureDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Return (Optional)
            </label>
            <input
              {...register('returnDate')}
              type="date"
              min={watch('departureDate') || new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adults</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Children</label>
            <input
              {...register('children', { valueAsNumber: true })}
              type="number"
              min="0"
              max="10"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select {...register('travelClass')} className="input-field">
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First Class</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto px-8">
          {loading ? 'Searching Flights...' : 'Search Flights'}
        </button>
      </form>

      {flights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Available Flights ({flights.length})
          </h3>

          {/* Outbound Flights */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Outbound Flights</h4>
            <div className="space-y-3">
              {flights.map((flight) => (
                <div
                  key={flight.flightId}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Plane className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="font-semibold text-gray-900">{flight.airline}</p>
                            <p className="text-sm text-gray-500">{flight.flightNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">{flight.origin.code}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span className="font-medium">{flight.destination.code}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Departure</p>
                          <p className="font-medium text-gray-900">
                            {flight.departure.time}
                          </p>
                          <p className="text-xs text-gray-500">{flight.origin.city}</p>
                          {flight.departure.terminal && (
                            <p className="text-xs text-gray-400">Terminal {flight.departure.terminal}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-600">Arrival</p>
                          <p className="font-medium text-gray-900">{flight.arrival.time}</p>
                          <p className="text-xs text-gray-500">{flight.destination.city}</p>
                          {flight.arrival.terminal && (
                            <p className="text-xs text-gray-400">Terminal {flight.arrival.terminal}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-600">Duration</p>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <p className="font-medium text-gray-900">{flight.duration}</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Aircraft</p>
                          <p className="font-medium text-gray-900 text-xs">{flight.aircraft}</p>
                          <p className="text-xs text-gray-500 capitalize">{flight.travelClass.toLowerCase()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        {formatCurrency(flight.price.total)}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        <span className="text-green-600 font-medium">● Live Price</span>
                      </p>
                      {flight.available ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => onViewDetails(flight)}
                            className="btn-secondary text-sm px-4 py-2 w-full"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => onBook(flight)}
                            className="btn-primary text-sm px-4 py-2 w-full"
                          >
                            Book Now
                          </button>
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Return Flights */}
          {returnFlights && returnFlights.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Return Flights</h4>
              <div className="space-y-3">
                {returnFlights.map((flight) => (
                  <div
                    key={flight.flightId}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Plane className="w-5 h-5 text-primary-600" />
                            <div>
                              <p className="font-semibold text-gray-900">{flight.airline}</p>
                              <p className="text-sm text-gray-500">{flight.flightNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">{flight.origin.code}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span className="font-medium">{flight.destination.code}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Departure</p>
                            <p className="font-medium text-gray-900">{flight.departure.time}</p>
                            <p className="text-xs text-gray-500">{flight.origin.city}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Arrival</p>
                            <p className="font-medium text-gray-900">{flight.arrival.time}</p>
                            <p className="text-xs text-gray-500">{flight.destination.city}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Duration</p>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <p className="font-medium text-gray-900">{flight.duration}</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Aircraft</p>
                            <p className="font-medium text-gray-900 text-xs">{flight.aircraft}</p>
                            <p className="text-xs text-gray-500 capitalize">{flight.travelClass.toLowerCase()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 text-right">
                        <p className="text-2xl font-bold text-primary-600">
                          {formatCurrency(flight.price.total)}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          <span className="text-green-600 font-medium">● Live Price</span>
                        </p>
                        {flight.available ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => onViewDetails(flight)}
                              className="btn-secondary text-sm px-4 py-2 w-full"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => onBook(flight)}
                              className="btn-primary text-sm px-4 py-2 w-full"
                            >
                              Book Now
                            </button>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}





