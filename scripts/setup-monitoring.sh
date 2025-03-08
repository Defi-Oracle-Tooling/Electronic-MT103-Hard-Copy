#!/bin/bash
# Script to set up application monitoring for the MT103 system

set -e  # Exit immediately if a command exits with non-zero status

# Default values
MONITORING_TYPE="${1:-prometheus}"  # Default to prometheus if not specified
APP_NAME="mt103-system"
NAMESPACE="default"

echo "Setting up $MONITORING_TYPE monitoring for $APP_NAME"

# Create monitoring namespace and directories
mkdir -p ./monitoring/dashboards
mkdir -p ./monitoring/config
mkdir -p ./monitoring/alerts

# Generate Prometheus configuration
if [ "$MONITORING_TYPE" == "prometheus" ] || [ "$MONITORING_TYPE" == "all" ]; then
    echo "Configuring Prometheus..."
    cat > ./monitoring/config/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093

rule_files:
  - "alerts/*.yml"

scrape_configs:
  - job_name: '$APP_NAME'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:3000']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

    # Create alert rules
    cat > ./monitoring/alerts/mt103_alerts.yml << EOF
groups:
- name: mt103_alerts
  rules:
  - alert: HighProcessingTime
    expr: mt103_processing_time_seconds{quantile="0.9"} > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High MT103 processing time"
      description: "MT103 message processing time is above 1s for 90% of requests for more than 5 minutes"

  - alert: HighErrorRate
    expr: rate(mt103_errors_total[5m]) / rate(mt103_requests_total[5m]) > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate in MT103 processing"
      description: "Error rate is above 5% for more than 2 minutes"
EOF

    echo "✅ Prometheus configuration created"
fi

# Generate Grafana dashboards
if [ "$MONITORING_TYPE" == "grafana" ] || [ "$MONITORING_TYPE" == "all" ]; then
    echo "Configuring Grafana..."
    cat > ./monitoring/dashboards/mt103_overview.json << EOF
{
  "title": "MT103 System Overview",
  "uid": "mt103-overview",
  "panels": [
    {
      "title": "Message Processing Rate",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "rate(mt103_messages_processed_total[5m])",
          "legendFormat": "Messages/second"
        }
      ]
    },
    {
      "title": "Processing Time",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "mt103_processing_time_seconds{quantile='0.5'}",
          "legendFormat": "P50"
        },
        {
          "expr": "mt103_processing_time_seconds{quantile='0.9'}",
          "legendFormat": "P90"
        },
        {
          "expr": "mt103_processing_time_seconds{quantile='0.99'}",
          "legendFormat": "P99"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "rate(mt103_errors_total[5m]) / rate(mt103_requests_total[5m])",
          "legendFormat": "Error Rate"
        }
      ]
    }
  ]
}
EOF

    echo "✅ Grafana dashboard created"
fi

# OpenTelemetry configuration
if [ "$MONITORING_TYPE" == "opentelemetry" ] || [ "$MONITORING_TYPE" == "all" ]; then
    echo "Configuring OpenTelemetry..."
    cat > ./monitoring/config/otel-collector-config.yml << EOF
receivers:
  otlp:
    protocols:
      grpc:
      http:

processors:
  batch:
    timeout: 1s

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger]
EOF

    echo "✅ OpenTelemetry configuration created"
fi

echo "Monitoring setup complete. Use 'docker-compose -f docker-compose.monitoring.yml up' to start the monitoring stack."
