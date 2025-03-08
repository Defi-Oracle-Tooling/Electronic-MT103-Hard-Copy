import { Pool } from 'pg';
import { logger } from '../mt103_logger';
import { config } from '../config';

export async function migrateDatabase() {
    const pool = new Pool(config.database);
    
    try {
        // Core schema
        await pool.query(`
            CREATE TABLE IF NOT EXISTS localization_entries (
                id SERIAL PRIMARY KEY,
                key TEXT NOT NULL,
                lang VARCHAR(5) NOT NULL,
                content TEXT NOT NULL,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'pending',
                reviewer VARCHAR(100),
                UNIQUE(key, lang)
            );
            
            CREATE TABLE IF NOT EXISTS translation_memory (
                id SERIAL PRIMARY KEY,
                source_hash VARCHAR(64) NOT NULL,
                source_text TEXT NOT NULL,
                target_text TEXT NOT NULL,
                lang_pair VARCHAR(10) NOT NULL,
                quality_score FLOAT NOT NULL,
                usage_count INTEGER DEFAULT 0,
                last_used TIMESTAMP WITH TIME ZONE,
                metadata JSONB,
                UNIQUE(source_hash, lang_pair)
            );

            CREATE TABLE IF NOT EXISTS compliance_rules (
                id SERIAL PRIMARY KEY,
                region VARCHAR(10) NOT NULL,
                rule_type VARCHAR(50) NOT NULL,
                rule_definition JSONB NOT NULL,
                priority INTEGER NOT NULL,
                active BOOLEAN DEFAULT true,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_events (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id VARCHAR(100) NOT NULL,
                user_id VARCHAR(100),
                event_data JSONB,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_localization_key_lang ON localization_entries(key, lang);
            CREATE INDEX IF NOT EXISTS idx_tm_source_hash ON translation_memory(source_hash);
            CREATE INDEX IF NOT EXISTS idx_tm_lang_pair ON translation_memory(lang_pair);
            CREATE INDEX IF NOT EXISTS idx_compliance_region ON compliance_rules(region);
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events USING BRIN(timestamp);
        `);

        logger.info('Database migration completed successfully');
    } catch (error) {
        logger.error('Database migration failed', { error });
        throw error;
    } finally {
        await pool.end();
    }
}
