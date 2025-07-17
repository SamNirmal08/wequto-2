const express = require('express');
const axios = require('axios');
const { getWeatherCache, setWeatherCache } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '9802df5f24558a016628d5e625a40817';

// Get weather for a city
router.get('/:city', authenticateToken, async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    // Check cache first
    const cachedWeather = getWeatherCache(city);
    if (cachedWeather) {
      return res.json(cachedWeather);
    }

    // Fetch from OpenWeatherMap API
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );

    const weatherData = {
      city: response.data.name,
      country: response.data.sys.country,
      temperature: Math.round(response.data.main.temp),
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      windSpeed: Math.round(response.data.wind.speed * 3.6), // Convert m/s to km/h
      icon: response.data.weather[0].icon,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    setWeatherCache(city, weatherData);

    res.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get weather forecast (5-day)
router.get('/:city/forecast', authenticateToken, async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );

    const forecast = response.data.list.map(item => ({
      date: item.dt_txt,
      temperature: Math.round(item.main.temp),
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind.speed * 3.6)
    }));

    res.json({
      city: response.data.city.name,
      country: response.data.city.country,
      forecast: forecast.slice(0, 8) // Next 24 hours (3-hour intervals)
    });
  } catch (error) {
    console.error('Weather forecast error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.status(500).json({ error: 'Failed to fetch weather forecast' });
  }
});

module.exports = router;