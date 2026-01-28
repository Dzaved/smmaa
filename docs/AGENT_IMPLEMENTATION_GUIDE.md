# SMMAA - Comprehensive Agent Implementation Guide
## Technical Deep-Dive: How the AI Brain Actually Works

---

## How Agents Work - The Technical Truth

### Yes, Each Agent Uses Its Own Gemini API Call

```
┌──────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR                               │
│                                                                   │
│  User Request ──► Pipeline Start                                  │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│  │ RESEARCHER  │───►│ STRATEGIST  │───►│   WRITER    │           │
│  │ API Call #1 │    │ API Call #2 │    │ API Call #3 │           │
│  └─────────────┘    └─────────────┘    └─────────────┘           │
│         │                  │                  │                   │
│         ▼                  ▼                  ▼                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│  │   context   │    │  strategy   │    │   drafts    │           │
│  │    .json    │    │    .json    │    │    .json    │           │
│  └─────────────┘    └─────────────┘    └─────────────┘           │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐                              │
│  │   EDITOR    │───►│  OPTIMIZER  │───► Final Output             │
│  │ API Call #4 │    │ API Call #5 │                              │
│  └─────────────┘    └─────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

**Each agent = 1 specialized Gemini API call with:**
- Its own system prompt (specialized role)
- Input from previous agents
- Structured JSON output
- Access to database queries

---

## Why Multiple API Calls Are Better Than One

### Single Call (Current MVP):
```
User Input ──► ONE BIG PROMPT ──► Output
              (tries to do everything)
```
**Problems:** Generic, unfocused, no specialization, easy to confuse

### Multi-Agent Pipeline:
```
User Input ──► Researcher ──► Strategist ──► Writer ──► Editor ──► Optimizer ──► Output
              (focused)      (focused)      (focused)   (focused)   (focused)
```
**Benefits:** Each step is focused, specialized, can be debugged separately

---

## Agent Architecture Patterns (Like n8n/Make/Zapier but in Code)

### Pattern 1: Sequential Pipeline (Primary)
```typescript
// Like a Zapier workflow but in TypeScript
async function generateContent(input: UserInput): Promise<FinalOutput> {
  // Step 1: Research
  const context = await researcherAgent.run(input);
  
  // Step 2: Strategy (uses research output)
  const strategy = await strategistAgent.run(input, context);
  
  // Step 3: Write (uses strategy)
  const drafts = await writerAgent.run(input, context, strategy);
  
  // Step 4: Edit (uses drafts)
  const polished = await editorAgent.run(drafts);
  
  // Step 5: Optimize (uses polished content)
  const final = await optimizerAgent.run(polished);
  
  // Step 6: Save to memory
  await memoryAgent.save(final);
  
  return final;
}
```

### Pattern 2: Parallel Execution (For Speed)
```typescript
// Some agents can run in parallel
async function generateFast(input: UserInput): Promise<FinalOutput> {
  // Run research and calendar check in parallel
  const [context, calendar] = await Promise.all([
    researcherAgent.run(input),
    calendarAgent.checkUpcoming()
  ]);
  
  // Continue pipeline...
}
```

### Pattern 3: Conditional Branching
```typescript
// Like n8n's IF node
async function smartGenerate(input: UserInput): Promise<FinalOutput> {
  const context = await researcherAgent.run(input);
  
  // Branch based on context
  if (context.upcomingHoliday) {
    return await seasonalPipeline(input, context);
  } else if (context.recentSimilarPost) {
    return await diversityPipeline(input, context); // Force different angle
  } else {
    return await standardPipeline(input, context);
  }
}
```

---

## Advanced AI Techniques to Enrich Agents

### 1. Chain of Thought (CoT) Prompting
```typescript
const strategistPrompt = `
Think step by step:

1. First, analyze what topics were covered in the last 10 posts: ${postHistory}
2. Then, identify gaps - what hasn't been mentioned recently?
3. Check if any upcoming events need content: ${calendarEvents}
4. Consider the emotional angle for platform: ${platform}
5. Finally, decide on the best strategy.

Output your reasoning, then your final strategy.
`;
```
**Why:** Forces AI to "show its work", produces better reasoning

### 2. ReAct Pattern (Reasoning + Acting)
```typescript
const researcherPrompt = `
You have access to these tools:
- searchKnowledge(query): Search company knowledge base
- getPostHistory(days): Get recent post history
- checkCalendar(days): Check upcoming events

For the user request: "${request}"

Think: What information do I need?
Action: searchKnowledge("servicii transport funerar")
Observation: [results from search]

Think: I should also check...
Action: getPostHistory(30)
Observation: [results]

Think: Now I have enough context.
Final Answer: [structured context document]
`;
```
**Why:** AI can "use tools" to gather information dynamically

### 3. Self-Reflection / Self-Critique
```typescript
const editorPrompt = `
Review this draft for a Romanian funeral home:

"${draft}"

CRITIQUE IT:
1. Is the Romanian grammar correct? (check diacritics)
2. Is there anything culturally insensitive?
3. Does it match the brand voice?
4. Is it too salesy or commercial?
5. Would a grieving family find this appropriate?

First, list all issues found.
Then, provide the corrected version.
`;
```
**Why:** AI catches its own mistakes

### 4. Few-Shot Learning with Examples
```typescript
const writerPrompt = `
Here are examples of EXCELLENT posts for this client:

Example 1 (Service post, Facebook, Warm tone):
"${savedGoodPost1}"
Engagement: 847 likes, 23 shares

Example 2 (Seasonal post, Easter):
"${savedGoodPost2}"
Engagement: 1.2k likes, 89 shares

Now create a similar quality post for: ${request}
Match the style and quality of these examples.
`;
```
**Why:** AI learns from actual successful content

### 5. Structured Output with JSON Schema
```typescript
const writerOutput = {
  type: "object",
  properties: {
    variants: {
      type: "array",
      items: {
        type: "object",
        properties: {
          approach: { type: "string", enum: ["safe", "creative", "emotional"] },
          content: { type: "string" },
          hook: { type: "string" },
          cta: { type: "string" },
          estimatedEngagement: { type: "number", minimum: 1, maximum: 100 }
        }
      },
      minItems: 3,
      maxItems: 3
    }
  }
};

