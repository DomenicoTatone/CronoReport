// utils.js

// Funzioni di formattazione
function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${padZero(hrs)}h ${padZero(mins)}m ${padZero(secs)}s`;
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}
