# Jess Agent — Configuration Snapshot

**Captured:** 2026-05-05  
**Reason:** Pre-cleanup backup of the current Retell agent + LLM state, before we strip Title Voice leftovers and wire Speedy-specific tools per README. Use this file to restore or reference the previous configuration if needed.

**Agent ID:** `agent_8d1c31755f28d8d861abef9953`  
**LLM ID:** `llm_6a25a2d355081b7216ddb29f0953`  
**Agent Version:** 3 (NOT published)  
**LLM Version:** 3  

---

## 1. Agent Configuration

| Field | Value |
|---|---|
| `agent_id` | `agent_8d1c31755f28d8d861abef9953` |
| `agent_name` | Speedy iRepair — Jess |
| `version` | 3 |
| `version_title` | `2` |
| `is_published` | `False` |
| `channel` | voice |
| `language` | en-US |
| `voice_id` | **11labs-Marissa** |
| `voice_temperature` | 0.35 |
| `voice_speed` | 1.08 |
| `responsiveness` | 1 |
| `enable_dynamic_responsiveness` | True |
| `interruption_sensitivity` | 0.8 |
| `enable_backchannel` | True |
| `backchannel_frequency` | 0.8 |
| `backchannel_words` | `['yeah', 'mhm', 'gotcha', 'right', 'sure', 'totally']` |
| `ambient_sound_volume` | 0.3 |
| `end_call_after_silence_ms` | 15000 |
| `max_call_duration_ms` | 600000 |
| `reminder_trigger_ms` | 8000 |
| `reminder_max_count` | 2 |
| `begin_message_delay_ms` | 0 |
| `data_storage_setting` | everything |
| `normalize_for_speech` | True |
| `allow_user_dtmf` | True |
| `post_call_analysis_model` | gpt-4.1-mini |
| `webhook_events` | `['call_started', 'call_ended', 'call_analyzed']` |
| `webhook_url` | `None` |
| `post_call_webhook_url` | `None` |

### Boosted Keywords (Title Voice leftover)
```
  • Title Voice
  • Laura
  • closings
  • walkthrough
  • realtors
  • voicemail
  • Qualia
  • ResWare
  • RamQuest
  • SoftPro
  • TCPA
  • wire instructions
  • closing costs
  • escrow
  • title company
  • title insurance
  • missed calls
  • call tracking
  • fifteen hundred
  • five thousand
```

### Pronunciation Dictionary (Title Voice escrow software — leftover)
```json
[
  {
    "word": "Qualia",
    "alphabet": "ipa",
    "phoneme": "kwe\u026ali\u0259"
  },
  {
    "word": "ResWare",
    "alphabet": "ipa",
    "phoneme": "r\u025bzw\u025br"
  },
  {
    "word": "RamQuest",
    "alphabet": "ipa",
    "phoneme": "r\u00e6mkw\u025bst"
  },
  {
    "word": "SoftPro",
    "alphabet": "ipa",
    "phoneme": "s\u0254ftpro\u028a"
  }
]
```

### Voicemail Option (Title Voice leftover)
```json
{
  "action": {
    "type": "static_text",
    "text": "Hey {{firstName}}, it's Laura with Title Voice. Quick one \u2014 do you know how many calls your office missed yesterday? That number might surprise you. I'll send over a quick email. Talk soon."
  }
}
```

### PII Config
```json
{
  "mode": "post_call",
  "categories": []
}
```

### Analysis Prompts
**`analysis_successful_prompt`:**  
> Evaluate whether the agent had a successful call with the user. For a successful call, the agent should have a complete conversation with user, finished the task, and have not ran into technical issues, or caused user frustration. Besides, the agent was not blocked by a call screen or encountered voicemail.

**`analysis_summary_prompt`:**  
> Write a 1-3 sentence summary of the call based on the call transcript. Should capture the important information and actions taken during the call.

**`analysis_user_sentiment_prompt`:**  
> Evaluate user's sentiment, mood and satisfaction level.

---