// Force Gemini to output valid JSON matching this schema
const response = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: writerOutput
  }
});
```
**Why:** Guarantees structured, parseable output

### 6. Memory Injection (RAG - Retrieval Augmented Generation)
```typescript
// Before calling Writer agent, inject relevant memories
async function enrichWithMemory(context: Context): Promise<EnrichedContext> {
  // Semantic search for similar past content
  const similarPosts = await supabase.rpc('match_posts', {
    query_embedding: await embedText(context.topic),
    match_count: 5
  });
  
  // Get best performing posts for this type
  const bestPosts = await supabase
    .from('post_history')
    .select('*')
    .eq('post_type', context.postType)
    .gte('engagement_actual', 80)
    .limit(3);
  
  return {
    ...context,
    similarPastPosts: similarPosts,
    topPerformingExamples: bestPosts
  };
}
```
**Why:** AI has access to institutional memory

### 7. Confidence Scoring
```typescript
const optimizerPrompt = `
Analyze this post and predict performance:

"${content}"

Rate each factor 1-10:
- Hook strength: How attention-grabbing is the opening?
- Emotional resonance: Will this connect emotionally?
- Call to action: Is the CTA clear and compelling?
- Platform fit: Does this match ${platform} best practices?
- Brand consistency: Does this sound like Funebra?
- Timing relevance: Is this timely/seasonal?

Calculate overall engagement prediction (1-100).
Explain your reasoning for each score.
`;
```
**Why:** Provides actionable quality metrics

### 8. Iterative Refinement Loop
```typescript
async function refineUntilGood(draft: string, maxAttempts = 3): Promise<string> {
  let current = draft;
  
  for (let i = 0; i < maxAttempts; i++) {
    const critique = await editorAgent.critique(current);
    
    if (critique.score >= 85) {
      return current; // Good enough
    }
    
    // Improve based on critique
    current = await editorAgent.improve(current, critique.issues);
  }
  
  return current;
}
```
**Why:** Content gets refined until it meets quality standards

---

## Database-Powered Intelligence

### Semantic Search with Embeddings
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to knowledge base
ALTER TABLE knowledge_base ADD COLUMN embedding vector(768);

-- Create similarity search function
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```
**Why:** AI can find relevant information semantically, not just by keywords

