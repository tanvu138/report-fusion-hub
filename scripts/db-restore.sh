#!/bin/sh
# Database restore script for Report Fusion Hub
# Usage: docker compose exec db-backup sh /usr/local/bin/db-restore.sh [backup_file]
# If no file specified, uses the most recent backup

set -e

BACKUP_DIR="/backups"

if [ -n "$1" ]; then
    BACKUP_FILE="${BACKUP_DIR}/$1"
else
    BACKUP_FILE=$(ls -t ${BACKUP_DIR}/report_fusion_hub_*.sql.gz 2>/dev/null | head -1)
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: No backup file found."
    echo "Available backups:"
    ls -lh ${BACKUP_DIR}/report_fusion_hub_*.sql.gz 2>/dev/null || echo "  (none)"
    exit 1
fi

echo "Restoring from: $(basename ${BACKUP_FILE})"
echo "Target database: ${PGDATABASE} @ ${PGHOST}"
echo ""
echo "WARNING: This will overwrite the current database. Press Ctrl+C to abort."
echo "Proceeding in 5 seconds..."
sleep 5

gunzip -c "${BACKUP_FILE}" | psql --single-transaction

echo "Restore complete."
