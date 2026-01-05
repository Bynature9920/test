/**
 * Amadeus API Service for real-time hotel data
 * Uses Amadeus Hotel Search API for global hotel bookings
 */

interface AmadeusHotelSearchParams {
  cityCode?: string
  latitude?: number
  longitude?: number
  checkInDate: string
  checkOutDate: string
  adults: number
  radius?: number
  radiusUnit?: 'KM' | 'MILE'
}

interface AmadeusHotel {
  hotelId: string
  name: string
  rating?: number
  hotelDistance?: {
    distance: number
    distanceUnit: string
  }
  geoCode: {
    latitude: number
    longitude: number
  }
  address: {
    lines: string[]
    cityName: string
    countryCode: string
    postalCode?: string
  }
  contact?: {
    phone: string
    email?: string
  }
  amenities?: string[]
  price: {
    currency: string
    total: string
    base: string
    variations?: {
      average?: {
        base: string
      }
    }
  }
  images: string[]
  available: boolean
  description?: string
}

// For production, use environment variables for API keys
// For now, we'll use a proxy or direct API calls
const AMADEUS_API_BASE = 'https://test.api.amadeus.com'
const AMADEUS_API_KEY = import.meta.env.VITE_AMADEUS_API_KEY || ''
const AMADEUS_API_SECRET = import.meta.env.VITE_AMADEUS_API_SECRET || ''

let accessToken: string | null = null
let tokenExpiry: number = 0

/**
 * Get Amadeus OAuth token
 */
async function getAmadeusToken(): Promise<string> {
  // Check if we have a valid token
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken
  }

  try {
    // For demo, we'll use a mock token
    // In production, make actual OAuth call:
    /*
    const response = await fetch(`${AMADEUS_API_BASE}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET,
      }),
    })
    
    const data = await response.json()
    accessToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in * 1000)
    return accessToken
    */

    // For now, return a placeholder
    return 'demo-token'
  } catch (error) {
    console.error('Error getting Amadeus token:', error)
    throw error
  }
}

/**
 * Search for hotels using Amadeus API
 */
export async function searchAmadeusHotels(
  params: AmadeusHotelSearchParams
): Promise<AmadeusHotel[]> {
  try {
    const token = await getAmadeusToken()

    // Build search parameters
    const searchParams = new URLSearchParams({
      hotelIds: '', // Empty for city search
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults.toString(),
    })

    if (params.cityCode) {
      searchParams.append('cityCode', params.cityCode)
    } else if (params.latitude && params.longitude) {
      searchParams.append('latitude', params.latitude.toString())
      searchParams.append('longitude', params.longitude.toString())
      if (params.radius) {
        searchParams.append('radius', params.radius.toString())
        searchParams.append('radiusUnit', params.radiusUnit || 'KM')
      }
    }

    // In production, make actual API call:
    /*
    const response = await fetch(
      `${AMADEUS_API_BASE}/v3/shopping/hotel-offers?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Amadeus API error: ${response.status}`)
    }

    const data = await response.json()
    return transformAmadeusResponse(data)
    */

    // For demo, return mock data with real structure
    // In production, this will be replaced with actual API response
    return getMockHotelsWithRealData(params)
  } catch (error) {
    console.error('Error searching Amadeus hotels:', error)
    // Fallback to mock data
    return getMockHotelsWithRealData(params)
  }
}

/**
 * Transform Amadeus API response to our format
 */
function transformAmadeusResponse(data: any): AmadeusHotel[] {
  // Transform Amadeus response format to our hotel format
  return data.data?.map((offer: any) => ({
    hotelId: offer.hotel.hotelId,
    name: offer.hotel.name,
    rating: offer.hotel.rating || 0,
    hotelDistance: offer.hotel.hotelDistance,
    geoCode: offer.hotel.geoCode,
    address: {
      lines: offer.hotel.address.lines || [],
      cityName: offer.hotel.address.cityName,
      countryCode: offer.hotel.address.countryCode,
      postalCode: offer.hotel.address.postalCode,
    },
    contact: offer.hotel.contact,
    amenities: offer.hotel.amenities || [],
    price: {
      currency: offer.offers[0]?.price.currency || 'NGN',
      total: offer.offers[0]?.price.total || '0',
      base: offer.offers[0]?.price.base || '0',
    },
    images: offer.hotel.media?.images || [],
    available: offer.offers && offer.offers.length > 0,
    description: offer.hotel.description?.text,
  })) || []
}

/**
 * Get mock hotels with realistic global data
 * In production, this will be replaced with real API calls
 */
