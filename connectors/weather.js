export default {
  name: "weather",
  title: "Open-Meteo Weather",
  description: "Current weather and daily forecast for any coordinates (free, no key). Use geocode_search first to get coordinates.",
  baseUrl: "https://api.open-meteo.com",
  tools: [
    {
      name: "forecast",
      description: "Current conditions plus a daily forecast (max/min temperature, precipitation, weather code).",
      path: "/v1/forecast",
      query: {
        latitude: "{latitude}",
        longitude: "{longitude}",
        current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
        forecast_days: "{days}",
        timezone: "auto",
      },
      params: {
        latitude: { type: "number", required: true, minimum: -90, maximum: 90 },
        longitude: { type: "number", required: true, minimum: -180, maximum: 180 },
        days: { type: "integer", minimum: 1, maximum: 16, default: 3 },
      },
      fields: ["timezone", "current", "current_units", "daily", "daily_units"],
    },
  ],
};
