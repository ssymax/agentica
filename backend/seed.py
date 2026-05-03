from datetime import datetime, timezone

TICKETS = [
    {
        "title": "Cloud Instance Latency Spikes on eu-west-1",
        "description": (
            "Since the deployment on 2026-04-28, our production API cluster on AWS eu-west-1 "
            "is experiencing intermittent latency spikes of 800–2400 ms on p99 responses. "
            "Normal baseline is under 120 ms. CloudWatch metrics show CPU utilization stays "
            "below 40%, ruling out compute saturation. Network egress is normal. The spikes "
            "correlate with a surge in DB connection pool exhaustion logs from RDS PostgreSQL. "
            "We suspect the recent migration that removed connection pooling via PgBouncer is "
            "the root cause. Rollback is blocked because the schema migration is not reversible. "
            "Immediate mitigation needed: re-introduce PgBouncer as a sidecar container."
        ),
        "status": "in_progress",
        "created_at": datetime(2026, 4, 28, 9, 14, tzinfo=timezone.utc),
    },
    {
        "title": "OAuth2 Access Tokens Expiring Prematurely",
        "description": (
            "Multiple enterprise customers report that their OAuth2 access tokens are being "
            "rejected with HTTP 401 before the advertised 3600-second TTL. Server logs show "
            "token validation failing at ~1800 seconds. The issue started after upgrading the "
            "auth service from v2.3.1 to v2.4.0. Investigation reveals the new version "
            "introduced a clock-skew tolerance check that defaults to subtracting 1800 seconds "
            "from the expiry. This is a misconfiguration in the JWT verification middleware. "
            "Affected customers: Acme Corp, GlobalTech, NovaSystems. Workaround: re-issue "
            "tokens with 7200-second TTL until the middleware is patched."
        ),
        "status": "open",
        "created_at": datetime(2026, 4, 29, 11, 5, tzinfo=timezone.utc),
    },
    {
        "title": "CI/CD Pipeline Failing on Docker Build Step",
        "description": (
            "The GitHub Actions pipeline for the main repository has been failing since "
            "2026-04-30 on the Docker build step. Error: 'failed to solve: failed to read "
            "dockerfile: open /workspace/Dockerfile: no such file or directory'. This occurs "
            "only on the self-hosted runner pool (runner-pool-prod), not on GitHub-hosted "
            "runners. Investigation shows the workspace checkout action fails silently due to "
            "insufficient disk space on two of the five self-hosted runners. The runners have "
            "old Docker layer caches consuming 85 GB each. Docker prune has been scheduled "
            "but not yet executed. Blocking: 3 hotfix releases and 1 major feature deployment."
        ),
        "status": "in_progress",
        "created_at": datetime(2026, 4, 30, 8, 22, tzinfo=timezone.utc),
    },
    {
        "title": "SSO Login Loop for Active Directory Federation Services",
        "description": (
            "Users authenticating through ADFS SSO are caught in an infinite redirect loop "
            "when attempting to access the internal portal. The browser redirects between the "
            "SP-initiated login URL and the ADFS identity provider URL indefinitely. The issue "
            "affects all users in the EMEA tenant. Root cause identified: the SAML assertion "
            "consumer service URL in the relying party trust was updated to HTTPS but the "
            "service provider metadata XML still references the old HTTP endpoint. The ADFS "
            "server rejects the mismatch and redirects back. Fix: update the SP metadata and "
            "re-establish trust. Estimated time to fix: 2 hours pending change management approval."
        ),
        "status": "open",
        "created_at": datetime(2026, 4, 30, 14, 48, tzinfo=timezone.utc),
    },
    {
        "title": "Database Replication Lag Exceeding SLA Threshold",
        "description": (
            "The read replica for the primary PostgreSQL cluster (db-primary-01) is showing "
            "replication lag of 45–120 seconds, well above our SLA threshold of 5 seconds. "
            "This is causing stale data to be served from the replica to reporting dashboards "
            "and analytics queries. The lag began after a large batch job inserted 12 million "
            "rows into the events table. WAL sender is processing normally but the replica's "
            "apply worker is throttled by high I/O wait. Proposed fix: increase "
            "wal_receiver_status_interval, enable parallel apply workers (PostgreSQL 16 "
            "feature), and add an index on the events table to speed up replica apply. "
            "Alerting has been set up to notify on-call if lag exceeds 30 seconds."
        ),
        "status": "open",
        "created_at": datetime(2026, 5, 1, 7, 33, tzinfo=timezone.utc),
    },
    {
        "title": "SSL Certificate Expiry Warning on api.example.com",
        "description": (
            "The SSL/TLS certificate for api.example.com expires in 7 days (2026-05-09). "
            "Automated renewal via Certbot/Let's Encrypt is failing with error: "
            "'Challenge failed for domain api.example.com: DNS problem: NXDOMAIN looking up "
            "CAA for api.example.com'. The DNS CAA record was inadvertently deleted during a "
            "DNS zone migration on 2026-04-25. Certificate renewal is blocked until the CAA "
            "record is restored. If not resolved before expiry, all API clients will receive "
            "SSL handshake errors. Immediate action required: restore CAA record and re-run "
            "certbot renewal. Secondary action: configure PagerDuty alert for certificate "
            "expiry 30 days in advance."
        ),
        "status": "in_progress",
        "created_at": datetime(2026, 5, 1, 10, 15, tzinfo=timezone.utc),
    },
    {
        "title": "Kubernetes Pod CrashLoopBackOff After Config Map Update",
        "description": (
            "Following a ConfigMap update pushed to the staging cluster on 2026-05-01, the "
            "payment-service pods entered CrashLoopBackOff state. kubectl logs show: "
            "'panic: runtime error: invalid memory address or nil pointer dereference' at "
            "startup. The new ConfigMap introduced a DATABASE_POOL_SIZE key that the "
            "application tries to parse as an integer, but the value was accidentally set to "
            "an empty string. The Go application does not handle the empty string case and "
            "panics on startup. Fix: patch the ConfigMap with the correct integer value "
            "(20) and trigger a rolling restart. Long-term: add ConfigMap validation "
            "in the Helm chart pre-install hook."
        ),
        "status": "resolved",
        "created_at": datetime(2026, 5, 1, 15, 40, tzinfo=timezone.utc),
    },
    {
        "title": "Memory Leak in Node.js API Gateway After WebSocket Upgrade",
        "description": (
            "The Node.js API gateway service is exhibiting a memory leak after upgrading the "
            "ws library from v7.5 to v8.0 in the latest release. Heap snapshots taken with "
            "clinic.js show EventEmitter listener count growing unboundedly — reaching 50,000+ "
            "listeners after 6 hours of load. The root cause is a missing removeAllListeners() "
            "call when WebSocket connections are closed. The old version of ws cleaned up "
            "listeners automatically on close; v8.0 changed this behavior. The gateway "
            "restarts automatically every 4 hours via a cron job as a temporary mitigation, "
            "but this causes ~30 seconds of elevated error rates per restart. Permanent fix "
            "requires patching the connection lifecycle handler."
        ),
        "status": "in_progress",
        "created_at": datetime(2026, 5, 1, 17, 12, tzinfo=timezone.utc),
    },
    {
        "title": "Data Export Functionality Timing Out for Large Datasets",
        "description": (
            "Enterprise users attempting to export datasets larger than 50,000 rows via the "
            "CSV export feature are encountering HTTP 504 Gateway Timeout errors. The export "
            "is processed synchronously in the request lifecycle and exceeds the 60-second "
            "ALB timeout. The feature works correctly for datasets under 10,000 rows. "
            "Root cause: the export query performs three large JOIN operations without "
            "pagination and loads the entire result set into memory before serializing to CSV. "
            "Proposed solution: implement async export using a background job queue (Bull/Redis), "
            "generate the CSV file to S3, and notify the user via email with a pre-signed "
            "download URL. This requires a 3-day implementation window."
        ),
        "status": "open",
        "created_at": datetime(2026, 5, 2, 9, 5, tzinfo=timezone.utc),
    },
    {
        "title": "Two-Factor Authentication Codes Not Delivered via SMS",
        "description": (
            "Users with SMS-based two-factor authentication are not receiving their OTP codes. "
            "The issue began at 06:00 UTC on 2026-05-02 and is affecting 100% of SMS 2FA "
            "attempts. Email-based 2FA is unaffected. Investigation shows the Twilio webhook "
            "delivery is returning 200 OK but codes are not being dispatched. The Twilio "
            "account dashboard shows the messaging service is paused due to an unpaid invoice "
            "($1,247.50 overdue since 2026-04-15). The account was placed in suspension mode "
            "automatically. Immediate action: process payment to restore the account. "
            "Temporary mitigation: automatically fall back to email OTP when SMS delivery "
            "fails. Long-term: configure billing alerts and auto-pay for the Twilio account."
        ),
        "status": "open",
        "created_at": datetime(2026, 5, 2, 8, 30, tzinfo=timezone.utc),
    },
]
