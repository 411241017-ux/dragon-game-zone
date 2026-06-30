const fs = require('fs');

const gameMap = {
    'mobilelegend.html': 1,
    'genshin.html': 2,
    'valorant.html': 3,
    'freefire.html': 4,
    'pubgmobile.html': 5,
    'lol.html': 6,
    'codm.html': 7,
    'apexlegend.html': 8,
    'steam.html': 9
};

for (const [file, id] of Object.entries(gameMap)) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        
        // Cek jika sudah pernah ditambahkan untuk menghindari duplikasi
        if (!content.includes('/api/game-status/')) {
            const injectCode = `
            // Cek status aktif game
            fetch('/api/game-status/${id}')
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success' && data.status_aktif === 0) {
                        const orderGrid = document.querySelector('.order-grid');
                        if (orderGrid) {
                            orderGrid.innerHTML = '<div style="text-align: center; padding: 50px; background: rgba(255, 0, 0, 0.1); border-radius: 10px; margin: 20px 0;"><h2 style="color: #ff2a3f;">⛔ Top Up Game Sedang Tutup ⛔</h2><p style="color: white; margin-top: 10px;">Mohon maaf, layanan top up untuk game ini sedang tidak tersedia saat ini.</p></div>';
                        }
                    }
                })
                .catch(err => console.error('Error fetching game status:', err));
`;
            
            // Cari lokasi untuk inject, tepat setelah DOMContentLoaded
            const targetStr = 'document.addEventListener("DOMContentLoaded", function () {';
            const parts = content.split(targetStr);
            if (parts.length === 2) {
                content = parts[0] + targetStr + injectCode + parts[1];
                fs.writeFileSync(file, content, 'utf-8');
                console.log(`Berhasil update ${file}`);
            } else {
                console.log(`Gagal menemukan titik injeksi di ${file}`);
            }
        } else {
            console.log(`File ${file} sudah memiliki kode game-status.`);
        }
    } else {
        console.log(`File ${file} tidak ditemukan.`);
    }
}
