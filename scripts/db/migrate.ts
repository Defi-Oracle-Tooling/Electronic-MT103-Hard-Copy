import { Pool } from 'pg';
import { logger } from '../mt103_logger';
import { config } from '../config';
import { sendMetrics, sendAlert } from '../monitoring/metrics';

interface MigrationSnapshot {
    timestamp: string;
    tables: string[];
    schemas?: Record<string, any>;
}

async function sendMigrationStatus(data: { 
    status: 'success' | 'failure';
    details: {
        timestamp: string;
        changes?: any;
        error?: any;
    }
}) {
    await sendMetrics('migration', data);
}

function compareMigrationSnapshots(before: MigrationSnapshot, after: MigrationSnapshot) {
    const added = after.tables.filter(t => !before.tables.includes(t));
    const removed = before.tables.filter(t => !after.tables.includes(t));
    
    return {
        tablesAdded: added,
        tablesRemoved: removed,
        totalTables: after.tables.length
    };
}

export async function migrateDatabase() {
    const pool = new Pool(config.database);
    const migrationSnapshot = await getMigrationSnapshot(pool);
    
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

            CREATE TABLE IF NOT EXISTS language_preferences (
                user_id VARCHAR(100) PRIMARY KEY,
                preferred_lang VARCHAR(5) NOT NULL,
                fallback_lang VARCHAR(5),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS translation_jobs (
                id SERIAL PRIMARY KEY,
                source_lang VARCHAR(5) NOT NULL,
                target_lang VARCHAR(5) NOT NULL,
                content_type VARCHAR(50) NOT NULL,
                content_id VARCHAR(100) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP WITH TIME ZONE,
                translator_id VARCHAR(100)
            );
        `);
        
        // Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_localization_key_lang ON localization_entries(key, lang);
            CREATE INDEX IF NOT EXISTS idx_tm_source_hash ON translation_memory(source_hash);
            CREATE INDEX IF NOT EXISTS idx_tm_lang_pair ON translation_memory(lang_pair);
            CREATE INDEX IF NOT EXISTS idx_compliance_region ON compliance_rules(region);
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events USING BRIN(timestamp);
            CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON translation_jobs(status);
            CREATE INDEX IF NOT EXISTS idx_translation_jobs_langs ON translation_jobs(source_lang, target_lang);
        `);

        // Report successful migration
        if (config.monitoring.endpoint) {
            await sendMigrationStatus({
                status: 'success',
                details: {
                    timestamp: new Date().toISOString(),
                    changes: compareMigrationSnapshots(migrationSnapshot, await getMigrationSnapshot(pool))
                }
            });
        }

        logger.info('Database migration completed successfully');
    } catch (error) {
        // Attempt rollback if possible
        if (migrationSnapshot) {
            await rollbackMigration(pool, migrationSnapshot);
        }
        
        // Report failure
        if (config.monitoring.alertWebhook) {
            await sendAlert('Database migration failed, manual intervention may be required');
        }
        
        logger.error('Database migration failed', { error });
        throw error;
    } finally {
        await pool.end();
    }
}

async function getMigrationSnapshot(pool) {
    const tables = await pool.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
    `);
    return {
        timestamp: new Date().toISOString(),
        tables: tables.rows.map(r => r.tablename)
    };
}

async function rollbackMigration(pool, snapshot) {
    logger.info('Attempting migration rollback', { snapshot });
    // Implement rollback logic
}
