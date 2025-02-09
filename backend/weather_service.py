
'''
Module for the weather api
'''
import requests

# Replace with the API key you copied from https://home.openweathermap.org/api_keys
API_KEY = '4a9e5b6157b3c619a8b67cfe0dccf9fe'

def get_weather(latitude:int , longitude:int):
    '''
    Get the weather details for the given latitude and longitude

    '''
    # Use HTTPS for the API URL
    url = f'https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={API_KEY}&units=metric'

    try:
        response = requests.get(url,timeout=5000)
        response.raise_for_status()  # This will raise an HTTPError for bad responses (like 401)
        data = response.json()

        # Extract weather details
        wind_speed = data.get('wind', {}).get('speed')
        wind_direction = data.get('wind', {}).get('deg')
        temperature = data.get('main', {}).get('temp')
        humidity = data.get('main', {}).get('humidity')

        return {
            "temperature": temperature,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "wind_direction": wind_direction
        }

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
    except Exception as err:
        print(f"An error occurred: {err}")

    return None

def get_scale_factor(weather_data: dict):
    '''
    Get the scale factor based on the weather data
    '''
    # Calculate the scale factor based on the weather data
    scale_factor = 0.005
    if weather_data:
        temperature = weather_data.get('temperature', 0)
        humidity = weather_data.get('humidity', 0)
        wind_speed = weather_data.get('wind_speed', 0)

        # Adjust the scale factor based on the weather conditions
        if temperature >= 30:
            scale_factor += 0.02
        elif temperature >= 20:
            scale_factor += 0.01
        if  humidity < 20:
            scale_factor += 0.01
        elif humidity < 30:
            scale_factor += 0.02
        if wind_speed > 20:
            scale_factor += 0.02
        elif wind_speed >= 10:
            scale_factor += 0.01
    return scale_factor

if __name__ == '__main__':
    # Test the weather API
    lat = 37.7749
    long = -122.4194
    weather_data = get_weather(lat, long)
    print(weather_data)

    # Test the scale factor
    sf = get_scale_factor(weather_data)
    print(f"Scale factor: {sf}")