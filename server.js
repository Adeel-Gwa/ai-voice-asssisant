require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');
const { OpenAI } = require('openai');
const sanitize = require('sanitize-filename');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' })); // Update '*' to your domain in production
app.use(bodyParser.json());

// OpenAI API Setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Language setting
let defaultLanguage = 'en-US'; // Default language is English
let currentSong = null; // Track the currently playing song
let isPlaying = false; // Track if a song is currently playing

// Open YouTube
app.post('/api/open-youtube', (req, res) => {
    const { query } = req.body;
    const searchQuery = query ? encodeURIComponent(query) : '';
    const url = searchQuery ? `https://www.youtube.com/results?search_query=${searchQuery}` : 'https://www.youtube.com';
    const platform = process.platform;
    const command =
        platform === 'win32' ? `powershell -Command "Start-Process '${url}'"` :
        platform === 'darwin' ? `open "${url}"` :
        `xdg-open "${url}"`;
    exec(command, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to open YouTube.' });
        }
        res.json({ message: searchQuery ? `Searching YouTube for: ${query}` : 'YouTube opened successfully!' });
    });
});

// Open Google
app.post('/api/open-google', (req, res) => {
    const { query } = req.body;
    const searchQuery = query ? encodeURIComponent(query) : '';
    const url = searchQuery ? `https://www.google.com/search?q=${searchQuery}` : 'https://www.google.com';
    const platform = process.platform;
    const command =
        platform === 'win32' ? `powershell -Command "Start-Process '${url}'"` :
        platform === 'darwin' ? `open "${url}"` :
        `xdg-open "${url}"`;
    exec(command, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to open Google.' });
        }
        res.json({ message: searchQuery ? `Searching Google for: ${query}` : 'Google opened successfully!' });
    });
});

// Open News Channel
app.post('/api/open-news', (req, res) => {
    const url = 'https://www.youtube.com/watch?v=O3DPVlynUM0&ab_channel=GeoNews'; // Change to your preferred news channel
    const platform = process.platform;
    const command =
        platform === 'win32' ? `powershell -Command "Start-Process '${url}'"` :
        platform === 'darwin' ? `open "${url}"` :
        `xdg-open "${url}"`;
    exec(command, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to open news channel.' });
        }
        res.json({ message: 'News channel opened successfully!' });
    });
});

// Play a Song from Local File System
app.post('/api/play-song', (req, res) => {
    const { songName } = req.body;
    if (!songName) return res.status(400).json({ error: 'Song name is required.' });
    const musicDir = 'C:/Users/adeel/Downloads'; // Change to your music directory
    const sanitizedSongName = sanitize(songName);
    fs.readdir(musicDir, (err, files) => {
        if (err) {
            console.error('Error accessing music directory:', err);
            return res.status(500).json({ error: 'Unable to access music directory.' });
        }
        const song = files.find((file) => file.toLowerCase().includes(sanitizedSongName.toLowerCase()));
        if (song) {
            const songPath = `${musicDir}/${song}`;
            const platform = process.platform;
            // If a song is already playing, stop it before starting a new one
            if (currentSong && isPlaying) {
                exec(`taskkill /IM "your_music_player.exe"`, (err) => { // Replace with your music player's executable name
                    if (err) {
                        console.error('Error stopping the current song:', err);
                    }
                });
            }
            // Play the new song
            const command =
                platform === 'win32' ? `powershell -Command "Start-Process '${songPath}'"` :
                platform === 'darwin' ? `open "${songPath}"` :
                `xdg-open "${songPath}"`;
            exec(command, (err) => {
                if (err) {
                    console.error('Error playing song:', err);
                    return res.status(500).json({ error: 'Unable to play the song.' });
                }
                currentSong = song; // Update the currently playing song
                isPlaying = true; // Mark as playing
                res.json({ message: `Playing: ${song}` });
            });
        } else {
            res.status(404).json({ error: 'Song not found.' });
        }
    });
});

// Pause the currently playing song
app.post('/api/pause-song', (req, res) => {
    if (!isPlaying) return res.status(400).json({ error: 'No song is currently playing.' });
    exec(`taskkill /IM "your_music_player.exe"`, (err) => { // Replace with your music player's executable name
        if (err) {
            console.error('Error pausing the song:', err);
            return res.status(500).json({ error: 'Unable to pause the song.' });
        }
        isPlaying = false; // Mark as not playing
        res.json({ message: `Paused: ${currentSong}` });
    });
});

