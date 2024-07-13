const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');


let audio = new Audio();
let songs = [];
let lastSong = 0;


// Select folder button click handler
document.getElementById('selectFolder').addEventListener('click', () => {
    ipcRenderer.send('select-folder');
});

// Handle selected folder path from main process
ipcRenderer.on('selected-folder', (event, folderPath) => {
    console.log('Selected folder path:', folderPath);
    document.getElementById('folderText').textContent = 'Folder selected';
    document.getElementById('selectFolder').style.display = 'none';
    document.getElementById('controls').style.display = 'block'; // Show controls
    listSongs(folderPath);
});

// Function to list songs in a folder
function listSongs(folderPath) {
    const songsList = document.getElementById('songsList');
    songsList.innerHTML = '';

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }

        const audioFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ext === '.mp3' || ext === '.wav' || ext === '.ogg';
        });

        songs = audioFiles;

        audioFiles.forEach(file => {
            const button = document.createElement('button');
            button.textContent = file;
            button.addEventListener('click', () => {
                playSong(folderPath, file);
               
               
            });
            songsList.appendChild(button);
        });
    });
}

async function getAlbumCover(filePath) {
    const buffer = fs.readFileSync(filePath);
    
    // Look for the ID3 tag (the first three bytes)
    if (buffer.toString('utf8', 0, 3) !== 'ID3') {
        var err = document.getElementById('error')
        err.textContent = 'Unable to find ID3 tag!'
        return;
    }

    // Find the album cover (APIC frame)
    const APIC = 'APIC';
    let pos = 10; // Start after the ID3 header

    while (pos < buffer.length) {
        const frameID = buffer.toString('utf8', pos, pos + 4);
        const frameSize = buffer.readUInt32BE(pos + 4);

        if (frameID === APIC) {
            const pictureType = buffer[pos + 8]; // 8 bytes for frame header
            const mimeType = buffer.toString('utf8', pos + 9, pos + 13).trim();
            const imageData = buffer.slice(pos + 13 + 1, pos + 13 + 1 + frameSize);

            // Save the image
            fs.writeFileSync('album-cover.' + mimeType.split('/')[1], imageData);
            console.log('Album cover extracted and saved.');
            return;
        }

        // Move to the next frame
        pos += 10 + frameSize; // Frame header size (10) + frame size
    }

    var err = document.getElementById('error')
    err.textContent = 'No album cover!'
    var img = document.getElementById('albumCoverImg')
    img.src = "./cover.png"

}

// Function to play a song
async function playSong(folderPath, songName) {
    //getAlbumCover(folderPath + "/" + songName)

    const songNameDisplay = document.getElementById('songName');
    songNameDisplay.textContent = songName;

    audio.pause();
    audio.src = `file://${path.join(folderPath, songName)}`;

    audio.play().then(() => {
        console.log(`Playing song: ${songName}`);
    }).catch(error => {
        console.error('Error playing audio:', error);
    });

    audio.onended = () => {
        playRandomSong(folderPath);
    };

    audio.addEventListener('loadedmetadata', () => {
        document.getElementById('progressBar').max = audio.duration; // Set max value
    });

    audio.ontimeupdate = () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        document.getElementById('progressBar').value = progress;
        updateIndicator(progress);
        updateTimeDisplay()
    };

    audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progress; 
        progressBall.style.left = `${progress}%`;
    });
    
    const volumeSlider = document.getElementById('volumeSlider');
    audio.volume = volumeSlider.value;
    
    volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value;
    });
    
    document.getElementById('nextButton').addEventListener('click', () => {
        playRandomSong(folderPath);
    });

    
   


           
    
}



// Function to play a random song
function playRandomSong(folderPath) {
    if (songs.length > 0) {
        const randomIndex = Math.floor(Math.random() * songs.length);
        playSong(folderPath, songs[randomIndex]);
    }
}

// Function to update the progress indicator
function updateIndicator(progress) {
    const progressBar = document.getElementById('progressBar');
    const progressIndicator = document.getElementById('progressIndicator');
    const width = progressBar.clientWidth;
    const left = (progress / 100) * width;
    progressIndicator.style.left = `${left - (progressIndicator.clientWidth / 2)}px`;
}

// Pause/Play button
document.getElementById('pauseButton').addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        document.getElementById('pauseButton').textContent = 'Pause';
    } else {
        audio.pause();
        document.getElementById('pauseButton').textContent = 'Play';
    }
});

// Next button
document.getElementById('nextButton').addEventListener('click', () => {
    playRandomSong(path.dirname(audio.src));
});




// Update the time display
function updateTimeDisplay() {
    const timeDisplay = document.getElementById('timeDisplay');
    const minutes = Math.floor(audio.currentTime / 60);
    const seconds = Math.floor(audio.currentTime % 60);
    timeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Seek using the progress bar
document.getElementById('progressBar').addEventListener('input', (event) => {
    const percent = event.target.value;
    audio.currentTime = (percent / 100) * audio.duration;
});


