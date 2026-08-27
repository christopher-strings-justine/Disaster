import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'disaster_sih',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shelters (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        locationId VARCHAR(50) NOT NULL,
        capacity INTEGER NOT NULL,
        occupancy INTEGER NOT NULL,
        waterLevel INTEGER NOT NULL,
        rations INTEGER NOT NULL,
        medicalKits INTEGER NOT NULL,
        hospitalBeds INTEGER NOT NULL,
        personnelCount INTEGER NOT NULL,
        inventoryDetails TEXT,
        lat FLOAT,
        lng FLOAT
      );

      CREATE TABLE IF NOT EXISTS responders (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        location VARCHAR(255) NOT NULL,
        progress INTEGER NOT NULL,
        taskId VARCHAR(255),
        vehicleCount INTEGER NOT NULL,
        personnelSize INTEGER NOT NULL,
        equipmentDetails TEXT
      );

      CREATE TABLE IF NOT EXISTS markers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        locationId VARCHAR(50) NOT NULL,
        risk INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        details TEXT NOT NULL,
        population INTEGER NOT NULL,
        lat FLOAT NOT NULL,
        lng FLOAT NOT NULL,
        radius INTEGER,
        x INTEGER,
        y INTEGER
      );

      CREATE TABLE IF NOT EXISTS work_orders (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        source VARCHAR(50) NOT NULL,
        locationId VARCHAR(50) NOT NULL,
        locationName VARCHAR(255) NOT NULL,
        priority VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        assignedResponderId VARCHAR(255),
        progress INTEGER NOT NULL
      );
    `);
    console.log('PostgreSQL tables initialized');
  } catch (error) {
    console.error('Error initializing PostgreSQL tables:', error);
  }
};
