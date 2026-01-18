const WeatherAlert = require('../models/WeatherAlert');
const User = require('../models/User');

// District coordinates for Tamil Nadu
const DISTRICT_COORDINATES = {
    'Ariyalur': { lat: 11.1382, lon: 79.0782 },
    'Chengalpattu': { lat: 12.6819, lon: 79.9888 },
    'Chennai': { lat: 13.0827, lon: 80.2707 },
    'Coimbatore': { lat: 11.0168, lon: 76.9558 },
    'Cuddalore': { lat: 11.7480, lon: 79.7714 },
    'Dharmapuri': { lat: 12.1357, lon: 78.1602 },
    'Dindigul': { lat: 10.3624, lon: 77.9695 },
    'Erode': { lat: 11.3410, lon: 77.7172 },
    'Kallakurichi': { lat: 11.7376, lon: 78.9597 },
    'Kancheepuram': { lat: 12.8342, lon: 79.7036 },
    'Karur': { lat: 10.9601, lon: 78.0766 },
    'Krishnagiri': { lat: 12.5186, lon: 78.2137 },
    'Madurai': { lat: 9.9252, lon: 78.1198 },
    'Mayiladuthurai': { lat: 11.1018, lon: 79.6521 },
    'Nagapattinam': { lat: 10.7672, lon: 79.8420 },
    'Namakkal': { lat: 11.2189, lon: 78.1674 },
    'Nilgiris': { lat: 11.4916, lon: 76.7337 },
    'Perambalur': { lat: 11.2320, lon: 78.8806 },
    'Pudukkottai': { lat: 10.3833, lon: 78.8001 },
    'Ramanathapuram': { lat: 9.3639, lon: 78.8395 },
    'Ranipet': { lat: 12.9224, lon: 79.3326 },
    'Salem': { lat: 11.6643, lon: 78.1460 },
    'Sivaganga': { lat: 9.8433, lon: 78.4809 },
    'Tenkasi': { lat: 8.9604, lon: 77.3152 },
    'Thanjavur': { lat: 10.7870, lon: 79.1378 },
    'Theni': { lat: 10.0104, lon: 77.4768 },
    'Thoothukudi': { lat: 8.7642, lon: 78.1348 },
    'Tiruchirappalli': { lat: 10.7905, lon: 78.7047 },
    'Tirunelveli': { lat: 8.7139, lon: 77.7567 },
    'Tirupathur': { lat: 12.4946, lon: 78.5730 },
    'Tiruppur': { lat: 11.1085, lon: 77.3411 },
    'Tiruvallur': { lat: 13.1231, lon: 79.9024 },
    'Tiruvannamalai': { lat: 12.2253, lon: 79.0747 },
    'Tiruvarur': { lat: 10.7668, lon: 79.6345 },
    'Vellore': { lat: 12.9165, lon: 79.1325 },
    'Viluppuram': { lat: 11.9395, lon: 79.4924 },
    'Virudhunagar': { lat: 9.5850, lon: 77.9624 }
};

