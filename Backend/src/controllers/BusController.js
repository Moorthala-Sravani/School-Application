const db = require('../config/db');

exports.getBusRoute = (req, res) => {
  const { routeNumber } = req.query;

  let query = 'SELECT * FROM bus_routes';
  let params = [];

  if (routeNumber) {
    query += ' WHERE route_number = ?';
    params = [routeNumber];
  }

  db.query(query, params, (err, routeResults) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    
    if (routeResults.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const route = routeResults[0];

    db.query(
      'SELECT * FROM bus_stops WHERE route_id = ? ORDER BY stop_order ASC',
      [route.id],
      (err, stopResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        
        res.json({
          ...route,
          stops: stopResults
        });
      }
    );
  });
};
