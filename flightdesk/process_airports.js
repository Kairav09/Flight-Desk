import fs from 'fs';

const rawData = fs.readFileSync('./src/utils/airports.json', 'utf8');
const airports = JSON.parse(rawData);

const iataMap = {};
for (const key in airports) {
  const airport = airports[key];
  if (airport.iata && airport.iata.length === 3) {
    iataMap[airport.iata] = {
      lat: airport.lat,
      lng: airport.lon,
      name: airport.name,
      city: airport.city,
      country: airport.country
    };
  }
}

fs.writeFileSync('./src/utils/iata.json', JSON.stringify(iataMap));
console.log(`Extracted ${Object.keys(iataMap).length} IATA airports.`);
