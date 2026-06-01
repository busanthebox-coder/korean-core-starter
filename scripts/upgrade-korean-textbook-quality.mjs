import { readFileSync, writeFileSync } from 'node:fs';

const coursePath = new URL('../korean/data/course.json', import.meta.url);
const grammarPath = new URL('../korean/data/grammar.json', import.meta.url);

const course = JSON.parse(readFileSync(coursePath, 'utf8'));
const grammar = JSON.parse(readFileSync(grammarPath, 'utf8'));

const chapterUpgrades = {
  'chapter-01': {
    beginnerGuide: [
      {
        title: 'What a complete beginner should notice',
        body: 'Hangul is not an alphabet written in a line like English. Korean letters are grouped into square syllable blocks, so 한 is one spoken chunk made from ㅎ, ㅏ, and ㄴ.'
      },
      {
        title: 'How to study this chapter',
        body: 'Look at the Hangul first, try to read it, then use romanization only to check. If you start from romanization, you will build English pronunciation habits that are hard to undo.'
      },
      {
        title: 'Minimum outcome',
        body: 'You do not need perfect pronunciation yet. You should be able to point to a block, name its parts, and repeat a short phrase after listening.'
      }
    ],
    checkpoints: [
      'I can explain that 한 is ㅎ + ㅏ + ㄴ.',
      'I can read a short phrase from Hangul before checking romanization.',
      'I know romanization is a helper, not Korean spelling.'
    ]
  },
  'chapter-02': {
    beginnerGuide: [
      {
        title: 'Why greetings come before grammar',
        body: 'A beginner needs phrases that work immediately. 안녕하세요, 감사합니다, 죄송합니다, 네, and 아니요 let you participate politely before you can build long sentences.'
      },
      {
        title: 'Politeness first',
        body: 'Use polite everyday Korean until the other person clearly uses casual speech with you. This course treats 해요체 and polite chunks as your default safety zone.'
      },
      {
        title: 'Your first personal sentence',
        body: '저는 ___예요 is not just translation practice. It teaches 은/는 as “as for me,” which becomes the base for many later sentences.'
      }
    ],
    checkpoints: [
      'I can greet and thank someone without reading English.',
      'I can say 저는 ___예요 with my own name.',
      'I can choose 감사합니다 when I want to sound safer or more formal.'
    ]
  },
  'chapter-03': {
    beginnerGuide: [
      {
        title: 'The first sentence engine',
        body: 'N이에요/예요 lets you say what something is. This is the noun-sentence engine for names, jobs, objects, places, and simple identity.'
      },
      {
        title: 'Topic marker in plain English',
        body: '은/는 marks what we are talking about. In 저는 학생이에요, Korean first says “as for me,” then gives the information.'
      },
      {
        title: 'Do not over-translate particles',
        body: 'Particles often do not become separate English words. Learn the Korean frame and the sentence job, not a one-word English translation.'
      }
    ],
    checkpoints: [
      'I can choose 이에요 after a final consonant and 예요 after a vowel.',
      'I can ask 이건 뭐예요?',
      'I can explain 은/는 as topic or contrast.'
    ]
  },
  'chapter-04': {
    beginnerGuide: [
      {
        title: 'Existence covers more than “there is”',
        body: '있어요 and 없어요 also mean “I have” and “I do not have.” 시간이 있어요 can mean “there is time” or “I have time.”'
      },
      {
        title: 'Why 이/가 appears here',
        body: 'The thing that exists, does not exist, hurts, or appears is usually marked with 이/가: 시간이 있어요, 문제가 없어요, 머리가 아파요.'
      },
      {
        title: 'Survival value',
        body: 'This chapter gives you high-frequency travel and daily phrases: 예약이 있어요, 시간이 없어요, 화장실이 있어요?'
      }
    ],
    checkpoints: [
      'I can say I have time and I do not have time.',
      'I can ask whether something exists with 있어요?',
      'I do not use 을/를 for the thing that exists.'
    ]
  },
  'chapter-05': {
    beginnerGuide: [
      {
        title: 'From words to actions',
        body: 'This chapter turns verbs into simple sentences: 밥을 먹어요, 커피를 마셔요, 한국어를 공부해요. The object marker 을/를 shows what receives the action.'
      },
      {
        title: 'Particle dropping comes later',
        body: 'Koreans often drop 을/를 in speech, but beginners should first understand the full frame. Once the structure is clear, natural short speech becomes easier.'
      },
      {
        title: 'Negatives start here',
        body: '안 먹어요 and 공부 안 해요 show the everyday short negative. This means “I do not do it,” not necessarily “I cannot.”'
      }
    ],
    checkpoints: [
      'I can make a present-tense sentence with an object.',
      'I can use 을 after a consonant and 를 after a vowel.',
      'I can make a short negative with 안.'
    ]
  },
  'chapter-06': {
    beginnerGuide: [
      {
        title: 'The 에 / 에서 split',
        body: '에 points to destination, time, or where something exists. 에서 marks where an action happens. 학교에 가요 and 학교에서 공부해요 are different for a reason.'
      },
      {
        title: 'Movement vs action',
        body: 'If the verb is 가다 or 오다, think destination: 에. If the verb is 공부하다, 일하다, 먹다, 기다리다, or 사다, think action place: 에서.'
      },
      {
        title: 'Time also uses 에',
        body: 'For clock time, use 에: 7시에 일어나요. Some time words like 오늘, 내일, 지금 usually do not need 에 at beginner level.'
      }
    ],
    checkpoints: [
      'I can say where I go with 에.',
      'I can say where I do an action with 에서.',
      'I do not say 학교에서 가요 for destination.'
    ]
  },
  'chapter-07': {
    beginnerGuide: [
      {
        title: 'Ordering is chunk-based',
        body: 'In a cafe or store, N 주세요 is more useful than a full English-style sentence. 물 주세요 and 이거 하나 주세요 are complete practical requests.'
      },
      {
        title: 'Payment language',
        body: '카드 돼요? is a common spoken shortcut. 카드로 결제할 수 있어요? is clearer and more textbook-complete. Both are useful, but they feel different.'
      },
      {
        title: 'Small particles, big meaning',
        body: '도 means also, 만 means only, and 로/으로 can show method such as payment or transportation. These small pieces change the shopping situation.'
      }
    ],
    checkpoints: [
      'I can order one item with N 주세요.',
      'I can ask price with 얼마예요?',
      'I can ask about card payment using 카드 돼요? or 카드로 결제할 수 있어요?'
    ]
  },
  'chapter-08': {
    beginnerGuide: [
      {
        title: 'Three different meanings',
        body: '고 싶어요 is desire, ㄹ/을 수 있어요 is ability or possibility, and 못 + verb is inability. They are not interchangeable.'
      },
      {
        title: 'The 못 rule beginners need',
        body: 'For most verbs, put 못 before the normal verb: 못 가요, 못 먹어요. For 하다 verbs, use 못 해요 or noun 못 해요: 공부 못 해요. Do not make 못 가해요.'
      },
      {
        title: 'Why this chapter matters',
        body: 'This is the chapter that lets you explain limits politely: I want to go, I can go, I cannot go, I cannot eat spicy food.'
      }
    ],
    checkpoints: [
      'I can say want to, can, and cannot with 가다 and 먹다.',
      'I can explain 안 가요 vs 못 가요.',
      'I know 못 가해요 is wrong.'
    ]
  },
  'chapter-09': {
    beginnerGuide: [
      {
        title: 'Requests and permission are different',
        body: 'V아/어 주세요 asks someone to do something. V아/어도 돼요? asks if you may do something. 사진 찍어 주세요 and 사진 찍어도 돼요? are not the same.'
      },
      {
        title: 'Prohibition is mostly for understanding first',
        body: '지 마세요 appears on signs and from staff. You can use it, but it can sound like an instruction, so beginners should learn to understand it before using it broadly.'
      },
      {
        title: 'Make requests softer',
        body: '좀 often softens ordinary requests: 좀 도와주세요, 물 좀 주세요, 잠깐 기다려 주세요.'
      }
    ],
    checkpoints: [
      'I can ask for help with 도와주세요.',
      'I can ask permission with 아/어도 돼요?',
      'I can recognize 지 마세요 as “please do not.”'
    ]
  },
  'chapter-10': {
    beginnerGuide: [
      {
        title: 'Travel Korean needs repair phrases',
        body: 'When communication breaks down, phrases like 다시 말해 주세요, 천천히 말해 주세요, and 잘 모르겠어요 keep the conversation alive.'
      },
      {
        title: 'Ask short, useful questions',
        body: '화장실 어디예요? and 지하철역 어디예요? are natural spoken questions. Adding 이 makes them more complete, but the shorter form is common.'
      },
      {
        title: 'Range and route',
        body: '부터/까지 helps with time and route: 여기부터 역까지, 9시부터 6시까지.'
      }
    ],
    checkpoints: [
      'I can ask someone to repeat slowly.',
      'I can ask where the bathroom or station is.',
      'I can use 부터/까지 for from-to ranges.'
    ]
  },
  'chapter-11': {
    beginnerGuide: [
      {
        title: 'Longer Korean starts with connectors',
        body: '아서/어서, 고, and 면 let you connect simple sentences. This is how beginner Korean stops sounding like isolated flashcards.'
      },
      {
        title: 'Reason, sequence, condition',
        body: '아서/어서 gives a reason, 고 connects actions or descriptions, and 면 gives a condition. 바빠서 못 가요, 먹고 가요, 시간이 있으면 전화해 주세요.'
      },
      {
        title: 'Promise form',
        body: 'ㄹ/을게요 is for the speaker’s decision or promise: 제가 할게요, 기다릴게요, 전화할게요. Do not use it to predict someone else.'
      }
    ],
    checkpoints: [
      'I can connect a reason to a result with 아서/어서.',
      'I can connect two actions with 고.',
      'I can make a simple condition with 면.'
    ]
  }
};

