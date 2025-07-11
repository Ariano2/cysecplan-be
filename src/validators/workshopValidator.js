const INDIAN_CITIES = [
  'Delhi',
  'Mumbai',
  'Chennai',
  'Bangalore',
  'Kolkata',
  'Hyderabad',
  'Ahmedabad',
  'Pune',
  'Jaipur',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Bhopal',
  'Patna',
];

const joinRequestValidator = (
  { originCity, modeOfTravel, preferredDate, accommodationRequired, remarks },
  workshop
) => {
  const currentDate = new Date(Date.now());
  if (!originCity || !modeOfTravel || !preferredDate)
    throw new Error('Incomplete Request, some fields are missing try again!');
  const validTravelModes = ['train', 'flight', 'bus', 'car', 'other'];
  if (!validTravelModes.includes(modeOfTravel))
    throw new Error('travel mode is invalid');
  if (currentDate.toISOString() > new Date(preferredDate).toISOString())
    throw new Error('Past Dates are not allowed');
  if (
    new Date(preferredDate).toISOString() >
    new Date(workshop.startDate).toISOString()
  )
    throw new Error(
      'preferred date of travel must be before start of workshop'
    );
  if (!INDIAN_CITIES.includes(originCity))
    throw new Error('Invalid Origin City');
  if (
    workshop?.registrationDeadline &&
    new Date(workshop.registrationDeadline).toISOString() <
      currentDate.toISOString()
  )
    throw new Error('deadline crossed cannot register for workshop');
  if (accommodationRequired && typeof accommodationRequired !== 'boolean')
    throw new Error('Accommodation field can only be true or false');
  if (remarks && remarks.length > 500)
    throw new Error('Remarks must be less than 500 characters');
};

const createWorkshopValidator = ({
  title,
  description,
  startDate,
  endDate,
  participants,
  location,
  capacity,
  registrationDeadline,
  category,
  price,
  materials,
}) => {
  const currentDate = new Date(Date.now());
  if (!title || !startDate || !endDate || !capacity || !location)
    throw new Error('Incomplete request certain fields are missing');
  if (location?.isVirtual && !location?.link)
    throw new Error('virtual workshops require a link');
  if (location?.isVirtual && location.link.length > 500)
    throw new Error('Link length must be < 500 characters');
  if (!location?.isVirtual && (!location?.address || !location?.city))
    throw new Error('Physical workshops require a valid city and address');
  if (!location?.isVirtual && !INDIAN_CITIES.includes(location.city))
    throw new Error('City is Invalid');
  if (!location?.isVirtual && location.address.length > 200)
    throw new Error('Address can only have 200 characters');
  if (new Date(startDate) > new Date(endDate))
    throw new Error('workshop must start before it ends');
  if (new Date(startDate) < currentDate)
    throw new Error('Start Date cannot be in the past!');
  if (description && description.length > 250)
    throw new Error('max description length is 250');
  if (title.length < 5 || title.length > 200)
    throw new Error('title length must be btw 5-200 characters');
  if (price && (isNaN(price) || price < 0 || price > 10000))
    throw new Error('Price must be in range 0-10000');
  if (capacity && (isNaN(capacity) || capacity < 1 || capacity > 10000))
    throw new Error('Capacity must be in range 1-10000');
  if (materials && materials.length > 10)
    throw new Error('Only upto 10 materials allowed');
  if (materials && materials.length > 0) {
    materials.forEach((material) => {
      if (material.length > 500)
        throw new Error('material link lengths below 500 characters only');
    });
  }
};

module.exports = { joinRequestValidator, createWorkshopValidator };
