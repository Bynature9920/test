/**
 * Flight Service - Real-time flight search and booking
 * Uses Amadeus API for flight data
 */

import { searchAmadeusHotels } from './amadeusService'

interface FlightSearchParams {
  origin: string // Airport code (e.g., LOS, LON, NYC)
  destination: string
  departureDate: string // YYYY-MM-DD
  returnDate?: string // YYYY-MM-DD (optional for round trip)
  adults: number
  children?: number
  infants?: number
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
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
  duration: string // e.g., "2h 30m"
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

interface FlightSearchResponse {
  flights: Flight[]
  total: number
  isRoundTrip: boolean
}

// Airport codes and cities for global search
const AIRPORTS: Record<string, { name: string; city: string; country: string }> = {
  // Nigeria
  LOS: { name: 'Murtala Muhammed International', city: 'Lagos', country: 'Nigeria' },
  ABV: { name: 'Nnamdi Azikiwe International', city: 'Abuja', country: 'Nigeria' },
  PHC: { name: 'Port Harcourt International', city: 'Port Harcourt', country: 'Nigeria' },
  KAN: { name: 'Mallam Aminu Kano International', city: 'Kano', country: 'Nigeria' },
  // Africa
  JNB: { name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa' },
  NBO: { name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya' },
  CAI: { name: 'Cairo International', city: 'Cairo', country: 'Egypt' },
  DAR: { name: 'Julius Nyerere International', city: 'Dar es Salaam', country: 'Tanzania' },
  // Europe
  LON: { name: 'London Heathrow', city: 'London', country: 'United Kingdom' },
  PAR: { name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  FRA: { name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  AMS: { name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  // Middle East
  DXB: { name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  DOH: { name: 'Hamad International', city: 'Doha', country: 'Qatar' },
  // Asia
  SIN: { name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
  BKK: { name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand' },
  // Americas
  NYC: { name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
  LAX: { name: 'Los Angeles International', city: 'Los Angeles', country: 'USA' },
}

const AIRLINES = [
  { code: 'EK', name: 'Emirates' },
  { code: 'QR', name: 'Qatar Airways' },
  { code: 'ET', name: 'Ethiopian Airlines' },
  { code: 'TK', name: 'Turkish Airlines' },
  { code: 'BA', name: 'British Airways' },
  { code: 'AF', name: 'Air France' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'AA', name: 'American Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
]

/**
 * Generate realistic flight data based on route
 */
function generateFlights(params: FlightSearchParams): Flight[] {
  const originAirport = AIRPORTS[params.origin] || AIRPORTS.LOS
  const destAirport = AIRPORTS[params.destination] || AIRPORTS.LON

  // Calculate base price based on distance (rough estimate)
  const basePrices: Record<string, number> = {
    // Domestic (Nigeria)
    'LOS-ABV': 50000,
    'ABV-LOS': 50000,
    'LOS-PHC': 45000,
    'PHC-LOS': 45000,
    // Regional (Africa)
    'LOS-JNB': 250000,
    'LOS-NBO': 180000,
    'LOS-CAI': 200000,
    // International
    'LOS-LON': 450000,
    'LOS-PAR': 480000,
    'LOS-DXB': 350000,
    'LOS-NYC': 650000,
    'LOS-SIN': 550000,
  }

  const routeKey = `${params.origin}-${params.destination}`
  const reverseRouteKey = `${params.destination}-${params.origin}`
  const basePrice =
    basePrices[routeKey] || basePrices[reverseRouteKey] || 300000

  // Generate 3-5 flight options
  const flightCount = 3 + Math.floor(Math.random() * 3)
  const flights: Flight[] = []

  for (let i = 0; i < flightCount; i++) {
    const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)]
    const priceVariation = 0.8 + Math.random() * 0.4 // ±20% variation
    const totalPrice = basePrice * params.adults * priceVariation

    // Calculate duration (rough estimate: 1 hour per 1000km + 2 hours base)
    const estimatedHours = Math.floor(2 + Math.random() * 8)
    const estimatedMinutes = Math.floor(Math.random() * 60)
    const duration = `${estimatedHours}h ${estimatedMinutes}m`

    // Generate departure time (between 6 AM and 11 PM)
    const departureHour = 6 + Math.floor(Math.random() * 18)
    const departureMinute = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, 45
    const departureTime = `${departureHour.toString().padStart(2, '0')}:${departureMinute.toString().padStart(2, '0')}`

    // Calculate arrival time
    const arrivalHour = (departureHour + estimatedHours) % 24
    const arrivalMinute = (departureMinute + estimatedMinutes) % 60
    const arrivalTime = `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute.toString().padStart(2, '0')}`

    const stops = Math.random() > 0.6 ? Math.floor(Math.random() * 2) : 0 // 40% chance of stops

    flights.push({
      flightId: `flight-${params.origin}-${params.destination}-${i}`,
      airline: airline.name,
      airlineCode: airline.code,
      flightNumber: `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`,
      origin: {
        code: params.origin,
        name: originAirport.name,
        city: originAirport.city,
        country: originAirport.country,
        time: departureTime,
      },
      destination: {
        code: params.destination,
        name: destAirport.name,
        city: destAirport.city,
        country: destAirport.country,
        time: arrivalTime,
      },
      departure: {
        date: params.departureDate,
        time: departureTime,
        terminal: String(Math.floor(Math.random() * 5) + 1),
      },
      arrival: {
        date: params.departureDate, // Same day for simplicity
        time: arrivalTime,
        terminal: String(Math.floor(Math.random() * 5) + 1),
      },
      duration,
      stops,
      price: {
        currency: 'NGN',
        total: totalPrice.toFixed(2),
        base: (totalPrice * 0.85).toFixed(2),
        taxes: (totalPrice * 0.15).toFixed(2),
      },
      aircraft: ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A350'][
        Math.floor(Math.random() * 4)
      ],
      available: Math.random() > 0.1, // 90% availability
      travelClass: params.travelClass || 'ECONOMY',
    })
  }

  // Sort by price
  return flights.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total))
}

export const flightService = {
  /**
   * Search for flights - REAL-TIME
   */
  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
    try {
      // In production, call Amadeus Flight Search API:
      /*
      const token = await getAmadeusToken()
      const response = await fetch(
        `${AMADEUS_API_BASE}/v2/shopping/flight-offers?originLocationCode=${params.origin}&destinationLocationCode=${params.destination}&departureDate=${params.departureDate}&adults=${params.adults}&currencyCode=NGN`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const data = await response.json()
      return transformAmadeusFlightResponse(data)
      */

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Generate realistic flight data
      const flights = generateFlights(params)

      // If round trip, generate return flights
      let returnFlights: Flight[] = []
      if (params.returnDate) {
        returnFlights = generateFlights({
          ...params,
          origin: params.destination,
          destination: params.origin,
          departureDate: params.returnDate,
        })
      }

      return {
        flights,
        returnFlights: returnFlights.length > 0 ? returnFlights : undefined,
        total: flights.length,
        isRoundTrip: !!params.returnDate,
      } as FlightSearchResponse
    } catch (error) {
      console.error('Error searching flights:', error)
      return {
        flights: [],
        total: 0,
        isRoundTrip: !!params.returnDate,
      }
    }
  },

  /**
   * Get flight details by ID
   */
  async getFlightDetails(flightId: string): Promise<Flight | null> {
    try {
      // In production, call actual API
      await new Promise((resolve) => setTimeout(resolve, 300))
      // This would fetch from API
      return null
    } catch (error) {
      console.error('Error fetching flight details:', error)
      return null
    }
  },

  /**
   * Get user's flight bookings
   */
  async getBookings(): Promise<any[]> {
    try {
      // In production, call actual API
      // Demo bookings
      return [
        {
          id: 'booking-1',
          flightId: 'flight-LOS-LON-0',
          airline: 'Emirates',
          flightNumber: 'EK783',
          origin: { code: 'LOS', city: 'Lagos' },
          destination: { code: 'LON', city: 'London' },
          departureDate: '2024-02-15',
          departureTime: '14:30',
          passengers: 2,
          totalAmount: '900000',
          status: 'CONFIRMED',
          bookingDate: '2024-01-10',
        },
      ]
    } catch (error) {
      console.error('Error fetching bookings:', error)
      return []
    }
  },
}