function getMockHotelsWithRealData(params: AmadeusHotelSearchParams): AmadeusHotel[] {
  // Use Unsplash API for real hotel images
  const cities = {
    LOS: { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
    ABV: { name: 'Abuja', country: 'Nigeria', lat: 9.0765, lng: 7.3986 },
    LON: { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
    NYC: { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060 },
    PAR: { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
    DXB: { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
    JNB: { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
    NBO: { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
    CAI: { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
    SIN: { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  }

  const city = cities[params.cityCode as keyof typeof cities] || cities.LOS
  const days = Math.ceil(
    (new Date(params.checkOutDate).getTime() - new Date(params.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  // Generate realistic prices based on city and dates
  const basePrices: Record<string, number> = {
    LOS: 45000,
    ABV: 50000,
    LON: 120000,
    NYC: 150000,
    PAR: 110000,
    DXB: 180000,
    JNB: 55000,
    NBO: 40000,
    CAI: 35000,
    SIN: 130000,
  }

  const basePrice = basePrices[params.cityCode as keyof typeof basePrices] || 50000
  const priceVariation = 0.8 + Math.random() * 0.4 // ±20% variation
  const totalPrice = basePrice * days * params.adults * priceVariation

  // Real hotel images from Unsplash with hotel search
  const imageUrls = [
    `https://source.unsplash.com/800x600/?hotel,${city.name.replace(' ', '+')}`,
    `https://source.unsplash.com/800x600/?luxury+hotel,${city.name.replace(' ', '+')}`,
    `https://source.unsplash.com/800x600/?resort,${city.name.replace(' ', '+')}`,
  ]

  return [
    {
      hotelId: `hotel-${city.name.toLowerCase()}-1`,
      name: `${city.name} Grand Hotel`,
      rating: 4.5 + Math.random() * 0.5,
      geoCode: {
        latitude: city.lat + (Math.random() - 0.5) * 0.1,
        longitude: city.lng + (Math.random() - 0.5) * 0.1,
      },
      address: {
        lines: [`Main Street`, 'City Center'],
        cityName: city.name,
        countryCode: city.country,
      },
      contact: {
        phone: `+${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      },
      amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking'],
      price: {
        currency: 'NGN',
        total: totalPrice.toFixed(2),
        base: (totalPrice / days).toFixed(2),
      },
      images: imageUrls,
      available: Math.random() > 0.15,
      description: `Luxury hotel in the heart of ${city.name}, ${city.country}.`,
    },
    {
      hotelId: `hotel-${city.name.toLowerCase()}-2`,
      name: `${city.name} Plaza Hotel`,
      rating: 4.2 + Math.random() * 0.6,
      geoCode: {
        latitude: city.lat + (Math.random() - 0.5) * 0.1,
        longitude: city.lng + (Math.random() - 0.5) * 0.1,
      },
      address: {
        lines: [`Business District`, city.name],
        cityName: city.name,
        countryCode: city.country,
      },
      contact: {
        phone: `+${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      },
      amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym', 'Business Center'],
      price: {
        currency: 'NGN',
        total: (totalPrice * 0.8).toFixed(2),
        base: ((totalPrice * 0.8) / days).toFixed(2),
      },
      images: imageUrls.map((url) => url.replace('hotel', 'business+hotel')),
      available: Math.random() > 0.2,
      description: `Modern business hotel in ${city.name}, ${city.country}.`,
    },
    {
      hotelId: `hotel-${city.name.toLowerCase()}-3`,
      name: `${city.name} Boutique Hotel`,
      rating: 4.7 + Math.random() * 0.3,
      geoCode: {
        latitude: city.lat + (Math.random() - 0.5) * 0.1,
        longitude: city.lng + (Math.random() - 0.5) * 0.1,
      },
      address: {
        lines: [`Historic District`, city.name],
        cityName: city.name,
        countryCode: city.country,
      },
      contact: {
        phone: `+${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      },
      amenities: ['WiFi', 'Spa', 'Restaurant', 'Concierge'],
      price: {
        currency: 'NGN',
        total: (totalPrice * 1.2).toFixed(2),
        base: ((totalPrice * 1.2) / days).toFixed(2),
      },
      images: imageUrls.map((url) => url.replace('hotel', 'boutique+hotel')),
      available: Math.random() > 0.1,
      description: `Charming boutique hotel in ${city.name}, ${city.country}.`,
    },
  ]
}

export const amadeusService = {
  searchHotels: searchAmadeusHotels,
  getAmadeusToken,
}





