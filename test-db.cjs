const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:yXVFpgnI30pyMisoVaBj@database-1.c7kuqs88yxgy.ap-south-1.rds.amazonaws.com:5432/postgres?sslmode=require',
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000 // 10 seconds
});

client.connect()
    .then(() => {
        console.log('Successfully connected to database with raw PG client');
        client.end();
    })
    .catch(err => {
        console.error('Failed to connect to database', err);
        process.exit(1);
    });
