// Weather-Integrated Scheduling System
class WeatherScheduler {
  constructor() {
    this.weatherApiKey = process.env.WEATHER_API_KEY;
    this.weatherApiEndpoint = 'https://api.weatherapi.com/v1';
  }

  // Get weather forecast for a specific location
  async getWeatherForecast(location, days = 7) {
    try {
      const response = await fetch(
        `${this.weatherApiEndpoint}/forecast.json?key=${this.weatherApiKey}&q=${location}&days=${days}`
      );
      
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      NotificationSystem.showNotification('Error fetching weather data', 'error');
      return null;
    }
  }

  // Check if weather is suitable for service
  isSuitableWeather(conditions) {
    const unsuitable = [
      'Heavy rain',
      'Thunderstorm',
      'Snow',
      'Sleet',
      'Heavy wind'
    ];

    return !unsuitable.includes(conditions.text);
  }

  // Get optimal service windows
  async getOptimalServiceWindows(location, serviceType) {
    const forecast = await this.getWeatherForecast(location);
    if (!forecast) return [];

    return forecast.forecast.forecastday
      .filter(day => {
        const conditions = day.day.condition;
        const temp = day.day.avgtemp_f;
        const precip = day.day.daily_chance_of_rain;

        // Basic weather suitability check
        if (!this.isSuitableWeather(conditions)) return false;

        // Service-specific checks
        switch (serviceType) {
          case 'Mowing & Trimming':
            return temp > 40 && temp < 90 && precip < 30;
          case 'Fertilization & Seeding':
            return temp > 50 && temp < 85 && precip < 40;
          case 'Landscape Design':
            return temp > 45 && temp < 95 && precip < 50;
          default:
            return temp > 32 && temp < 95 && precip < 60;
        }
      })
      .map(day => ({
        date: day.date,
        conditions: day.day.condition.text,
        temperature: day.day.avgtemp_f,
        rainChance: day.day.daily_chance_of_rain,
        suitable: true
      }));
  }

  // Schedule service with weather consideration
  async scheduleService(serviceDetails) {
    try {
      const {
        customerId,
        serviceType,
        location,
        preferredDate,
        flexibleTiming
      } = serviceDetails;

      // Get weather forecast
      const optimalWindows = await this.getOptimalServiceWindows(location, serviceType);
      
      if (optimalWindows.length === 0) {
        throw new Error('No suitable weather windows found in the next 7 days');
      }

      // If preferred date is provided, check if it's suitable
      if (preferredDate) {
        const preferredWindow = optimalWindows.find(
          window => window.date === preferredDate
        );

        if (preferredWindow) {
          return await this.createServiceAppointment({
            ...serviceDetails,
            scheduledDate: preferredDate,
            weatherNote: 'Weather conditions are suitable'
          });
        }

        if (!flexibleTiming) {
          throw new Error('Preferred date has unsuitable weather conditions');
        }
      }

      // Find the next best available date
      const nextBestDate = optimalWindows[0].date;
      
      return await this.createServiceAppointment({
        ...serviceDetails,
        scheduledDate: nextBestDate,
        weatherNote: 'Scheduled for optimal weather conditions'
      });

    } catch (error) {
      console.error('Error scheduling service:', error);
      NotificationSystem.showNotification(error.message, 'error');
      return null;
    }
  }

  // Create service appointment in database
  async createServiceAppointment(appointmentDetails) {
    try {
      const appointment = {
        ...appointmentDetails,
        status: 'scheduled',
        createdAt: new Date(),
        weatherChecked: true
      };

      // Add to appointments collection
      const appointmentRef = await db.collection('appointments').add(appointment);

      // Send notification to customer
      await NotificationSystem.sendNotification(
        appointment.customerId,
        'appointment_scheduled',
        `Service scheduled for ${appointment.scheduledDate}. ${appointment.weatherNote}`
      );

      return {
        success: true,
        appointmentId: appointmentRef.id,
        ...appointment
      };
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Monitor weather changes for scheduled services
  async monitorWeatherChanges() {
    try {
      // Get upcoming appointments
      const upcoming = await db.collection('appointments')
        .where('status', '==', 'scheduled')
        .get();

      for (const appointment of upcoming.docs) {
        const data = appointment.data();
        const forecast = await this.getWeatherForecast(data.location, 1);

        if (!forecast) continue;

        const conditions = forecast.forecast.forecastday[0].day.condition;
        
        if (!this.isSuitableWeather(conditions)) {
          // Weather has become unsuitable
          await this.handleWeatherAlert(appointment.id, data);
        }
      }
    } catch (error) {
      console.error('Error monitoring weather changes:', error);
    }
  }

  // Handle weather alerts and rescheduling
  async handleWeatherAlert(appointmentId, appointmentData) {
    try {
      // Find new optimal date
      const optimalWindows = await this.getOptimalServiceWindows(
        appointmentData.location,
        appointmentData.serviceType
      );

      if (optimalWindows.length === 0) {
        await NotificationSystem.sendNotification(
          appointmentData.customerId,
          'weather_alert',
          'Weather alert: Service may be affected. We will contact you to reschedule.'
        );
        return;
      }

      const newDate = optimalWindows[0].date;

      // Update appointment
      await db.collection('appointments').doc(appointmentId).update({
        scheduledDate: newDate,
        weatherNote: 'Rescheduled due to weather conditions',
        lastUpdated: new Date()
      });

      // Notify customer
      await NotificationSystem.sendNotification(
        appointmentData.customerId,
        'appointment_rescheduled',
        `Due to weather conditions, your service has been rescheduled to ${newDate}`
      );

    } catch (error) {
      console.error('Error handling weather alert:', error);
    }
  }
}

// Export WeatherScheduler
window.WeatherScheduler = WeatherScheduler; 