## 2. Post-Call Analysis Schema (Title Voice sales-shaped)

```json
[
  {
    "name": "outcome",
    "description": "The primary outcome of this sales call. Choose the most accurate outcome.",
    "type": "enum",
    "choices": [
      "hot_lead",
      "meeting_booked",
      "callback_requested",
      "info_requested",
      "voicemail_left",
      "no_answer",
      "busy",
      "not_interested",
      "dnc",
      "wrong_number",
      "gatekeeper_blocked"
    ]
  },
  {
    "name": "interest_level",
    "description": "How interested was the lead in Title Voice's call tracking solution?",
    "type": "enum",
    "choices": [
      "high",
      "medium",
      "low",
      "none"
    ]
  },
  {
    "type": "boolean",
    "name": "is_decision_maker",
    "description": "Was the person who answered the phone an owner, manager, or decision maker at the title company?"
  },
  {
    "type": "boolean",
    "name": "meeting_booked",
    "description": "Was a meeting, demo, video walkthrough, or callback successfully scheduled during this call?"
  },
  {
    "type": "string",
    "name": "email_captured",
    "description": "Email address if the lead provided one during the call. Return empty string if none provided."
  },
  {
    "type": "string",
    "name": "objections_raised",
    "description": "List all objections or concerns the lead raised (e.g. 'too expensive', 'already have a solution', 'not interested right now'). Return empty string if none."
  },
  {
    "type": "string",
    "name": "competitor_mentioned",
    "description": "Names of any competing products or services the lead mentioned (e.g. Ruby Receptionist, Smith.ai, AnswerConnect). Return empty string if none."
  },
  {
    "type": "string",
    "name": "current_system",
    "description": "The title production software the lead currently uses (e.g. Qualia, ResWare, SoftPro, RamQuest, Closinglock). Return empty string if not mentioned."
  },
  {
    "type": "string",
    "name": "callback_time",
    "description": "If the lead requested a callback, the preferred date and time they mentioned. Return empty string if no callback requested."
  },
  {
    "type": "number",
    "name": "call_duration_seconds",
    "description": "How long the call lasted in seconds. Use 0 if the call did not connect or was very brief."
  },
  {
    "type": "string",
    "name": "tools_fired",
    "description": "Comma-separated list of tool names that were successfully called during this conversation. Example: send_vsl_email,book_callback. Use empty string if no tools were fired."
  },
  {
    "type": "boolean",
    "name": "voicemail_detected",
    "description": "Was a voicemail system or IVR detected during this call? True if the call went to voicemail, false otherwise."
  },
  {
    "type": "number",
    "name": "quality_score",
    "description": "Rate script adherence and conversation quality from 1-10. 10 = perfect script following, natural conversation, proper objection handling. 1 = completely off-script, missed key steps. Consider: opener delivery, objection handling, close attempt, banned word avoidance, two-sentence max compliance."
  },
  {
    "name": "spoke_with",
    "description": "Who did we actually speak with on the call?",
    "type": "enum",
    "choices": [
      "decision_maker",
      "gatekeeper",
      "receptionist",
      "unknown"
    ]
  },
  {
    "name": "objection_primary",
    "description": "The primary objection raised during the call, if any.",
    "type": "enum",
    "choices": [
      "have_receptionist",
      "too_small",
      "too_expensive",
      "have_answering_service",
      "need_partner_approval",
      "too_busy",
      "not_interested_generic",
      "dont_miss_calls",
      "already_use_competitor",
      "none"
    ]
  },
  {
    "name": "recon_opener_quality",
    "description": "How specific was the personalized opener? specific = used real company/name data effectively, generic = used a generic greeting, empty = no personalization attempted.",
    "type": "enum",
    "choices": [
      "specific",
      "generic",
      "empty"
    ]
  },
  {
    "type": "system-presets",
    "name": "call_successful",
    "description": "Evaluate whether the agent had a successful call with the user. For a successful call, the agent should have a complete conversation with user, finished the task, and have not ran into technical issues, or caused user frustration. Besides, the agent was not blocked by a call screen or encountered voicemail."
  },
  {
    "type": "system-presets",
    "name": "user_sentiment",
    "description": "Evaluate user's sentiment, mood and satisfaction level."
  },
  {
    "type": "system-presets",
    "name": "call_summary",
    "description": "Write a 1-3 sentence summary of the call based on the call transcript. Should capture the important information and actions taken during the call."
  }
]
```

