// Pre-configured Job Role Templates and Question Banks with explicit rubrics and adaptive branching triggers

const JOB_TEMPLATES = [
  {
    id: 'backend-systems-engineer',
    title: 'Senior Backend Systems Engineer',
    description: 'Design and build high-throughput backend services, distributed systems, resilient caching, and optimized database queries in Python and modern architectures.',
    candidateProfile: 'Alex Chen - 3.5 years of experience building Python microservices, caching layers, and relational databases.',
    competencies: [
      {
        id: 'comp_algo_complexity',
        name: 'Data Structures & Algorithmic Complexity',
        category: 'Core Computer Science',
        description: 'Demonstrating correct asymptotic analysis, optimal data structure selection (hash maps, heaps, trees), and space-time trade-offs.',
        weight: 1.2
      },
      {
        id: 'comp_concurrency_io',
        name: 'Concurrency & Asynchronous I/O',
        category: 'Systems Engineering',
        description: 'Understanding event loops, threads vs processes, race conditions, synchronization primitives, and non-blocking I/O.',
        weight: 1.1
      },
      {
        id: 'comp_db_optimization',
        name: 'Database & Query Optimization',
        category: 'Data Persistence',
        description: 'Relational indexing mechanics (B-Trees), query plan analysis, connection pooling, and transactional isolation.',
        weight: 1.0
      },
      {
        id: 'comp_system_architecture',
        name: 'System Architecture & Scalability',
        category: 'Distributed Systems',
        description: 'Decoupling, message queuing, backpressure, idempotency, caching tiers, and failure isolation.',
        weight: 1.3
      },
      {
        id: 'comp_reliability_fault',
        name: 'Error Handling & Reliability',
        category: 'Operational Engineering',
        description: 'Graceful degradation, circuit breakers, dead-letter queues, idempotent retries, and defensive error propagation.',
        weight: 0.9
      }
    ],
    questions: [
      // 1. Data Structures & Algorithmic Complexity (Primary)
      {
        id: 'q_algo_lru_concept',
        competency_id: 'comp_algo_complexity',
        title: 'In-Memory LRU Cache Structure & Complexity',
        type: 'conceptual',
        difficulty: 'intermediate',
        is_initial: 1,
        prompt: 'Explain how you would design an in-memory Least Recently Used (LRU) Cache from scratch. Which data structures are required to guarantee both O(1) get and O(1) put operations, and why is a simple array or single hash map insufficient?',
        rubric_criteria: [
          {
            id: 'crit_hash_doubly_linked',
            name: 'Dual Structure Synergy (Hash Map + Doubly Linked List)',
            description: 'Explains combining a Hash Map for O(1) key lookup with a Doubly Linked List for O(1) node removal and insertion at head/tail.',
            keywords: ['hash map', 'hash table', 'doubly linked list', 'linked list', 'pointers', 'nodes', 'head', 'tail', 'o(1)']
          },
          {
            id: 'crit_algo_time_complexity',
            name: 'Rigorous O(1) Asymptotic Analysis',
            description: 'Explicitly analyzes time complexity for get, put, and eviction, explaining why singly linked list would require O(N) traversal to delete previous node.',
            keywords: ['o(1)', 'constant time', 'time complexity', 'previous pointer', 'prev pointer', 'traversal', 'o(n)']
          },
          {
            id: 'crit_lru_edge_cases',
            name: 'Eviction Order & Boundary Handling',
            description: 'Identifies boundary conditions: updating recently accessed nodes, updating existing keys vs inserting new keys, and evicting from tail when capacity exceeded.',
            keywords: ['capacity', 'evict', 'tail', 'least recently', 'boundary', 'update', 'full']
          }
        ],
        follow_up_triggers: {
          on_missing: {
            crit_algo_time_complexity: 'q_algo_complexity_deepdive',
            crit_lru_edge_cases: 'q_algo_boundary_cases'
          },
          on_demonstrated: {
            all: 'q_concurrency_event_loop'
          }
        }
      },
      // 1. Data Structures (Follow-up Deep Dive)
      {
        id: 'q_algo_complexity_deepdive',
        competency_id: 'comp_algo_complexity',
        title: 'Algorithmic Complexity & Pointer Mechanics Deep Dive',
        type: 'conceptual',
        difficulty: 'intermediate',
        is_initial: 0,
        prompt: 'Let us drill down into the asymptotic complexity. Specifically, what happens if hash collisions occur in the lookup table, and why exactly does a singly linked list fail to deliver O(1) deletion when evicting an arbitrary node?',
        rubric_criteria: [
          {
            id: 'crit_singly_vs_doubly',
            name: 'Singly vs Doubly Linked List Deletion Mechanics',
            description: 'Explains that deleting a node from a singly linked list requires finding the predecessor node, which is O(N) unless you have a pointer to the predecessor.',
            keywords: ['predecessor', 'previous node', 'singly', 'o(n)', 'traverse', 'pointer', 'before']
          },
          {
            id: 'crit_hash_collision_amortization',
            name: 'Hash Collision Degradation & Amortization',
            description: 'Explains chaining or open addressing where worst-case lookup can degrade to O(N) or O(K), but average/amortized is O(1).',
            keywords: ['collision', 'chaining', 'buckets', 'amortized', 'worst case', 'o(n)', 'o(k)']
          }
        ],
        follow_up_triggers: {
          on_demonstrated: {
            all: 'q_concurrency_event_loop'
          }
        }
      },
      // 1. Data Structures (Boundary Cases)
      {
        id: 'q_algo_boundary_cases',
        competency_id: 'comp_algo_complexity',
        title: 'LRU Cache State Mutation & Edge Cases',
        type: 'scenario',
        difficulty: 'intermediate',
        is_initial: 0,
        prompt: 'In your LRU cache design, walk through the exact pointer re-linking sequence when an existing key is accessed again versus when a brand new key is inserted at max capacity.',
        rubric_criteria: [
          {
            id: 'crit_relink_sequence',
            name: 'Pointer Re-linking Sequence',
            description: 'Describes detaching the node by updating node.prev.next and node.next.prev, then placing it at the head.',
            keywords: ['prev.next', 'next.prev', 'detach', 'relink', 'head', 'splice']
          },
          {
            id: 'crit_capacity_eviction_step',
            name: 'Atomic Eviction Step',
            description: 'Removes the tail node from both the doubly linked list and removes the key from the dictionary.',
            keywords: ['tail', 'delete from map', 'remove from dictionary', 'capacity']
          }
        ],
        follow_up_triggers: {
          on_demonstrated: {
            all: 'q_concurrency_event_loop'
          }
        }
      },
      // 1. Data Structures (Hands-on Coding)
      {
        id: 'q_code_lru_python',
        competency_id: 'comp_algo_complexity',
        title: 'Hands-on Coding: Implement LRU Cache in Python',
        type: 'code_challenge',
        difficulty: 'advanced',
        is_initial: 0,
        prompt: 'Implement an LRUCache class in Python with `get(key)` and `put(key, value)`. It must support initial capacity, return -1 if key not found, update usage on both get and put, and evict the least recently used item when capacity is exceeded.',
        starter_code: `class Node:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        # Hint: Initialize dummy head and tail nodes
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def get(self, key: int) -> int:
        # TODO: Return value and move to head, or return -1
        return -1

    def put(self, key: int, value: int) -> None:
        # TODO: Insert or update, move to head, handle eviction if size > capacity
        pass
`,
        test_cases: JSON.stringify([
          {
            name: 'Basic Put & Get',
            code: 'cache = LRUCache(2); cache.put(1, 1); cache.put(2, 2); assert cache.get(1) == 1, f"Expected 1, got {cache.get(1)}"'
          },
          {
            name: 'Eviction on Capacity Exceeded',
            code: 'cache = LRUCache(2); cache.put(1, 1); cache.put(2, 2); cache.put(3, 3); assert cache.get(1) == -1, f"Expected key 1 evicted, got {cache.get(1)}"'
          },
          {
            name: 'Get Updates Recency (Prevents Eviction)',
            code: 'cache = LRUCache(2); cache.put(1, 1); cache.put(2, 2); cache.get(1); cache.put(3, 3); assert cache.get(1) == 1 and cache.get(2) == -1, "Key 1 should be preserved and key 2 evicted"'
          },
          {
            name: 'Update Existing Key Value and Recency',
            code: 'cache = LRUCache(2); cache.put(1, 10); cache.put(1, 20); assert cache.get(1) == 20, "Existing key value should update"'
          }
        ]),
        rubric_criteria: [
          {
            id: 'crit_code_lru_tests_pass',
            name: 'Functional Correctness & Unit Test Execution',
            description: 'All unit test cases pass cleanly without runtime exceptions or assertion errors.',
            keywords: ['pass', 'tests passed', 'correct', 'clean execution']
          },
          {
            id: 'crit_code_lru_o1_design',
            name: 'O(1) Data Structure Implementation',
            description: 'Uses hash map plus doubly linked list pointer manipulation rather than list.remove or linear scan.',
            keywords: ['head', 'tail', 'prev', 'next', 'node', 'dict', 'hash map']
          }
        ]
      },

      // 2. Concurrency & Asynchronous I/O (Primary)
      {
        id: 'q_concurrency_event_loop',
        competency_id: 'comp_concurrency_io',
        title: 'Asynchronous I/O Event Loops & Blocking Pitfalls',
        type: 'conceptual',
        difficulty: 'intermediate',
        is_initial: 1,
        prompt: 'In asynchronous frameworks (such as Python asyncio or Node.js), explain how cooperative multitasking functions. What happens when a developer mistakenly executes a heavy CPU-bound computation or synchronous file read inside an async handler, and how do you mitigate this?',
        rubric_criteria: [
          {
            id: 'crit_cooperative_event_loop',
            name: 'Cooperative Event Loop Scheduling',
            description: 'Explains that coroutines cooperatively yield control via await/yield to the single-threaded event loop during I/O operations.',
            keywords: ['event loop', 'cooperative', 'yield', 'await', 'non-blocking', 'single thread', 'io']
          },
          {
            id: 'crit_cpu_bound_starvation',
            name: 'Event Loop Blocking & Starvation Mechanics',
            description: 'Identifies that CPU-bound operations run synchronously on the main thread, blocking the event loop from scheduling other tasks.',
            keywords: ['blocks the event loop', 'starvation', 'freeze', 'stall', 'synchronous', 'cpu bound', 'latency spike']
          },
          {
            id: 'crit_worker_thread_mitigation',
            name: 'Offloading Strategies (Process/Thread Pools)',
            description: 'Recommends offloading CPU tasks to run_in_executor, ProcessPoolExecutor, worker threads, or background task queues.',
            keywords: ['processpool', 'threadpool', 'executor', 'run_in_executor', 'worker', 'celery', 'background']
          }
        ],
        follow_up_triggers: {
          on_missing: {
            crit_worker_thread_mitigation: 'q_concurrency_race_conditions'
          },
          on_demonstrated: {
            all: 'q_db_b_tree_indexing'
          }
        }
      },
      // 2. Concurrency (Follow-up)
      {
        id: 'q_concurrency_race_conditions',
        competency_id: 'comp_concurrency_io',
        title: 'Race Conditions & Synchronization Primitives',
        type: 'scenario',
        difficulty: 'intermediate',
        is_initial: 0,
        prompt: 'Consider two concurrent requests attempting to decrement a user account balance simultaneously. Explain the Check-Then-Act race condition, and discuss two different synchronization techniques to prevent double-spending.',
        rubric_criteria: [
          {
            id: 'crit_check_then_act',
            name: 'Check-Then-Act Race Condition Explanation',
            description: 'Explains how interleaved reads and writes allow both requests to observe sufficient balance before either decrements.',
            keywords: ['race condition', 'interleaved', 'check then act', 'read', 'write', 'stale']
          },
          {
            id: 'crit_pessimistic_vs_optimistic',
            name: 'Pessimistic vs Optimistic Locking',
            description: 'Compares database row-level locking (SELECT FOR UPDATE) with optimistic locking using version numbers or atomic SQL decrement.',
            keywords: ['select for update', 'pessimistic', 'optimistic', 'version', 'atomic', 'isolation', 'mutex']
          }
        ],
        follow_up_triggers: {
          on_demonstrated: {
            all: 'q_db_b_tree_indexing'
          }
        }
      },

      // 3. Database & Query Optimization (Primary)
      {
        id: 'q_db_b_tree_indexing',
        competency_id: 'comp_db_optimization',
        title: 'Composite B-Tree Indexes & Leftmost Prefix Rule',
        type: 'conceptual',
        difficulty: 'intermediate',
        is_initial: 1,
        prompt: 'Suppose a relational database table has a composite index on (tenant_id, status, created_at). Explain the leftmost prefix rule. If a developer runs a query filtering WHERE status = "ACTIVE" ORDER BY created_at, will this query utilize the index effectively? Why or why not?',
        rubric_criteria: [
          {
            id: 'crit_leftmost_prefix',
            name: 'Leftmost Prefix Rule Mechanics',
            description: 'Explains that B-Tree composite keys are sorted hierarchically starting with the leading column (tenant_id). Skipping tenant_id means the tree cannot be binary-searched.',
            keywords: ['leftmost prefix', 'leading column', 'hierarchical', 'sorted order', 'tenant_id', 'cannot use', 'b-tree']
          },
          {
            id: 'crit_table_scan_fallback',
            name: 'Index Skip / Full Table Scan Fallback',
            description: 'Identifies that the query optimizer will either perform a full index scan or fall back to a full table scan and filesort.',
            keywords: ['full table scan', 'full index scan', 'filesort', 'fallback', 'unindexed', 'expensive']
          },
          {
            id: 'crit_query_remediation',
            name: 'Targeted Remediation & Index Design',
            description: 'Suggests creating an index beginning with status (e.g., (status, created_at)) or passing tenant_id in the predicate.',
            keywords: ['new index', 'composite', 'status, created_at', 'remediation', 'filter tenant_id']
          }
        ],
        follow_up_triggers: {
          on_missing: {
            crit_table_scan_fallback: 'q_db_query_plan_pooling'
          },
          on_demonstrated: {
            all: 'q_arch_webhook_ingestion'
          }
        }
      },
      // 3. Database (Follow-up)
      {
        id: 'q_db_query_plan_pooling',
        competency_id: 'comp_db_optimization',
        title: 'Query Execution Plans & Connection Pool Sizing',
        type: 'scenario',
        difficulty: 'intermediate',
        is_initial: 0,
        prompt: 'How do you inspect a slow SQL query using EXPLAIN ANALYZE? Furthermore, explain how sizing an application connection pool too large can paradoxically degrade database throughput due to context switching and lock contention.',
        rubric_criteria: [
          {
            id: 'crit_explain_analyze_metrics',
            name: 'Execution Plan Cost & Scan Analysis',
            description: 'Explains interpreting Seq Scan vs Index Scan, rows estimated vs actual, and execution buffer hits in EXPLAIN output.',
            keywords: ['explain', 'analyze', 'seq scan', 'index scan', 'cost', 'actual time', 'buffers', 'rows']
          },
          {
            id: 'crit_connection_pool_sizing',
            name: 'Connection Pool Sizing & CPU Contention',
            description: 'Explains that oversized pools cause thrashing, CPU context switching, memory pressure, and lock contention on disk I/O.',
            keywords: ['context switch', 'pool size', 'contention', 'cpu cores', 'thrashing', 'hikari', 'bottleneck']
          }
        ],
        follow_up_triggers: {
          on_demonstrated: {
            all: 'q_arch_webhook_ingestion'
          }
        }
      },

      // 4. System Architecture & Scalability (Primary)
      {
        id: 'q_arch_webhook_ingestion',
        competency_id: 'comp_system_architecture',
        title: 'High-Throughput Ingestion & Backpressure Architecture',
        type: 'scenario',
        difficulty: 'advanced',
        is_initial: 1,
        prompt: 'You are designing an ingestion system that receives 50,000 incoming webhook requests per second during flash sales. Your downstream database can only handle 4,000 writes per second. How do you architect this system to guarantee zero message loss, protect the database, and handle downstream failures?',
        rubric_criteria: [
          {
            id: 'crit_message_buffering',
            name: 'Asynchronous Durable Message Queue / Buffer',
            description: 'Places a high-throughput message streaming buffer (Kafka, AWS Kinesis, RabbitMQ) between HTTP ingest and database workers.',
            keywords: ['kafka', 'message queue', 'sqs', 'rabbitmq', 'buffer', 'streaming', 'decouple', 'durable']
          },
          {
            id: 'crit_backpressure_batching',
            name: 'Backpressure & Micro-Batching Ingestion',
            description: 'Explains consumers reading at a controlled rate, batching multiple writes into bulk database inserts to minimize transactions.',
            keywords: ['backpressure', 'batch', 'bulk insert', 'rate limiting', 'controlled rate', 'throttle']
          },
          {
            id: 'crit_idempotency_dlq',
            name: 'Idempotency & Dead Letter Queue (DLQ)',
            description: 'Implements idempotency keys to handle duplicate webhook deliveries safely and uses a DLQ for permanently failing records.',
            keywords: ['idempotency', 'deduplication', 'dlq', 'dead letter', 'retry', 'exponential backoff']
          }
        ],
        follow_up_triggers: {
          on_missing: {
            crit_backpressure_batching: 'q_arch_cache_invalidation'
          },
          on_demonstrated: {
            all: 'q_reliability_circuit_breaker'
          }
        }
      },
      // 4. System Architecture (Follow-up)
      {
        id: 'q_arch_cache_invalidation',
        competency_id: 'comp_system_architecture',
        title: 'Distributed Caching Tiers & Invalidation Patterns',
        type: 'scenario',
        difficulty: 'intermediate',
        is_initial: 0,
        prompt: 'In a distributed microservice setup with Redis, compare the Cache-Aside pattern with Write-Through caching. How do you prevent cache stampedes (thundering herd) and ensure eventual consistency when data updates?',
        rubric_criteria: [
          {
            id: 'crit_cache_aside_vs_write_through',
            name: 'Cache-Aside vs Write-Through Patterns',
            description: 'Contrasts lazy loading on cache miss (Cache-Aside) with synchronous cache and database writes (Write-Through).',
            keywords: ['cache aside', 'write through', 'lazy load', 'redis', 'ttl', 'stale']
          },
          {
            id: 'crit_thundering_herd_mitigation',
            name: 'Thundering Herd & Lock Mutex Prevention',
            description: 'Explains using distributed mutex locks or probabilistic early expiration to prevent thousands of simultaneous queries hitting the database.',
            keywords: ['stampede', 'thundering herd', 'mutex', 'lock', 'probabilistic', 'single flight']
          }
        ],
        follow_up_triggers: {
          on_demonstrated: {
            all: 'q_reliability_circuit_breaker'
          }
        }
      },

      // 5. Error Handling & Reliability (Primary)
      {
        id: 'q_reliability_circuit_breaker',
        competency_id: 'comp_reliability_fault',
        title: 'Cascading Failures & Circuit Breaker Pattern',
        type: 'scenario',
        difficulty: 'intermediate',
        is_initial: 1,
        prompt: 'In a microservice architecture, Service A calls Service B synchronously. Service B becomes unresponsive and latency spikes to 30 seconds. How does this cascade into a total system outage, and how does the Circuit Breaker pattern with fallback responses prevent it?',
        rubric_criteria: [
          {
            id: 'crit_thread_pool_exhaustion',
            name: 'Cascading Outage & Resource Exhaustion',
            description: 'Explains that waiting for timeouts exhausts Service A connection pools and worker threads, causing Service A to also fail to serve upstream clients.',
            keywords: ['thread exhaustion', 'connection pool', 'timeout', 'cascade', 'pile up', 'resources depleted', 'outage']
          },
          {
            id: 'crit_circuit_states',
            name: 'Circuit Breaker State Machine Mechanics',
            description: 'Describes the three states: Closed (normal), Open (fast fail without calling B), and Half-Open (trial requests to test recovery).',
            keywords: ['closed', 'open', 'half-open', 'fast fail', 'threshold', 'trial', 'recovery']
          },
          {
            id: 'crit_graceful_fallback',
            name: 'Graceful Degradation & Fallback Strategy',
            description: 'Describes returning cached data, degraded responses, or queuing operations instead of throwing 500 errors to end users.',
            keywords: ['fallback', 'degraded', 'cache', 'graceful degradation', 'default response']
          }
        ],
        follow_up_triggers: {
          on_missing: {
            crit_circuit_states: 'q_reliability_idempotent_retries'
          }
        }
      },
      // 5. Error Handling (Follow-up)
      {
        id: 'q_reliability_idempotent_retries',
        competency_id: 'comp_reliability_fault',
        title: 'Idempotent Retries & Exponential Backoff with Jitter',
        type: 'conceptual',
        difficulty: 'intermediate',
        is_initial: 0,
        prompt: 'Why can naive immediate retries on failed HTTP calls create a self-inflicted denial-of-service attack? Explain how exponential backoff with full jitter and idempotency keys solve this.',
        rubric_criteria: [
          {
            id: 'crit_retry_storm_mechanics',
            name: 'Retry Storms & Self-Inflicted Amplification',
            description: 'Explains that synchronized retries multiply load on already struggling downstream systems, preventing recovery.',
            keywords: ['retry storm', 'amplification', 'thundering', 'ddos', 'synchronized', 'overload']
          },
          {
            id: 'crit_backoff_jitter_solution',
            name: 'Exponential Backoff with Full Jitter',
            description: 'Explains compounding delay intervals combined with random noise (jitter) to de-synchronize retry requests.',
            keywords: ['exponential backoff', 'jitter', 'random', 'decorrelate', 'delay', 'desynchronize']
          }
        ]
      }
    ]
  },
  {
    id: 'fullstack-web-architect',
    title: 'Full-Stack Web Architect',
    description: 'Design responsive web applications, secure REST/GraphQL APIs, manage browser rendering performance, and architect state management and caching.',
    candidateProfile: 'Jordan Lee - 4 years full-stack development with React, Node.js, REST API design, and distributed caching.',
    competencies: [
      {
        id: 'comp_web_performance',
        name: 'Browser Rendering & Frontend Performance',
        category: 'Client Architecture',
        description: 'Critical rendering path, bundle optimization, hydration, memoization, and Core Web Vitals.',
        weight: 1.2
      },
      {
        id: 'comp_api_security',
        name: 'API Design & Authentication Security',
        category: 'API Engineering',
        description: 'REST conventions, JWT vs session cookies, CSRF/XSS mitigations, and rate limiting.',
        weight: 1.1
      },
      {
        id: 'comp_state_caching',
        name: 'Client & Server State Synchronization',
        category: 'Data Architecture',
        description: 'Optimistic updates, cache invalidation (stale-while-revalidate), and conflict resolution.',
        weight: 1.0
      }
    ],
    questions: [
      // 1. Browser Performance (Primary)
      {
        id: 'q_web_crp_optimization',
        competency_id: 'comp_web_performance',
        title: 'Critical Rendering Path & Bundle Performance',
        type: 'conceptual',
        difficulty: 'intermediate',
        is_initial: 1,
        prompt: 'Explain the browser Critical Rendering Path from HTML parsing to pixel paint. What causes layout thrashing (forced reflow), and what architectural techniques ensure high Core Web Vitals (LCP, INP, CLS)?',
        rubric_criteria: [
          {
            id: 'crit_crp_pipeline',
            name: 'DOM/CSSOM to Render Tree & Paint Pipeline',
            description: 'Walks through DOM construction, CSSOM creation, Render Tree calculation, Layout (reflow), and Painting.',
            keywords: ['dom', 'cssom', 'render tree', 'layout', 'reflow', 'paint', 'composite']
          },
          {
            id: 'crit_forced_reflow',
            name: 'Layout Thrashing / Forced Synchronous Reflow',
            description: 'Explains reading geometric properties (offsetWidth, clientHeight) immediately after mutating the DOM.',
            keywords: ['forced reflow', 'layout thrashing', 'offsetwidth', 'getboundingclientrect', 'interleaved read write']
          },
          {
            id: 'crit_web_vitals_tactics',
            name: 'Concrete Web Vitals Optimization',
            description: 'Suggests code splitting, font-display: swap, fixed dimensions for media (CLS), and minimizing long tasks for INP.',
            keywords: ['lcp', 'inp', 'cls', 'code splitting', 'dimensions', 'font-display', 'lazy loading']
          }
        ],
        follow_up_triggers: {
          on_demonstrated: {
            all: 'q_api_jwt_csrf_security'
          }
        }
      },
      // 2. API Security (Primary)
      {
        id: 'q_api_jwt_csrf_security',
        competency_id: 'comp_api_security',
        title: 'Authentication Architecture: JWT vs HttpOnly Session Cookies',
        type: 'conceptual',
        difficulty: 'intermediate',
        is_initial: 1,
        prompt: 'Compare storing authentication tokens in browser localStorage versus HttpOnly SameSite cookies. How do you defend modern web applications against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF)?',
        rubric_criteria: [
          {
            id: 'crit_storage_xss_vulnerability',
            name: 'LocalStorage XSS Vulnerability Analysis',
            description: 'Explains that JavaScript can read localStorage, allowing malicious injected scripts to exfiltrate bearer tokens.',
            keywords: ['localstorage', 'xss', 'script injection', 'exfiltrate', 'token theft', 'javascript access']
          },
          {
            id: 'crit_httponly_samesite_defense',
            name: 'HttpOnly SameSite Cookie Defenses',
            description: 'Explains that HttpOnly cookies cannot be accessed by JS, and SameSite=Lax/Strict prevents unauthorized cross-origin cookie attachment.',
            keywords: ['httponly', 'samesite', 'csrf', 'strict', 'lax', 'cookie protection']
          }
        ],
        follow_up_triggers: {
          on_demonstrated: {
            all: 'q_state_optimistic_swr'
          }
        }
      },
      // 3. State Synchronization (Primary)
      {
        id: 'q_state_optimistic_swr',
        competency_id: 'comp_state_caching',
        title: 'Optimistic UI Updates & Cache Invalidation',
        type: 'scenario',
        difficulty: 'intermediate',
        is_initial: 1,
        prompt: 'Explain the mechanics of Optimistic UI updates in frontend state managers (such as TanStack Query or SWR). How do you handle rollback on network error, and how does stale-while-revalidate maintain responsive user experience?',
        rubric_criteria: [
          {
            id: 'crit_optimistic_mutation_flow',
            name: 'Optimistic Mutation & Rollback Mechanics',
            description: 'Describes updating local state immediately, saving previous snapshot context, and rolling back if server responds with error.',
            keywords: ['optimistic', 'rollback', 'snapshot', 'mutation', 'immediate update', 'previous state']
          },
          {
            id: 'crit_swr_caching_lifecycle',
            name: 'Stale-While-Revalidate Caching Lifecycle',
            description: 'Explains returning cached data instantly while silently fetching fresh data in the background to revalidate.',
            keywords: ['stale-while-revalidate', 'swr', 'revalidate', 'background fetch', 'cache invalidation']
          }
        ]
      }
    ]
  }
];

module.exports = {
  JOB_TEMPLATES
};
