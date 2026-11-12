import { SamplePreset } from '../types/graph';

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'iot-telemetry',
    name: 'Distributed IoT Telemetry Pipeline',
    subtitle: 'High-throughput edge-to-cloud streaming ingestion & anomaly detection',
    description: 'System architecture documenting a 50,000-sensor industrial telemetry mesh with MQTT, Kafka, Apache Flink, TimescaleDB, and automated anomaly alerts.',
    suggestedQuestions: [
      'Find all queues and stream processors between Edge Gateways and storage',
      'Which services are downstream of the Kafka Ingestion Cluster?',
      'Show potential single points of failure in the telemetry ingestion path',
      'List all databases and cold storage layers receiving metrics',
    ],
    sourceText: `System Architecture: High-Throughput Industrial IoT Telemetry Mesh (Revision 4.2)

1. Edge Tier & Ingestion:
Approximately 50,000 distributed industrial IoT sensor devices (iot_fleet) monitor temperature, vibration, and pressure across 12 manufacturing plants. The sensors transmit metrics over TLS via cellular backhaul to an Edge Gateway Cluster (edge_gateway). The Edge Gateways normalize protocol variations and forward encrypted MQTT packets to a clustered EMQX MQTT Broker (emqx_broker) operating at QoS level 1.

2. Streaming Backbone:
The EMQX MQTT Broker bridges directly into an Apache Kafka Ingestion Cluster (kafka_ingest) partitioned into 32 topic partitions on the "telemetry-raw" stream. An Apache Flink Stream Processing Engine (flink_stream) consumes telemetry records with 10-second tumbling event-time windows, computing moving averages, rate-of-change variances, and device health heartbeats.

3. Persistence & Cache Layers:
For sub-millisecond operator dashboards, Flink publishes real-time aggregate summaries into a distributed Redis Real-Time Cache (redis_cache). Concurrently, Flink persists immutable timestamped metrics into a clustered TimescaleDB Time-Series Database (timescale_db) utilizing continuous aggregates and 90-day compression chunks. Daily batch compaction exports raw historical partitions into an S3 Cold Telemetry Lake (s3_cold_archive) in Parquet format.

4. Anomaly Detection & Incident Alerting:
The Flink stream engine routes statistical outliers to an Isolation Forest ML Anomaly Detector worker (anomaly_detector). When sensor metrics exceed 3.2 standard deviations or indicate signature bearing failure, the anomaly detector emits high-priority alerts to the Grafana Alert Manager (grafana_alerts), which triggers automated PagerDuty incidents and notifies plant safety engineers.`,
    initialGraph: {
      summary: 'Distributed edge-to-cloud telemetry ingestion pipeline with 10 entities, dual-speed storage (hot Redis cache and persistent TimescaleDB), Kafka streaming queue, and real-time anomaly alerting.',
      nodes: [
        {
          id: 'iot_fleet',
          label: 'IoT Sensor Fleet',
          type: 'CLIENT',
          description: '50,000 edge sensors gathering thermal, vibration, and pressure readings.',
          properties: { count: '50,000+', protocol: 'MQTT/TLS', battery_life: '36mo', sample_rate: '100Hz' }
        },
        {
          id: 'edge_gateway',
          label: 'Edge Gateway Cluster',
          type: 'GATEWAY',
          description: 'On-premise edge nodes performing protocol normalization and network buffering.',
          properties: { instances: 24, redundancy: 'N+1', region: 'Global' }
        },
        {
          id: 'emqx_broker',
          label: 'EMQX MQTT Broker',
          type: 'GATEWAY',
          description: 'Scalable distributed MQTT message broker handling TLS handshakes and QoS 1.',
          properties: { qos: 1, connections: '120k peak', protocol: 'MQTT 5.0' }
        },
        {
          id: 'kafka_ingest',
          label: 'Kafka Ingestion Cluster',
          type: 'QUEUE',
          description: 'Distributed event log partitioned across 32 topics on "telemetry-raw".',
          properties: { partitions: 32, replication_factor: 3, throughput: '85MB/s' }
        },
        {
          id: 'flink_stream',
          label: 'Apache Flink Engine',
          type: 'SERVICE',
          description: 'Stateful stream analytics calculating 10-second tumbling window aggregates.',
          properties: { parallelism: 16, state_backend: 'RocksDB', checkpointing: '30s' }
        },
        {
          id: 'redis_cache',
          label: 'Redis Real-Time Cache',
          type: 'CACHE',
          description: 'In-memory cache delivering sub-millisecond telemetry summaries for live UI.',
          properties: { eviction: 'allkeys-lru', memory_limit: '64GB', cluster_nodes: 6 }
        },
        {
          id: 'timescale_db',
          label: 'TimescaleDB Hypertable',
          type: 'DATABASE',
          description: 'PostgreSQL-backed time-series store with automatic chunk partitioning.',
          properties: { engine: 'PostgreSQL 16', compression_ratio: '88%', retention_days: 90 }
        },
        {
          id: 'anomaly_detector',
          label: 'ML Anomaly Detector',
          type: 'SERVICE',
          description: 'Isolation Forest inference engine scoring sensor deviation vectors.',
          properties: { model: 'Isolation Forest v2.4', threshold_zscore: 3.2, latency_p99: '18ms' }
        },
        {
          id: 'grafana_alerts',
          label: 'Grafana Alert Manager',
          type: 'MONITORING',
          description: 'Rule evaluation engine dispatching webhooks to PagerDuty and incident channels.',
          properties: { oncall_pager: 'Enabled', evaluation_interval: '10s' }
        },
        {
          id: 's3_cold_archive',
          label: 'S3 Cold Telemetry Lake',
          type: 'STORAGE',
          description: 'Parquet-formatted object store for deep historical compliance and model training.',
          properties: { format: 'Apache Parquet', storage_class: 'Glacier Instant', lifecycle: '7yr' }
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'iot_fleet',
          target: 'edge_gateway',
          relationship: 'TRANSMITS_TO',
          description: 'Cellular backhaul telemetry packets',
          properties: { cipher: 'AES-256-GCM', frequency: 'Continuous' }
        },
        {
          id: 'e2',
          source: 'edge_gateway',
          target: 'emqx_broker',
          relationship: 'PUBLISHES_MQTT',
          description: 'Normalizes sensor streams and publishes over TLS',
          properties: { qos: 'QoS 1' }
        },
        {
          id: 'e3',
          source: 'emqx_broker',
          target: 'kafka_ingest',
          relationship: 'STREAMS_INTO',
          description: 'Kafka source connector pumping into telemetry-raw topic',
          properties: { batch_size: '16KB' }
        },
        {
          id: 'e4',
          source: 'kafka_ingest',
          target: 'flink_stream',
          relationship: 'CONSUMED_BY',
          description: 'Stream consumer group reading with exactly-once semantics',
          properties: { semantics: 'Exactly-Once' }
        },
        {
          id: 'e5',
          source: 'flink_stream',
          target: 'redis_cache',
          relationship: 'UPDATES_HOT_METRIC',
          description: 'Publishes 10s rolling window aggregates for operational console',
          properties: { ttl_seconds: 300 }
        },
        {
          id: 'e6',
          source: 'flink_stream',
          target: 'timescale_db',
          relationship: 'PERSISTS_TIME_SERIES',
          description: 'Batch inserts time-stamped metric records into hypertables',
          properties: { batch_timeout_ms: 500 }
        },
        {
          id: 'e7',
          source: 'flink_stream',
          target: 'anomaly_detector',
          relationship: 'EVALUATES_ANOMALY',
          description: 'Routes variance metrics to ML model inference pool',
          properties: { queue_depth_cap: 1000 }
        },
        {
          id: 'e8',
          source: 'anomaly_detector',
          target: 'grafana_alerts',
          relationship: 'TRIGGERS_INCIDENT',
          description: 'Dispatches high z-score violation payload to alert router',
          properties: { severity: 'CRITICAL' }
        },
        {
          id: 'e9',
          source: 'timescale_db',
          target: 's3_cold_archive',
          relationship: 'BATCH_EXPORTS_TO',
          description: 'Nightly Parquet archive cron job offloading cold chunks',
          properties: { frequency: 'Daily 02:00 UTC' }
        }
      ],
      cypherStatements: [
        '// Constraints & Unique Indexes',
        'CREATE CONSTRAINT node_id_unique IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE;',
        '',
        '// Entity Node Definitions (MERGE for Idempotency)',
        'MERGE (c:Client {id: "iot_fleet"})',
        '  ON CREATE SET c.name = "IoT Sensor Fleet", c.type = "CLIENT", c.count = "50,000+", c.protocol = "MQTT/TLS"',
        '  ON MATCH SET c.updatedAt = datetime();',
        '',
        'MERGE (gw1:Gateway {id: "edge_gateway"})',
        '  ON CREATE SET gw1.name = "Edge Gateway Cluster", gw1.type = "GATEWAY", gw1.instances = 24, gw1.redundancy = "N+1";',
        '',
        'MERGE (gw2:Gateway {id: "emqx_broker"})',
        '  ON CREATE SET gw2.name = "EMQX MQTT Broker", gw2.type = "GATEWAY", gw2.qos = 1, gw2.connections = "120k peak";',
        '',
        'MERGE (q:Queue {id: "kafka_ingest"})',
        '  ON CREATE SET q.name = "Kafka Ingestion Cluster", q.type = "QUEUE", q.partitions = 32, q.throughput = "85MB/s";',
        '',
        'MERGE (s1:Service {id: "flink_stream"})',
        '  ON CREATE SET s1.name = "Apache Flink Engine", s1.type = "SERVICE", s1.parallelism = 16, s1.stateBackend = "RocksDB";',
        '',
        'MERGE (cache:Cache {id: "redis_cache"})',
        '  ON CREATE SET cache.name = "Redis Real-Time Cache", cache.type = "CACHE", cache.memoryLimit = "64GB";',
        '',
        'MERGE (db:Database {id: "timescale_db"})',
        '  ON CREATE SET db.name = "TimescaleDB Hypertable", db.type = "DATABASE", db.engine = "PostgreSQL 16", db.retention = 90;',
        '',
        'MERGE (s2:Service {id: "anomaly_detector"})',
        '  ON CREATE SET s2.name = "ML Anomaly Detector", s2.type = "SERVICE", s2.model = "Isolation Forest v2.4", s2.thresholdZScore = 3.2;',
        '',
        'MERGE (mon:Monitoring {id: "grafana_alerts"})',
        '  ON CREATE SET mon.name = "Grafana Alert Manager", mon.type = "MONITORING", mon.oncallPager = "Enabled";',
        '',
        'MERGE (st:Storage {id: "s3_cold_archive"})',
        '  ON CREATE SET st.name = "S3 Cold Telemetry Lake", st.type = "STORAGE", st.format = "Apache Parquet", st.lifecycle = "7yr";',
        '',
        '// Idempotent Relationship Bindings',
        'MATCH (a {id: "iot_fleet"}), (b {id: "edge_gateway"})',
        'MERGE (a)-[r:TRANSMITS_TO {frequency: "Continuous", cipher: "AES-256-GCM"}]->(b);',
        '',
        'MATCH (a {id: "edge_gateway"}), (b {id: "emqx_broker"})',
        'MERGE (a)-[r:PUBLISHES_MQTT {qos: "QoS 1"}]->(b);',
        '',
        'MATCH (a {id: "emqx_broker"}), (b {id: "kafka_ingest"})',
        'MERGE (a)-[r:STREAMS_INTO {batch_size: "16KB"}]->(b);',
        '',
        'MATCH (a {id: "kafka_ingest"}), (b {id: "flink_stream"})',
        'MERGE (a)-[r:CONSUMED_BY {semantics: "Exactly-Once"}]->(b);',
        '',
        'MATCH (a {id: "flink_stream"}), (b {id: "redis_cache"})',
        'MERGE (a)-[r:UPDATES_HOT_METRIC {ttl_seconds: 300}]->(b);',
        '',
        'MATCH (a {id: "flink_stream"}), (b {id: "timescale_db"})',
        'MERGE (a)-[r:PERSISTS_TIME_SERIES {batch_timeout_ms: 500}]->(b);',
        '',
        'MATCH (a {id: "flink_stream"}), (b {id: "anomaly_detector"})',
        'MERGE (a)-[r:EVALUATES_ANOMALY {queue_depth_cap: 1000}]->(b);',
        '',
        'MATCH (a {id: "anomaly_detector"}), (b {id: "grafana_alerts"})',
        'MERGE (a)-[r:TRIGGERS_INCIDENT {severity: "CRITICAL"}]->(b);',
        '',
        'MATCH (a {id: "timescale_db"}), (b {id: "s3_cold_archive"})',
        'MERGE (a)-[r:BATCH_EXPORTS_TO {frequency: "Daily 02:00 UTC"}]->(b);'
      ]
    }
  },
  {
    id: 'incident-postmortem',
    name: 'Microservices Incident Postmortem (SEV-1)',
    subtitle: 'Database connection pool collapse cascading into API Gateway failure',
    description: 'Postmortem report tracing an unindexed query rollout that exhausted PostgreSQL connection poolers, tripped downstream circuit breakers, and halted user authentication.',
    suggestedQuestions: [
      'What was the root cause entity that triggered the incident?',
      'Which services experienced cascading failures?',
      'Trace the path from unindexed query rollout to user facing outages',
      'Show circuit breaker states and database pool utilization'
    ],
    sourceText: `Postmortem Report: Incident INC-8924 (SEV-1 Authentication Outage)

Summary:
On October 14 at 14:22 UTC, deployment v2.18 of the User Profile Service (profile_service) introduced an unindexed query on user_tenants. This saturated the PgBouncer Connection Pooler (pgbouncer_pool), escalating database CPU on the primary PostgreSQL RDS cluster (postgres_primary) to 100%.

Propagation & Blast Radius:
1. When PgBouncer ran out of worker connections, client queries from Auth Service (auth_service) timed out after 5,000ms.
2. The Envoy API Gateway (api_gateway) experienced a surge in HTTP 504 Gateway Timeouts on all /api/v1/login routes.
3. The Payment Settlement Service (payment_service) attempted synchronous token revalidation against Auth Service. Upon consecutive timeout thresholds, the Resilience4j Circuit Breaker (circuit_breaker) tripped to OPEN state, dropping 100% of checkout attempts.
4. PagerDuty Incident Manager (pagerduty_router) alerted the on-call Site Reliability Engineering squad.

Remediation:
Engineers rolled back profile_service to v2.17 at 14:52 UTC, injected an index on user_tenants(tenant_id), and restarted pgbouncer_pool to flush hung transactions.`,
    initialGraph: {
      summary: 'SEV-1 incident dependency graph demonstrating connection starvation propagation from Profile Service into Postgres, affecting Auth, API Gateway, and Payment circuit breakers.',
      nodes: [
        {
          id: 'profile_service',
          label: 'User Profile Service',
          type: 'SERVICE',
          description: 'Deployed v2.18 release with unindexed join on user_tenants.',
          properties: { version: 'v2.18 (flawed)', status: 'FAILED' }
        },
        {
          id: 'pgbouncer_pool',
          label: 'PgBouncer Pooler',
          type: 'INFRASTRUCTURE',
          description: 'Connection pool exhausted by long-running sequential table scans.',
          properties: { max_client_conn: 2000, active_conn: 2000, status: 'EXHAUSTED' }
        },
        {
          id: 'postgres_primary',
          label: 'PostgreSQL RDS Primary',
          type: 'DATABASE',
          description: 'Database engine overwhelmed with 100% CPU utilization.',
          properties: { cpu_utilization: '100%', disk_iops: 'High', status: 'DEGRADED' }
        },
        {
          id: 'auth_service',
          label: 'Auth Authentication Service',
          type: 'SERVICE',
          description: 'Session validation service timing out on tenant credential lookups.',
          properties: { p99_latency: '5120ms', error_rate: '94%' }
        },
        {
          id: 'api_gateway',
          label: 'Envoy API Gateway',
          type: 'GATEWAY',
          description: 'Edge reverse proxy returning HTTP 504 Gateway Timeouts to mobile & web clients.',
          properties: { status_504_count: '14,200/min', health: 'CRITICAL' }
        },
        {
          id: 'payment_service',
          label: 'Payment Service',
          type: 'SERVICE',
          description: 'Downstream checkout engine unable to revalidate bearer JWTs.',
          properties: { checkout_failures: 840 }
        },
        {
          id: 'circuit_breaker',
          label: 'Resilience4j Circuit Breaker',
          type: 'COMPONENT',
          description: 'Protective trip mechanism flipped to OPEN state to prevent thread death.',
          properties: { state: 'OPEN', failure_rate_threshold: '50%' }
        },
        {
          id: 'pagerduty_router',
          label: 'PagerDuty Router',
          type: 'MONITORING',
          description: 'Automated paging trigger calling primary SRE on-call engineer.',
          properties: { incident_id: 'INC-8924', priority: 'P1-CRITICAL' }
        }
      ],
      edges: [
        {
          id: 'ie1',
          source: 'profile_service',
          target: 'pgbouncer_pool',
          relationship: 'SATURATES_POOL',
          description: 'Emits unindexed queries holding worker threads',
          properties: { impact: 'Catastrophic' }
        },
        {
          id: 'ie2',
          source: 'pgbouncer_pool',
          target: 'postgres_primary',
          relationship: 'LOCKS_THREADS',
          description: 'Drives database CPU to 100%',
          properties: { metric: 'CPU=100%' }
        },
        {
          id: 'ie3',
          source: 'auth_service',
          target: 'pgbouncer_pool',
          relationship: 'BLOCKED_BY',
          description: 'Auth queries queue behind hung profile queries',
          properties: { timeout_ms: 5000 }
        },
        {
          id: 'ie4',
          source: 'api_gateway',
          target: 'auth_service',
          relationship: 'PROXIES_TO',
          description: 'Forwards login traffic that ends in timeout',
          properties: { response_code: 504 }
        },
        {
          id: 'ie5',
          source: 'payment_service',
          target: 'auth_service',
          relationship: 'VALIDATES_TOKEN',
          description: 'Synchronous token auth check',
          properties: { retry_policy: '3x-then-trip' }
        },
        {
          id: 'ie6',
          source: 'payment_service',
          target: 'circuit_breaker',
          relationship: 'TRIPS_STATE',
          description: 'Fails open when error rate exceeds threshold',
          properties: { resulting_state: 'OPEN' }
        },
        {
          id: 'ie7',
          source: 'api_gateway',
          target: 'pagerduty_router',
          relationship: 'DISPATCHES_ALERT',
          description: 'High 5xx rate triggers P1 escalation',
          properties: { threshold: '>5% 5xx' }
        }
      ],
      cypherStatements: [
        '// Postmortem Incident Topology Graph',
        'CREATE CONSTRAINT incident_node_id IF NOT EXISTS FOR (n:IncidentEntity) REQUIRE n.id IS UNIQUE;',
        '',
        'MERGE (s1:Service {id: "profile_service"})',
        '  ON CREATE SET s1.name = "User Profile Service", s1.version = "v2.18", s1.fault = "Unindexed query";',
        '',
        'MERGE (pool:Infrastructure {id: "pgbouncer_pool"})',
        '  ON CREATE SET pool.name = "PgBouncer Pooler", pool.maxConn = 2000, pool.state = "EXHAUSTED";',
        '',
        'MERGE (db:Database {id: "postgres_primary"})',
        '  ON CREATE SET db.name = "PostgreSQL RDS Primary", db.cpu = 100;',
        '',
        'MERGE (s2:Service {id: "auth_service"})',
        '  ON CREATE SET s2.name = "Auth Service", s2.errorRate = 0.94;',
        '',
        'MERGE (gw:Gateway {id: "api_gateway"})',
        '  ON CREATE SET gw.name = "Envoy API Gateway", gw.outageCode = 504;',
        '',
        'MERGE (s3:Service {id: "payment_service"})',
        '  ON CREATE SET s3.name = "Payment Service", s3.failedCheckouts = 840;',
        '',
        'MERGE (cb:Component {id: "circuit_breaker"})',
        '  ON CREATE SET cb.name = "Resilience4j Circuit Breaker", cb.state = "OPEN";',
        '',
        'MERGE (alert:Monitoring {id: "pagerduty_router"})',
        '  ON CREATE SET alert.name = "PagerDuty Router", alert.severity = "SEV-1";',
        '',
        'MATCH (a {id: "profile_service"}), (b {id: "pgbouncer_pool"})',
        'MERGE (a)-[:SATURATES_POOL {cause: "unindexed_join"}]->(b);',
        '',
        'MATCH (a {id: "pgbouncer_pool"}), (b {id: "postgres_primary"})',
        'MERGE (a)-[:LOCKS_THREADS {cpu: 100}]->(b);',
        '',
        'MATCH (a {id: "auth_service"}), (b {id: "pgbouncer_pool"})',
        'MERGE (a)-[:BLOCKED_BY {timeout: 5000}]->(b);',
        '',
        'MATCH (a {id: "api_gateway"}), (b {id: "auth_service"})',
        'MERGE (a)-[:PROXIES_TO {http_status: 504}]->(b);',
        '',
        'MATCH (a {id: "payment_service"}), (b {id: "auth_service"})',
        'MERGE (a)-[:VALIDATES_TOKEN {state: "TIMED_OUT"}]->(b);',
        '',
        'MATCH (a {id: "payment_service"}), (b {id: "circuit_breaker"})',
        'MERGE (a)-[:TRIPS_STATE {target: "OPEN"}]->(b);',
        '',
        'MATCH (a {id: "api_gateway"}), (b {id: "pagerduty_router"})',
        'MERGE (a)-[:DISPATCHES_ALERT {severity: "SEV-1"}]->(b);'
      ]
    }
  },
  {
    id: 'cloud-serverless',
    name: 'Cloud-Native Event-Driven Architecture',
    subtitle: 'Serverless web application with Lambda, DynamoDB, SQS, and OpenSearch',
    description: 'Cloud API specification mapping AWS edge routing, authentication lambdas, async decoupling, and event bus indexing.',
    suggestedQuestions: [
      'Which services are triggered asynchronously by SQS queues?',
      'Show the complete read path from CloudFront to DynamoDB',
      'Find all components interfacing with the OpenSearch indexing engine'
    ],
    sourceText: `Architecture Whitepaper: Event-Driven Serverless Commerce Platform

1. Edge & Entry:
User requests hit the CloudFront CDN (cloudfront_cdn) with edge TLS termination. Dynamic requests route to the Amazon API Gateway (api_gw), which executes an upfront Lambda Authorizer (lambda_authorizer) validating RS256 JWT claims from Cognito.

2. Application Core:
Authorized REST requests are dispatched to the Order Processing Lambda (order_lambda). The Order Lambda executes ACID transactions against Amazon DynamoDB (dynamodb_orders) with single-table design.

3. Asynchronous Fanout & Search:
DynamoDB Streams publish row-level mutations into an Amazon EventBridge Event Bus (eventbridge_bus). The Event Bus routes order-created events to an SQS Settlement Queue (sqs_orders) for asynchronous billing, while forwarding audit payloads to an OpenSearch Ingestion Lambda (opensearch_indexer) that maintains real-time full-text search indexes in an OpenSearch Cluster (opensearch_cluster).`,
    initialGraph: {
      summary: 'Cloud-native serverless architecture with edge CDN, authorizer, DynamoDB single-table persistence, EventBridge pub/sub, and OpenSearch.',
      nodes: [
        {
          id: 'cloudfront_cdn',
          label: 'Amazon CloudFront CDN',
          type: 'GATEWAY',
          description: 'Global edge network caching static assets and terminating TLS.',
          properties: { locations: 450, ssl: 'TLS 1.3' }
        },
        {
          id: 'api_gw',
          label: 'Amazon API Gateway',
          type: 'GATEWAY',
          description: 'Managed REST API interface handling throttling and request validation.',
          properties: { protocol: 'HTTP/REST', rate_limit: '10,000 rps' }
        },
        {
          id: 'lambda_authorizer',
          label: 'Lambda Authorizer',
          type: 'SERVICE',
          description: 'Edge token validation function inspecting signed RS256 JWTs.',
          properties: { runtime: 'Node.js 20', cache_ttl: '300s' }
        },
        {
          id: 'order_lambda',
          label: 'Order Processing Lambda',
          type: 'SERVICE',
          description: 'Core compute function orchestrating checkout transactions.',
          properties: { memory: '1024MB', concurrency: 'Provisioned 50' }
        },
        {
          id: 'dynamodb_orders',
          label: 'DynamoDB Single-Table',
          type: 'DATABASE',
          description: 'NoSQL persistence tier with on-demand capacity and streams enabled.',
          properties: { billing: 'Pay-per-request', streams: 'NEW_AND_OLD_IMAGES' }
        },
        {
          id: 'eventbridge_bus',
          label: 'EventBridge Bus',
          type: 'QUEUE',
          description: 'Serverless event bus routing domain events across account boundaries.',
          properties: { schema_discovery: 'Active' }
        },
        {
          id: 'sqs_orders',
          label: 'SQS Settlement Queue',
          type: 'QUEUE',
          description: 'Dead-letter-queue backed FIFO buffer for payment processing.',
          properties: { type: 'FIFO', retention: '14 days' }
        },
        {
          id: 'opensearch_indexer',
          label: 'OpenSearch Indexer Lambda',
          type: 'SERVICE',
          description: 'Micro-batch consumer writing normalized document records into search.',
          properties: { batch_size: 100 }
        },
        {
          id: 'opensearch_cluster',
          label: 'OpenSearch Cluster',
          type: 'DATABASE',
          description: 'Full-text analytics and customer order search engine.',
          properties: { version: '2.11', nodes: 3 }
        }
      ],
      edges: [
        {
          id: 'ce1',
          source: 'cloudfront_cdn',
          target: 'api_gw',
          relationship: 'ROUTES_TO',
          description: 'Origin request forwarding',
          properties: { protocol: 'HTTPS' }
        },
        {
          id: 'ce2',
          source: 'api_gw',
          target: 'lambda_authorizer',
          relationship: 'AUTHENTICATES_VIA',
          description: 'Validates bearer token before routing',
          properties: { type: 'TOKEN' }
        },
        {
          id: 'ce3',
          source: 'api_gw',
          target: 'order_lambda',
          relationship: 'INVOKES',
          description: 'Direct synchronous proxy invocation',
          properties: { method: 'POST /orders' }
        },
        {
          id: 'ce4',
          source: 'order_lambda',
          target: 'dynamodb_orders',
          relationship: 'TRANSACT_WRITE',
          description: 'Idempotent PutItem order record',
          properties: { consistency: 'Strong' }
        },
        {
          id: 'ce5',
          source: 'dynamodb_orders',
          target: 'eventbridge_bus',
          relationship: 'PIPES_STREAM_TO',
          description: 'DynamoDB Streams to EventBridge pipe',
          properties: { pattern: 'OrderCreated' }
        },
        {
          id: 'ce6',
          source: 'eventbridge_bus',
          target: 'sqs_orders',
          relationship: 'ENQUEUES_TO',
          description: 'Routes billing events to payment queue',
          properties: { rule: 'order.status == created' }
        },
        {
          id: 'ce7',
          source: 'eventbridge_bus',
          target: 'opensearch_indexer',
          relationship: 'TRIGGERS_INDEXING',
          description: 'Invokes search sync lambda',
          properties: { filter: 'order.*' }
        },
        {
          id: 'ce8',
          source: 'opensearch_indexer',
          target: 'opensearch_cluster',
          relationship: 'BULK_INDEXES',
          description: 'Writes customer search document index',
          properties: { index: 'orders-v1' }
        }
      ],
      cypherStatements: [
        'CREATE CONSTRAINT serverless_node_id IF NOT EXISTS FOR (n:CloudResource) REQUIRE n.id IS UNIQUE;',
        '',
        'MERGE (cdn:Gateway {id: "cloudfront_cdn"}) ON CREATE SET cdn.name = "Amazon CloudFront CDN", cdn.type = "GATEWAY";',
        'MERGE (gw:Gateway {id: "api_gw"}) ON CREATE SET gw.name = "Amazon API Gateway", gw.type = "GATEWAY";',
        'MERGE (auth:Service {id: "lambda_authorizer"}) ON CREATE SET auth.name = "Lambda Authorizer", auth.type = "SERVICE";',
        'MERGE (fn:Service {id: "order_lambda"}) ON CREATE SET fn.name = "Order Processing Lambda", fn.type = "SERVICE";',
        'MERGE (db:Database {id: "dynamodb_orders"}) ON CREATE SET db.name = "DynamoDB Single-Table", db.type = "DATABASE";',
        'MERGE (bus:Queue {id: "eventbridge_bus"}) ON CREATE SET bus.name = "EventBridge Bus", bus.type = "QUEUE";',
        'MERGE (q:Queue {id: "sqs_orders"}) ON CREATE SET q.name = "SQS Settlement Queue", q.type = "QUEUE";',
        'MERGE (idx:Service {id: "opensearch_indexer"}) ON CREATE SET idx.name = "OpenSearch Indexer Lambda", idx.type = "SERVICE";',
        'MERGE (search:Database {id: "opensearch_cluster"}) ON CREATE SET search.name = "OpenSearch Cluster", search.type = "DATABASE";',
        '',
        'MATCH (a {id: "cloudfront_cdn"}), (b {id: "api_gw"}) MERGE (a)-[:ROUTES_TO]->(b);',
        'MATCH (a {id: "api_gw"}), (b {id: "lambda_authorizer"}) MERGE (a)-[:AUTHENTICATES_VIA]->(b);',
        'MATCH (a {id: "api_gw"}), (b {id: "order_lambda"}) MERGE (a)-[:INVOKES]->(b);',
        'MATCH (a {id: "order_lambda"}), (b {id: "dynamodb_orders"}) MERGE (a)-[:TRANSACT_WRITE]->(b);',
        'MATCH (a {id: "dynamodb_orders"}), (b {id: "eventbridge_bus"}) MERGE (a)-[:PIPES_STREAM_TO]->(b);',
        'MATCH (a {id: "eventbridge_bus"}), (b {id: "sqs_orders"}) MERGE (a)-[:ENQUEUES_TO]->(b);',
        'MATCH (a {id: "eventbridge_bus"}), (b {id: "opensearch_indexer"}) MERGE (a)-[:TRIGGERS_INDEXING]->(b);',
        'MATCH (a {id: "opensearch_indexer"}), (b {id: "opensearch_cluster"}) MERGE (a)-[:BULK_INDEXES]->(b);'
      ]
    }
  }
];