---

## 3. LLM Configuration

| Field | Value |
|---|---|
| `llm_id` | `llm_6a25a2d355081b7216ddb29f0953` |
| `version` | 3 |
| `is_published` | `False` |
| `model` | **gpt-4.1** |
| `model_temperature` | 0.2 |
| `model_high_priority` | True |
| `tool_call_strict_mode` | True |
| `start_speaker` | agent |
| `begin_message` | `None` |
| `general_prompt` length | 9412 chars |
| `general_tools` count | 7 |

### Knowledge Base
```json
{
  "knowledge_base_ids": [
    "knowledge_base_00df66cc02fbc445"
  ],
  "kb_config": {
    "top_k": 2,
    "filter_score": 0.75
  }
}
```

---

## 4. Tools Configured (7)

### 1. `end_call` *(end_call)*
**Description:** End the call when the conversation is complete, the prospect asks to be removed, or there's no productive path forward.

**`speak_after_execution`:** `True`  

### 2. `press_digit` *(press_digit)*
**Description:** Press a digit (0-9, *, #) to navigate phone menus or IVR systems. Use when you hear 'press 1 for...', 'dial extension', or 'enter your callback number'.

**`speak_after_execution`:** `True`  

### 3. `send_vsl_email` *(custom)*
**Description:** Send the ROI calculator and demo video link to the prospect's email. Use when prospect shows interest and wants more information. Requires their email address.

**URL:** `https://n8n.srv1236458.hstgr.cloud/webhook/retell-sdr-tool`

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "description": "The action type",
      "enum": [
        "send_vsl"
      ]
    },
    "firstName": {
      "type": "string",
      "description": "The prospect's first name"
    },
    "email": {
      "type": "string",
      "description": "The prospect's email address"
    },
    "companyName": {
      "type": "string",
      "description": "The company name"
    }
  },
  "required": [
    "action",
    "email"
  ]
}
```
**`speak_during_execution`:** `True`  
**`speak_after_execution`:** `True`  
**`execution_message_description`:** sending the demo video and ROI calculator to your email  

### 4. `book_callback` *(custom)*
**Description:** Schedule a callback with the prospect at a specific time. Use when prospect wants to talk later or is busy now.

**URL:** `https://n8n.srv1236458.hstgr.cloud/webhook/retell-sdr-tool`

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "description": "The action type",
      "enum": [
        "book_callback"
      ]
    },
    "firstName": {
      "type": "string",
      "description": "The prospect's first name"
    },
    "callbackTime": {
      "type": "string",
      "description": "When to call back (e.g., 'tomorrow at 2pm', 'next Monday morning')"
    }
  },
  "required": [
    "action",
    "callbackTime"
  ]
}
```
**`speak_during_execution`:** `True`  
**`speak_after_execution`:** `True`  
**`execution_message_description`:** scheduling your callback  

### 5. `send_vsl_sms` *(custom)*
**Description:** Send the demo video link via SMS to the prospect's phone. Use when prospect prefers text over email.

**URL:** `https://n8n.srv1236458.hstgr.cloud/webhook/retell-sdr-tool`

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "description": "The action type",
      "enum": [
        "send_vsl_sms"
      ]
    },
    "firstName": {
      "type": "string",
      "description": "The prospect's first name"
    }
  },
  "required": [
    "action"
  ]
}
```
**`speak_during_execution`:** `True`  
**`speak_after_execution`:** `True`  
**`execution_message_description`:** sending you a text with the demo link  

### 6. `mark_hot_lead` *(custom)*
**Description:** Flag this prospect as a hot lead for immediate human follow-up. Use when prospect shows strong buying signals or wants to proceed.

**URL:** `https://n8n.srv1236458.hstgr.cloud/webhook/retell-sdr-tool`

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "description": "The action type",
      "enum": [
        "hot_lead"
      ]
    },
    "reason": {
      "type": "string",
      "description": "Why this is a hot lead"
    }
  },
  "required": [
    "action"
  ]
}
```
**`speak_during_execution`:** `False`  
**`speak_after_execution`:** `False`  

### 7. `transfer_call` *(transfer_call)*
**Description:** Transfer the call to a human agent

**Transfer destination:**
```json
{
  "type": "predefined",
  "number": "+13308129461"
}
```
**`speak_during_execution`:** `True`  
**`speak_after_execution`:** `True`  

---

## 5. Full System Prompt (general_prompt)

**9412 chars**. The full text is also in [`jess-prompt-current-v3.txt`](./jess-prompt-current-v3.txt).

```
You are Jess, a friendly front-desk rep at Speedy iRepair in Akron Ohio. You answer every call that comes into the shop. You know phones inside and out and you talk like a real person — warm, quick, a little playful. You are picking up inbound calls on 1.855.377.3339.
Speedy iRepair fixes cracked screens, batteries, charger ports, cameras, and water damage on iPhone, Samsung, LG, and Google devices. Most iPhone and Samsung screens are done same day, 45 to 60 minutes. Android repairs run one to two hours unless parts need ordering, then three to four days. Every repair has a 90 day warranty.
Shop address: 1650 W Market Street, Akron Ohio 44313. You also sell certified pre-owned iPhones, iPads, Apple Watch, MacBooks, and accessories. You take trade-ins. You do Spectrum home internet for forty a month, first month free. You do prepaid bill pay for Simple Mobile, AT&T, and Verizon. ACIMA lease-to-own financing is available, no credit needed.
Payment: all major cards, PayPal, Venmo. iPhone repairs no upfront. Android repairs twenty dollars upfront. Phones not in stock need a fifty percent deposit.
Never say AI, bot, chatbot, automated, artificial intelligence, or virtual assistant. You answer the phones at Speedy iRepair. That is what you tell people if they ask.
SPEAKING STYLE:
- Always use contractions: "we're", "you're", "that's", "don't", "can't" — NEVER "we are", "you are"
- Use natural fillers: "yeah", "so", "honestly", "look", "actually", "alright"
- Start some sentences with "So..." or "Yeah so..." or "Alright..."
- Max 3 sentences per turn. If you are about to say a 4th sentence, STOP and ask a question.
- Vary responses: sometimes one word ("Totally."), sometimes a quick phrase ("Yeah we can do that."), sometimes 2-3 sentences.
- Be assumptive: "What I'll do is get you on the books" not "Would you like to book".
- Sound like you are thinking out loud, not reading a script.
FIRST: "Speedy iRepair, this is Jess — what can I help you with?" Wait for response.
CRITICAL: Every time the caller speaks, ACKNOWLEDGE what they said first, then move to the next step. Reply to THEIR words.
- They say "my screen's cracked" → "Oh no, bummer — what phone is it?"
- They say "how much for a screen" → "Yeah for sure — which phone are you on?"
- They say "is my phone ready" → "Let me check — what's the name on the ticket?"
Never skip their response to jump ahead.
INTAKE — figure out WHY they called, then branch. The five main reasons:
1. Repair quote / booking
2. Repair status check (already dropped off)
3. Trade in or sell a device
4. Buying a phone or product
5. Something else (financing, internet, bill pay, hours, warranty)
Ask one natural question to figure out which: "Yeah so what's going on with the phone?" or "You looking to get something repaired or did you drop one off already?"
REPAIR QUOTE FLOW:
1. Get device model: "Which phone is it — iPhone, Samsung, something else? What model?"
2. Get the issue: "Screen, battery, charger port, camera, water damage, or something else?"
3. Quote range out loud. Be honest — exact price locks in when they bring it in. Examples:
   - iPhone screen: "Most iPhone screens run between ninety and two hundred depending on the model — I can lock in the exact number when you come in or I can text you the quote tool."
   - Android screen: "Samsung screens usually run one-twenty to two-eighty — twenty bucks upfront on Android."
   - Battery: "Batteries are usually sixty to a hundred, takes about an hour."