### Learning from Feedback
```typescript
// When user rates a post
async function learnFromFeedback(postId: string, rating: number, wasUsed: boolean) {
  // Update post record
  await supabase
    .from('post_history')
    .update({ user_rating: rating, was_used: wasUsed })
    .eq('id', postId);
  
  // If highly rated, extract patterns
  if (rating >= 4) {
    const post = await getPost(postId);
    
    // Extract successful patterns
    const patterns = await analyzePatterns(post);
    
    // Save patterns for future use
    for (const pattern of patterns) {
      await supabase
        .from('content_patterns')
        .upsert({
          pattern_type: pattern.type,
          pattern: pattern.value,
          success_score: rating,
          platform: post.platform,
          post_type: post.post_type
        });
    }
  }
}
```
**Why:** System gets smarter with every piece of feedback

---

## Implementation Files

### Core Agent Infrastructure

```
src/lib/brain/
├── types.ts              # TypeScript interfaces
├── orchestrator.ts       # Main pipeline coordinator
├── base-agent.ts         # Base class for all agents
├── agents/
│   ├── researcher.ts     # Context gathering
│   ├── strategist.ts     # Strategy planning  
│   ├── writer.ts         # Content creation
│   ├── editor.ts         # Quality assurance
│   ├── optimizer.ts      # Engagement optimization
│   └── memory.ts         # Learning & storage
├── tools/
│   ├── knowledge-search.ts   # RAG implementation
│   ├── calendar.ts           # Romanian calendar
│   ├── similarity.ts         # Duplicate detection
│   └── embeddings.ts         # Text embeddings
├── prompts/
│   ├── researcher.txt    # Researcher system prompt
│   ├── strategist.txt    # Strategist system prompt
│   ├── writer.txt        # Writer system prompt
│   ├── editor.txt        # Editor system prompt
│   └── optimizer.txt     # Optimizer system prompt
└── utils/
    ├── json-parser.ts    # Safe JSON parsing
    └── error-handler.ts  # Agent error handling
```

---

## Comparison: n8n/Make vs Our Code-Based Approach

| Aspect | n8n/Make/Zapier | Our TypeScript Agents |
|--------|-----------------|----------------------|
| Visual workflow | ✅ Drag & drop | ❌ Code only |
| Flexibility | Limited by nodes | ✅ Unlimited |
| AI integration | Basic | ✅ Deep, custom |
| Cost | $20-100+/month | ✅ Free (just API costs) |
| Speed | HTTP overhead | ✅ Direct API calls |
| Debugging | Limited | ✅ Full code debugging |
| Version control | Limited | ✅ Git |
| Custom logic | Limited | ✅ Any logic possible |
| Error handling | Basic | ✅ Custom retry, fallback |

**Our approach is like building n8n workflows but with superpowers:**
- More control
- More intelligence
- Lower cost
- Better performance

---

## API Cost Estimation

| Agent | Tokens (avg) | Cost per run |
|-------|--------------|--------------|
| Researcher | ~1,500 | ~$0.002 |
| Strategist | ~1,200 | ~$0.0015 |
| Writer | ~2,500 | ~$0.003 |
| Editor | ~1,800 | ~$0.002 |
| Optimizer | ~1,000 | ~$0.001 |
| **Total** | ~8,000 | **~$0.01** |

**Cost per post: ~1 cent** (with Gemini 2.0 Flash pricing)

100 posts/month = ~$1.00

---

## Implementation Order

### Week 2: Foundation
1. [ ] Create `src/lib/brain/` structure
2. [ ] Implement `types.ts` with all interfaces
3. [ ] Create `base-agent.ts` class
4. [ ] Build `orchestrator.ts` pipeline
5. [ ] Set up Supabase with full schema
6. [ ] Implement embedding generation

### Week 2-3: Agents
7. [ ] Implement Researcher agent + tests
8. [ ] Implement Strategist agent + tests
9. [ ] Implement Writer agent + tests
10. [ ] Implement Editor agent + tests
11. [ ] Implement Optimizer agent + tests
12. [ ] Implement Memory agent + tests

### Week 3: Intelligence
13. [ ] Add semantic search (RAG)
14. [ ] Build Romanian calendar system
15. [ ] Create similarity detection
16. [ ] Implement feedback learning

### Week 4: UI Integration
17. [ ] Add "AI Thinking" progress UI
18. [ ] Create 3-variant output display
19. [ ] Build rating/feedback system
20. [ ] Add post history page

---

## Next Steps

This comprehensive plan is now saved. Ready to start implementation?
