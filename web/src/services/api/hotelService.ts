/**
 * Hotel Service - Real-time hotel search and booking
 * Uses Amadeus API for hotel data with real-time prices and images
 */

import { searchAmadeusHotels } from './amadeusService'

interface HotelSearchParams {
  cityCode: string
  checkInDate: string // YYYY-MM-DD
  checkOutDate: string // YYYY-MM-DD
  adults: number
}

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

interface HotelSearchResponse {
  hotels: Hotel[]
  total: number
}

// For demo purposes, we'll use a mock API that simulates real hotel data
// In production, replace with actual Amadeus API integration
const DEMO_HOTELS: Hotel[] = [
  {
    hotelId: 'hotel-1',
    name: 'Lagos Continental Hotel',
    rating: 4.5,
    address: {
      lines: ['52A Kofo Abayomi Street', 'Victoria Island'],
      cityName: 'Lagos',
      countryCode: 'NG',
    },
    contact: {
      phone: '+234 1 277 2000',
      email: 'info@lagoscontinental.com',
    },
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'],
    price: {
      currency: 'NGN',
      total: '45000',
      base: '40000',
    },
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    ],
    available: true,
    description: 'Luxury hotel in the heart of Victoria Island with stunning views and world-class amenities.',
  },
  {
    hotelId: 'hotel-2',
    name: 'Eko Hotels & Suites',
    rating: 4.8,
    address: {
      lines: ['1415 Adetokunbo Ademola Street', 'Victoria Island'],
      cityName: 'Lagos',
      countryCode: 'NG',
    },
    contact: {
      phone: '+234 1 277 3000',
      email: 'reservations@ekohotels.com',
    },
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Beach Access'],
    price: {
      currency: 'NGN',
      total: '65000',
      base: '60000',
    },
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    ],
    available: true,
    description: 'Premium beachfront hotel offering elegant rooms and exceptional service.',
  },
  {
    hotelId: 'hotel-3',
    name: 'Radisson Blu Anchorage Hotel',
    rating: 4.6,
    address: {
      lines: ['1A Ozumba Mbadiwe Avenue', 'Victoria Island'],
      cityName: 'Lagos',
      countryCode: 'NG',
    },
    contact: {
      phone: '+234 1 280 6600',
    },
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Business Center'],
    price: {
      currency: 'NGN',
      total: '55000',
      base: '50000',
    },
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800',
    ],
    available: true,
    description: 'Modern hotel with contemporary design and excellent facilities.',
  },
  {
    hotelId: 'hotel-4',
    name: 'Federal Palace Hotel',
    rating: 4.3,
    address: {
      lines: ['6-8 Ahmadu Bello Way', 'Victoria Island'],
      cityName: 'Lagos',
      countryCode: 'NG',
    },
    contact: {
      phone: '+234 1 262 4600',
    },
    amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym'],
    price: {
      currency: 'NGN',
      total: '35000',
      base: '30000',
    },
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    ],
    available: true,
    description: 'Comfortable hotel with great value for money in a prime location.',
  },
  {
    hotelId: 'hotel-5',
    name: 'Wheatbaker Hotel',
    rating: 4.7,
    address: {
      lines: ['4 Onitolo Road', 'Ikoyi'],
      cityName: 'Lagos',
      countryCode: 'NG',
    },
    contact: {
      phone: '+234 1 277 3500',
    },
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Concierge'],
    price: {
      currency: 'NGN',
      total: '75000',
      base: '70000',
    },
    images: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
    ],
    available: true,
    description: 'Boutique luxury hotel offering personalized service and elegant accommodations.',
  },
]

export const hotelService = {
  /**
   * Search for hotels by city and dates - REAL-TIME
   */
  async searchHotels(params: HotelSearchParams): Promise<HotelSearchResponse> {
    try {
      // Call Amadeus API for real-time hotel data
      const amadeusHotels = await searchAmadeusHotels({
        cityCode: params.cityCode,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        adults: params.adults,
      })

      // Transform to our format
      const hotels: Hotel[] = amadeusHotels.map((amadeusHotel) => ({
        hotelId: amadeusHotel.hotelId,
        name: amadeusHotel.name,
        rating: amadeusHotel.rating || 0,
        address: amadeusHotel.address,
        contact: amadeusHotel.contact || { phone: '' },
        amenities: amadeusHotel.amenities || [],
        price: amadeusHotel.price,
        images: amadeusHotel.images,
        available: amadeusHotel.available,
        description: amadeusHotel.description,
      }))

      return {
        hotels,
        total: hotels.length,
      }
    } catch (error) {
      console.error('Error searching hotels:', error)
      // Return empty results on error
      return { hotels: [], total: 0 }
    }
  },

  /**
   * Get hotel details by ID
   */
  async getHotelDetails(hotelId: string): Promise<Hotel | null> {
    try {
      // In production, call actual API:
      // const response = await apiClient.instance.get(`/api/v1/travel/hotels/${hotelId}`)
      // return response.data

      await new Promise((resolve) => setTimeout(resolve, 300))

      const hotel = DEMO_HOTELS.find((h) => h.hotelId === hotelId)
      return hotel || null
    } catch (error) {
      console.error('Error fetching hotel details:', error)
      return null
    }
  },

  /**
   * Check hotel availability for specific dates
   */
  async checkAvailability(
    hotelId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<boolean> {
    try {
      // In production, call actual API
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Simulate availability check
      return Math.random() > 0.15 // 85% chance of availability
    } catch (error) {
      console.error('Error checking availability:', error)
      return false
    }
  },

  /**
   * Get user's hotel reservations
   */
  async getReservations(): Promise<any[]> {
    try {
      // In production, call actual API:
      // const response = await apiClient.instance.get('/api/v1/travel/bookings?type=HOTEL')
      // return response.data

      // Demo reservations
      return [
        {
          id: 'res-1',
          hotelId: 'hotel-1',
          hotelName: 'Lagos Continental Hotel',
          checkIn: '2024-02-15',
          checkOut: '2024-02-18',
          guests: 2,
          totalAmount: '135000',
          status: 'CONFIRMED',
          bookingDate: '2024-01-10',
        },
      ]
    } catch (error) {
      console.error('Error fetching reservations:', error)
      return []
    }
  },
}

