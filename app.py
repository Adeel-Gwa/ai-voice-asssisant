import os
import subprocess
import json
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import openai
import glob

load_dotenv()

app = Flask(__name__)

# OpenAI API Key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Language setting
default_language = 'en-US'  # Default language is English
current_song = None  # Track the currently playing song
is_playing = False  # Track if a song is currently playing

# Open YouTube
@app.route('/api/open-youtube', methods=['POST'])
def open_youtube():
    query = request.json.get('query', '')
    search_query = query if query else ''
    url = f"https://www.youtube.com/results?search_query={search_query}" if search_query else "https://www.youtube.com"
    
    platform = os.name
    command = {
        'nt': f'powershell -Command "Start-Process \'{url}\'"',  # Windows
        'posix': f'open "{url}"' if os.uname().sysname == 'Darwin' else f'xdg-open "{url}"'  # macOS or Linux
    }.get(platform)

    try:
        subprocess.Popen(command, shell=True)
        return jsonify(message=f"Searching YouTube for: {query}" if search_query else "YouTube opened successfully!")
    except Exception as e:
        return jsonify(error='Unable to open YouTube.'), 500

# Open Google
@app.route('/api/open-google', methods=['POST'])
def open_google():
    query = request.json.get('query', '')
    search_query = query if query else ''
    url = f"https://www.google.com/search?q={search_query}" if search_query else "https://www.google.com"
    
    platform = os.name
    command = {
        'nt': f'powershell -Command "Start-Process \'{url}\'"',  # Windows
        'posix': f'open "{url}"' if os.uname().sysname == 'Darwin' else f'xdg-open "{url}"'  # macOS or Linux
    }.get(platform)

    try:
        subprocess.Popen(command, shell=True)
        return jsonify(message=f"Searching Google for: {query}" if search_query else "Google opened successfully!")
    except Exception as e:
        return jsonify(error='Unable to open Google.'), 500

# Open News Channel
@app.route('/api/open-news', methods=['POST'])
def open_news():
    url = 'https://www.youtube.com/watch?v=O3DPVlynUM0&ab_channel=GeoNews'  # Change to your preferred news channel
    platform = os.name
    command = {
        'nt': f'powershell -Command "Start-Process \'{url}\'"',  # Windows
        'posix': f'open "{url}"' if os.uname().sysname == 'Darwin' else f'xdg-open "{url}"'  # macOS or Linux
    }.get(platform)

    try:
        subprocess.Popen(command, shell=True)
        return jsonify(message='News channel opened successfully!')
    except Exception as e:
        return jsonify(error='Unable to open news channel.'), 500

# Play a Song from Local File System
@app.route('/api/play-song', methods=['POST'])
def play_song():
    global current_song, is_playing
    song_name = request.json.get('songName', None)
    if not song_name:
        return jsonify(error='Song name is required.'), 400

    music_dir = 'C:/Users/adeel/Downloads'  # Change to your music directory
    song_path = os.path.join(music_dir, song_name)

    # Use glob to find the song in the directory
    song_files = glob.glob(os.path.join(music_dir, '*'))
    song = next((f for f in song_files if song_name.lower() in os.path.basename(f).lower()), None)

    if song:
        if current_song and is_playing:
            subprocess.Popen(['taskkill', '/F', '/IM', 'your_music_player.exe'])  # Replace with your music player's executable name

        platform = os.name
        command = {
            'nt': f'start "{song}"',  # Windows
            'posix': f'open "{song}"' if os.uname().sysname == 'Darwin' else f'xdg-open "{song}"'  # macOS or Linux
        }.get(platform)

        try:
            subprocess.Popen(command, shell=True)
            current_song = song
            is_playing = True
            return jsonify(message=f'Playing: {os.path.basename(song)}')
        except Exception as e:
            return jsonify(error='Unable to play the song.'), 500
    else:
        return jsonify(error='Song not found.'), 404

# Pause the currently playing song
@app.route('/api/pause-song', methods=['POST'])
def pause_song():
    global is_playing
    if not is_playing:
        return jsonify(error='No song is currently playing.'), 400

    try:
        subprocess.Popen(['taskkill', '/F', '/IM', 'your_music_player.exe'])  # Replace with your music player's executable name
        is_playing = False
        return jsonify(message=f'Paused: {current_song}')
    except Exception as e:
        return jsonify(error='Unable to pause the song.'), 500

