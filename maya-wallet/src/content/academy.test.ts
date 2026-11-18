import { describe, expect, it } from 'vitest';

import {
  ACADEMY_MODULES,
  getAcademyModule,
  requiredCorrect,
  PASS_THRESHOLD,
} from './academy';

// Lesson content is data, and data fails silently. A wrong `correctIndex` would
// teach the opposite of the truth and still pass every type check, so the shape
// and internal consistency of the academy are asserted here rather than left to
// review.

/** On-chain module ids seeded by the chain spec, with their advertised rewards. */
const LIVE_MODULES: Array<{ id: number; rewardDalla: number }> = [
  { id: 0, rewardDalla: 50 },
  { id: 1, rewardDalla: 75 },
  { id: 2, rewardDalla: 50 },
  { id: 3, rewardDalla: 60 },
];

describe('academy content shape', () => {
  it('covers every module that exists on chain', () => {
    for (const { id } of LIVE_MODULES) {
      expect(getAcademyModule(id), `module ${id} has no lesson content`).toBeDefined();
    }
  });

  it('does not define content for modules the chain does not have', () => {
    const live = new Set(LIVE_MODULES.map((entry) => entry.id));
    for (const lessonModule of ACADEMY_MODULES) {
      expect(live.has(lessonModule.moduleId), `module ${lessonModule.moduleId} is not on chain`).toBe(true);
    }
  });

  it('gives every module at least two lessons and three questions', () => {
    for (const lessonModule of ACADEMY_MODULES) {
      expect(lessonModule.lessons.length).toBeGreaterThanOrEqual(2);
      expect(lessonModule.quiz.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('gives every lesson a title and non-empty prose', () => {
    for (const lessonModule of ACADEMY_MODULES) {
      for (const lesson of lessonModule.lessons) {
        expect(lesson.title.trim().length).toBeGreaterThan(0);
        expect(lesson.body.length).toBeGreaterThan(0);
        expect(lesson.body.every((paragraph) => paragraph.trim().length > 40)).toBe(true);
      }
    }
  });
});

describe('quiz integrity', () => {
  it('points every correctIndex at a real option', () => {
    for (const lessonModule of ACADEMY_MODULES) {
      lessonModule.quiz.forEach((question, index) => {
        expect(
          question.correctIndex,
          `module ${lessonModule.moduleId} question ${index}: correctIndex out of range`,
        ).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(question.options.length);
      });
    }
  });

  it('has at least two options per question and no duplicate options', () => {
    for (const lessonModule of ACADEMY_MODULES) {
      for (const question of lessonModule.quiz) {
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(new Set(question.options).size).toBe(question.options.length);
      }
    }
  });

  it('never repeats a question inside a module', () => {
    for (const lessonModule of ACADEMY_MODULES) {
      const questions = lessonModule.quiz.map((question) => question.question);
      expect(new Set(questions).size).toBe(questions.length);
    }
  });

  it('explains every answer, right or wrong', () => {
    for (const lessonModule of ACADEMY_MODULES) {
      for (const question of lessonModule.quiz) {
        expect(question.explanation.trim().length).toBeGreaterThan(30);
      }
    }
  });

  it('does not make the correct answer always the same position', () => {
    // A learner who notices "always option B" has learned nothing. Across the
    // whole academy the correct answers must be spread out.
    const positions = new Set(
      ACADEMY_MODULES.flatMap((lessonModule) =>
        lessonModule.quiz.map((question) => question.correctIndex),
      ),
    );
    expect(positions.size).toBeGreaterThanOrEqual(3);
  });
});

describe('pass mark', () => {
  it('needs three of four at the stated threshold', () => {
    expect(PASS_THRESHOLD).toBe(0.75);
    expect(requiredCorrect(4)).toBe(3);
  });

  it('never rounds down to zero for a short quiz', () => {
    expect(requiredCorrect(1)).toBe(1);
    expect(requiredCorrect(2)).toBe(2);
    expect(requiredCorrect(3)).toBe(3);
  });

  it('cannot be passed by answering nothing', () => {
    for (const lessonModule of ACADEMY_MODULES) {
      expect(requiredCorrect(lessonModule.quiz.length)).toBeGreaterThan(0);
    }
  });
});

describe('content accuracy guards', () => {
  // These pin facts that are easy to "tidy up" wrongly later. If the chain or
  // the national fact changes, change the code and this test together.

  it('states the Belize dollar peg as 2 BZD = 1 USD', () => {
    // The old rate appears in the module as a deliberate distractor, so this
    // asserts the correct statement is present rather than asserting the wrong
    // one is absent.
    const facts = JSON.stringify(ACADEMY_MODULES);
    expect(facts).toContain('two BZD to one USD');
    const literacy = getAcademyModule(0);
    const question = literacy?.quiz[0];
    expect(question?.options[question.correctIndex]).toBe('2 BZD = 1 USD');
  });

  it('states the BelizeChain block time as six seconds', () => {
    const chainModule = getAcademyModule(3);
    expect(JSON.stringify(chainModule)).toContain('six seconds');
  });

  it('states the existential deposit as 0.001 DALLA', () => {
    const chainModule = getAcademyModule(3);
    expect(JSON.stringify(chainModule)).toContain('0.001 DALLA');
  });

  it('names all six Belize districts', () => {
    const facts = JSON.stringify(getAcademyModule(2));
    for (const district of [
      'Belize',
      'Cayo',
      'Corozal',
      'Orange Walk',
      'Stann Creek',
      'Toledo',
    ]) {
      expect(facts).toContain(district);
    }
  });

  it('does not promise a profit or a guaranteed return', () => {
    const facts = JSON.stringify(ACADEMY_MODULES).toLowerCase();
    for (const forbidden of ['guaranteed return', 'risk-free', 'guaranteed profit', 'will double']) {
      expect(facts).not.toContain(forbidden);
    }
  });
});
