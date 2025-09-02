// DOM Elements
const downloadBtn = document.getElementById('downloadBtn');
const downloadModal = document.getElementById('downloadModal');
const closeModal = document.getElementById('closeModal');
const manualDownload = document.getElementById('manualDownload');

// Download URL
const DOWNLOAD_URL = 'https://hypecc.store/Inertia.exe';

// Download functionality
function initiateDownload() {
    downloadModal.style.display = 'block';
    
    // Start download automatically
    setTimeout(() => {
        const link = document.createElement('a');
        link.href = DOWNLOAD_URL;
        link.download = 'Inertia.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 500);
}

// Close modal functionality
function closeDownloadModal() {
    downloadModal.style.display = 'none';
}

// Event Listeners
downloadBtn.addEventListener('click', initiateDownload);
closeModal.addEventListener('click', closeDownloadModal);
manualDownload.addEventListener('click', () => {
    window.open(DOWNLOAD_URL, '_blank');
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === downloadModal) {
        closeDownloadModal();
    }
});

// Keyboard shortcut to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && downloadModal.style.display === 'block') {
        closeDownloadModal();
    }
});