# Open WhatsApp
@app.route('/api/open-whatsapp', methods=['POST'])
def open_whatsapp():
    url = 'https://web.whatsapp.com/'
    try:
        subprocess.Popen(['start', url], shell=True)  # For Windows
        return jsonify(message='WhatsApp opened successfully!')
    except Exception as e:
        return jsonify(error='Unable to open WhatsApp.'), 500

# Open Calculator
@app.route('/api/open-calculator', methods=['POST'])
def open_calculator():
    platform = os.name
    command = {
        'nt': 'calc',  # Windows
        'posix': 'open -a Calculator' if os.uname().sysname == 'Darwin' else 'gnome-calculator'  # macOS or Linux
    }.get(platform)

    try:
        subprocess.Popen(command, shell=True)
        return jsonify(message='Calculator opened successfully!')
    except Exception as e:
        return jsonify(error='Unable to open Calculator.'), 500

# Open This PC
@app.route('/api/open-this-pc', methods=['POST'])
def open_this_pc():
    platform = os.name
    command = {
        'nt': 'explorer',  # Windows
        'posix': 'open ./' if os.uname().sysname == 'Darwin' else 'xdg-open .'  # macOS or Linux
    }.get(platform)

    try:
        subprocess.Popen(command, shell=True)
        return jsonify(message='This PC opened successfully!')
    except Exception as e:
        return jsonify(error='Unable to open This PC.'), 500

# OpenAI Chat Completion
@app.route('/api/chat', methods=['POST'])
def chat():
    global default_language
    message = request.json.get('message', '')

    # Check for language setting in the message
    if 'speak in' in message.lower():
        lang = message.split('speak in')[1].strip().lower()
        if lang in ['spanish', 'french', 'german']:
            default_language = 'es-ES' if lang == 'spanish' else 'fr-FR' if lang == 'french' else 'de-DE'
            return jsonify(response=f'Language set to {lang}.')
        else:
            default_language = 'en-US'  # Default to English

    # Validate input message
    if not message or not isinstance(message, str) or len(message) > 1000:
        return jsonify(error='Invalid input message.'), 400

    try:
        completion = openai.ChatCompletion.create(
            model='gpt-3.5-turbo',
            messages=[{'role': 'user', 'content': message}],
        )
        return jsonify(response=completion.choices[0].message.content)
    except Exception as e:
        return jsonify(error='Error fetching response from OpenAI.'), 500

# Shutdown System
@app.route('/api/shutdown', methods=['POST'])
def shutdown():
    platform = os.name
    command = {
        'nt': 'shutdown /s /t 0',  # Windows
        'posix': 'osascript -e "tell application \\"System Events\\" to shut down"' if os.uname().sysname == 'Darwin' else 'shutdown now'  # macOS or Linux
    }.get(platform)

    try:
        subprocess.Popen(command, shell=True)
        return jsonify(message='System is shutting down.')
    except Exception as e:
        return jsonify(error='Unable to shut down the system.'), 500

# Sleep System
@app.route('/api/sleep', methods=['POST'])
def sleep():
    platform = os.name
    command = {
        'nt': 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0',  # Windows
        'posix': 'osascript -e "tell application \\"System Events\\" to sleep"' if os.uname().sysname == 'Darwin' else 'systemctl suspend'  # macOS or Linux
    }.get(platform)

    try:
        subprocess.Popen(command, shell=True)
        return jsonify(message='System is going to sleep.')
    except Exception as e:
        return jsonify(error='Unable to put the system to sleep.'), 500

# Open ChatGPT
@app.route('/api/open-chatgpt', methods=['POST'])
def open_chatgpt():
    url = 'https://chat.openai.com/'  # URL for ChatGPT
    platform = os.name
    command = {
        'nt': f'powershell -Command "Start-Process \'{url}\'"',  # Windows
        'posix': f'open "{url}"' if os.uname().sysname == 'Darwin' else f'xdg-open "{url}"'  # macOS or Linux
    }.get(platform)

    try:
        subprocess.Popen(command, shell=True)
        return jsonify(message='ChatGPT opened successfully!')
    except Exception as e:
        return jsonify(error='Unable to open ChatGPT.'), 500

# Default Route
@app.route('/', methods=['GET'])
def index():
    return "Flask backend for AI Voice Assistant is running!"

# Start Server
if __name__ == '__main__':
    app.run(port=3000)