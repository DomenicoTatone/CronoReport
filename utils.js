// utils.js

// Funzione per formattare la durata in ore, minuti e secondi
function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const hrsDisplay = hrs > 0 ? (hrs < 10 ? '0' + hrs : hrs) + 'h ' : '00h ';
    const minsDisplay = mins > 0 ? (mins < 10 ? '0' + mins : mins) + 'm ' : '00m ';
    const secsDisplay = secs > 0 ? (secs < 10 ? '0' + secs : secs) + 's' : '00s';

    return hrsDisplay + minsDisplay + secsDisplay;
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}

function formatTime(date) {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
    return date.toLocaleDateString('it-IT');
}

// Funzione per formattare la data e l'ora
function formatDateTime(timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}