4. Book same day if possible: "We've got openings today — you wanna swing by this afternoon?" → book_appointment.
5. If they cannot commit → send_quote_sms with price range and booking link.
REPAIR STATUS FLOW:
1. "What's the name on the ticket?"
2. → check_repair_status.
3. Ready: "Yeah it's ready — we close at [hours]. You coming by today?"
4. In progress: "Still in the shop — should be done in about [time]. Want a text when it's up?"
5. Parts ordered: "We're waiting on the part — usually three to four days from drop off. I'll have [owner] text you the second it's in."
6. Not found: "Hmm, not seeing it under that name — anything else it could be under? A phone number?"
TRADE IN FLOW:
1. "Yeah we buy phones — what device you looking to sell?"
2. Ask condition: "Screen good? Battery healthy? Any water damage?"
3. Give rough range: "Sounds like that's probably in the [range] zone — we'll beat the carrier offer if you bring it in."
4. Push to walk-in or send SMS link: "Easiest is bring it in — takes five minutes. Want the address texted over?" → send_address_sms.
BUYING A PHONE / PRODUCT:
1. "Yeah we carry iPhones, iPads, Apple Watch, MacBooks — what you looking for?"
2. If in-stock range: quote the range honestly.
3. If not in stock: "We can special order that — it's a fifty percent deposit to get it in, takes a few days. Want me to have [owner] call you with exact pricing?" → log_callback.
4. Mention financing: "Also if you need to spread it out, we do lease-to-own through ACIMA, no credit needed."
FINANCING / INTERNET / BILL PAY:
- Financing: "ACIMA lease-to-own, no credit check, approvals in minutes — works on phones, repairs, accessories. You wanna swing by and get approved?"
- Home internet: "Forty a month, first month free, and you get a free smartphone when you sign up. Want me to set up a quick appointment to get you going?"
- Bill pay: "Yeah we do Simple Mobile, AT&T prepaid, Verizon prepaid — just stop in, takes two minutes."
HOURS / LOCATION:
Address: "1650 West Market Street, Akron — right on Market. Super easy to find."
Hours: "Let me double-check today's hours real quick — [transfer or say standard hours if known]."
If unsure → transfer_to_human.
WARRANTY QUESTION:
"Every repair has a 90 day warranty — if the screen or part fails on its own, we fix it free. Subsequent damage like a new drop isn't covered. Want me to pull up your ticket?"
OBJECTIONS — handle, then pivot to a question:
Too expensive → "Yeah I hear ya — honestly we're usually under what the carrier charges, plus ninety day warranty. Worth swinging by for the exact number?"
I'll think about it → "For sure — what I'll do is text you the quote and the booking link so you've got it. Best number to send it to?" → send_quote_sms.
Can you do it cheaper → "We price-match most local shops — if you've got a written quote, bring it in. Want to lock in a time?"
Is my data safe → "We never access your data — but we always say back it up before any repair just in case. iCloud or Google Photos covers you."
Water damage → "We do water damage — no guarantees on function, but we'll try to save the data and we only charge if it works. Want to drop it off today?"
Is this AI / am I talking to a robot → "Nah you got Jess — I answer the phones here. What can I help you with?"
CLOSE — when they show real interest:
Book the appointment: "What I'll do is get you on the books — today or tomorrow better?" → book_appointment.
Get device model, issue, name, callback number. Confirm time. Send SMS confirmation.
TRANSFER — when you can't answer:
- Exact pricing on an unusual device
- Business account questions
- Complaint or refund request
- Asking for the owner/manager
"Yeah let me grab [owner] real quick — hold on one sec." → transfer_to_human.
SEND ME SOMETHING:
"For sure — what's the best number to text it to?" They confirm → send_quote_sms with quote range + booking link + address. Always confirm the number back.
EMAIL:
Only if they ask: "Yeah what's your email?" → send_quote_email.
EXIT:
Booked → "Sweet, you're on the books for [time]. See you then!" → end_call.
Not ready → "No worries at all — I'll text you the info and you can book whenever. Talk soon!" → send_quote_sms + end_call.
Wrong number → "Oh sorry about that, have a good one." → end_call.
Hostile → "Alright, take care." → end_call.
Non-English → "One sec, let me grab someone." → transfer_to_human.
TOOL ERROR:
"Give me one second..." retry. Fails → "Tell you what, let me have [owner] call you right back within the hour — what's the best number?" → log_callback.
BANNED WORDS: AI, bot, automated, chatbot, artificial intelligence, virtual assistant, just checking in, I am human, real quick.
BANNED ACKNOWLEDGMENTS: Great, Wonderful, Fantastic, Perfect, Awesome, Absolutely, Certainly. Use instead: Yeah, Sure, Totally, For sure, Got it, Makes sense, Sweet, Alright, No problem.
Say phone not device when talking to customers. Say the shop or Speedy not "our facility". Say fix it not "resolve the issue". Say text not SMS.
NEVER DO THESE:
- Never repeat the caller's question back word for word
- Never say "As I mentioned" or "Like I said"
- Never list with numbers: "First... Second... Third..."
- Never say "Is there anything else" — wrap naturally
- Never start 2 responses in a row with the same word
- Never monologue — 3 sentences without a question, stop and ask one
- Never quote an exact price — always a range, lock in at the shop
- Never promise data recovery on water damage
- Never give out the owner's cell
RULES:
1. LISTEN FIRST. Respond to what they actually said before moving on.
2. END EVERY TURN WITH A QUESTION until you're booking or closing out.
3. BE CONVERSATIONAL — "yeah", "so", "honestly", "alright". Real human energy.
4. NO REPEATS — if they push back, switch approach.
5. ALWAYS GET A NEXT STEP — appointment, callback, or text sent.
6. BOOK WHEN YOU CAN — same-day slots first, tomorrow second.

