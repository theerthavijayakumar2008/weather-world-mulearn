const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const currentCard = document.getElementById("currentCard");
const forecastCard = document.getElementById("forecastCard");

function getWeatherInfo(code) {
  if (code === 0) return ["☀️", "Clear sky"];
  if (code <= 2) return ["🌤️", "Partly cloudy"];
  if (code === 3) return ["☁️", "Overcast"];

  if ([45, 48].includes(code)) {
    return ["🌫️", "Fog"];
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return ["🌦️", "Drizzle"];
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return ["🌧️", "Rain"];
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return ["❄️", "Snow"];
  }

  if ([95, 96, 99].includes(code)) {
    return ["⛈️", "Thunderstorm"];
  }

  return ["🌡️", "Weather unavailable"];
}

async function getJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather service request failed. Try again.");
  }

  return await response.json();
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

async function searchWeather(city) {
  loading.hidden = false;
  errorBox.hidden = true;
  currentCard.hidden = true;
  forecastCard.hidden = true;
  searchButton.disabled = true;

  try {
    // Step 1: Find the city coordinates
    const geoURL =
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(city) +
      "&count=1&language=en&format=json";

    const geoData = await getJSON(geoURL);

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Please check the spelling.");
    }

    const place = geoData.results[0];

    // Step 2: Fetch current weather and six calendar days
    const weatherURL =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + place.latitude +
      "&longitude=" + place.longitude +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&timezone=auto&forecast_days=6";

    const data = await getJSON(weatherURL);

    if (
      !data.current ||
      !data.daily ||
      !data.daily.time ||
      data.daily.time.length < 6
    ) {
      throw new Error("Weather data is incomplete. Please try again.");
    }

    // Step 3: Display current weather
    document.getElementById("cityName").textContent =
      place.name + (place.country ? ", " + place.country : "");

    document.getElementById("todayDate").textContent =
      new Date(data.current.time).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long"
      });

    const currentInfo = getWeatherInfo(data.current.weather_code);

    document.getElementById("weatherIcon").textContent =
      currentInfo[0];

    document.getElementById("temperature").textContent =
      Math.round(data.current.temperature_2m) + "°C";

    document.getElementById("condition").textContent =
      currentInfo[1];

    document.getElementById("humidity").textContent =
      data.current.relative_humidity_2m + "%";

    document.getElementById("wind").textContent =
      data.current.wind_speed_10m + " km/h";

    document.getElementById("feelsLike").textContent =
      Math.round(data.current.apparent_temperature) + "°C";

    currentCard.hidden = false;

    // Step 4: Display the next five days, excluding today
    const forecast = document.getElementById("forecast");
    forecast.replaceChildren();

    for (let i = 1; i <= 5; i++) {
      const info = getWeatherInfo(data.daily.weather_code[i]);

      const day = document.createElement("div");
      day.className = "day";

      const date = new Date(data.daily.time[i] + "T12:00:00");

      const dateLabel = document.createElement("strong");
      dateLabel.textContent = date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric"
      });

      const icon = document.createElement("div");
      icon.className = "day-icon";
      icon.textContent = info[0];

      const condition = document.createElement("div");
      condition.textContent = info[1];

      const temperatures = document.createElement("p");
      temperatures.textContent =
        Math.round(data.daily.temperature_2m_max[i]) + "° / " +
        Math.round(data.daily.temperature_2m_min[i]) + "°";

      day.append(dateLabel, icon, condition, temperatures);
      forecast.appendChild(day);
    }

    forecastCard.hidden = false;

  } catch (err) {
    if (err instanceof TypeError) {
      showError(
        "Network error. Check your internet connection and try again."
      );
    } else {
      showError(
        err.message || "Something went wrong. Please try again."
      );
    }
  } finally {
    loading.hidden = true;
    searchButton.disabled = false;
  }
}

// Step 5: Handle city search
form.addEventListener("submit", function(event) {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  searchWeather(city);
});

// Load default city on startup
searchWeather("Kochi");