// Deep, hand-authored beginner explanations live in scripts/grammar-explanations.json
// (regenerate via the grammar-enrichment step). The inline map below is the legacy fallback.
const grammarExplanations = JSON.parse(
  readFileSync(new URL('./grammar-explanations.json', import.meta.url), 'utf8')
);
const legacyGrammarExplanations = {
  'grammar-foundation-hangul-blocks': 'For a beginner, the key is not memorizing every sound rule at once. The key is seeing that Korean is built from reusable letters inside syllable blocks. Read the block first, then listen.',
  'grammar-particle-eun-neun': 'Think of 은/는 as putting a label on the sentence topic. It tells the listener, “This is what I am talking about now.” It often creates contrast, even when English does not show it.',
  'grammar-particle-i-ga': 'Think of 이/가 as pointing to the subject that appears, exists, hurts, or is newly important. It often answers “who?” or “what?” inside the sentence.',
  'grammar-particle-eul-reul': '을/를 marks the thing affected by an action. If you eat, drink, buy, read, write, or study something, that something often takes 을/를.',
  'grammar-particle-e': '에 is a target marker: a destination, a time point, or the place where something exists. It does not usually mark where an active action happens.',
  'grammar-particle-eseo': '에서 is an action-place marker. If something happens at a place, use 에서. This is why 학교에서 공부해요 is different from 학교에 가요.',
  'grammar-particle-ege-hante': 'Use 에게 or 한테 when the receiver is a person. This is about direction toward a person, not physical travel to a place.',
  'grammar-particle-ro-euro': '로/으로 often answers “by what method?” or “with what tool?” It can also show direction or language. In shopping, 카드로 is “by card.”',
  'grammar-particle-do': '도 replaces the particle you might expect and means “also/too/even.” 저도 means “me too,” not 저는도.',
  'grammar-particle-man': '만 narrows the sentence to “only this.” In shopping, 이것만 주세요 means you do not want the other items.',
  'grammar-particle-buteo-kkaji': '부터 and 까지 create a range. They are useful for schedules, routes, and opening hours before you can make complex sentences.',
  'grammar-ending-want': '고 싶어요 attaches to a verb stem and expresses the speaker’s desire. It is usually safer for “I want to do” than translating English word by word.',
  'grammar-ending-can': 'ㄹ/을 수 있어요 means the action is possible. The ㄹ/을 part depends on the verb stem ending, so memorize complete examples first.',
  'grammar-ending-mot': '못 is the inability negative. It says a real limit blocks the action. For most verbs, it simply goes before the verb: 못 가요, 못 먹어요.',
  'grammar-ending-must': '아/어야 해요 creates obligation. It often sounds like “I have to,” not just “I will.” Use it for rules, health, schedules, and necessary tasks.',
  'grammar-ending-permission': '아/어도 돼요? asks whether doing an action is okay. This is essential in travel, classrooms, restaurants, and public places.',
  'grammar-ending-request': '아/어 주세요 asks someone else to do an action. It is different from N 주세요, which asks for an item.',
  'grammar-ending-prohibition': '지 마세요 tells someone not to do something. Beginners should first recognize it on signs and staff instructions.',
  'grammar-connector-because': '아서/어서 joins a reason and a result. Start with short sentences like 바빠서 못 가요 before using it in longer speech.',
  'grammar-connector-and': '고 connects actions or descriptions. It can mean “and” or “and then,” depending on context.',
  'grammar-connector-if': '면 creates a condition. Beginners can read it as “if,” but in real context it can also feel like “when.”',
  'grammar-ending-promise': 'ㄹ/을게요 is the speaker’s decision or promise. It is common when responding to someone: 제가 할게요.'
};

for (const chapter of course.chapters || []) {
  Object.assign(chapter, chapterUpgrades[chapter.id] || {});
}

for (const item of [...(grammar.grammarItems || []), ...(grammar.endingItems || [])]) {
  item.beginnerExplanation = grammarExplanations[item.id] || item.beginnerExplanation || item.plainEnglish;
  if (!item.studyOrder) {
    item.studyOrder = [
      'Read the full example first.',
      'Find the noun, verb stem, or adjective stem that changes.',
      'Say the frame aloud with one substitution.',
      'Check the common mistake before making a new sentence.'
    ];
  }
}

writeFileSync(coursePath, `${JSON.stringify(course, null, 2)}\n`, 'utf8');
writeFileSync(grammarPath, `${JSON.stringify(grammar, null, 2)}\n`, 'utf8');

console.log('Upgraded Korean textbook explanations and chapter guides.');
