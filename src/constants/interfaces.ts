export interface Coordinates {
    lat: number
    lng: number
}

export interface Profile {
    qualifications: string
    experience: number
    specializations: string
    contact_phone: string
    contact_email: string
    address : string
    // "address_line2": "string",
    // "city": "string",
    // "district": "string",
    // "state": "string",
    // "country": "string",
    // "postal_code": "string",
    additional_info: string,
    user_id: string
  }