let map;
let marker;
let savedNotes = [];

// Initialize the map
function initMap() {
  // Default location (San Francisco)
  const defaultLocation = [37.7749, -122.4194];

  // Create the map
  map = L.map('map').setView(defaultLocation, 12);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  // Add a marker at the default location
  marker = L.marker(defaultLocation).addTo(map);

  // Add click event to the map to select a location
  map.on('click', (e) => {
    const clickedLocation = e.latlng; // Get the clicked location
    marker.setLatLng(clickedLocation); // Move the marker to the clicked location
    document.getElementById('note-input').focus(); // Focus on the note input
  });

  // Add search functionality
  const searchBox = document.getElementById('search-box');
  const searchButton = document.getElementById('search-button');

  searchButton.addEventListener('click', () => {
    const location = searchBox.value;
    if (location) {
      geocodeLocation(location);
    } else {
      alert('Please enter a location.');
    }
  });

  // Add note functionality
  const saveNoteButton = document.getElementById('save-note-button');
  saveNoteButton.addEventListener('click', () => {
    const noteText = document.getElementById('note-input').value;
    if (noteText && marker) {
      const locationName = document.getElementById('search-box').value || 'Selected Location';
      const note = {
        locationName: locationName,
        coordinates: marker.getLatLng(),
        text: noteText,
      };
      savedNotes.push(note);
      updateNotesList();
      document.getElementById('note-input').value = ''; // Clear input
      document.getElementById('search-box').value = ''; // Clear search box
    }
  });

  // Check if the user is near a saved location (only if permission is granted)
  if (Notification.permission === 'granted') {
    setInterval(checkUserLocation, 5000); // Check every 5 seconds
  }
}

// Geocode the searched location using Nominatim
function geocodeLocation(location) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
    .then((response) => response.json())
    .then((data) => {
      if (data && data.length > 0) {
        const position = [data[0].lat, data[0].lon]; // [lat, lng]
        const address = data[0].display_name;

        // Move the map to the new location
        map.setView(position, 14);

        // Update the marker position
        marker.setLatLng(position);

        // Update the search box with the found location
        document.getElementById('search-box').value = address;
      } else {
        alert('No results found. Please try a more specific location.');
      }
    })
    .catch((error) => {
      console.error('Error geocoding location:', error);
      alert('Geocoding failed. Please check your input and try again.');
    });
}

// Update the list of saved notes
function updateNotesList() {
  const notesList = document.getElementById('notes-list');
  notesList.innerHTML = ''; // Clear the list
  savedNotes.forEach((note, index) => {
    const li = document.createElement('li');
    li.textContent = `Note: ${note.text} (Location: ${note.locationName})`;
    notesList.appendChild(li);
  });
}

// Check if the user is near a saved location
function checkUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      savedNotes.forEach((note) => {
        const distance = getDistance(userLocation, note.coordinates);
        if (distance < 0.5) { // Within 500 meters
          showNotification(`You are near a saved note: ${note.text}`);
        }
      });
    });
  }
}

// Calculate distance between two coordinates (in kilometers)
function getDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Show a notification
function showNotification(message) {
  if (Notification.permission === 'granted') {
    new Notification(message); // Show notification if permission is granted
  }
}

// Initialize the app
initMap();