// Fetch weather data from Open-Meteo API
const fetchWeatherFromAPI = async (district) => {
    const coords = DISTRICT_COORDINATES[district];
    if (!coords) {
        // Try to find a matching district
        const matchingDistrict = Object.keys(DISTRICT_COORDINATES).find(
            d => d.toLowerCase() === district.toLowerCase()
        );
        if (matchingDistrict) {
            return fetchWeatherFromAPI(matchingDistrict);
        }
        throw new Error(`District not found: ${district}`);
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=Asia/Kolkata&forecast_days=14`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch weather data');
    }

    return await response.json();
};

// Map weather codes to conditions
const getWeatherCondition = (code) => {
    const conditions = {
        0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Foggy',
        51: 'Light Drizzle', 53: 'Drizzle', 55: 'Dense Drizzle',
        61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
        71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
        80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm'
    };
    return conditions[code] || 'Unknown';
};

// Get weather icon
const getWeatherIcon = (code, isDay = true) => {
    if (code === 0 || code === 1) return isDay ? '☀️' : '🌙';
    if (code === 2 || code === 3) return '☁️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 55) return '🌦️';
    if (code >= 61 && code <= 65) return '🌧️';
    if (code >= 71 && code <= 75) return '❄️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 95) return '⛈️';
    return '🌤️';
};

// Generate alerts based on forecast data
const generateAlertsFromForecast = async (userId, district, forecastData) => {
    const alerts = [];
    const daily = forecastData.daily;
    const today = new Date();

    // Check for various weather conditions
    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const tempMax = daily.temperature_2m_max[i];
        const tempMin = daily.temperature_2m_min[i];
        const precipitation = daily.precipitation_sum[i];
        const rainProb = daily.precipitation_probability_max[i];
        const windSpeed = daily.wind_speed_10m_max[i];
        const weatherCode = daily.weather_code[i];

        // Rain Alert (probability > 60%)
        if (rainProb > 60 && precipitation > 0) {
            alerts.push({
                user: userId,
                district,
                alertType: 'rain',
                severity: precipitation > 20 ? 'warning' : 'info',
                title: precipitation > 20 ? 'Heavy Rain Expected' : 'Rain Expected',
                message: `Rain expected on ${date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} with ${rainProb}% probability. Expected rainfall: ${precipitation.toFixed(1)}mm.`,
                recommendation: precipitation > 20
                    ? 'Delay irrigation. Prepare drainage channels. Protect harvested crops.'
                    : 'Plan field activities accordingly. Consider delaying irrigation.',
                forecastDate: date,
                expiresAt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
                weatherData: { precipitation, rainProbability: rainProb, temperature: tempMax }
            });
        }

        // Heavy Rain / Flood Warning (precipitation > 50mm)
        if (precipitation > 50) {
            alerts.push({
                user: userId,
                district,
                alertType: 'flood',
                severity: 'critical',
                title: '⚠️ Flood Warning',
                message: `Heavy rainfall of ${precipitation.toFixed(1)}mm expected on ${date.toLocaleDateString('en-IN')}. Potential flooding risk.`,
                recommendation: 'Move livestock to higher ground. Secure equipment. Avoid low-lying areas. Store harvested crops safely.',
                forecastDate: date,
                expiresAt: new Date(date.getTime() + 48 * 60 * 60 * 1000),
                weatherData: { precipitation, rainProbability: rainProb }
            });
        }

        // Heatwave Warning (temp > 40°C)
        if (tempMax > 40) {
            alerts.push({
                user: userId,
                district,
                alertType: 'heatwave',
                severity: tempMax > 45 ? 'critical' : 'warning',
                title: '🔥 Heatwave Alert',
                message: `High temperature of ${tempMax}°C expected on ${date.toLocaleDateString('en-IN')}.`,
                recommendation: 'Increase irrigation frequency. Provide shade for livestock. Avoid field work during peak hours (11 AM - 4 PM).',
                forecastDate: date,
                expiresAt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
                weatherData: { temperature: tempMax }
            });
        }

        // Strong Wind Alert (> 50 km/h)
        if (windSpeed > 50) {
            alerts.push({
                user: userId,
                district,
                alertType: 'wind',
                severity: windSpeed > 70 ? 'critical' : 'warning',
                title: '💨 Strong Wind Alert',
                message: `Strong winds of ${windSpeed.toFixed(0)} km/h expected on ${date.toLocaleDateString('en-IN')}.`,
                recommendation: 'Secure loose equipment and structures. Stake tall crops. Avoid spraying pesticides.',
                forecastDate: date,
                expiresAt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
                weatherData: { windSpeed }
            });
        }
    }

    // Drought Alert (check for 7+ consecutive days without rain)
    let consecutiveDryDays = 0;
    for (let i = 0; i < daily.time.length; i++) {
        if (daily.precipitation_sum[i] < 1) {
            consecutiveDryDays++;
        } else {
            if (consecutiveDryDays >= 7) {
                alerts.push({
                    user: userId,
                    district,
                    alertType: 'drought',
                    severity: consecutiveDryDays >= 10 ? 'critical' : 'warning',
                    title: '🏜️ Drought Alert',
                    message: `No significant rainfall expected for ${consecutiveDryDays} consecutive days.`,
                    recommendation: 'Implement water conservation. Use drip irrigation. Mulch crops to retain moisture. Consider drought-resistant varieties.',
                    forecastDate: new Date(daily.time[i - consecutiveDryDays]),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    weatherData: { precipitation: 0 }
                });
            }
            consecutiveDryDays = 0;
        }
    }

    // Check if we ended with a drought condition
    if (consecutiveDryDays >= 7) {
        alerts.push({
            user: userId,
            district,
            alertType: 'drought',
            severity: consecutiveDryDays >= 10 ? 'critical' : 'warning',
            title: '🏜️ Drought Alert',
            message: `No significant rainfall expected for ${consecutiveDryDays} consecutive days in the forecast period.`,
            recommendation: 'Implement water conservation. Use drip irrigation. Mulch crops to retain moisture.',
            forecastDate: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            weatherData: { precipitation: 0 }
        });
    }

    return alerts;
};

// @desc    Get current weather data
// @route   GET /api/weather
// @access  Private
exports.getWeatherData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const district = user.location || 'Chennai';

        const weatherData = await fetchWeatherFromAPI(district);

        const current = weatherData.current;
        const daily = weatherData.daily;

        res.json({
            success: true,
            data: {
                current: {
                    temperature: Math.round(current.temperature_2m),
                    humidity: current.relative_humidity_2m,
                    windSpeed: current.wind_speed_10m,
                    condition: getWeatherCondition(current.weather_code),
                    icon: getWeatherIcon(current.weather_code),
                    weatherCode: current.weather_code
                },
                location: district,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching weather:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weather data'
        });
    }
};

// @desc    Get 14-day weather forecast
// @route   GET /api/weather/forecast
// @access  Private
exports.getWeatherForecast = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const district = user.location || 'Chennai';

        const weatherData = await fetchWeatherFromAPI(district);
        const daily = weatherData.daily;

        const forecast = daily.time.map((date, index) => ({
            date,
            dayName: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
            tempMax: Math.round(daily.temperature_2m_max[index]),
            tempMin: Math.round(daily.temperature_2m_min[index]),
            precipitation: daily.precipitation_sum[index],
            rainProbability: daily.precipitation_probability_max[index],
            windSpeed: Math.round(daily.wind_speed_10m_max[index]),
            condition: getWeatherCondition(daily.weather_code[index]),
            icon: getWeatherIcon(daily.weather_code[index])
        }));

        res.json({
            success: true,
            data: {
                forecast,
                location: district,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching forecast:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch forecast data'
        });
    }
};

// @desc    Get weather alerts for user
// @route   GET /api/weather/alerts
// @access  Private
exports.getWeatherAlerts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const district = user.location || 'Chennai';

        // Get existing alerts
        let alerts = await WeatherAlert.find({
            user: req.user.id,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        // If no alerts or alerts are old, refresh them
        const lastAlert = alerts[0];
        const shouldRefresh = !lastAlert ||
            (new Date() - new Date(lastAlert.createdAt)) > 24 * 60 * 60 * 1000;

        if (shouldRefresh) {
            // Fetch new forecast and generate alerts
            const weatherData = await fetchWeatherFromAPI(district);
            const newAlerts = await generateAlertsFromForecast(req.user.id, district, weatherData);

            // Remove old alerts for this user
            await WeatherAlert.deleteMany({ user: req.user.id });

            // Save new alerts
            if (newAlerts.length > 0) {
                await WeatherAlert.insertMany(newAlerts);
            }

            alerts = await WeatherAlert.find({
                user: req.user.id,
                expiresAt: { $gt: new Date() }
            }).sort({ createdAt: -1 });
        }

        const unreadCount = await WeatherAlert.getUnreadCount(req.user.id);

        res.json({
            success: true,
            data: {
                alerts,
                unreadCount,
                location: district,
                lastUpdated: lastAlert ? lastAlert.createdAt : new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weather alerts'
        });
    }
};

// @desc    Mark alert as read
// @route   PATCH /api/weather/alerts/:id/read
// @access  Private
exports.markAlertAsRead = async (req, res) => {
    try {
        const alert = await WeatherAlert.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error marking alert as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update alert'
        });
    }
};

// @desc    Refresh weather alerts
// @route   POST /api/weather/alerts/refresh
// @access  Private
exports.refreshAlerts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const district = user.location || 'Chennai';

        // Fetch new forecast
        const weatherData = await fetchWeatherFromAPI(district);
        const newAlerts = await generateAlertsFromForecast(req.user.id, district, weatherData);

        // Remove old alerts
        await WeatherAlert.deleteMany({ user: req.user.id });

        // Save new alerts
        if (newAlerts.length > 0) {
            await WeatherAlert.insertMany(newAlerts);
        }

        const alerts = await WeatherAlert.find({
            user: req.user.id,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        const unreadCount = await WeatherAlert.getUnreadCount(req.user.id);

        res.json({
            success: true,
            message: 'Alerts refreshed successfully',
            data: {
                alerts,
                unreadCount,
                location: district,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error refreshing alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh alerts'
        });
    }
};

// @desc    Mark all alerts as read
// @route   POST /api/weather/alerts/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await WeatherAlert.markAllAsRead(req.user.id);

        res.json({
            success: true,
            message: 'All alerts marked as read'
        });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all alerts as read'
        });
    }
};
