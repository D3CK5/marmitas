/**
 * Address API request type definitions
 */

/**
 * Create address request
 */
export interface CreateAddressRequest {
  /** Street name */
  street: string;
  
  /** House/building number */
  number: string;
  
  /** Additional address information (apartment, floor, etc.) */
  complement?: string;
  
  /** Neighborhood/district */
  neighborhood: string;
  
  /** City name */
  city: string;
  
  /** State/province */
  state: string;
  
  /** Postal/ZIP code */
  zipCode: string;
  
  /** Country */
  country: string;
  
  /** Whether this is the default address for the user */
  isDefault?: boolean;
  
  /** Optional address label (home, work, etc.) */
  label?: string;
}

/**
 * Update address request
 */
export interface UpdateAddressRequest {
  /** Optional street name */
  street?: string;
  
  /** Optional house/building number */
  number?: string;
  
  /** Optional additional address information */
  complement?: string;
  
  /** Optional neighborhood/district */
  neighborhood?: string;
  
  /** Optional city name */
  city?: string;
  
  /** Optional state/province */
  state?: string;
  
  /** Optional postal/ZIP code */
  zipCode?: string;
  
  /** Optional country */
  country?: string;
  
  /** Optional default address flag */
  isDefault?: boolean;
  
  /** Optional address label */
  label?: string;
} 