// Open WhatsApp
app.post('/api/open-whatsapp', (req, res) => {
    const url = 'https://web.whatsapp.com/';
    exec(`start ${url}`, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to open WhatsApp.' });
        }
        res.json({ message: 'WhatsApp opened successfully!' });
    });
});

// Open Calculator
app.post('/api/open-calculator', (req, res) => {
    const platform = process.platform;
    const command =
        platform === 'win32' ? 'calc' :
        platform === 'darwin' ? 'open -a Calculator' :
        'gnome-calculator'; // Adjust for Linux
    exec(command, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to open Calculator.' });
        }
        res.json({ message: 'Calculator opened successfully!' });
    });
});

// Open This PC
app.post('/api/open-this-pc', (req, res) => {
    const platform = process.platform;
    const command =
        platform === 'win32' ? 'explorer' :
        platform === 'darwin' ? 'open ./' : // Modify for Mac
        'xdg-open .'; // Modify for Linux
    exec(command, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to open This PC.' });
        }
        res.json({ message: 'This PC opened successfully!' });
    });
});

// OpenAI Chat Completion
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    // Check for language setting in the message
    if (message.toLowerCase().includes('speak in')) {
        const lang = message.split('speak in')[1].trim().toLowerCase();
        switch (lang) {
            case 'spanish':
                defaultLanguage = 'es-ES';
                break;
            case 'french':
                defaultLanguage = 'fr-FR';
                break;
            case 'german':
                defaultLanguage = 'de-DE';
                break;
            default:
                defaultLanguage = 'en-US'; // Default to English
        }
        return res.json({ response: `Language set to ${lang}.` });
    }
    // Validate input message
    if (!message || typeof message !== 'string' || message.length > 1000) {
        return res.status(400).json({ error: 'Invalid input message.' });
    }
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: message }],
            user: { language: defaultLanguage } // Add language context
        });
        // Respond with the assistant's message
        res.json({ response: completion.choices[0].message.content });
    } catch (error) {
        console.error('Error with OpenAI API:', error);
        res.status(500).json({ error: 'Error fetching response from OpenAI.' });
    }
});

// Shutdown System
app.post('/api/shutdown', (req, res) => {
    const platform = process.platform;
    const command =
        platform === 'win32' ? 'shutdown /s /t 0' : // Windows
        platform === 'darwin' ? 'osascript -e "tell application \\"System Events\\" to shut down"' : // macOS
        'shutdown now'; // Linux
    exec(command, (err) => {
        if (err) {
            console.error('Error shutting down the system:', err);
            return res.status(500).json({ error: 'Unable to shut down the system.' });
        }
        res.json({ message: 'System is shutting down.' });
    });
});

// Sleep System
app.post('/api/sleep', (req, res) => {
    const platform = process.platform;
    const command =
        platform === 'win32' ? 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0' : // Windows
        platform === 'darwin' ? 'osascript -e "tell application \\"System Events\\" to sleep"' : // macOS
        'systemctl suspend'; // Linux
    exec(command, (err) => {
        if (err) {
            console.error('Error putting the system to sleep:', err);
            return res.status(500).json({ error: 'Unable to put the system to sleep.' });
        }
        res.json({ message: 'System is going to sleep.' });
    });
});

// Open ChatGPT
app.post('/api/open-chatgpt', (req, res) => {
    const url = 'https://chat.openai.com/'; // URL for ChatGPT
    const platform = process.platform;
    const command =
        platform === 'win32' ? `powershell -Command "Start-Process '${url}'"` :
        platform === 'darwin' ? `open "${url}"` :
        `xdg-open "${url}"`;
    exec(command, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to open ChatGPT.' });
        }
        res.json({ message: 'ChatGPT opened successfully!' });
    });
});

// Sign Out (Shutdown)
app.post('/api/signout', (req, res) => {
    const response = 'Signing out and shutting down the system.';
    exec('shutdown /s /t 0', (err) => {
        if (err) {
            console.error('Error during shutdown:', err);
            return res.status(500).json({ error: 'Unable to sign out and shut down the system.' });
        }
        res.json({ message: response });
    });
});

// Default Route
app.get('/', (req, res) => {
    res.send('Node.js backend for AI Voice Assistant is running!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});