#!/bin/sh
# Database backup script for Report Fusion Hub
# Runs inside the db-backup container via cron
# Creates timestamped pg_dump files and prunes old backups

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="report_fusion_hub_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

echo "[$(date)] Starting database backup..."

# Create compressed backup
pg_dump --clean --if-exists --no-owner | gzip > "${BACKUP_DIR}/${FILENAME}"

# Verify backup is not empty
FILESIZE=$(stat -c%s "${BACKUP_DIR}/${FILENAME}" 2>/dev/null || stat -f%z "${BACKUP_DIR}/${FILENAME}" 2>/dev/null)
if [ "$FILESIZE" -lt 100 ]; then
    echo "[$(date)] ERROR: Backup file is suspiciously small (${FILESIZE} bytes). Keeping file for inspection."
    exit 1
fi

echo "[$(date)] Backup created: ${FILENAME} (${FILESIZE} bytes)"

# Prune backups older than retention period
PRUNED=$(find "${BACKUP_DIR}" -name "report_fusion_hub_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$PRUNED" -gt 0 ]; then
    echo "[$(date)] Pruned ${PRUNED} backup(s) older than ${RETENTION_DAYS} days"
fi

echo "[$(date)] Backup complete. Total backups: $(ls ${BACKUP_DIR}/report_fusion_hub_*.sql.gz 2>/dev/null | wc -l)"
