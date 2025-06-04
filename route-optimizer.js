// Route Optimization System
class RouteOptimizer {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.directionsService = null;
    this.geocoder = null;
  }

  // Initialize Google Maps services
  async initializeServices() {
    try {
      await this.loadGoogleMapsScript();
      this.directionsService = new google.maps.DirectionsService();
      this.geocoder = new google.maps.Geocoder();
      return true;
    } catch (error) {
      console.error('Error initializing Google Maps services:', error);
      return false;
    }
  }

  // Load Google Maps script
  loadGoogleMapsScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=places,geometry`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Geocode address to coordinates
  async geocodeAddress(address) {
    try {
      const result = await this.geocoder.geocode({ address });
      if (result.results.length > 0) {
        return {
          lat: result.results[0].geometry.location.lat(),
          lng: result.results[0].geometry.location.lng()
        };
      }
      throw new Error('Address not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  // Calculate optimal route for multiple stops
  async calculateOptimalRoute(stops) {
    try {
      // Convert addresses to coordinates
      const coordinates = await Promise.all(
        stops.map(stop => this.geocodeAddress(stop.address))
      );

      // Calculate distances between all points
      const distances = await this.calculateDistanceMatrix(coordinates);

      // Use nearest neighbor algorithm for route optimization
      const route = this.nearestNeighborRoute(distances);

      // Get detailed directions
      const directions = await this.getDetailedDirections(
        stops.map((stop, index) => ({
          ...stop,
          order: route.indexOf(index)
        })).sort((a, b) => a.order - b.order)
      );

      return {
        route: directions.routes[0],
        duration: directions.routes[0].legs.reduce((total, leg) => total + leg.duration.value, 0),
        distance: directions.routes[0].legs.reduce((total, leg) => total + leg.distance.value, 0)
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      throw error;
    }
  }

  // Calculate distance matrix between all points
  async calculateDistanceMatrix(coordinates) {
    const matrix = [];
    for (let i = 0; i < coordinates.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < coordinates.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
          continue;
        }
        const distance = await this.getDistance(coordinates[i], coordinates[j]);
        matrix[i][j] = distance;
      }
    }
    return matrix;
  }

  // Get distance between two points
  async getDistance(point1, point2) {
    return new Promise((resolve, reject) => {
      this.directionsService.route(
        {
          origin: point1,
          destination: point2,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            resolve(result.routes[0].legs[0].distance.value);
          } else {
            reject(new Error('Direction service failed'));
          }
        }
      );
    });
  }

  // Implement nearest neighbor algorithm for route optimization
  nearestNeighborRoute(distances) {
    const n = distances.length;
    const visited = new Array(n).fill(false);
    const route = [0]; // Start from first location
    visited[0] = true;

    for (let i = 1; i < n; i++) {
      let lastPoint = route[route.length - 1];
      let nextPoint = -1;
      let minDistance = Infinity;

      for (let j = 0; j < n; j++) {
        if (!visited[j] && distances[lastPoint][j] < minDistance) {
          minDistance = distances[lastPoint][j];
          nextPoint = j;
        }
      }

      route.push(nextPoint);
      visited[nextPoint] = true;
    }

    return route;
  }

  // Get detailed directions for the route
  async getDetailedDirections(stops) {
    return new Promise((resolve, reject) => {
      const waypoints = stops.slice(1, -1).map(stop => ({
        location: stop.address,
        stopover: true
      }));

      this.directionsService.route(
        {
          origin: stops[0].address,
          destination: stops[stops.length - 1].address,
          waypoints,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            reject(new Error('Failed to get detailed directions'));
          }
        }
      );
    });
  }

  // Optimize daily schedule based on route
  async optimizeDailySchedule(appointments) {
    try {
      // Group appointments by date
      const scheduleByDate = this.groupAppointmentsByDate(appointments);
      const optimizedSchedule = {};

      for (const [date, dayAppointments] of Object.entries(scheduleByDate)) {
        // Calculate optimal route for the day
        const route = await this.calculateOptimalRoute(dayAppointments);

        // Estimate time windows for each appointment
        const timeWindows = this.calculateTimeWindows(route, dayAppointments);

        optimizedSchedule[date] = dayAppointments.map((appointment, index) => ({
          ...appointment,
          estimatedArrival: timeWindows[index].start,
          estimatedDeparture: timeWindows[index].end,
          routeOrder: index
        }));
      }

      return optimizedSchedule;
    } catch (error) {
      console.error('Schedule optimization error:', error);
      throw error;
    }
  }

  // Group appointments by date
  groupAppointmentsByDate(appointments) {
    return appointments.reduce((groups, appointment) => {
      const date = appointment.scheduledDate;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    }, {});
  }

  // Calculate time windows for appointments
  calculateTimeWindows(route, appointments) {
    const START_TIME = 8 * 60; // 8:00 AM in minutes
    const timeWindows = [];
    let currentTime = START_TIME;

    route.legs.forEach((leg, index) => {
      const travelTime = Math.ceil(leg.duration.value / 60); // Convert seconds to minutes
      const serviceTime = appointments[index].estimatedDuration || 60; // Default 1 hour

      timeWindows.push({
        start: this.minutesToTime(currentTime),
        end: this.minutesToTime(currentTime + serviceTime)
      });

      currentTime += serviceTime + travelTime;
    });

    return timeWindows;
  }

  // Convert minutes to time string
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Calculate fuel cost estimate
  calculateFuelCost(route, fuelEfficiency, fuelPrice) {
    const distanceInMiles = route.distance / 1609.34; // Convert meters to miles
    return (distanceInMiles / fuelEfficiency) * fuelPrice;
  }
}

// Export RouteOptimizer
window.RouteOptimizer = RouteOptimizer; 