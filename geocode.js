const axios = require("axios");

const apiKey = "AIzaSyBYnX1EhN5r4c465VtBwqz6Z16-8HbldN0"; // Your Google API Key

// Function to perform geocoding
async function geocodeAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === "OK") {
      const result = data.results[0];
      const location = result.geometry.location;
      console.log(`Address: ${result.formatted_address}`);
      console.log(`Latitude: ${location.lat}`);
      console.log(`Longitude: ${location.lng}`);
    } else {
      console.log("Error: Unable to get the location.");
    }
  } catch (error) {
    console.error("Error occurred while making the request:", error.message);
  }
}

// Test the geocoding function with a sample address
const address = "1600 Amphitheatre Parkway, Mountain View, CA"; // You can replace this with any address
geocodeAddress(address);
