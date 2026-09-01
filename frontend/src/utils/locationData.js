export const STATE_CITIES_MAP = {
  'Uttar Pradesh': [
    'Noida',
    'Greater Noida',
    'Ghaziabad',
    'Meerut',
    'Lucknow',
    'Kanpur',
    'Agra',
    'Varanasi',
    'Prayagraj',
    'Bareilly',
    'Aligarh',
    'Moradabad',
    'Saharanpur',
    'Gorakhpur',
    'Jhansi',
    'Muzaffarnagar',
    'Mathura',
    'Ayodhya',
    'Firozabad'
  ],
  'Delhi': [
    'New Delhi',
    'North Delhi',
    'South Delhi',
    'East Delhi',
    'West Delhi',
    'Central Delhi'
  ],
  'Haryana': [
    'Gurugram',
    'Faridabad',
    'Panipat',
    'Ambala',
    'Karnal',
    'Sonipat',
    'Rohtak',
    'Hisar',
    'Panchkula',
    'Yamunanagar',
    'Bhiwani',
    'Sirsa'
  ],
  'Himachal Pradesh': [
    'Shimla',
    'Paonta Sahib',
    'Solan',
    'Dharamshala',
    'Mandi',
    'Baddi',
    'Kullu',
    'Hamirpur',
    'Una',
    'Bilaspur',
    'Chamba',
    'Kangra'
  ],
  'Maharashtra': [
    'Mumbai',
    'Pune',
    'Nagpur',
    'Thane',
    'Nashik',
    'Aurangabad',
    'Solapur',
    'Amravati',
    'Navi Mumbai',
    'Kolhapur',
    'Akola',
    'Latur'
  ],
  'Gujarat': [
    'Ahmedabad',
    'Surat',
    'Vadodara',
    'Rajkot',
    'Bhavnagar',
    'Jamnagar',
    'Gandhinagar',
    'Junagadh',
    'Anand',
    'Bharuch',
    'Vapi',
    'Morbi'
  ],
  'Punjab': [
    'Ludhiana',
    'Amritsar',
    'Jalandhar',
    'Patiala',
    'Bathinda',
    'Mohali',
    'Hoshiarpur',
    'Pathankot',
    'Moga',
    'Abohar'
  ],
  'Rajasthan': [
    'Jaipur',
    'Jodhpur',
    'Kota',
    'Udaipur',
    'Bikaner',
    'Ajmer',
    'Bhilwara',
    'Alwar',
    'Sikar',
    'Bharatpur'
  ],
  'Karnataka': [
    'Bengaluru',
    'Mysuru',
    'Hubballi',
    'Mangaluru',
    'Belagavi',
    'Davangere',
    'Ballari',
    'Vijayapura',
    'Shivamogga',
    'Tumakuru'
  ],
  'Tamil Nadu': [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Tiruppur',
    'Erode',
    'Vellore',
    'Tirunelveli',
    'Thanjavur'
  ],
  'West Bengal': [
    'Kolkata',
    'Howrah',
    'Durgapur',
    'Asansol',
    'Siliguri',
    'Bardhaman',
    'Kharagpur',
    'Malda'
  ],
  'Madhya Pradesh': [
    'Indore',
    'Bhopal',
    'Jabalpur',
    'Gwalior',
    'Ujjain',
    'Sagar',
    'Dewas',
    'Satna',
    'Ratlam',
    'Rewa'
  ],
  'Telangana': [
    'Hyderabad',
    'Warangal',
    'Nizamabad',
    'Khammam',
    'Karimnagar',
    'Ramagundam',
    'Mahbubnagar'
  ],
  'Bihar': [
    'Patna',
    'Gaya',
    'Bhagalpur',
    'Muzaffarpur',
    'Purnia',
    'Darbhanga',
    'Bihar Sharif',
    'Arrah'
  ],
  'Uttarakhand': [
    'Dehradun',
    'Haridwar',
    'Roorkee',
    'Haldwani',
    'Rudraprayag',
    'Kashipur',
    'Rishikesh'
  ]
};

export const ALL_STATES = Object.keys(STATE_CITIES_MAP);

export const getCitiesForState = (stateName) => {
  if (!stateName) return [];
  const stateMatch = ALL_STATES.find(
    s => s.toLowerCase() === stateName.trim().toLowerCase()
  );
  if (stateMatch) return STATE_CITIES_MAP[stateMatch];

  if (stateName.toLowerCase().includes('pradesh')) {
    if (stateName.toLowerCase().includes('uttar')) return STATE_CITIES_MAP['Uttar Pradesh'];
    if (stateName.toLowerCase().includes('himachal')) return STATE_CITIES_MAP['Himachal Pradesh'];
    if (stateName.toLowerCase().includes('madhya')) return STATE_CITIES_MAP['Madhya Pradesh'];
  }
  return [];
};