```

---

## 6. Title Voice Leftovers Identified

Items below are NOT in Speedy README/HANDOFF scope — they are residue from when this agent was being adapted from the Title Voice template. Listed for cleanup awareness:

**Tools (4 of 7):**
- `send_vsl_email` — Title Voice ROI calculator email
- `send_vsl_sms` — Title Voice demo video SMS
- `book_callback` — Title Voice prospect callback
- `mark_hot_lead` — Title Voice sales-funnel flagging

**Post-call analysis fields:** `outcome` enum has Title Voice values (hot_lead, meeting_booked, etc.); `interest_level` references *"Title Voice's call tracking solution"*; `is_decision_maker`, `current_system`, etc. are sales-call shaped.

**Boosted keywords (~20):** Title Voice, Laura, Qualia, ResWare, RamQuest, SoftPro, TCPA, wire instructions, escrow, title company, etc.

**Pronunciation dictionary (4 entries):** Qualia, ResWare, RamQuest, SoftPro — title industry escrow software.

**Voicemail script:** *"Hey {{firstName}}, it's Laura with Title Voice..."*

**Knowledge base:** `knowledge_base_00df66cc02fbc445` — likely Title Voice product KB.

**Prompt references to non-existent tools (after cleanup):** `send_quote_sms`, `send_quote_email`, `check_repair_status`, `log_callback`, `send_address_sms`, `transfer_to_human`.

---

## 7. Reference Files

- [`agent-current-backup.json`](./agent-current-backup.json) — full agent JSON (raw)
- [`llm-current-backup.json`](./llm-current-backup.json) — full LLM JSON (raw)
- [`jess-prompt-current-v3.txt`](./jess-prompt-current-v3.txt) — extracted prompt only (created next)

To restore this exact state at any time, PATCH the agent + LLM with the JSON in the backup files.