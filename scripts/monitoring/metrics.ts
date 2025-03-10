import { logger } from '../mt103_logger';
import { config } from '../config';

export async function sendMetrics(type: string, data: any) {
    if (!config.monitoring.endpoint) return;
    
    try {
        await fetch(config.monitoring.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, ...data })
        });
    } catch (error) {
        logger.error('Failed to send metrics', { error, type });
    }
}

export async function sendAlert(message: string) {
    if (!config.monitoring.alertWebhook) return;

    try {
        await fetch(config.monitoring.alertWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
    } catch (error) {
        logger.error('Failed to send alert', { error, message });
    }
}
