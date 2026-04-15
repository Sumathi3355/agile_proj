const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Locations API
app.get('/api/locations', (req, res) => {
  const locations = [
    'Chennai 🏙️', 'Coimbatore 🏭', 'Madurai 🛕', 'Tiruchirappalli 🌉', 'Salem 🏞️',
    'Erode 🧣', 'Tirunelveli 🌊', 'Vellore 🏥', 'Thoothukudi ⚓', 'Dindigul 🍲',
    'Thanjavur 🎨', 'Kanchipuram 🕉️', 'Ooty ⛰️', 'Kodaikanal 🌸', 'Rameswaram 🕍'
  ];
  res.json(locations);
});

// Hotels API based on location and star class
app.get('/api/hotels', (req, res) => {
  const { location, starClass } = req.query;
  const hotelsByStar = {
    '5': [
      'ITC Grand Chola ✨', 'The Leela Palace 👑', 'Taj Coromandel 🕌', 
      'Park Hyatt 🍷', 'Hyatt Regency 🌟', 'Vivanta 💎', 'Le Meridien ✨',
      'Radisson Blu 🌠', 'Welcomhotel 🏨', 'The Residency Towers 🏰'
    ],
    '4': [
      'Radisson Blu ⭐', 'Novotel 🏨', 'Holiday Inn 🛏️', 
      'Feathers Hotel 🪶', 'Zone by The Park 🌳', 'Gokulam Park 🌺',
      'Hotel Sangam 💧', 'Regency Madurai 👑', 'Breeze Residency 🌬️'
    ],
    '3': [
      'Green Park 🌿', 'Hotel Abu Palace 🕌', 'Hotel Benzz Park ✨',
      'Hotel Mars Classic 🔴', 'Hotel Pandian 🐘', 'Heritage Inn 🏛️',
      'Hotel Seetharam 🕉️', 'Hotel Supreme 👑', 'Hotel Rockfort 🏯'
    ]
  };
  
  let hotels = hotelsByStar[starClass] || hotelsByStar['3'];
  res.json(hotels.slice(0, 15));
});

// Get table availability (20 tables with 5 always reserved)
app.post('/api/tables/check', (req, res) => {
  const { hotel, date } = req.body;
  
  db.all("SELECT table_number FROM reserved_tables WHERE (hotel = ? OR hotel = 'ALL') AND date = ?", [hotel, date], (err, rows) => {
    if (err) {
      res.json([]);
      return;
    }
    
    const reservedTables = rows.map(row => row.table_number);
    const tables = [];
    
    // Create 20 tables
    for (let i = 1; i <= 20; i++) {
      tables.push({
        number: i,
        status: reservedTables.includes(i) ? 'reserved' : 'available'
      });
    }
    res.json(tables);
  });
});

// Reserve table
app.post('/api/tables/reserve', (req, res) => {
  const { tableNumber, hotel, date } = req.body;
  db.run("INSERT INTO reserved_tables (table_number, hotel, date) VALUES (?, ?, ?)",
    [tableNumber, hotel, date],
    (err) => {
      if (err) res.json({ success: false, message: 'Table already reserved!' });
      else res.json({ success: true, message: 'Table reserved successfully!' });
    });
});

// Create reservation
app.post('/api/reservations', (req, res) => {
  const reservation = req.body;
  const advanceAmount = reservation.starClass === '3' ? 500 : reservation.starClass === '4' ? 1000 : 1500;
  
  db.run(`INSERT INTO reservations (
    location, star_class, hotel, ac_type, meal_type, timing, date, persons, 
    table_number, customer_name, mobile, email, advance_paid, payment_method
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [reservation.location, reservation.starClass, reservation.hotel, reservation.acType,
     reservation.mealType, reservation.timing, reservation.date, reservation.persons,
     reservation.tableNumber, reservation.name, reservation.mobile, reservation.email,
     advanceAmount, reservation.paymentMethod],
    function(err) {
      if (err) res.status(500).json({ success: false, error: err.message });
      else res.json({ success: true, id: this.lastID, advanceAmount });
    });
});

// Get reservation details
app.get('/api/reservations/:id', (req, res) => {
  db.get("SELECT * FROM reservations WHERE id = ?", [req.params.id], (err, row) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(row);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('✨ Dining Reservation System is ready!');
  console.log('📋 5 Tables pre-reserved: 3, 7, 12, 15, 18');
});