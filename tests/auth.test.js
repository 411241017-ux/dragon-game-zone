const request = require('supertest');
const { app, db } = require('../server');

describe('Login & Registration System Tests', () => {
    // Akun dummy untuk testing
    const testUser = {
        nama: 'User Test',
        email: 'testuser123@example.com',
        password: 'password123',
        confirm_password: 'password123'
    };

    // Bersihkan data test user sebelum dan sesudah test berjalan
    beforeAll((done) => {
        db.query('DELETE FROM users WHERE email = ?', [testUser.email], (err) => {
            done();
        });
    });

    afterAll((done) => {
        db.query('DELETE FROM users WHERE email = ?', [testUser.email], (err) => {
            // Tutup koneksi database agar Jest bisa exit
            db.end(() => {
                done();
            });
        });
    });

    it('1. POST /api/register - Seharusnya berhasil registrasi', async () => {
        const response = await request(app)
            .post('/api/register')
            .send(testUser);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('message', 'Registrasi berhasil! Silakan login.');
    });

    it('2. POST /api/register - Seharusnya gagal jika email sudah terdaftar', async () => {
        const response = await request(app)
            .post('/api/register')
            .send(testUser);
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('message', 'Email sudah terdaftar!');
    });

    let cookies;

    it('3. POST /api/login - Seharusnya berhasil login dengan akun yang dibuat', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        
        // Simpan session cookie untuk test selanjutnya
        cookies = response.headers['set-cookie'];
    });

    it('4. POST /api/login - Seharusnya gagal login dengan password yang salah', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('message', 'Password salah!');
    });

    it('5. GET /api/check-session - Seharusnya user terdeteksi sudah login', async () => {
        const response = await request(app)
            .get('/api/check-session')
            .set('Cookie', cookies);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('loggedIn', true);
        expect(response.body).toHaveProperty('nama', testUser.nama);
    });

    it('6. GET /api/logout - Seharusnya berhasil logout dan menghancurkan session', async () => {
        const response = await request(app)
            .get('/api/logout')
            .set('Cookie', cookies);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        
        // Cek kembali session
        const checkResponse = await request(app)
            .get('/api/check-session');
        expect(checkResponse.body).toHaveProperty('loggedIn', false);
    });
});
