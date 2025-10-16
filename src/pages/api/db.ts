import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: '193.203.184.38',  // e.g., 185.224.137.22 or your Hostinger DB host
  port: 3306,                         // Default MariaDB port
  user: 'u746575951_typhoon',          // Your database username
  password: 'GMu~h4S$r',  // Database password
  database: 'u746575951_typhoon',     // Your created database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
