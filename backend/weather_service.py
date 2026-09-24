'''
Module for the weather api

Order of preference:
1. OpenWeatherMap, if OPENWEATHER_API_KEY is set in the environment
2. Open-Meteo (free, no key needed)
3. A fixed "hot, dry, offshore wind" sample so the demo still works offline
'''
import os

import requests

OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', '')

# Used when no weather API is reachable. Roughly a Santa Ana day: hot, dry, wind from the north-east.
DEMO_WEATHER = {
    "temperature": 31.0,
    "humidity": 17,
    "wind_speed": 11.0,
    "wind_direction": 45,
    "source": "demo",
}


def _openweather(latitude: float, longitude: float):
    url = 'https://api.openweathermap.org/data/2.5/weather'
    params = {'lat': latitude, 'lon': longitude, 'appid': OPENWEATHER_API_KEY, 'units': 'metric'}
    response = requests.get(url, params=params, timeout=5)
    response.raise_for_status()
    data = response.json()
    return {
        "temperature": data.get('main', {}).get('temp'),
        "humidity": data.get('main', {}).get('humidity'),
        "wind_speed": data.get('wind', {}).get('speed'),
        "wind_direction": data.get('wind', {}).get('deg'),
        "source": "openweathermap",
    }


def _open_meteo(latitude: float, longitude: float):
    url = 'https://api.open-meteo.com/v1/forecast'
    params = {
        'latitude': latitude,
        'longitude': longitude,
        'current': 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m',
        'wind_speed_unit': 'ms',
    }
    response = requests.get(url, params=params, timeout=5)
    response.raise_for_status()
    current = response.json()['current']
    return {
        "temperature": current['temperature_2m'],
        "humidity": current['relative_humidity_2m'],
        "wind_speed": current['wind_speed_10m'],
        "wind_direction": current['wind_direction_10m'],
        "source": "open-meteo",
    }


def get_weather(latitude: float, longitude: float):
    '''
    Get the weather details for the given latitude and longitude.
    Never returns None: falls back to DEMO_WEATHER if every provider fails.
    '''
    providers = [_openweather, _open_meteo] if OPENWEATHER_API_KEY else [_open_meteo]
    for provider in providers:
        try:
            weather = provider(latitude, longitude)
            if weather['wind_direction'] is None:
                weather['wind_direction'] = 0
            return weather
        except Exception as err:  # network error, bad key, unexpected payload...
            print(f"{provider.__name__} failed: {err}")
    return dict(DEMO_WEATHER)


def get_scale_factor(weather_data: dict):
    '''
    Get the scale factor (fire size, in degrees) based on the weather data.
    Hotter, drier and windier conditions make a bigger fire.
    '''
    scale_factor = 0.005
    if weather_data:
        temperature = weather_data.get('temperature') or 0
        humidity = weather_data.get('humidity') or 0
        wind_speed = weather_data.get('wind_speed') or 0

        if temperature >= 30:
            scale_factor += 0.02
        elif temperature >= 20:
            scale_factor += 0.01
        # (the hackathon version had these two the wrong way round)
        if humidity < 20:
            scale_factor += 0.02
        elif humidity < 30:
            scale_factor += 0.01
        if wind_speed > 20:
            scale_factor += 0.02
        elif wind_speed >= 10:
            scale_factor += 0.01
    return scale_factor


if __name__ == '__main__':
    weather_data = get_weather(37.7749, -122.4194)
    print(weather_data)
    print(f"Scale factor: {get_scale_factor(weather_data)}")
