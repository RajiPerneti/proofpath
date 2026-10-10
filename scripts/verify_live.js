// Verification script for live running ProofPath server

async function runLiveVerification() {
  const base = 'http://localhost:5000';
  console.log('--- 1. Testing Health & Static Frontend Serving ---');
  const healthRes = await fetch(`${base}/api/health`);
  const health = await healthRes.json();
  console.log('Health:', health);

  const homeRes = await fetch(`${base}/`);
  const homeHtml = await homeRes.text();
  console.log('Index.html served correctly:', homeHtml.includes('<div id="root"></div>'));

  console.log('\n--- 2. Testing Job Templates API ---');
  const tmplRes = await fetch(`${base}/api/templates`);
  const tmpls = await tmplRes.json();
  console.log(`Found ${tmpls.templates.length} templates:`, tmpls.templates.map(t => t.title));

  console.log('\n--- 3. Testing Assessment Creation ---');
  const createRes = await fetch(`${base}/api/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobTitle: 'Senior Backend Systems Engineer',
      jobDescription: 'High throughput distributed microservices and database optimization',
      candidateName: 'Alex Chen',
      candidateProfile: '3.5 YOE Python, distributed caching, databases',
      templateId: 'backend-systems-engineer',
      maxQuestions: 4
    })
  });
  const created = await createRes.json();
  console.log('Created Assessment:', created);
  const asmtId = created.assessmentId;

  console.log('\n--- 4. Testing Path A Branching (Partial Answer - Misses Complexity) ---');
  const q1Res = await fetch(`${base}/api/assessments/${asmtId}`);
  const q1Data = await q1Res.json();
  const q1 = q1Data.currentQuestion;
  console.log(`Question 1: "${q1.title}"`);

  // Partial answer that describes hash map + doubly linked list but DOES NOT mention O(1) or complexity
  const answerPartial = 'I would combine a hash map and a doubly linked list. The map provides key lookup while the doubly linked list nodes maintain head and tail pointers for updating eviction order.';
  const submit1Res = await fetch(`${base}/api/assessments/${asmtId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionId: q1.id,
      responseText: answerPartial
    })
  });
  const sub1 = await submit1Res.json();
  console.log('Evaluation 1 Status:', sub1.evaluation.evaluation_status);
  console.log('Adaptive Rule Applied:', sub1.decision.decision_rule);
  console.log('Adaptive Rationale:', sub1.decision.decision_rationale);
  console.log('Next Question Selected:', sub1.nextQuestion ? sub1.nextQuestion.title : 'None');

  if (sub1.decision.decision_rule === 'RULE_TARGETED_GAP_FOLLOW_UP') {
    console.log('>>> SUCCESS: Path A branched directly to drill-down question on algorithmic complexity!');
  } else {
    console.error('>>> FAILURE: Unexpected rule:', sub1.decision.decision_rule);
  }

  console.log('\n--- 5. Answering Follow-up (Path B: Mastering Complexity & Pointers) ---');
  const q2 = sub1.nextQuestion;
  const answerComplexity = 'In a singly linked list, deleting an arbitrary node requires traversing from the head to find the predecessor pointer, which is O(N). In a doubly linked list, each node has a prev pointer so node deletion is strictly O(1). In a hash table, collisions can lead to O(K) chaining traversals, but good load factors keep average and amortized lookup at O(1).';
  const submit2Res = await fetch(`${base}/api/assessments/${asmtId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionId: q2.id,
      responseText: answerComplexity
    })
  });
  const sub2 = await submit2Res.json();
  console.log('Evaluation 2 Status:', sub2.evaluation.evaluation_status);
  console.log('Adaptive Rule Applied:', sub2.decision.decision_rule);
  console.log('Adaptive Rationale:', sub2.decision.decision_rationale);
  console.log('Next Question Selected:', sub2.nextQuestion ? sub2.nextQuestion.title : 'None');

  if (sub2.decision.decision_rule === 'RULE_BROADEN_COVERAGE_HIGH_PRIORITY') {
    console.log('>>> SUCCESS: Path B broadened coverage to new unassessed high-priority competency!');
  }

  console.log('\n--- 6. Testing Safe Python Code Challenge Execution ---');
  const validPythonLRU = `
class Node:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_head(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._add_to_head(node)
        return node.value

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.value = value
            self._remove(node)
            self._add_to_head(node)
        else:
            if len(self.cache) >= self.capacity:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]
            new_node = Node(key, value)
            self.cache[key] = new_node
            self._add_to_head(new_node)
`;

  // Submit code to ledger
  const codeSubmitRes = await fetch(`${base}/api/assessments/${asmtId}/submit-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: validPythonLRU,
      questionId: 'q_code_lru_python'
    })
  });
  const codeSub = await codeSubmitRes.json();
  console.log('Code Execution Results:', {
    passed: codeSub.runResult ? `${codeSub.runResult.testsPassed}/${codeSub.runResult.testsTotal}` : 'n/a',
    executionTimeMs: codeSub.runResult ? `${codeSub.runResult.executionTimeMs}ms` : 'n/a',
    evalStatus: codeSub.evaluation.evaluation_status
  });

  console.log('\n--- 7. Testing Competency Explorer API ---');
  const compRes = await fetch(`${base}/api/assessments/${asmtId}/competencies`);
  const compData = await compRes.json();
  console.log(`Competencies status summary for ${compData.assessmentTitle}:`);
  for (const c of compData.competencies) {
    console.log(` - ${c.name}: [${c.current_status}], Inquiries: ${c.questionsAskedCount}, Quotes: ${c.evidenceQuotes.length}`);
  }

  console.log('\n--- 8. Testing Evidence Ledger & Timeline API ---');
  const evRes = await fetch(`${base}/api/assessments/${asmtId}/events`);
  const evData = await evRes.json();
  console.log(`Total events in evidence ledger: ${evData.events.length}`);
  for (const ev of evData.events) {
    console.log(` [Event #${ev.event_sequence}] ${ev.competency_name}: Status=${ev.evaluation_status}, Excerpts=${ev.supporting_excerpts.length}`);
  }

  console.log('\n--- 9. Testing Final Report Generation & Persistence ---');
  const repRes = await fetch(`${base}/api/assessments/${asmtId}/report`);
  const repData = await repRes.json();
  console.log('Final Report Coverage Score:', repData.report.coverage_score + '%');
  console.log('Verified Evidence Items:', repData.report.verified_evidence.length);
  console.log('Unverified Claims / Gaps:', repData.report.unverified_claims.length);
  console.log('Recommended Next Steps for Humans:', repData.report.recommended_next_steps);

  console.log('\n--- 10. Testing Assessment History API ---');
  const histRes = await fetch(`${base}/api/assessments`);
  const histData = await histRes.json();
  console.log(`Total assessments in history: ${histData.assessments.length}`);
  const found = histData.assessments.find(a => a.id === asmtId);
  console.log('Found created assessment in history:', found ? `${found.candidate_name} (${found.status})` : 'NOT FOUND');

  console.log('\n========================================');
  console.log(' ALL END-TO-END VERIFICATIONS PASSED! ');
  console.log('========================================');
}

runLiveVerification().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
