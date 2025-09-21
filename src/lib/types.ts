
export interface Place {
  id: string;
  name: string;
  description: string;
  type: string;
  imageUrl: string;
  googleStars: number;
  imageHint: string;
}

export type TripDetails = {
  tripDescription: string;
  destination: string;
  interests: string;
  budget: string;
  travelDates: string;
  tripType: string;
  adults: number;
  kids: number;
  kidAges: string;
  modeOfTravel: string;
};

export type UserData = {
  user_favorites: string;
  user_id: number;
  user_interests: string;
  user_name: string;
  user_phone_no: string;
  session_id?: string;
};

    