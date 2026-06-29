import requests

try:
    response = requests.get('http://localhost:5000/api/v1/data/?page=1&per_page=5')
    print('Status:', response.status_code)
    print('Response:', response.json())
except Exception as e:
    print('Error:', e)
